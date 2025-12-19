# so

基于 Cloudflare Workers 实现自己的搜索网站。

## 功能亮点

- 自定义搜索结果
- 搜索历史管理
- 免服务器部署
- 所有搜索数据均在浏览器本地存储

## 网站使用说明

- 输入搜索内容，点击搜索按钮或按下 Enter 键即可搜索
- 快捷键快速聚焦搜索框
- 点击搜索历史项快速搜索
- 作为浏览器搜索引擎，如 <https://so.wangze.tech?q=%s>，并设置关键字为 so

## 自部署说明

- 打开：<https://dash.cloudflare.com>
- 部署到 Cloudflare Workers 拿到访问地址（src 里的文件都要添加到 Worker 里）
- 修改 config.js 再部署一次

![image.png](./images/1.png)

![image.png](./images/2.png)

![image.png](./images/3.png)

![image.png](./images/4.png)
