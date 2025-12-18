export default {
  get title() {
    return 'so';
  },

  get base() {
    return 'https://so.wangze.tech?q=';
  },

  get urls() {
    return [
      {
        name: 'Google',
        url: 'https://www.google.com/search?q=%s',
      },
      {
        name: '搜狗',
        url: 'https://www.sogou.com/web?query=%s',
      },
      {
        name: '百度',
        url: 'https://www.baidu.com/s?wd=%s',
      },
      {
        name: 'Bing',
        url: 'https://www.bing.com/search?q=%s',
      },
      {
        name: '📕 小红书',
        url: 'https://www.xiaohongshu.com/search_result?keyword=%s&source=web_explore_feed',
      },
      {
        name: 'Google V2EX',
        url: 'https://www.google.com/search?q=site:v2ex.com/t%20%s',
      },
      {
        name: 'SOV2EX',
        url: 'https://www.sov2ex.com/?q=%s&ref=opensearch',
      },
      {
        name: '哔哩哔哩',
        url: 'https://search.bilibili.com/all?keyword=%s',
      },
      {
        name: "YouTube",
        url: 'https://www.youtube.com/results?search_query=%s',
      },
      {
        name: '🐧 腾讯视频',
        url: 'https://v.qq.com/x/search/?q=%s',
      },
      {
        name: '🏆 豆瓣',
        url: 'https://www.douban.com/search?q=%s',
      },
      {
        name: 'AGE',
        url: 'https://www.agedm.org/search?query=%s',
      },
      {
        name: '🌸 樱花动漫',
        url: 'https://yhdm.one/search?q=%s',
      },
      {
        name: '🌸 樱之空动漫',
        url: 'https://www.skr2.cc/vodsearch/-------------/?wd=%s',
      },
      {
        name: 'OmoFun',
        url: 'https://omofun.in/vod/search.html?wd=%s',
      },
      {
        name: '爱壹帆',
        url: 'https://www.iyf.tv/search/%s',
      },
    ];
  },
};
