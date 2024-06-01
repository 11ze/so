import config from './config.js';

export default {
  fetch(searchText) {
    const indexHtml = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
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

        input[type="text"] {
          width: 100%;
          height: 30px;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 5px;
        }
    </style>
    </head>
    <body>
    <div class="container">
        <h1>
            搜索
            <form id="searchForm" action="/" method="GET">
              <input type="text" id="searchInput" name="query" placeholder="输入搜索内容并按回车" value="{{keyword}}"/>
            </form>
        </h1>
        <ul>
            {{li_list}}
        </ul>
    </div>

    <script>
    document.getElementById("searchInput").addEventListener("keypress", function(e) {
        if (e.key === "Enter") {
            e.preventDefault(); // 阻止默认提交行为
            var query = document.getElementById("searchInput").value;
            var url = "{{base}}" + query;
            window.location.href = url;
        }
    });
    </script>
    </body>
    </html>
    `;

    let title = config.title;
    const base = config.base;
    const resourceList = config.urls;

    const keyword = searchText || '';

    let html = indexHtml.replace('{{base}}', base).replace('{{keyword}}', keyword);

    const encodeSearchText = encodeURIComponent(searchText);

    const liList = [];
    if (searchText) {
      for (const resource of resourceList) {
        const finalUrl = resource.url.replace('%s', encodeSearchText);
        liList.push(`<li><a href="${finalUrl}">${resource.name}</a></li>`);
      }
      title += ' - ' + searchText;
    }

    return html.replace('{{title}}', title).replace('{{li_list}}', liList.join('\n'));
  },
};
