export default {
  get title() {
    return '11ze';
  },

  get base() {
    return 'https://so.wangze.tech?q=';
  },

  get urls() {
    return [
      {
        name: '豆瓣',
        url: 'https://www.douban.com/search?q=%s',
      },
      {
        name: '小雅',
        url: 'http://localhost:9060/search?box=%s&url=&type=video',
      },
      {
        name: "YouTube",
        url: 'https://www.youtube.com/results?search_query=%s',
      },
      {
        name: '哔哩哔哩',
        url: 'https://search.bilibili.com/all?keyword=%s',
      },
      {
        name: '小红书',
        url: 'https://www.xiaohongshu.com/search_result?keyword=%s&source=web_explore_feed',
      },
      {
        name: '搜狗',
        url: 'https://www.sogou.com/web?query=%s&type=2&ie=utf8',
      },
      {
        name: 'Google',
        url: 'https://www.google.com/search?q=%s',
      },
      {
        name: 'DuckDuckGo',
        url: 'https://duckduckgo.com/?q=%s',
      },
      {
        name: 'Perplexity',
        url: 'https://www.perplexity.ai/search?s=o&q=%s',
      },
      {
        name: 'Devv',
        url: 'https://devv.ai/zh/search/%s',
      },
      {
        name: 'SOV2EX',
        url: 'https://www.sov2ex.com/?q=%s&ref=opensearch',
      },
      {
        name: 'AGE 动漫',
        url: 'https://www.agedm.org/search?query=%s',
      },
      {
        name: '懒盘搜索',
        url: 'https://www.lzpanx.com/search?exact=false&page=1&share_time=&type=&user=&q=%s',
      },
    ];
  },
};
