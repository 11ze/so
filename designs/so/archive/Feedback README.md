# so 视觉审查

入口：`Feedback - so.html`（同目录）；以 `index.html` 的副本为底稿，原稿未修改。批注数据在 `feedback-views.js`，渲染器为 baoyu-design 提供的 `data-overlay.js`，页面内图标复用 `../assets`。

在仓库根目录运行 `python3 -m http.server 4311 --bind 127.0.0.1 --directory designs`，访问 http://127.0.0.1:4311/so/archive/Feedback%20-%20so.html 。

重复验证：默认显示搜索示例和 14 个入口；切换 Showing 后的三组选项，检查批注锚点、完整文字与视图切换；切换浅深色，检查可读性。副本历史和主题使用独立的 so_review 存储键。

静态批注稿跳过 Red → Green，以浏览器验证代替；原有测试不证明批注布局正确。尺寸建议尚未应用到原稿。

已验证：浏览器三组批注切换、14 个图标加载、1440px 页面无横向溢出、完整截图；浏览器无警告和错误日志；新增与内联脚本语法通过。未验证手机视口和深色批注布局。
