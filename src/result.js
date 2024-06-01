import config from './config.js';

export default {
  fetch(searchText) {
    const indexHtml = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>11ze</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #ffffff; /* 白色背景 */
            color: #333; /* 主要文本颜色 */
            margin: 0;
            padding: 0;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }

        h1 {
            color: #333; /* 标题颜色 */
        }

        ul {
            list-style-type: none; /* 移除列表默认样式 */
            padding: 0;
        }

        li {
            background-color: #f0f8ff; /* 淡蓝色背景 */
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 5px;
            cursor: pointer; /* 鼠标悬停时显示手型光标 */
        }

        a {
            text-decoration: none; /* 移除链接下划线 */
            color: #333; /* 链接文本颜色 */
            display: block; /* 将链接元素设置为块级元素，使其占据整个列表项空间 */
            padding: 10px; /* 为链接添加内边距，使整个列表项可点击 */
        }
    </style>
    </head>
    <body>
    <div class="container">
        <h1>搜索：{{keyword}}</h1>
        <ul>
            {{li_list}}
        </ul>
    </div>
    </body>
    </html>
    `;

    const resourceList = config.urls;

    const encodeSearchText = encodeURIComponent(searchText);

    const liList = [];
    for (const resource of resourceList) {
      const finalUrl = resource.url.replace('%s', encodeSearchText);
      liList.push(`<li><a href="${finalUrl}">${resource.name}</a></li>`);
    }

    const html = indexHtml.replace('{{keyword}}', searchText).replace('{{li_list}}', liList.join('\n'));

    return html;
  },
};
