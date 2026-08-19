import result from './result.js';
import { getSecurityHeaders } from './utils/security.js';

// 安全响应头策略集中在 security.js（单文件页面需允许内联脚本/样式），模块加载时算一次
const SECURITY_HEADERS = {
  'content-type': 'text/html;charset=UTF-8',
  ...getSecurityHeaders(),
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const searchText = url.searchParams.get('q');

    // 获取 HTML 内容
    const html = result.fetch(searchText);

    return new Response(html, {
      headers: SECURITY_HEADERS,
    });
  },
};
