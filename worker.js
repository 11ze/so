/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run "npm run dev" in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run "npm run deploy" to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

import search from './search.js';

export default {
  async fetch(request, env, ctx) {
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

    const url = new URL(request.url);
    const searchText = url.searchParams.get('q');

    if (!searchText) {
      return search.fetch(request, env, ctx);
    }

    const resourceList = [
      {
        name: 'AGE 动漫',
        url: 'https://www.agedm.org/search?query=%s',
      },
      {
        name: '小雅',
        url: 'http://localhost:9060/search?box=%s&url=&type=video',
      },
      {
        name: '懒盘搜索',
        url: 'https://www.lzpanx.com/search?exact=false&page=1&share_time=&type=&user=&q=%s',
      },
      {
        name: '豆瓣',
        url: 'https://www.douban.com/search?q=%s',
      },
      {
        name: '小红书',
        url: 'https://www.xiaohongshu.com/search_result?keyword=%s&source=web_explore_feed',
      },
      {
        name: '哔哩哔哩',
        url: 'https://search.bilibili.com/all?keyword=%s',
      },
    ];

    const encodeSearchText = encodeURIComponent(searchText);

    const liList = [];
    for (const resource of resourceList) {
      const finalUrl = resource.url.replace('%s', encodeSearchText);
      liList.push(`<li><a href="${finalUrl}">${resource.name}</a></li>`);
    }

    const html = indexHtml.replace('{{keyword}}', searchText).replace('{{li_list}}', liList.join('\n'));

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    });
  },
};
