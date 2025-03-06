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
        name: '搜狗',
        url: 'https://www.sogou.com/web?query=%s&type=2&ie=utf8',
      },
      {
        name: 'Google',
        url: 'https://www.google.com/search?q=%s',
      },
      {
        name: 'SOV2EX',
        url: 'https://www.sov2ex.com/?q=%s&ref=opensearch',
      },
      {
        name: 'Google V2EX',
        url: 'https://www.google.com/search?q=site:v2ex.com/t%20%s',
      },
    ];
  },
};
