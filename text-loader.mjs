/**
 * 测试专用 ESM loader：让 node 能像 wrangler rules 一样
 * 把模板三件套按文本导入。
 * 不参与部署——wrangler 侧由 wrangler.toml 的 rules 提供同样能力，
 * result.test.js 里有强制两份清单保持同步的检查。
 */
import { readFile } from 'node:fs/promises';

export const TEXT_MODULE_SUFFIXES = ['/template.html', '/styles.css', '/client.js'];

export async function load(url, context, next) {
  if (TEXT_MODULE_SUFFIXES.some(suffix => url.endsWith(suffix))) {
    const source = await readFile(new URL(url), 'utf8');
    return {
      format: 'module',
      shortCircuit: true,
      source: `export default ${JSON.stringify(source)}`,
    };
  }
  return next(url, context);
}
