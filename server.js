const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const root = __dirname;
const runtimeDir = path.resolve(process.env.CODEHARBOR_DATA_DIR || path.join(root, '.runtime'));
const usersFile = path.join(runtimeDir, 'auth-users.json');
const sessions = new Map();
const requestLimits = new Map();
const sessionLifetime = 7 * 24 * 60 * 60;
const limitWindow = 60_000;
const maxBodyBytes = 16 * 1024;
const cookieName = 'codeharbor_session';
const port = Number(process.env.CODEHARBOR_PORT || 4173);
const staticTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml'
};

fs.mkdirSync(runtimeDir, { recursive: true });
if (!fs.existsSync(usersFile)) fs.writeFileSync(usersFile, '[]', 'utf8');

function readUsers() {
  const users = JSON.parse(fs.readFileSync(usersFile, 'utf8').replace(/^\uFEFF/, ''));
  if (!Array.isArray(users)) throw new Error('Invalid user store');
  return users;
}

function writeUsers(users) {
  const pendingFile = `${usersFile}.${process.pid}.tmp`;
  fs.writeFileSync(pendingFile, JSON.stringify(users, null, 2), { encoding: 'utf8', mode: 0o600 });
  fs.renameSync(pendingFile, usersFile);
}

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  return { salt, hash: hashPassword(password, salt) };
}

const dummyPassword = createPassword(crypto.randomBytes(16).toString('hex'));

function samePassword(password, user) {
  const salt = user ? user.passwordSalt : dummyPassword.salt;
  const expected = user ? user.passwordHash : dummyPassword.hash;
  const hash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expected, 'hex'));
}

function sessionToken(request) {
  const cookie = (request.headers.cookie || '').split(';').find(part => part.trim().startsWith(`${cookieName}=`));
  const token = cookie && cookie.trim().slice(cookieName.length + 1);
  return /^[a-f0-9]{64}$/.test(token || '') ? token : null;
}

function sessionCookie(token, maxAge) {
  return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`;
}

function startSession(request, user) {
  sessions.delete(sessionToken(request));
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId: user.id, expiresAt: Date.now() + sessionLifetime * 1000 });
  return { 'Set-Cookie': sessionCookie(token, sessionLifetime) };
}

function allowRequest(request, response, scope, maximum) {
  const now = Date.now();
  const key = `${scope}:${request.socket.remoteAddress}`;
  let limit = requestLimits.get(key);
  if (!limit || limit.expiresAt <= now) {
    limit = { count: 0, expiresAt: now + limitWindow };
    requestLimits.set(key, limit);
  }
  if (limit.count >= maximum) {
    sendError(response, 429, '尝试次数过多，请稍后再试', { 'Retry-After': Math.ceil((limit.expiresAt - now) / 1000) });
    return false;
  }
  limit.count += 1;
  return true;
}

const pruneExpired = setInterval(() => {
  const now = Date.now();
  for (const entries of [sessions, requestLimits]) {
    for (const [key, entry] of entries) {
      if (entry.expiresAt <= now) entries.delete(key);
    }
  }
}, limitWindow);
pruneExpired.unref();

function publicUser(user) {
  return { id: user.id, username: user.username, email: user.email, createdAt: user.createdAt };
}

function sendJson(response, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
  response.end(payload);
}

function sendError(response, status, message, headers) {
  sendJson(response, status, { code: `AUTH_${status}`, message }, headers);
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', chunk => {
      size += chunk.length;
      if (size <= maxBodyBytes) chunks.push(chunk);
      else reject(413);
    });
    request.on('end', () => {
      if (size > maxBodyBytes) return;
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
        if (!body || typeof body !== 'object' || Array.isArray(body)) return reject(400);
        resolve(body);
      } catch {
        reject(400);
      }
    });
    request.on('error', () => reject(400));
  });
}

function sessionUser(request) {
  const token = sessionToken(request);
  const session = sessions.get(token);
  if (!session) return null;
  if (session.expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return readUsers().find(user => user.id === session.userId);
}

async function handleApi(request, response, pathname) {
  const action = pathname.startsWith('/api/v1/auth/') ? pathname.slice('/api/v1/auth/'.length) : '';
  const isRegister = action === 'register';
  if (request.method === 'POST' && ['register', 'login', 'logout'].includes(action)) {
    const origin = request.headers.origin;
    if (origin && origin !== `http://${request.headers.host}`) {
      sendError(response, 403, '请从码境页面发起请求');
      return true;
    }
    if (action === 'logout') {
      sessions.delete(sessionToken(request));
      sendJson(response, 200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
      return true;
    }
    if (!/^application\/json(?:\s*;|$)/i.test(request.headers['content-type'] || '')) {
      sendError(response, 415, '请提交 JSON 格式的请求');
      return true;
    }
    if (!allowRequest(request, response, action, isRegister ? 8 : 12)) return true;
    let body;
    try {
      body = await readBody(request);
    } catch (status) {
      sendError(response, status, status === 413 ? '请求内容太长' : '请求格式不正确');
      return true;
    }
    const { password } = body;
    if (isRegister) {
      const username = typeof body.username === 'string' ? body.username.trim() : '';
      const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
      if (!/^[\w\u4e00-\u9fa5-]{2,24}$/.test(username) || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || typeof password !== 'string' || password.length < 6 || password.length > 128) {
        sendError(response, 400, '请填写有效的用户名、邮箱和 6–128 位密码');
        return true;
      }
      const users = readUsers();
      if (users.some(user => user.username.toLowerCase() === username.toLowerCase() || user.email === email)) {
        sendError(response, 409, '用户名或邮箱已被使用');
        return true;
      }
      const { salt, hash } = createPassword(password);
      const user = { id: `user_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`, username, email, passwordSalt: salt, passwordHash: hash, createdAt: new Date().toISOString() };
      users.push(user);
      writeUsers(users);
      sendJson(response, 201, { user: publicUser(user) }, startSession(request, user));
    } else {
      const identifier = typeof body.identifier === 'string' ? body.identifier.trim().toLowerCase() : '';
      if (!identifier || typeof password !== 'string' || !password) {
        sendError(response, 400, '请输入用户名或邮箱和密码');
        return true;
      }
      const user = readUsers().find(item => item.username.toLowerCase() === identifier || item.email === identifier);
      if (!samePassword(password, user) || !user) {
        sendError(response, 401, '账号或密码不正确');
        return true;
      }
      sendJson(response, 200, { user: publicUser(user) }, startSession(request, user));
    }
    return true;
  }

  if (request.method === 'GET' && action === 'me') {
    const user = sessionUser(request);
    if (!user) { sendError(response, 401, '未登录'); return true; }
    sendJson(response, 200, { user: publicUser(user) });
    return true;
  }

  if (pathname.startsWith('/api/')) {
    sendError(response, 404, '接口不存在');
    return true;
  }
  return false;
}

function serveStatic(request, response, pathname) {
  const asset = pathname === '/' ? '/index.html' : pathname === '/designs/' ? '/designs/index.html' : pathname;
  const isPublic = ['/index.html', '/app.js', '/styles.css'].includes(asset) || /^\/designs\/[a-z0-9-]+\.(html|css|js|svg)$/i.test(asset);
  if (!isPublic || !['GET', 'HEAD'].includes(request.method)) {
    response.writeHead(404).end('Not Found');
    return;
  }
  const filePath = path.join(root, asset.slice(1));
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) { response.writeHead(404); response.end('Not Found'); return; }
    response.writeHead(200, { 'Content-Type': staticTypes[path.extname(filePath)], 'X-Content-Type-Options': 'nosniff' });
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(filePath).on('error', () => response.destroy()).pipe(response);
  });
}

const server = http.createServer(async (request, response) => {
  const pathname = url.parse(request.url).pathname;
  try {
    if (!(await handleApi(request, response, pathname))) serveStatic(request, response, pathname);
  } catch {
    sendError(response, 500, '服务器暂时无法处理请求');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`CodeHarbor server running at http://localhost:${server.address().port}`);
});
