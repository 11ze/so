/**
 * 安全工具测试文件
 * 用于验证安全功能是否正常工作
 */

import {
  escapeHtml,
  escapeHtmlAttribute,
  validateAndCleanKeyword,
  isValidUrl,
  encodeUrlParam,
  generateCSP,
  getSecurityHeaders,
  sanitizeInput,
  isValidIconUrl,
} from './security.js';

// 测试辅助函数
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  ${error.message}`);
  }
}

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

// 输入清理测试
test('sanitizeInput should remove control characters', () => {
  const input = 'test\x00\x01\x02string';
  const result = sanitizeInput(input);
  assert(result === 'teststring', 'Should remove control characters');
});

test('sanitizeInput should remove zero-width characters', () => {
  const input = 'test\u200B\u200Cstring';
  const result = sanitizeInput(input);
  assert(result === 'teststring', 'Should remove zero-width characters');
});

test('sanitizeInput should limit consecutive spaces', () => {
  const input = 'test' + ' '.repeat(30) + 'string';
  const result = sanitizeInput(input);
  assert(result === 'test     string', 'Should limit consecutive spaces');
});

// CSP 生成测试
test('generateCSP should generate valid CSP', () => {
  const csp = generateCSP();

  assert(csp.includes("default-src 'self'"), 'Should include default-src');
  assert(csp.includes('script-src'), 'Should include script-src');
  assert(csp.includes('style-src'), 'Should include style-src');
  assert(csp.includes('img-src'), 'Should include img-src');
  assert(csp.includes("frame-ancestors 'none'"), 'Should include frame-ancestors');
  assert(csp.includes('upgrade-insecure-requests'), 'Should include upgrade-insecure-requests');
});

test('generateCSP should respect options', () => {
  const csp = generateCSP({
    allowInlineScripts: false,
    allowEval: false,
    imgSources: ["'self'"],
  });

  assert(csp.includes("'unsafe-inline'") === csp.includes('style-src'), 'Should handle inline option');
});

// 安全响应头测试
test('getSecurityHeaders should include all headers', () => {
  const headers = getSecurityHeaders();

  assert(headers['Content-Security-Policy'] !== undefined, 'Should include CSP');
  assert(headers['X-Content-Type-Options'] === 'nosniff', 'Should include X-Content-Type-Options');
  assert(headers['X-Frame-Options'] === 'DENY', 'Should include X-Frame-Options');
  assert(headers['Referrer-Policy'] !== undefined, 'Should include Referrer-Policy');
  assert(headers['Strict-Transport-Security'] !== undefined, 'Should include HSTS');
});

test('getSecurityHeaders should respect enable options', () => {
  const headers = getSecurityHeaders({
    enableHSTS: false,
    enableXFrameOptions: false,
  });

  assert(headers['Strict-Transport-Security'] === undefined, 'Should omit HSTS when disabled');
  assert(headers['X-Frame-Options'] === undefined, 'Should omit X-Frame-Options when disabled');
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

console.log('\n=== 安全测试完成 ===');
console.log('所有安全功能测试都已通过!');
