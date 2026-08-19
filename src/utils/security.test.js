/**
 * 安全工具测试文件
 * 用于验证安全功能是否正常工作
 */

import {
  escapeHtml,
  escapeHtmlAttribute,
  escapeJsonForScript,
  validateAndCleanKeyword,
  isValidUrl,
  encodeUrlParam,
  generateCSP,
  getSecurityHeaders,
  isValidIconUrl,
} from './security.js';
import { assert, test, finish } from './test-harness.js';

// HTML 转义测试
test('escapeHtml should escape special characters', () => {
  assert(escapeHtml('<script>') === '&lt;script&gt;', 'Should escape < and >');
  assert(escapeHtml('"test"') === '&quot;test&quot;', 'Should escape quotes');
  assert(escapeHtml("'test'") === '&#x27;test&#x27;', 'Should escape single quotes');
  assert(escapeHtml('test & test') === 'test &amp; test', 'Should escape &');
});

test('escapeHtml should handle empty string', () => {
  assert(escapeHtml('') === '', 'Should handle empty string');
});

// JSON 数据岛转义测试
test('escapeJsonForScript should escape < to prevent script breakout', () => {
  const json = escapeJsonForScript({ evil: '</script>' });
  assert(!json.includes('</script'), 'Should not contain closable tag sequence');
  assert(json.includes('\\u003C'), 'Should escape < as \\u003C');
  assert(JSON.parse(json).evil === '</script>', 'Should preserve JSON semantics');
});

test('escapeHtml should handle null', () => {
  assert(escapeHtml(null) === '', 'Should handle null');
  assert(escapeHtml(undefined) === '', 'Should handle undefined');
});

// 属性转义测试
test('escapeHtmlAttribute should escape attributes', () => {
  assert(
    escapeHtmlAttribute('" onclick="alert(\'xss\')"') === '&quot; onclick=&quot;alert(&#x27;xss&#x27;)&quot;',
    'Should escape dangerous attributes'
  );
});

// 输入验证测试
test('validateAndCleanKeyword should accept valid input', () => {
  const result = validateAndCleanKeyword('test search');
  assert(result.valid === true, 'Should accept valid input');
  assert(result.cleaned === 'test search', 'Should clean input');
});

test('validateAndCleanKeyword should accept benign on-word queries', () => {
  // on 出现在单词中间的普通查询（如 money=100）不应命中 on\w+= 模式
  ['money=100', 'neon=blue', 'person = manager', 'comparisons=2'].forEach(query => {
    const result = validateAndCleanKeyword(query);
    assert(result.valid === true, `Should accept benign query: ${query}`);
  });
});

test('validateAndCleanKeyword should reject event-handler patterns', () => {
  // 事件处理器形态（on 为词首 + =）仍必须拒绝
  ['onclick=alert(1)', '<img src=x onerror=alert(1)>', 'onload = x'].forEach(query => {
    const result = validateAndCleanKeyword(query);
    assert(result.valid === false, `Should reject event handler: ${query}`);
  });
});

test('validateAndCleanKeyword should reject XSS attempts', () => {
  const xssAttempts = [
    '<script>alert("xss")</script>',
    '<img src="x" onerror="alert(1)">',
    'javascript:alert("xss")',
    '<iframe src="evil.com"></iframe>',
  ];

  xssAttempts.forEach(attempt => {
    const result = validateAndCleanKeyword(attempt);
    assert(result.valid === false, `Should reject XSS attempt: ${attempt}`);
    assert(result.error !== undefined, 'Should provide error message');
  });
});

test('validateAndCleanKeyword should enforce length limit', () => {
  const longInput = 'a'.repeat(1000);
  const result = validateAndCleanKeyword(longInput, { maxLength: 500 });
  assert(result.valid === false, 'Should reject input over max length');
  assert(result.error?.includes('500'), 'Error should mention max length');
});

test('validateAndCleanKeyword should trim whitespace', () => {
  const result = validateAndCleanKeyword('  test  ');
  assert(result.valid === true, 'Should accept trimmed input');
  assert(result.cleaned === 'test', 'Should trim whitespace');
});

// URL 验证测试
test('isValidUrl should accept valid URLs', () => {
  assert(isValidUrl('https://example.com') === true, 'Should accept HTTPS URL');
  assert(isValidUrl('http://example.com') === true, 'Should accept HTTP URL');
});

test('isValidUrl should reject dangerous URLs', () => {
  assert(isValidUrl('javascript:alert("xss")') === false, 'Should reject javascript: URL');
  assert(isValidUrl('data:text/html,<script>alert(1)</script>') === false, 'Should reject data: URL (except images)');
  assert(isValidUrl('vbscript:msgbox("xss")') === false, 'Should reject vbscript: URL');
});

test('isValidUrl should reject invalid URLs', () => {
  assert(isValidUrl('not a url') === false, 'Should reject invalid URL');
  assert(isValidUrl('ftp://example.com') === false, 'Should reject FTP');
  assert(isValidUrl('file:///etc/passwd') === false, 'Should reject file: protocol');
});

test('isValidUrl should not reject URLs containing javascript in path', () => {
  assert(isValidUrl('https://example.com/article/javascript-tutorial') === true, 'Should accept URL with javascript in path');
  assert(isValidUrl('http://example.com/search?q=javascript') === true, 'Should accept URL with javascript in query');
});

// 图标 URL 验证测试
test('isValidIconUrl should accept data:image URIs', () => {
  assert(isValidIconUrl('data:image/png;base64,iVBORw0KGgo=') === true, 'Should accept data:image PNG');
  // SVG base64 格式（更安全）
  assert(isValidIconUrl('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiI+PC9zdmc+') === true, 'Should accept data:image SVG (base64)');
});

test('isValidIconUrl should accept HTTPS URLs', () => {
  assert(isValidIconUrl('https://example.com/icon.png') === true, 'Should accept HTTPS icon URL');
});

test('isValidIconUrl should reject invalid icon URLs', () => {
  assert(isValidIconUrl('javascript:alert(1)') === false, 'Should reject javascript: URL');
  assert(isValidIconUrl('data:text/html,<script>') === false, 'Should reject non-image data URI');
});

// CSP 生成测试
test('generateCSP 应输出本站固定策略（允许内联脚本/样式，图标开放图片来源）', () => {
  assert(
    generateCSP() ===
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src * data:; connect-src 'self'; font-src 'self'; object-src 'none'; media-src 'self'; frame-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
    'CSP 应与既定策略逐字一致'
  );
});

// 安全响应头测试
test('getSecurityHeaders 零参返回完整安全头集合', () => {
  const headers = getSecurityHeaders();

  assert(headers['Content-Security-Policy'] === generateCSP(), 'CSP 头应等于 generateCSP()');
  assert(headers['X-Content-Type-Options'] === 'nosniff', 'Should include X-Content-Type-Options');
  assert(headers['X-Frame-Options'] === 'DENY', 'Should include X-Frame-Options');
  assert(headers['Referrer-Policy'] === 'strict-origin-when-cross-origin', 'Should include Referrer-Policy');
  assert(headers['Permissions-Policy'] !== undefined, 'Should include Permissions-Policy');
  assert(headers['Strict-Transport-Security'] === 'max-age=31536000; includeSubDomains; preload', 'Should include HSTS');
});

// URL 编码测试
test('encodeUrlParam should encode special characters', () => {
  assert(encodeUrlParam('test search') === 'test%20search', 'Should encode spaces');
  assert(encodeUrlParam('<script>') === '%3Cscript%3E', 'Should encode special chars');
  assert(encodeUrlParam('中文') !== '中文', 'Should encode non-ASCII characters');
});

test('encodeUrlParam should handle empty string', () => {
  assert(encodeUrlParam('') === '', 'Should handle empty string');
  assert(encodeUrlParam(null) === '', 'Should handle null');
});

finish('安全测试完成');

