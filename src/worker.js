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
import result from './result.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const searchText = url.searchParams.get('q');

    let html = '';

    if (!searchText) {
      html = search.fetch();
    } else {
      html = result.fetch(searchText);
    }

    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    });
  },
};
