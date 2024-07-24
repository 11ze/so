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
        name: 'AGE',
        url: 'https://www.agedm.org/search?query=%s',
      },
      {
        name: '樱花动漫',
        url: 'https://yhdm.one/search?q=%s',
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
        name: 'SOV2EX',
        url: 'https://www.sov2ex.com/?q=%s&ref=opensearch',
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
        name: 'Devv',
        url: 'https://devv.ai/zh/search/%s',
      },
    ];
  },
};
