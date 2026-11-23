# CodeHarbor（码境）

CodeHarbor 是一个面向开发者的中文开发社区 Web 项目。项目以「首页聚合、博客交流、工具效率、需求协作、每日资讯」为首版核心体验，采用轻量的原生 Web 技术实现，方便快速迭代和部署。

> 当前版本是可运行的 MVP / 本地开发版。博客、工具、需求和资讯中的部分内容仍然是前端演示数据；认证服务已经接入，但暂不等同于生产级账号系统。

## 项目介绍

CodeHarbor 希望把开发者日常会用到的内容、工具和协作入口放在一个清晰的工作台里：

- **首页**：展示各模块核心数据、最近内容和网站宣传信息。
- **博客**：浏览开发文章、标签与作者信息，为后续发布、编辑和互动预留入口。
- **工具箱**：集中展示常用开发工具和效率工具。
- **需求广场**：浏览、发布和跟进开发需求的产品方向。
- **每日资讯**：聚合每日技术资讯与行业动态。
- **账号系统**：支持注册、用户名或邮箱登录、当前用户查询和退出登录。
- **左侧导航**：使用 Arco Design 风格的竖向导航，模块之间可以快速切换。

## 当前状态

已完成：

- 可直接运行的首页和模块化 Web 界面
- Arco Design 风格视觉方案
- 首页、博客、工具箱、需求广场、每日资讯入口
- 注册、登录、退出登录和登录状态查询
- HttpOnly Cookie Session
- 基于本地 JSON 文件的用户数据存储
- 开发文档、功能文档和 AI 协作指南

暂未纳入首版：

- 生产级数据库、对象存储和多实例 Session
- 完整的文章发布、审核、评论和点赞后端接口
- 在线代码执行、实时聊天、支付担保和原生移动端 App

## 技术栈

- 前端：HTML、CSS、原生 JavaScript
- 设计风格：Arco Design 风格（当前版本未引入 Arco npm 运行时依赖）
- 后端：Node.js 原生 `http` 模块
- 认证：HttpOnly Cookie + 进程内 Session
- 用户数据：本地 JSON 文件（默认 `.runtime/auth-users.json`）
- 运行要求：Node.js 14+

项目没有第三方运行时依赖，因此无需执行 `npm install`，也没有 `package.json`。

## 快速开始

### 1. 获取代码

```bash
git clone https://github.com/xgk1906806hjy/CodeHarbor.git
cd CodeHarbor
```

### 2. 启动服务

Windows PowerShell：

```powershell
node server.js
```

macOS / Linux：

```bash
node server.js
```

默认访问地址：<http://localhost:4173>

可以通过环境变量修改端口和运行数据目录：

```powershell
$env:CODEHARBOR_PORT = "8080"
$env:CODEHARBOR_DATA_DIR = "D:\CodeHarborData"
node server.js
```

```bash
CODEHARBOR_PORT=8080 CODEHARBOR_DATA_DIR=/var/lib/codeharbor node server.js
```

## 认证接口

服务端当前提供以下接口：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `POST` | `/api/auth/register` | 注册账号 |
| `POST` | `/api/auth/login` | 使用用户名或邮箱登录 |
| `POST` | `/api/auth/logout` | 退出当前会话 |
| `GET` | `/api/auth/me` | 查询当前登录用户 |

请求体使用 JSON。示例：

```json
{
  "username": "developer",
  "email": "developer@example.com",
  "password": "your-password"
}
```

认证服务已经包含参数校验、密码哈希、请求体大小限制、登录限流、Origin 校验和安全 Cookie。生产环境仍建议替换为正式数据库、集中式 Session 存储、HTTPS 和更完整的审计与风控方案。

## Windows 部署流程

### 直接运行

1. 安装 Node.js 14 或更高版本。
2. 将项目放到服务器目录，例如 `D:\Apps\CodeHarbor`。
3. 在项目目录执行 `node server.js`。
4. 放行服务器端口，并通过 `http://服务器地址:4173` 访问。

### 使用后台进程运行

开发测试可以使用 PowerShell 后台进程：

```powershell
$env:CODEHARBOR_PORT = "4173"
$env:CODEHARBOR_DATA_DIR = "D:\CodeHarborData"
Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory "D:\Apps\CodeHarbor" -WindowStyle Hidden
```

长期运行建议使用 Windows 服务管理器、NSSM 或企业现有的进程管理方案，并将日志、数据目录和备份目录放到项目目录之外。

## Linux / 云服务器部署流程

```bash
sudo mkdir -p /opt/codeharbor /var/lib/codeharbor
sudo chown -R $USER:$USER /opt/codeharbor /var/lib/codeharbor
git clone https://github.com/xgk1906806hjy/CodeHarbor.git /opt/codeharbor
cd /opt/codeharbor
CODEHARBOR_PORT=4173 CODEHARBOR_DATA_DIR=/var/lib/codeharbor node server.js
```

生产环境建议：

1. 使用 systemd、PM2 或容器编排工具托管进程。
2. 使用 Nginx、Caddy 或云负载均衡提供 HTTPS 和反向代理。
3. 将 `CODEHARBOR_DATA_DIR` 指向独立的持久化目录。
4. 对用户数据做定期备份，并限制数据目录权限。
5. 将访问日志、错误日志和告警接入现有运维系统。

## 发布检查清单

- [ ] 已配置 HTTPS 和正确的域名。
- [ ] 已将 `CODEHARBOR_DATA_DIR` 放到项目目录之外。
- [ ] 已确认 `.runtime/`、日志和本地账号数据不会被提交。
- [ ] 已设置进程自动拉起和健康检查。
- [ ] 已完成数据备份与恢复演练。
- [ ] 已根据业务规模替换本地 JSON 存储和进程内 Session。
- [ ] 已限制服务器端口暴露范围。
- [ ] 已检查注册、登录、退出和未授权访问行为。

## 项目目录

```text
CodeHarbor/
├─ index.html              # 主页面
├─ app.js                  # 前端交互与页面状态
├─ styles.css              # 主站样式
├─ server.js               # Node.js 静态服务与认证接口
├─ 产品需求文档.md          # 产品需求总文档
├─ AGENTS.md               # AI 协作和开发约定
├─ doc/                    # 系统级开发文档
├─ docs/                   # 按功能拆分的 AI 可读文档
├─ designs/                # 方案和视觉设计稿
└─ .runtime/               # 本地运行数据，不纳入 Git
```

## 文档入口

- [产品需求文档](./产品需求文档.md)
- [系统开发文档](./doc/README.md)
- [功能文档索引](./docs/README.md)
- [AI 协作指南](./AGENTS.md)
- [设计方案索引](./designs/README.md)

开发新功能前，请先阅读 `AGENTS.md`、`doc/README.md`，再阅读对应的 `docs/<功能>/README.md` 和 `CHANGELOG.md`。

## 开发约定

- 修改接口、数据结构或用户行为时，同步更新对应文档和变更记录。
- 列表接口默认分页，生产接口不要无条件返回全量数据。
- 用户输入、Markdown、HTML 和外链内容必须经过安全处理。
- 交付前检查加载中、空状态、错误、无权限和重复提交状态。

## 许可证

当前仓库尚未指定开源许可证。未经项目维护者明确授权，请不要将代码用于再分发或商业发行。
