const feed = document.querySelector('#feed');
const modalBackdrop = document.querySelector('#modal-backdrop');
const modalContent = document.querySelector('#modal-content');
const toast = document.querySelector('#toast');
const storageKey = 'codeharbor-content-v1';
const favoritesKey = 'codeharbor-favorites-v1';

const seedContent = [
  { type: 'blog', label: '博客 · 前端', title: '把复杂的交互，写成简单的体验', summary: '从状态管理到微交互，聊聊我在做产品型前端时反复验证的几个细节。', author: 'Yuki Zhang', avatar: 'Y', avatarClass: 'avatar-blue', meta: '6 min read · 32', thumb: 'thumb-purple', visual: 'UX', time: '今天 09:42' },
  { type: 'toolbox', label: '工具 · 开源项目', title: 'Flowboard：给开发者的轻量协作画布', summary: '一个把白板、任务和灵感放在一起的开源工具，适合小团队快速对齐想法。', author: 'Marco Lin', avatar: 'M', avatarClass: 'avatar-orange', meta: '开源 · 1.2k stars', thumb: 'thumb-orange', visual: 'FLOW', time: '昨天 18:20' },
  { type: 'requirements', label: '需求 · 网站建设', title: '寻找一位熟悉 Next.js 的伙伴，一起做个小产品', summary: '我们正在做一个面向创作者的知识管理工具，希望找到一位对产品有感觉的全栈开发者。', author: 'Lena Zhou', avatar: 'L', avatarClass: 'avatar-green', meta: '预算 8k–15k · 3 人响应', thumb: 'thumb-green', visual: 'JOIN', time: '昨天 14:05' },
  { type: 'blog', label: '博客 · 工程实践', title: '从 0 到 1 构建一个真正好用的 CLI', summary: '命令行工具不只是把参数接进来，好的 CLI 应该让人感到笃定、快速，并且乐于反复使用。', author: 'Kevin Wu', avatar: 'K', avatarClass: 'avatar-green', meta: '11 min read · 58', thumb: 'thumb-blue', visual: 'CLI', time: '11 月 20 日' },
  { type: 'toolbox', label: '工具 · 效率工具', title: 'TinyDiff：不打扰你的文本对比工具', summary: '轻量、快速、支持 Markdown 预览，适合日常写作和代码片段比对。', author: 'Aria Chen', avatar: 'A', avatarClass: 'avatar-purple', meta: '在线工具 · 4.8', thumb: 'thumb-blue', visual: 'DIFF', time: '11 月 19 日' }
];

const pageViews = { home: '#home-view', blog: '#blog-view', toolbox: '#toolbox-view', requirements: '#requirements-view' };
let content = readJson(storageKey, seedContent);
let activeFilter = 'all';
let currentRoute = 'home';
let searchOpen = false;
let currentUser = null;

function readJson(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return Array.isArray(value) && value.length ? value : fallback;
  } catch {
    return fallback;
  }
}

function saveContent() {
  localStorage.setItem(storageKey, JSON.stringify(content));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function openModal(html) {
  modalContent.innerHTML = html;
  modalBackdrop.hidden = false;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.style.overflow = '';
}

function renderFeed() {
  if (!feed) return;
  const visible = content.filter(item => activeFilter === 'all' || item.type === activeFilter);
  feed.innerHTML = visible.length
    ? visible.map(item => {
      const index = content.indexOf(item);
      const actionLabel = item.type === 'requirements' ? '我有兴趣' : item.type === 'toolbox' ? '收藏工具' : '收藏文章';
      return `<article class="feed-card" data-index="${index}">
        <div>
          <p class="content-type">${escapeHtml(item.label)}</p>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.summary)}</p>
          <div class="feed-meta"><span class="mini-avatar ${escapeHtml(item.avatarClass)}">${escapeHtml(item.avatar)}</span><span>${escapeHtml(item.author)}</span><span>·</span><span>${escapeHtml(item.meta)}</span><span>·</span><span>${escapeHtml(item.time)}</span></div>
        </div>
        <div class="feed-thumb ${escapeHtml(item.thumb)}" aria-label="${escapeHtml(item.visual)}"></div>
        <span class="feed-action-hint">${actionLabel}</span>
      </article>`;
    }).join('')
    : '<div class="empty-state"><h3>还没有这类内容</h3><p>换个筛选条件，或者成为第一个分享的人。</p><button class="primary-button" data-empty-publish>开始发布</button></div>';

  feed.querySelectorAll('.feed-card').forEach(card => {
    card.addEventListener('click', () => openDetail(content[Number(card.dataset.index)]));
  });
  const empty = feed.querySelector('[data-empty-publish]');
  if (empty) empty.addEventListener('click', () => openPublish(activeFilter === 'all' ? 'blog' : activeFilter));
}

function setRoute(route, updateHash = true) {
  const target = pageViews[route] ? route : 'home';
  Object.entries(pageViews).forEach(([key, selector]) => {
    const node = document.querySelector(selector);
    if (node) node.hidden = key !== target;
  });
  document.querySelectorAll('.nav-link').forEach(item => item.classList.toggle('active', item.dataset.route === target));
  document.querySelectorAll('.module-link').forEach(item => item.classList.toggle('is-active', item.dataset.route === target));
  currentRoute = target;
  activeFilter = target === 'home' ? 'all' : target;
  document.querySelectorAll('.filter-chip').forEach(item => item.classList.toggle('active', item.dataset.filter === activeFilter || target === 'home' && item.dataset.filter === 'all'));
  if (updateHash) history.replaceState(null, '', `#${target}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderFeed();
}

function updateAuthUI() {
  const loginButton = document.querySelector('#login-button');
  const profileButton = document.querySelector('#profile-button');
  if (!loginButton || !profileButton) return;
  if (currentUser) {
    loginButton.textContent = currentUser.username;
    loginButton.classList.add('is-authenticated');
    profileButton.textContent = currentUser.username.slice(0, 1).toUpperCase();
    profileButton.classList.add('is-authenticated');
    profileButton.title = `${currentUser.username} · 个人中心`;
  } else {
    loginButton.textContent = '登录';
    loginButton.classList.remove('is-authenticated');
    profileButton.textContent = 'L';
    profileButton.classList.remove('is-authenticated');
    profileButton.title = '个人中心';
  }
}

function authErrorMessage(error, fallback) {
  if (error && typeof error.message === 'string' && error.message) return error.message;
  return fallback;
}

async function requestAuth(path, body) {
  const response = await fetch(path, {
    method: body ? 'POST' : 'GET',
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.message || '请求未完成');
    error.status = response.status;
    throw error;
  }
  return payload;
}

function openLogin(mode = 'login', notice = '') {
  const isRegister = mode === 'register';
  openModal(`<div class="auth-shell">
    <div class="auth-heading"><p class="eyebrow">WELCOME TO CODEHARBOR</p><h2 id="modal-title">${isRegister ? '加入码境社区' : '登录码境'}</h2><p>${isRegister ? '创建账号，发布内容、收藏工具并参与需求协作。' : '登录后可以发布内容、收藏工具、参与需求协作。'}</p></div>
    <div class="auth-tabs" role="tablist"><button type="button" class="${isRegister ? '' : 'is-active'}" data-auth-tab="login">登录</button><button type="button" class="${isRegister ? 'is-active' : ''}" data-auth-tab="register">注册</button></div>
    ${notice ? `<div class="auth-notice">${escapeHtml(notice)}</div>` : ''}
    <form class="auth-form" data-auth-form>
      ${isRegister ? '<label for="auth-username">用户名</label><input id="auth-username" name="username" minlength="2" maxlength="24" autocomplete="username" placeholder="2-24 个字符" required /><label for="auth-email">邮箱</label><input id="auth-email" name="email" type="email" maxlength="254" autocomplete="email" placeholder="you@example.com" required />' : '<label for="auth-identifier">邮箱或用户名</label><input id="auth-identifier" name="identifier" maxlength="254" autocomplete="username" placeholder="you@example.com" required />'}
      <label for="auth-password">密码</label><input id="auth-password" name="password" type="password" minlength="6" maxlength="128" autocomplete="${isRegister ? 'new-password' : 'current-password'}" placeholder="至少 6 位字符" required />
      ${isRegister ? '<label for="auth-confirm-password">确认密码</label><input id="auth-confirm-password" name="confirmPassword" type="password" minlength="6" maxlength="128" autocomplete="new-password" placeholder="再次输入密码" required />' : ''}
      <p class="auth-error" data-auth-error role="alert"></p>
      <button class="primary-button modal-submit" type="submit">${isRegister ? '创建账号' : '登录'}</button>
    </form>
    <div class="login-note">${isRegister ? '注册即表示你同意遵守社区规范。' : '支持使用用户名或邮箱登录。'}</div>
  </div>`);

  const form = document.querySelector('[data-auth-form]');
  const errorNode = document.querySelector('[data-auth-error]');
  const submit = form.querySelector('.modal-submit');
  document.querySelectorAll('[data-auth-tab]').forEach(tab => {
    tab.addEventListener('click', () => openLogin(tab.dataset.authTab));
  });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    errorNode.textContent = '';
    submit.disabled = true;
    submit.classList.add('is-loading');
    const formData = new FormData(form);
    try {
      let payload;
      if (isRegister) {
        const password = String(formData.get('password') || '');
        const confirmPassword = String(formData.get('confirmPassword') || '');
        if (password !== confirmPassword) throw new Error('两次输入的密码不一致');
        payload = await requestAuth('/api/v1/auth/register', {
          username: String(formData.get('username') || '').trim(),
          email: String(formData.get('email') || '').trim(),
          password
        });
      } else {
        payload = await requestAuth('/api/v1/auth/login', {
          identifier: String(formData.get('identifier') || '').trim(),
          password: String(formData.get('password') || '')
        });
      }
      currentUser = payload.user;
      updateAuthUI();
      closeModal();
      showToast(isRegister ? `账号创建成功，欢迎 ${currentUser.username}` : `登录成功，欢迎回来 ${currentUser.username}`);
    } catch (error) {
      errorNode.textContent = authErrorMessage(error, isRegister ? '注册失败，请稍后重试' : '登录失败，请检查账号和密码');
    } finally {
      submit.disabled = false;
      submit.classList.remove('is-loading');
    }
  });
}

function openProfile() {
  if (!currentUser) {
    openLogin();
    return;
  }
  openModal(`<div class="auth-shell profile-modal"><p class="eyebrow">YOUR CODEHARBOR</p><h2 id="modal-title">${escapeHtml(currentUser.username)}</h2><p>你的社区账号已登录，可以继续发布内容和参与协作。</p><div class="profile-info"><span class="avatar-button is-authenticated">${escapeHtml(currentUser.username.slice(0, 1).toUpperCase())}</span><div><strong>${escapeHtml(currentUser.email)}</strong><small>加入时间：${new Date(currentUser.createdAt).toLocaleDateString('zh-CN')}</small></div></div><p class="auth-error" data-auth-error role="alert"></p><button class="primary-button modal-submit" data-logout-submit>退出登录</button></div>`);
  const logoutButton = document.querySelector('[data-logout-submit]');
  const errorNode = document.querySelector('[data-auth-error]');
  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    errorNode.textContent = '';
    try {
      await requestAuth('/api/v1/auth/logout', {});
      currentUser = null;
      updateAuthUI();
      closeModal();
      showToast('已退出登录');
    } catch (error) {
      errorNode.textContent = authErrorMessage(error, '退出失败，请检查网络后重试');
      logoutButton.disabled = false;
    }
  });
}

async function restoreAuth() {
  try {
    const payload = await requestAuth('/api/v1/auth/me');
    currentUser = payload.user;
  } catch {
    currentUser = null;
  }
  updateAuthUI();
}

function openPublish(defaultType = 'blog') {
  openModal(`<p class="eyebrow">SHARE YOUR WORK</p><h2>发布到码境</h2><p>先保存一条本地草稿，后续接入后端后即可同步发布。</p><label>内容类型</label><select id="publish-type"><option value="blog" ${defaultType === 'blog' ? 'selected' : ''}>写一篇博客</option><option value="toolbox" ${defaultType === 'toolbox' ? 'selected' : ''}>提交一个工具</option><option value="requirements" ${defaultType === 'requirements' ? 'selected' : ''}>发布一个需求</option></select><label>标题</label><input id="publish-title" placeholder="给你的内容起个标题" /><label>内容简介</label><textarea id="publish-summary" placeholder="用几句话说说它为什么值得被看见"></textarea><button class="primary-button modal-submit" data-publish-submit>保存为草稿</button>`);
  document.querySelector('[data-publish-submit]').addEventListener('click', () => {
    const type = document.querySelector('#publish-type').value;
    const title = document.querySelector('#publish-title').value.trim();
    const summary = document.querySelector('#publish-summary').value.trim();
    if (!title || !summary) {
      showToast('请填写标题和内容简介');
      return;
    }
    const labels = { blog: '博客 · 新发布', toolbox: '工具 · 新提交', requirements: '需求 · 新发布' };
    content.unshift({ type, label: labels[type], title, summary, author: 'Lin', avatar: 'L', avatarClass: 'avatar-blue', meta: type === 'requirements' ? '待响应 · 新需求' : '刚刚创建 · 草稿', thumb: type === 'blog' ? 'thumb-purple' : type === 'toolbox' ? 'thumb-orange' : 'thumb-green', visual: type.toUpperCase(), time: '刚刚' });
    saveContent();
    closeModal();
    setRoute(type);
    showToast('已保存到本地草稿');
  });
}

function openDetail(item) {
  const action = item.type === 'requirements' ? '我有兴趣' : item.type === 'toolbox' ? '收藏工具' : '收藏文章';
  openModal(`<p class="content-type">${escapeHtml(item.label)}</p><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.summary)}</p><div class="author-row" style="margin:22px 0"><span class="mini-avatar ${escapeHtml(item.avatarClass)}">${escapeHtml(item.avatar)}</span><span>${escapeHtml(item.author)}</span><small>${escapeHtml(item.time)}</small></div><div class="login-note">${item.type === 'requirements' ? '这是一个开放中的需求，发布者正在寻找合适的协作者。' : item.type === 'toolbox' ? '这个工具适合加入你的日常开发工作流，打开详情了解更多。' : '这篇内容来自码境社区，登录后可以继续阅读并参与讨论。'}</div><button class="primary-button modal-submit" data-detail-action>${action} <span>→</span></button>`);
  document.querySelector('[data-detail-action]').addEventListener('click', () => {
    const favorites = readJson(favoritesKey, []);
    if (!favorites.includes(item.title)) favorites.push(item.title);
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
    closeModal();
    showToast(`已记录：${action}`);
  });
}

function openSearch() {
  if (searchOpen) {
    document.querySelector('#search-input').focus();
    return;
  }
  searchOpen = true;
  const search = document.createElement('div');
  search.className = 'search-dock';
  search.innerHTML = '<input id="search-input" placeholder="搜索博客、工具和需求…" autocomplete="off" /><button id="search-close" aria-label="关闭搜索">×</button>';
  (document.querySelector('.header') || document.body).appendChild(search);
  const input = search.querySelector('input');
  input.focus();
  input.addEventListener('input', () => {
    const keyword = input.value.trim().toLowerCase();
    if (keyword && currentRoute === 'home') setRoute('blog');
    document.querySelectorAll('.feed-card').forEach(card => {
      card.hidden = Boolean(keyword) && !card.textContent.toLowerCase().includes(keyword);
    });
  });
  search.querySelector('#search-close').addEventListener('click', () => {
    search.remove();
    searchOpen = false;
    renderFeed();
  });
}

function bind(selector, event, handler) {
  const node = document.querySelector(selector);
  if (node) node.addEventListener(event, handler);
}

document.querySelectorAll('.filter-chip').forEach(button => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.filter-chip').forEach(item => item.classList.remove('active'));
    button.classList.add('active');
    activeFilter = button.dataset.filter;
    renderFeed();
  });
});

document.querySelectorAll('[data-route]').forEach(link => {
  link.addEventListener('click', event => {
    event.preventDefault();
    setRoute(link.dataset.route);
  });
});

bind('#search-toggle', 'click', openSearch);
bind('#login-button', 'click', () => currentUser ? openProfile() : openLogin());
bind('#publish-button', 'click', () => openPublish());
bind('#hero-publish', 'click', () => openPublish());
bind('#side-publish', 'click', () => openPublish());
bind('#profile-button', 'click', openProfile);
bind('#blog-publish', 'click', () => openPublish('blog'));
bind('#toolbox-publish', 'click', () => openPublish('toolbox'));
bind('#requirements-publish', 'click', () => openPublish('requirements'));
bind('#modal-close', 'click', closeModal);
modalBackdrop.addEventListener('click', event => {
  if (event.target === modalBackdrop) closeModal();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') closeModal();
});

const initialRoute = window.location.hash.replace('#', '');
setRoute(pageViews[initialRoute] ? initialRoute : 'home', false);
restoreAuth();
