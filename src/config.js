// 开发环境配置
const DEV_CONFIG = {
  base: 'http://localhost:8787/?q=',
};

// 生产环境配置
const PROD_CONFIG = {
  base: 'https://so.wangze.tech?q=',
};

export default {
  get title() {
    return 'so';
  },

  // 获取当前环境的 base URL
  getBaseForEnv(url) {
    // 如果传入 URL,使用 URL 的 origin
    if (url) {
      try {
        const parsed = new URL(url);
        // localhost 或 127.0.0.1 认为是开发环境
        if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          return DEV_CONFIG.base;
        }
        return `${parsed.origin}/?q=`;
      } catch (e) {
        // URL 解析失败,返回默认
        return PROD_CONFIG.base;
      }
    }

    // 默认返回生产环境配置
    return PROD_CONFIG.base;
  },

  // 验证配置 - 统一管理所有验证参数
  validation: {
    maxQueryLength: 500,      // 搜索关键词最大长度
    minQueryLength: 0,        // 搜索关键词最小长度
    maxHistoryItems: 10,      // 搜索历史最大记录数
    maxDataUriSize: 100 * 1024, // 图标 data URI 最大大小 (100KB)
  },

  get urls() {
    // icon 可以是 URL 或 base64
    return [
      {
        name: 'Google',
        url: 'https://www.google.com/search?q=%s',
        icon: 'https://www.google.com/favicon.ico',
      },
      {
        name: '搜狗',
        url: 'https://www.sogou.com/web?query=%s',
        icon: 'https://www.sogou.com/favicon.ico',
      },
      {
        name: '百度',
        url: 'https://www.baidu.com/s?wd=%s',
        icon: 'https://www.baidu.com/favicon.ico',
      },
      {
        name: 'Bing',
        url: 'https://www.bing.com/search?q=%s',
        icon: 'https://www.bing.com/favicon.ico',
      },
      {
        name: '小红书',
        url: 'https://www.xiaohongshu.com/search_result?keyword=%s&source=web_explore_feed',
        icon: 'https://www.xiaohongshu.com/favicon.ico',
      },
      {
        name: 'Google V2EX',
        url: 'https://www.google.com/search?q=site:v2ex.com/t%20%s',
        icon: 'https://www.google.com/favicon.ico',
      },
      {
        name: 'SOV2EX',
        url: 'https://www.sov2ex.com/?q=%s&ref=opensearch',
        icon: 'https://www.v2ex.com/favicon.ico',
      },
      {
        name: '哔哩哔哩',
        url: 'https://search.bilibili.com/all?keyword=%s',
        icon: 'https://www.bilibili.com/favicon.ico',
      },
      {
        name: 'YouTube',
        url: 'https://www.youtube.com/results?search_query=%s',
        icon: 'https://www.youtube.com/favicon.ico',
      },
      {
        name: '腾讯视频',
        url: 'https://v.qq.com/x/search/?q=%s',
        icon: 'https://v.qq.com/favicon.ico',
      },
      {
        name: '豆瓣',
        url: 'https://www.douban.com/search?q=%s',
        icon: 'https://www.douban.com/favicon.ico',
      },
      {
        name: 'AGE',
        url: 'https://www.agedm.org/search?query=%s',
        icon: 'https://www.agedm.io/favicon.ico',
      },
      {
        name: '樱花动漫',
        url: 'https://yhdm.one/search?q=%s',
        icon: 'https://yhdm.one/favicon.ico',
      },
      {
        name: '樱之空动漫',
        url: 'https://www.skr2.cc/vodsearch/-------------/?wd=%s',
        icon: 'https://www.skr2.cc/favicon.ico',
      },
      {
        name: 'OmoFun',
        url: 'https://omofun.in/vod/search.html?wd=%s',
        icon: 'https://omofun.in/favicon.ico',
      },
      {
        name: '爱壹帆',
        url: 'https://www.iyf.tv/search/%s',
        icon: 'https://www.iyf.tv/favicon.ico',
      },
    ];
  },
};
