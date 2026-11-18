# 部署

线上地址：<https://so.wangze.tech>

## 自动部署（现行）

本仓库已接入 Cloudflare Workers 的 Git 集成（Workers Builds）。推送到 `main` 会自动构建并部署，不需要手动执行 `wrangler deploy`。

- 触发：`main` 的新提交。
- 构建：零构建；`wrangler.toml` 的 Text rules 把 `template.html`、`styles.css`、`client.js` 内联进单文件 HTML。
- 产物：Worker `so`。
- 验证：`curl -s 'https://so.wangze.tech/?q=Cloudflare%20Workers'` 应返回四个 `engine-group-title`（综合／社区／影音／动漫），`current-search` 默认 `display: none`，V2EX 图标指向 `v2ex.com/favicon.ico`。也可以在 Cloudflare Dashboard 的 Workers & Pages → so → Deployments 查看构建记录。

2026-11-18 推送 `6696608` 后，线上已返回上述四组入口和隐藏的当前搜索，自动部署生效。

## 手动部署（自部署、fork、应急）

```bash
npx wrangler login
npx wrangler deploy
```

需要本机已登录 Cloudflare，且 `wrangler.toml` 的 `name` 指向目标 Worker。自部署的完整步骤见 README 的“自部署”一节。
