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
  },
};
