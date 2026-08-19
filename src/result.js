import config from './config.js';
import {
  escapeHtml,
  escapeHtmlAttribute,
  escapeJsonForScript,
  validateAndCleanKeyword,
  isValidUrl,
  encodeUrlParam,
  isValidIconUrl,
} from './utils/security.js';
import templateSource from './template.html';
import stylesSource from './styles.css';
import clientSource from './client.js';

// 单遍填充模板槽位：函数替换的返回值不会被再次扫描，
// 所以用户文本和内联资产里的 {{xxx}} 字面量都不会被二次展开，与填充顺序无关
function fillSlots(html, slots) {
  return html.replace(/\{\{(\w+)\}\}/g, (match, slot) => (Object.hasOwn(slots, slot) ? slots[slot] : match));
}

// 处理图标的函数(增强安全性)
function getIconHtml(icon) {
  if (typeof icon !== 'string' || icon.trim() === '') {
    return '';
  }

  // 验证图标 URL 是否安全 - 使用配置中的参数
  if (!isValidIconUrl(icon, { maxDataUriSize: config.validation.maxDataUriSize })) {
    return '';
  }

  // 检查是否是base64图片
  if (icon.startsWith('data:image/')) {
    return `<img src="${escapeHtmlAttribute(icon)}" alt="" class="button-icon" loading="lazy" onerror="this.classList.add('error')">`;
  }

  // 否则作为URL处理(添加 referrerpolicy 防止信息泄露)
  // 使用 CSS 类控制错误状态,而不是内联样式
  return `<img src="${escapeHtmlAttribute(icon)}" alt="" class="button-icon" loading="lazy" onerror="this.classList.add('error')" referrerpolicy="no-referrer">`;
}

// 组装期常量槽：内联样式 + 内联客户端脚本 + 配置数据岛（零构建单文件产物，见 docs/adr/0001）
const ASSEMBLY_SLOTS = {
  styles: stylesSource,
  client_script: clientSource,
  client_config: escapeJsonForScript({
    maxHistoryItems: config.validation.maxHistoryItems,
    maxQueryLength: config.validation.maxQueryLength,
  }),
};

// 引擎清单的常量部分（图标校验/转义、名称转义、URL 校验）只需算一次，每请求只拼 URL。
// 编码后的关键词只含安全字符，不改变 URL 结构，所以校验结果与关键词无关
const BUTTON_PARTS = config.urls
  .filter(resource => resource.url && typeof resource.url === 'string')
  .map(resource => {
    const valid = isValidUrl(resource.url.replace('%s', 'x'));
    if (!valid) {
      console.warn(`Invalid URL in config: ${resource.name}: ${resource.url}`);
    }
    return {
      urlTemplate: resource.url,
      valid,
      iconHtml: getIconHtml(resource.icon || ''),
      nameHtml: escapeHtml(resource.name),
    };
  });

// 空关键词页（首页）在模块加载时预渲染
const EMPTY_HTML = fillSlots(templateSource, {
  ...ASSEMBLY_SLOTS,
  title: config.title,
  button_list: '',
  current_search: '',
  // 布局归 CSS（.current-search 默认 flex），空页才需要内联隐藏
  current_search_style: 'display: none;',
  keyword: '',
});

export default {
  fetch(searchText) {
    // 验证和清理搜索关键词 - 使用配置中的参数
    const validationResult = validateAndCleanKeyword(searchText, {
      maxLength: config.validation.maxQueryLength,
      minLength: config.validation.minQueryLength,
      allowEmpty: true,
    });

    // 使用验证和清理后的关键词
    const keyword = validationResult.valid ? validationResult.cleaned : '';
    if (!keyword) {
      return EMPTY_HTML;
    }

    // 使用安全的 URL 编码
    const encodeSearchText = encodeUrlParam(keyword);
    const buttonList = [];

    for (const part of BUTTON_PARTS) {
      if (!part.valid) {
        continue;
      }
      buttonList.push(
        `<div class="button"><a href="${escapeHtmlAttribute(part.urlTemplate.replace('%s', encodeSearchText))}" target="_blank" rel="noopener noreferrer">${part.iconHtml}<span class="button-text">${part.nameHtml}</span></a></div>`
      );
    }

    const keywordHtml = escapeHtml(keyword);
    return fillSlots(templateSource, {
      ...ASSEMBLY_SLOTS,
      title: config.title + ' - ' + keywordHtml,
      button_list: buttonList.join('\n'),
      // label/keyword 双 span 结构在模板里，槽位只传转义后的关键词
      current_search: keywordHtml,
      current_search_style: '',
      keyword: escapeHtmlAttribute(keyword),
    });
  },
};
