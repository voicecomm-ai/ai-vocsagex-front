# VoCSageX 前端

AI Voice SageX 管理平台前端项目，基于 Next.js 14 构建。


## 环境要求

- Node.js 18+
- npm 或 pnpm

## 快速开始

### 安装依赖

```bash
npm install
```

### 环境变量

在项目根目录创建或使用已有环境配置：

- `.env.development`：开发环境
- `.env.production`：生产环境

常用变量示例（请按实际后端地址配置）：

- `NEXT_PUBLIC_API_BASE`: 后端 API 基础地址（如静态资源、图标等拼接用）

开发环境下，`next.config.mjs` 中已配置将 `/voicesagex-console/*` 代理到指定后端，可按需修改 `destination`。

### 开发

```bash
npm run dev
```

浏览器访问 [http://localhost:3000](http://localhost:3000)。未登录会跳转登录页，登录后进入 `/main`。

### 构建

```bash
npm run build
```

构建产物在 `build` 目录（构建前会执行 `clean` 并禁用 lint）。

### 启动生产服务

```bash
npm start
```

### 代码检查与格式化

- 执行 ESLint：`npm run lint`
- 提交前会通过 lint-staged 对 `*.{js,jsx,css,md,json}` 执行 Prettier 格式化

## 项目结构概览

```
src/
├── app/                    # Next.js App Router
│   ├── layout.js           # 根布局（Antd、主题、中文）
│   ├── main/               # 主后台（需登录）
│   │   ├── application/    # 应用、工作流、Agent、MCP
│   │   ├── knowledge/      # 知识库、文档、图谱
│   │   ├── model/          # 模型相关
│   │   └── ...
│   ├── chat/               # 对话与 Agent 对话
│   ├── login/              # 登录等
│   └── ...
├── api/                    # 接口封装
├── store/                  # Zustand 状态
├── utils/                  # 工具（如 rsa）
└── middleware.js           # 路由鉴权、白名单
```


