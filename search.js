
export default {
  async fetch(request, env, ctx) {
    const html = `<!DOCTYPE html>
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

          input[type="text"] {
              width: 100%;
              padding: 10px;
              border: 1px solid #ccc;
              border-radius: 5px;
          }
      </style>
      </head>
      <body>
      <div class="container">
          <h1>11ze</h1>
          <form id="searchForm" action="https://www.example.com/search" method="GET">
              <input type="text" id="searchInput" name="query" placeholder="输入搜索内容并按回车">
          </form>
      </div>

      <script>
          document.getElementById("searchInput").addEventListener("keypress", function(e) {
              if (e.key === "Enter") {
                  e.preventDefault(); // 阻止默认提交行为
                  var query = document.getElementById("searchInput").value;
                  var url = "https://so.wangzecn.workers.dev?q=" + query;
                  window.location.href = url; // 跳转到搜索结果页面
              }
          });
      </script>
      </body>
      </html>
  `;

  return new Response(html, {
    headers: {
      'content-type': 'text/html;charset=UTF-8',
    },
  });
},
};
