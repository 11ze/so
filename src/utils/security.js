/**
 * 安全工具模块
 * 提供 XSS 防护、HTML 转义、URL 验证等安全功能
 */

/**
 * HTML 实体编码表
 */
const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

/**
 * 预编译的 XSS 攻击模式正则表达式
 * 避免在每次函数调用时重复创建,提升性能
 */
const XSS_PATTERNS = [
  /<script/i,
  /javascript:/i,
  /\bon\w+\s*=/i, // onclick=, onload= 等（词边界避免误杀 money=100 这类 on 在词中的查询）
  /<iframe/i,
  /<embed/i,
  /<object/i,
  /<link/i,
  /<meta/i,
  /<style/i,
  /expression\s*\(/i,
];

/**
 * 转义 HTML 特殊字符,防止 XSS 攻击
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的字符串
 */
export function escapeHtml(str) {
  if (typeof str !== 'string') {
    return '';
  }

  return String(str).replace(/[&<>"'`=\/]/g, (char) => HTML_ENTITIES[char] || char);
}

/**
 * 转义 HTML 属性值
 * @param {string} str - 需要转义的属性值
 * @returns {string} 转义后的字符串
 */
export function escapeHtmlAttribute(str) {
  if (typeof str !== 'string') {
    return '';
  }

  // 属性值需要转义引号和其他特殊字符
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * JSON 数据岛专用转义：JSON.stringify 不转义 /，
 * < 需转义为 \u003C 防止字符串值提前闭合 <script> 标签
 * @param {*} value - 可 JSON 序列化的值
 * @returns {string} 可安全内联到 <script> 的 JSON 文本
 */
export function escapeJsonForScript(value) {
  return JSON.stringify(value).replace(/</g, '\\u003C');
}

/**
 * 验证并清理搜索关键词
 * @param {string} keyword - 搜索关键词
 * @param {Object} options - 配置选项
 * @returns {Object} { valid: boolean, cleaned: string, error?: string }
 */
export function validateAndCleanKeyword(keyword, options = {}) {
  const {
    maxLength = 500, // 最大长度限制(默认 500)
    minLength = 0,   // 最小长度限制(默认 0)
    allowEmpty = false, // 是否允许空字符串(默认 false)
  } = options;

  // 如果为 null 或 undefined
  if (keyword == null) {
    return {
      valid: allowEmpty,
      cleaned: '',
      error: allowEmpty ? undefined : '搜索关键词不能为空',
    };
  }

  // 转换为字符串
  const str = String(keyword);

  // 检查长度
  if (str.length > maxLength) {
    return {
      valid: false,
      cleaned: '',
      error: `搜索关键词长度不能超过 ${maxLength} 个字符`,
    };
  }

  if (str.length < minLength) {
    return {
      valid: false,
      cleaned: '',
      error: `搜索关键词长度不能少于 ${minLength} 个字符`,
    };
  }

  // 去除首尾空白
  const trimmed = str.trim();

  if (!allowEmpty && trimmed.length === 0) {
    return {
      valid: false,
      cleaned: '',
      error: '搜索关键词不能为空',
    };
  }

  // 检测潜在的 XSS 攻击模式
  // 使用预编译的正则表达式常量,避免重复创建,提升性能
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        cleaned: '',
        error: '搜索关键词包含非法字符',
      };
    }
  }

  return {
    valid: true,
    cleaned: trimmed,
  };
}

/**
 * 验证 URL 是否安全
 * @param {string} url - 需要验证的 URL
 * @returns {boolean} 是否安全
 */
export function isValidUrl(url) {
  if (typeof url !== 'string') {
    return false;
  }

  try {
    const parsed = new URL(url);

    // 只允许 http 和 https 协议
    // 这已经涵盖了所有危险协议(javascript:, data:, vbscript:, file:, ftp: 等)
    // 因为它们无法被 URL 构造函数解析为合法的 URL
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch (e) {
    // URL 解析失败,包括:
    // - 伪协议(javascript:, data:, vbscript: 等)
    // - 格式错误的 URL
    return false;
  }
}

/**
 * 安全地编码 URL 参数
 * @param {string} str - 需要编码的字符串
 * @returns {string} 编码后的字符串
 */
export function encodeUrlParam(str) {
  if (typeof str !== 'string') {
    return '';
  }

  // 使用 encodeURIComponent 进行 URL 编码
  return encodeURIComponent(str);
}

/**
 * 生成 CSP 头部值
 * 本站策略：单文件页面需允许内联脚本/样式，搜索引擎图标需要开放图片来源
 * @returns {string} CSP 头部值
 */
export function generateCSP() {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    'img-src * data:',
    "connect-src 'self'",
    "font-src 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "frame-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'", // 防止被嵌入 iframe
    'upgrade-insecure-requests',
  ].join('; ');
}

/**
 * 生成推荐的安全响应头
 * @returns {Object} 安全头部对象
 */
export function getSecurityHeaders() {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': generateCSP(),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  };
}

/**
 * 验证图标 URL 是否安全
 * @param {string} iconUrl - 图标 URL
 * @param {Object} [options={}] - 配置选项(可选)
 * @param {number} [options.maxDataUriSize=102400] - data URI 最大大小(字节),默认 100KB
 * @returns {boolean} 是否安全
 */
export function isValidIconUrl(iconUrl, options = {}) {
  const {
    maxDataUriSize = 100 * 1024, // 默认 100KB
  } = options || {};

  if (!iconUrl || typeof iconUrl !== 'string') {
    return false;
  }

  const trimmed = iconUrl.trim();

  // 允许 data:image (base64 图片)
  if (trimmed.startsWith('data:image/')) {
    // 限制 data URI 大小(防止 DOS 攻击)
    if (trimmed.length > maxDataUriSize) {
      return false;
    }

    // 验证 data URI 格式
    return /^data:image\/(png|jpg|jpeg|gif|svg\+xml|ico|webp);base64,[a-zA-Z0-9+/=]+$/i.test(trimmed);
  }

  // 其他 URL 需要通过标准 URL 验证
  return isValidUrl(trimmed);
}
