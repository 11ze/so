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

finish('结果页渲染测试完成');
