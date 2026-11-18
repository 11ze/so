# so 搜索交互原型

独立设计稿。当前稿为 `clean.html`；`index.html`、`compact.html`、`Feedback - so.html` 已移到 `archive/`，不再维护。保留蓝色主色，使用浅底、细边框和搜索引擎卡片；移除标语、快捷键说明和页脚提示，空态只留一句提示。

2026-11-18：空态改为顶部对齐，去掉最近搜索，在搜索框下方的空白区中部显示一句提示（“一次输入，选一个站点继续搜”，按入口聚合站定位）；历史面板加高到 480px，超过约 10 条后内部滚动；入口按综合／社区／影音／动漫分组；当前搜索默认隐藏、编辑时出现；历史面板加“清空”，删除键改为 44px；主题按钮统一为 46px 描边、与历史入口同宽；深色下入口图标加 20px 淡底片；搜索框补 `min-width:0`，320px 不再横向溢出；顶部补 24px 留白（≤480px 16px），空态仍顶部对齐。`clean.html` 与 `src/` 已同步；其余三份原型已归档。

设计依据：`src/template.html`、`src/styles.css`、`src/client.js`、`src/config.js`。输入校验代码来自 `src/utils/security.js`，引擎清单取自当前配置。使用本机字体，网站图标按原配置下载至 assets/，保持原色，无滤镜和远程资源依赖。原型为静态快照，之后调整正式配置时不会自动同步。


## 归档

`archive/index.html`、`archive/compact.html`、`archive/Feedback - so.html` 是历史快照，保留作对照，不再维护；空态、清空 bug 和入口布局都停在旧版。归档页的资源引用已改为 `../assets/`，可用同一个静态服务器打开。`archive/Feedback README.md` 是当时的人工审查说明。

## 预览

在仓库根目录执行：

```sh
python3 -m http.server 4311 --bind 127.0.0.1 --directory designs
```

访问 http://127.0.0.1:4311/so/clean.html 。原型历史使用 `so_design_search_history`，与正式页面隔离。

## 重复验证

1. 首页只显示标识、搜索框、历史入口和中部提示；不出现最近搜索。输入 `Cloudflare Workers` 并回车，按“综合／社区／影音／动漫”四组显示 14 个入口，地址栏带 `q`；默认不显示“当前搜索”。
2. 输入 `中文 & 空格` 并搜索，检查 Google 链接包含 `q=%E4%B8%AD%E6%96%87%20%26%20%E7%A9%BA%E6%A0%BC`。
3. 打开搜索历史，输入 12 条以上记录后确认面板加高到 480px、内部滚动；点击历史项重新搜索；删除测试记录，面板应保持展开，全部删除后显示“暂无搜索历史”。标题右侧“清空”点两次清空全部历史，面板保持展开；删除键点击区域 44px。刷新后检查保留的历史项。
4. 清空按钮应清空输入并聚焦搜索框；离开输入框后按 `/` 应聚焦；历史面板打开时按 Escape 应收起。
5. 输入 501 个字符并提交，应提示长度限制；输入 `<script>` 应提示非法字符。
6. 在 390px 和桌面宽度检查布局，页面不应出现水平滚动；系统切换暗色后检查文字、搜索框与卡片对比度。
7. 浏览器前进、后退应还原对应关键词和引擎链接。
8. 同一关键词再搜一次，地址栏不变，浏览器历史不新增条目；连按后退不会原地重复。

已执行：回车搜索、14 个入口、中文与特殊字符编码、清空、历史删除及空态、历史重新搜索、501 字符拒绝；空态提示与 12 条历史的面板高度；390px 截图与横向溢出检查；浏览器无警告及错误日志；`npm test`（含 4 项 Chrome 回归，需 Node 22+ / Chrome）通过。深浅色切换、刷新后主题记忆、14 个图标加载和无滤镜显示均已在浏览器验证；第三方网站可用性未验证。

搜索换页的重复压栈已与正式页对齐：`search()` 在目标地址与当前地址相同时不调用 `pushState`，当时四份原型（`index.html`、`clean.html`、`compact.html`、`Feedback - so.html`）同改；现在历史版本在 `archive/`。用 headless Chrome 逐页验证首次搜索、重复搜索、点历史条目、前进后退、501 字符拒绝共 19 项，四页全过。静态原型跳过 Red → Green，靠浏览器行为验证。

设计稿采用浏览器操作验证，未执行自动化测试先行的 Red → Green。原有测试覆盖正式页面，不能替代设计稿的交互验证。

文案精简属于静态展示调整，未执行 Red → Green；复用上述浏览器操作复查搜索和历史入口。

## 主题与图标

右上角按钮切换浅色／深色；首次按系统主题显示，手动选择存入 `so_design_theme`。验证时切换到深色，刷新应保持深色，再切回浅色；两种主题下图标均保持原色。

修改前浏览器检查：主题按钮 0 个、网站图片 0 个；修改后：主题按钮可切换，14 张图片全部加载成功，CSS filter 均为 none。采用浏览器行为验证，未新增自动化测试文件。

图标来源（与 src/config.js 对应）：

- `assets/icon-0.ico`：Google，https://www.google.com/favicon.ico
- `assets/icon-1.ico`：DuckDuckGo，https://duckduckgo.com/favicon.ico
- `assets/icon-2.ico`：Bing，https://www.bing.com/favicon.ico
- `assets/icon-3.ico`：搜狗，https://www.sogou.com/favicon.ico
- `assets/icon-4.ico`：旧 Google V2EX 图标，当前稿不用；归档页仍引用。现行 V2EX · Google 复用 `assets/icon-5.ico`（https://www.v2ex.com/favicon.ico）
- `assets/icon-5.ico`：SOV2EX，https://www.v2ex.com/favicon.ico
- `assets/icon-6.ico`：YouTube，https://www.youtube.com/favicon.ico
- `assets/icon-7.ico`：小红书，https://www.xiaohongshu.com/favicon.ico
- `assets/icon-8.ico`：哔哩哔哩，https://www.bilibili.com/favicon.ico
- `assets/icon-9.ico`：AGE，https://www.agedm.io/favicon.ico
- `assets/icon-10.ico`：樱花动漫，https://www.yinhuadm.cc/favicon.ico
- `assets/icon-11.ico`：樱之空动漫，https://www.skr2.cc/favicon.ico
- `assets/icon-12.ico`：OmoFun，https://omofun.in/favicon.ico
- `assets/icon-13.ico`：豆瓣，https://www.douban.com/favicon.ico

搜索历史入口：文字 15px，时钟图标 1em（15px），按钮保留至少 44px 的点击高度。纯尺寸调整采用浏览器目视验证，跳过 Red → Green。

页头与搜索区使用相同的 880px 最大宽度，标识保留 12px 内缩并放松字距。主题切换采用半圆图标按钮，通过悬停提示和无障碍名称说明切换目标；搜索放大镜与输入文字同字号，桌面 17px、窄屏 16px；引擎卡片移除箭头，仍在新标签页打开。纯展示调整采用浏览器验证，未执行 Red → Green。

搜索、历史和主题图标使用 1em，与对应文字字号一致：搜索桌面 17px／窄屏 16px，历史和主题 15px；清空、删除图标保持 20×20px，网站图标为 24×24px。网站图标保持原色与原始比例，内置留白不裁切。搜索历史入口额外向内留 12px，与页头右侧内缩一致。纯图标按钮保留至少 44px 点击区域。

网站 favicon 使用 `assets/favicon.svg`，沿用搜索放大镜的蓝色轮廓。纯静态资源调整未执行 Red → Green；验证 HTML 引用、SVG 解析及 HTTP 资源返回。

Favicon 恢复最初的 `0 0 24 24` viewBox。纯静态尺寸调整未执行 Red → Green，使用 SVG 解析与 HTTP 内容校验。

搜索引擎卡片的文字为 15px、网站图标为 24×24px；卡片尺寸与间距保持原样。纯展示调整不执行 Red → Green，按桌面及窄屏浏览器布局复查。

“当前搜索”默认隐藏，只在输入值与已提交值不同时出现；关键词用正文色，避免看起来像链接。验证：搜索 A 后将输入改成 B，该行出现并显示 A；改回 A 后消失；提交 B 后隐藏并更新结果。纯展示调整未执行 Red → Green。

## 紧凑版

入口 `archive/compact.html`，预览 http://127.0.0.1:4311/so/archive/compact.html 。`archive/index.html` 保留作对照。

页头高 60px（标识上下各留 13px），搜索区顶部间距 6px，标识到搜索框共 19px。结果区距搜索框 8px，引擎卡片高至少 58px、网格间距 8px、圆角 9px。

“当前搜索”与历史入口共用搜索框下方 44px 高的一行，文字基线对齐。“当前搜索”文字 15px、与引擎卡片文字同级，行高 22px，左内缩 15px，与卡片图标左缘对齐；关键词换行时标签仍与首行对齐，右侧留 148px 给历史入口。历史入口文字 14px、时钟图标 16px、按钮高 44px，文字右内缩 24px。搜索框到“当前搜索”文字约 19px，到卡片约 20px。历史面板下移到搜索框下 54px。站点图标在 24px 容器中显示为 22px，保留原色与比例。主题按钮移除边框。

窄屏（≤700px）页头同为 60px、搜索区顶部间距 6px，卡片仍至少 58px；≤480px 时“当前搜索”左内缩 12px，与窄屏卡片图标对齐，右侧为历史入口留 120px，整行不换行，关键词超出时显示省略号，卡片转两列。

仅调整展示，跳过 Red → Green；复用前面的搜索、历史和主题验证步骤，并在桌面与窄屏检查卡片、换行和横向溢出。

紧凑版已验证：1440、1024、768、500、481、414、390、360、320px 均无横向溢出，搜索行高度稳定 44px；卡片在 1440、1024、768、414、390、360 实测 58px，500、481、320px 下长名称换行撑高到 77px；14 个入口及图标正常；“当前搜索”与历史入口文字中心偏差 0.4px，左缘与卡片图标左缘偏差 1px；108 字关键词换行时标签与首行对齐，末行右缘距历史入口 32px；浅深色、中文与特殊字符编码、历史展开与 Esc 收起、斜杠聚焦、501 字符与危险字符拦截、前进后退还原、主题记忆通过；浏览器无警告及错误日志。交互脚本与原稿逐字一致。低清 favicon 仍沿用原资源，公网部署未改动。

预览图：`compact-preview.png`（1440×900）、`compact-mobile.png`（390×844，2 倍像素）。

## 精简版

入口 `clean.html`，预览 http://127.0.0.1:4311/so/clean.html 。`compact.html`、`index.html` 已归档到 `archive/`。

整体缩小一档：页头 48px、标识 26px、搜索框高 50px（输入 15px、圆角 12px）、卡片高至少 46px（文字 13px、图标 16px、圆角 8px）、网格间距 8px。

去掉“搜索”按钮，回车提交。搜索历史由文字按钮改成图标按钮，放在搜索框右侧，与搜索框同高，宽 46px（≤480px 时 44px），点击在下方展开面板。“当前搜索”默认隐藏，输入值偏离已提交值时显示；13px，关键词用正文色，左内缩 10px 与卡片图标左缘对齐。搜索框到该行 16px。

入口按“综合／社区／影音／动漫”分组，组标题 12px 次要色；组内 8px、组间 20px，入口区距搜索框 14px。历史标题右侧“清空”需二次确认、热区 44px；删除键 44px；主题按钮 46px（窄屏 44px）描边，与历史入口同宽。

标识左侧内缩 6px（窄屏 2px），从 880px 内容区边缘起算；主题按钮右侧不再内缩，与搜索历史图标同宽、共用一条垂直中线，右缘贴内容列。

窄屏（≤700px）三列，≤480px 两列、页面左右内缩 16px。

仅调整展示，跳过 Red → Green；复用前面的搜索、历史和主题验证步骤。

精简版已验证：1440、1024、768、500、481、414、390、360、320px 无横向溢出；搜索框 50px、卡片 46px 在各宽度一致；回车提交、四组顺序与 14 个入口、当前搜索显示与隐藏、中文与特殊字符编码、清空、历史展开与 Esc 收起、历史删除及空态、历史一次清空、斜杠聚焦、501 字符与危险字符拦截、前进后退还原、主题记忆通过；历史入口无文字、页面无提交按钮；浏览器无警告及错误日志。

预览图：`clean-preview.png`（1440×900）、`clean-mobile.png`（390×844，2 倍像素）。

该设计已落到线上代码：`src/template.html`、`src/styles.css`、`src/client.js`，并补上主题切换（`so_theme`），结构断言见 `src/result.test.js`。
