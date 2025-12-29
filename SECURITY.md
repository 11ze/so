# 安全策略文档

本文档说明项目实施的安全措施和最佳实践。

## 已实施的安全措施

### 1. 输入验证和清理

#### 服务器端 (Cloudflare Workers)
- **搜索关键词验证**: 使用 `validateAndCleanKeyword()` 函数验证所有输入
- **长度限制**: 搜索关键词最大长度限制为 500 个字符
- **XSS 模式检测**: 自动检测和拒绝包含恶意代码模式的输入
- **URL 验证**: 验证所有生成的 URL,只允许 HTTP/HTTPS 协议
- **图标 URL 验证**: 验证 favicon URL,只允许安全的 data URI 或 HTTPS URL

#### 客户端 (浏览器)
- **输入验证**: 客户端也执行相同的验证逻辑
- **长度限制**: 客户端限制为 500 个字符
- **恶意模式检测**: 检测并拒绝潜在的 XSS 攻击模式
- **localStorage 安全**: 验证和清理从 localStorage 读取的数据

### 2. 输出转义

#### HTML 转义
- 使用 `escapeHtml()` 函数转义所有动态 HTML 内容
- 使用 `escapeHtmlAttribute()` 函数转义 HTML 属性值
- 转义字符包括: `&`, `<`, `>`, `"`, `'`, `/`, `` ` ``, `=`

#### DOM 操作
- 优先使用 `textContent` 而不是 `innerHTML`
- 使用 `createElement()` 和 `appendChild()` 而不是字符串拼接
- 避免使用 `innerHTML` 插入用户可控的内容

### 3. 安全响应头

项目实施以下 HTTP 安全响应头:

#### Content Security Policy (CSP)
```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src * data:;
connect-src 'self';
font-src 'self';
object-src 'none';
media-src 'self';
frame-src 'self';
base-uri 'self';
form-action 'self';
frame-ancestors 'none';
upgrade-insecure-requests;
```

#### 其他安全头
- `X-Content-Type-Options: nosniff` - 防止 MIME 类型嗅探
- `X-Frame-Options: DENY` - 防止点击劫持
- `Referrer-Policy: strict-origin-when-cross-origin` - 控制 Referrer 信息泄露
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` - 强制 HTTPS
- `Permissions-Policy: geolocation=(), microphone=(), camera=()` - 限制浏览器功能

### 4. URL 安全

#### 外部链接
- 所有搜索引擎链接添加 `rel="noopener noreferrer"`
- 防止 window.opener API 被滥用
- 防止 Referrer 信息泄露

#### URL 编码
- 使用 `encodeURIComponent()` 正确编码 URL 参数
- 自定义 `encodeUrlParam()` 函数提供额外的验证

### 5. 错误处理

#### localStorage 错误处理
- 捕获 `QuotaExceededError` 并优雅降级
- 损坏的数据自动清除
- 验证 JSON 解析结果

#### 网络错误
- 所有 URL 验证失败时记录警告
- 无效的搜索引擎 URL 会被跳过
- 使用 console.error 记录错误信息

### 6. 数据存储安全

#### 搜索历史
- 限制存储数量: 最多 10 条
- 验证所有存储的数据
- 定期清理损坏的数据
- 使用 try-catch 包裹所有 localStorage 操作

## 安全最佳实践

### 开发建议

1. **永远不要信任用户输入**
   - 所有输入都必须验证和清理
   - 在客户端和服务器端都执行验证

2. **使用安全的 API**
   - 优先使用 `textContent` 而不是 `innerHTML`
   - 优先使用 `createElement()` 而不是字符串拼接

3. **实施纵深防御**
   - 在多个层面执行安全检查
   - 不要只依赖客户端验证

4. **保持依赖更新**
   - 定期更新 Cloudflare Workers 运行时
   - 关注安全公告

5. **最小权限原则**
   - 只请求必要的权限
   - 限制第三方脚本的能力

### 已知限制

1. **内联脚本和样式**
   - 当前实现使用了内联脚本和样式
   - CSP 策略中需要 `'unsafe-inline'`
   - 未来可以考虑将脚本和样式外部化

2. **第三方图标**
   - 搜索引擎图标从外部加载
   - 可能受外部服务可用性影响
   - 已添加 `referrerpolicy="no-referrer"` 降低风险

3. **无后端验证**
   - 项目是无服务器架构,没有后端存储
   - 所有数据存储在客户端 localStorage
   - 数据可以被用户清除或篡改(不影响安全性)

## 安全审计清单

- [x] 输入验证和清理
- [x] 输出转义
- [x] CSP 实施
- [x] 安全响应头
- [x] URL 安全
- [x] XSS 防护
- [x] 错误处理
- [x] 数据验证
- [x] 安全日志记录

## 进一步改进建议

1. **实施 Subresource Integrity (SRI)**
   - 为外部资源添加完整性校验

2. **添加报告机制**
   - CSP 违规报告
   - 安全事件日志

3. **性能监控**
   - 添加性能指标收集
   - 监控异常行为

4. **定期安全审计**
   - 依赖项安全扫描
   - 代码安全审查

5. **安全测试**
   - 添加自动化安全测试
   - 渗透测试

## 安全联系方式

如果发现安全漏洞,请通过以下方式联系:
- GitHub Issues: https://github.com/11ze/so/issues

## 更新日志

- 2025-12-29: 初始安全策略文档,实施全面的安全增强
