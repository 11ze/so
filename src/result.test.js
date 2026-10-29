/**
 * 结果页渲染测试
 * 接缝：result.fetch(searchText) → html（worker.js 消费的同一公开接口）
 */

import result from './result.js';
import stylesSource from './styles.css';
import clientSource from './client.js';
import { assert, test, finish } from './utils/test-harness.js';
import { readFileSync } from 'node:fs';
import { TEXT_MODULE_SUFFIXES } from '../text-loader.mjs';

// 良性输入下产物出现任何 {{...}} 都意味着有槽位漏填
const UNFILLED_SLOT = /\{\{[^}]*\}\}/;

test('搜索词含 $& 时不触发替换特殊语义', () => {
  const html = result.fetch('a$&b');
  assert(html.includes('value="a$&amp;b"'), 'value 应原样保留用户输入（转义后）');
  assert(!html.includes('{{keyword}}'), '输出不应残留未解析的 {{keyword}} 占位符');
});

test('搜索词等于模板占位符时不劫持模板槽位', () => {
  const html = result.fetch('{{button_list}}');
  assert(html.includes('value="{{button_list}}"'), 'value 应保留用户输入的占位符字面量');
  assert(html.includes('<title>so - {{button_list}}</title>'), 'title 应为 so - 关键词');
  assert(
    html.includes('https://www.google.com/search?q=%7B%7Bbutton_list%7D%7D'),
    '按钮链接应包含 URL 编码后的关键词'
  );
});

test('超长搜索词被服务端拒绝，渲染空状态', () => {
  const html = result.fetch('a'.repeat(600));
  assert(html.includes('value=""'), 'value 应为空');
  assert(!html.includes('https://www.google.com/search?q='), '不应渲染搜索按钮');
});

// 被拒绝时不能静默：页面要说明原因，且提示容器可被读屏播报
test('被拒绝的搜索词在页面上给出原因', () => {
  const tooLong = result.fetch('a'.repeat(600));
  assert(tooLong.includes('搜索关键词长度不能超过 500 个字符'), '超长应显示长度原因');
  assert(tooLong.includes('role="alert"'), '提示容器应可被读屏播报');
  assert(tooLong.includes('id="error"'), '提示容器应有 id 供 aria-describedby 引用');

  const illegal = result.fetch('<script>alert(1)</script>');
  assert(illegal.includes('搜索关键词包含非法字符'), '非法字符应显示原因');
  assert(!illegal.includes('https://www.google.com/search?q='), '被拒时不应渲染入口');
  assert(!illegal.includes('<script>alert(1)</script>'), '原因里不应回显原始输入');
});

test('正常搜索与空输入不留提示', () => {
  for (const html of [result.fetch(''), result.fetch('正常关键词')]) {
    assert(html.includes('<p id="error" class="error" role="alert"></p>'), '没有原因时提示容器应为空');
  }
});

test('空输入不崩溃且渲染空状态', () => {
  const html = result.fetch(null);
  assert(html.includes('value=""'), 'null 输入 value 应为空');
});

// 良性输入下产物出现任何 {{...}} 都意味着有槽位漏填（新槽忘注册、EMPTY_HTML 漏填）
test('良性输入的渲染产物不含未填充的模板槽位', () => {
  assert(!UNFILLED_SLOT.test(result.fetch('正常关键词')), '有词页不应残留 {{...}}');
  assert(!UNFILLED_SLOT.test(result.fetch('')), '空页不应残留 {{...}}');
});

// 单遍填充下内联资产是替换值、不会被扫描；这里防的是回归——
// 若改回对已组装页面二次填充，资产里的 {{xxx}} 会重新变成可被用户数据顶替的槽位，
// 而闭合标签序列无论几遍都会截断 HTML 结构
test('内联资产不含模板槽位与闭合标签序列', () => {
  assert(!UNFILLED_SLOT.test(clientSource), 'client.js 不应含 {{...}} 字面量');
  assert(!UNFILLED_SLOT.test(stylesSource), 'styles.css 不应含 {{...}} 字面量');
  assert(!clientSource.includes('</script'), "client.js 不应含 '</script'");
  assert(!stylesSource.includes('</style'), "styles.css 不应含 '</style'");
});

// wrangler rules（部署侧）与 text-loader（测试侧）必须对同一组文件按文本导入，
// 两份清单漂移会导致测试通过但部署产物损坏，这里强制保持同步
test('text-loader 文本模块清单与 wrangler.toml rules 同步', () => {
  const toml = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8');
  const tomlParts = toml.split('[[rules]]');
  assert(tomlParts.length === 2, '预期恰好一个 [[rules]] 块，否则下方提取逻辑不成立');
  const rulesBlock = tomlParts[1];
  assert(rulesBlock.includes('type = "Text"'), 'rules 类型必须是 Text（按文本导入），改类型测试必须红');
  const globs = [...rulesBlock.matchAll(/"(\*\*\/[^"]+)"/g)].map(match => match[1]);
  const suffixes = globs.map(glob => glob.replace(/^\*\*/, ''));
  assert(
    [...suffixes].sort().join() === [...TEXT_MODULE_SUFFIXES].sort().join(),
    `wrangler globs [${globs}] 与 loader 后缀 [${TEXT_MODULE_SUFFIXES}] 不一致`
  );
});

// 复刻设计稿的页头契约：主题按钮存在，且主题在样式之前确定，避免首屏闪白
test('页头渲染主题切换按钮，主题在样式前初始化', () => {
  for (const html of [result.fetch(''), result.fetch('正常关键词')]) {
    assert(html.includes('id="themeToggle"'), '应渲染主题切换按钮');
    const initAt = html.indexOf('documentElement.dataset.theme');
    const styleAt = html.indexOf('<style>');
    assert(initAt > -1 && initAt < styleAt, '主题初始化脚本应位于 <style> 之前');
  }
});

// 设计稿去掉了提交按钮，历史入口只剩图标；这两条是模板结构契约
test('脚本创建的按钮显式声明 type，表单内不会被当成提交按钮', () => {
  // 模板里没有 submit 按钮，但历史行的删除键是运行时创建的，默认 type 就是 submit
  const created = [...clientSource.matchAll(/const (\w+) = document\.createElement\('button'\)/g)].map((m) => m[1]);
  assert(created.length > 0, '应能找到客户端动态创建的按钮');
  for (const variable of created) {
    assert(
      clientSource.includes(`${variable}.type = 'button'`),
      `${variable} 没有声明 type="button"，在 #searchForm 内点击会提交表单`
    );
  }
});

// 点历史条目、按回车都曾是 window.location.href 整页重载；现在客户端取同源页面换结果区。
// 客户端只认页面结构，不复制服务端校验，所以这里守住它要替换的钩子和不再出现的整页跳转
test('搜索换页在客户端完成，不再整页重载', () => {
  const html = result.fetch('正常关键词');
  for (const hook of ['id="currentSearchDisplay"', 'class="current-search-keyword"', 'class="button-container"', 'id="error"']) {
    assert(html.includes(hook), `结果页应渲染客户端换页依赖的钩子：${hook}`);
  }
  assert(!/window\.location\.href\s*=/.test(clientSource), '客户端不应再用赋值 location.href 整页跳到搜索页');
  assert(clientSource.includes('pushState'), '换页后应用 pushState 更新地址栏');
  assert(clientSource.includes('popstate'), '前进后退应触发客户端换页');
});

test('无提交按钮，历史入口只保留时钟图标', () => {
  const html = result.fetch('正常关键词');
  assert(!html.includes('type="submit"'), '页面不应包含提交按钮');
  assert(html.includes('class="search-symbol"'), '搜索框应包含放大镜容器');
  const trigger = (html.match(/<button[^>]*id="historyDropdownBtn"[\s\S]*?<\/button>/) || [''])[0];
  assert(trigger !== '', '应渲染历史入口');
  assert(trigger.includes('class="clock"'), '历史入口应含时钟图标');
  // 只留标签之间的文本，属性里的 aria-label/title 不算可见文字
  const visibleText = trigger.replace(/<[^>]*>/g, '').trim();
  assert(visibleText === '', `历史入口不应有可见文字，实际为 ${JSON.stringify(visibleText)}`);
  assert(/aria-label="搜索历史"/.test(trigger), '图标按钮需要无障碍名称');
  assert(/aria-expanded="false"/.test(trigger), '入口应暴露展开状态');
});

// 设计稿的搜索区标注：表单语义、输入框可读名称、蓝色放大镜 favicon
test('搜索区语义与 favicon 按设计稿标注', () => {
  const html = result.fetch('');
  assert(html.includes('role="search"'), '表单应声明 role="search"');
  assert(/id="searchInput"[^>]*aria-label="搜索关键词"/.test(html), '输入框应有可读名称');
  assert(/id="searchInput"[^>]*autocomplete="off"/.test(html), '输入框应关闭自动补全');
  assert(html.includes('stroke=%22%230069ad%22'), 'favicon 应换成设计稿的蓝色放大镜');
  assert(!html.includes('🔍'), '不应保留 emoji favicon');
});

// 主题存储键两处各写一份时，改一处会静默回落到默认主题
test('主题存储键在模板里单点定义', () => {
  const html = result.fetch('');
  assert(html.includes('data-theme-key="so_theme"'), 'html 元素应声明主题存储键');
  const initAt = html.indexOf('document.documentElement.dataset.themeKey');
  assert(initAt > -1 && initAt < html.indexOf('<style>'), '首屏脚本应读取同一来源');
  assert(!clientSource.includes("'so_theme'"), 'client.js 不应再硬编码主题键');
});

finish('结果页渲染测试完成');
