# 🎯 完整测试指南

## ✅ 已完成：自动化测试

```bash
npm test
```

**结果**: ✅ 全部通过

---

## 🌐 现在进行浏览器测试

### 步骤 1: 服务器已启动 ✅

开发服务器正在运行：
- **地址**: http://localhost:8787
- **状态**: ✅ 运行中
- **安全响应头**: ✅ 已配置

### 步骤 2: 在浏览器中测试

1. **打开浏览器访问**: http://localhost:8787

2. **测试安全响应头**:
   - 按 `F12` 打开开发者工具
   - 切换到 `Network` 标签
   - 刷新页面
   - 点击第一个请求
   - 查看 `Response Headers`
   - 应该看到：
     ```
     Content-Security-Policy: ...
     X-Content-Type-Options: nosniff
     X-Frame-Options: DENY
     Strict-Transport-Security: ...
     Referrer-Policy: ...
     Permissions-Policy: ...
     ```

3. **测试 CSP（内容安全策略）**:
   - 在 `Console` 标签中输入：
     ```javascript
     // 尝试执行内联脚本（应该被阻止）
     eval('alert("test")');
     ```
   - 应该看到 CSP 错误（这是正常的）

### 步骤 3: 停止服务器

测试完成后，在终端按 `Ctrl+C` 停止服务器。

---

## 📋 测试检查清单

### 自动化测试 ✅
- [x] HTML 转义功能
- [x] 输入验证（XSS 检测）
- [x] URL 验证
- [x] 图标 URL 验证
- [x] CSP 生成
- [x] 安全响应头

### 浏览器测试
- [ ] 打开 http://localhost:8787
- [ ] 检查安全响应头（F12 → Network）
- [ ] 验证 CSP 策略生效
- [ ] 检查页面显示正常
- [ ] 右上角切换浅色／深色，刷新后保持
- [ ] 搜索历史图标在搜索框右侧，点击展开面板，Esc 关闭并回到图标
- [ ] 历史条目可用键盘聚焦、回车重搜；右侧 × 可删除
- [ ] 搜索不整页刷新：控制台执行 `window.__mark = 1` 后输入关键词回车，`window.__mark` 仍是 1，地址栏、标题、当前搜索、入口卡片同步更新
- [ ] 点历史条目同样不刷新：面板收起、输入框回填该关键词、该条提到历史最前
- [ ] 同一关键词再搜一次，浏览器历史不新增条目（连按后退不会原地重复）
- [ ] 后退回到上一关键词、前进回到最新关键词，页面与地址栏一致；后退只还原页面，不把旧关键词重新写进历史
- [ ] 取不到页面时退化为整页导航：DevTools 的 Network 设为 Offline 后点历史条目，会走整页导航（浏览器报网络错误），不是静默无反应
- [ ] 输入 501 个字符或 `<script>` 后回车，页面显示拒绝原因而不是空白，该次查询不写入历史
- [ ] 有结果时点搜索框的 ×：入口卡片清空、地址回到 `/`、标题变回 `so`，焦点留在输入框
- [ ] 在输入框改动任意字符后，上方的拒绝提示立刻消失

---

## 🔧 常用命令

### 使用 Wrangler（推荐）

```bash
# 1. 安装 Wrangler（首次使用）
npm install -g wrangler

# 2. 登录 Cloudflare（首次使用需要）
wrangler login

# 3. 启动本地开发服务器
wrangler dev

# 4. 访问 http://localhost:8787

# 其他有用命令
wrangler dev --local              # 监听所有网络接口（局域网访问）
wrangler dev --port 3000          # 指定端口
wrangler deploy                   # 部署到生产环境
wrangler tail                     # 查看实时日志
```

### 使用 npm scripts

```bash
# 运行安全测试
npm test

# 停止服务器
# 按 Ctrl+C
```

---

## 📚 更多信息

- 详细测试说明: [TESTING.md](TESTING.md)
- 快速参考: [TEST_QUICK.md](TEST_QUICK.md)
- 安全文档: [SECURITY.md](SECURITY.md)
