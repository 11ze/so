/**
 * 浏览器回归测试
 * 接缝：真实 Chrome 里的渲染页面与用户操作（空态、历史面板、清空、窄屏）。
 * 无 devDependencies：Node 内置 http/WebSocket 驱动本机 Chrome 的 CDP。
 * 需要 Node 22+（内置 WebSocket）和本机 Chrome；找不到默认路径时用 CHROME_PATH 指定。
 */

import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { access, mkdtemp, rm } from 'node:fs/promises';
import { constants } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import result from './result.js';
import { assert, testAsync, finish } from './utils/test-harness.js';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 0;
    this.pending = new Map();
    this.listeners = new Map();
    ws.addEventListener('message', event => {
      let message;
      try {
        message = JSON.parse(event.data);
      } catch {
        return;
      }
      if (message.id !== undefined) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message || 'CDP 调用失败'));
        else pending.resolve(message.result || {});
        return;
      }
      if (!message.method) return;
      for (const listener of this.listeners.get(message.method) || []) {
        listener(message.params || {});
      }
    });
  }

  static async connect(wsUrl) {
    const ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('连接 Chrome 超时')), 5000);
      ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      }, { once: true });
      ws.addEventListener('error', () => {
        clearTimeout(timer);
        reject(new Error('连接 Chrome 失败'));
      }, { once: true });
    });
    return new Cdp(ws);
  }

  send(method, params = {}, timeout = 10000) {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`CDP 超时: ${method}`));
      }, timeout);
      this.pending.set(id, {
        resolve: value => {
          clearTimeout(timer);
          resolve(value);
        },
        reject: error => {
          clearTimeout(timer);
          reject(error);
        },
      });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  on(method, listener) {
    if (!this.listeners.has(method)) this.listeners.set(method, new Set());
    this.listeners.get(method).add(listener);
    return () => this.listeners.get(method)?.delete(listener);
  }

  waitFor(method, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const off = this.on(method, params => {
        clearTimeout(timer);
        off();
        resolve(params);
      });
      const timer = setTimeout(() => {
        off();
        reject(new Error(`等待事件超时: ${method}`));
      }, timeout);
    });
  }

  close() {
    try {
      this.ws.close();
    } catch {}
  }
}

async function findChrome() {
  for (const candidate of CHROME_CANDIDATES) {
    try {
      await access(candidate, constants.X_OK);
      return candidate;
    } catch {}
  }
  throw new Error('找不到 Chrome，请设置 CHROME_PATH 指向 Chrome 可执行文件');
}

async function launchChrome() {
  const chromePath = await findChrome();
  const userDataDir = await mkdtemp(join(tmpdir(), 'so-ui-'));
  const child = spawn(chromePath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    '--disable-extensions',
    '--blink-settings=imagesEnabled=false',
    '--remote-debugging-port=0',
    `--user-data-dir=${userDataDir}`,
    'about:blank',
  ], { stdio: ['ignore', 'ignore', 'pipe'] });

  const wsUrl = await new Promise((resolve, reject) => {
    let stderr = '';
    const timer = setTimeout(() => reject(new Error(`Chrome 启动超时\n${stderr.slice(-500)}`)), 20000);
    const onData = chunk => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/\S+)/);
      if (!match) return;
      clearTimeout(timer);
      child.stderr.off('data', onData);
      resolve(match[1]);
    };
    child.stderr.on('data', onData);
    child.once('error', error => {
      clearTimeout(timer);
      reject(error);
    });
    child.once('exit', code => {
      clearTimeout(timer);
      reject(new Error(`Chrome 提前退出（${code}）\n${stderr.slice(-500)}`));
    });
  });

  return { child, userDataDir, wsUrl };
}

async function stopChrome(child, userDataDir) {
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await Promise.race([once(child, 'exit'), sleep(3000)]);
    if (child.exitCode === null) {
      child.kill('SIGKILL');
      await Promise.race([once(child, 'exit'), sleep(1000)]);
    }
  }
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}

async function evaluate(cdp, expression) {
  const { result: value, exceptionDetails } = await cdp.send('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) {
    throw new Error(exceptionDetails.exception?.description || exceptionDetails.text || '页面脚本异常');
  }
  return value.value;
}

async function waitForFunction(cdp, expression, timeout = 5000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      if (await evaluate(cdp, expression)) return;
    } catch (error) {
      if (!/Execution context was destroyed|Cannot find context|Inspected target navigated/i.test(error.message)) {
        throw error;
      }
    }
    await sleep(50);
  }
  throw new Error(`等待条件超时: ${expression}`);
}

async function setViewport(cdp, width, height, mobile = false) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile,
  });
}

async function navigate(cdp, url) {
  const loaded = cdp.waitFor('Page.loadEventFired', 15000);
  await cdp.send('Page.navigate', { url });
  await loaded;
}

async function reload(cdp) {
  const loaded = cdp.waitFor('Page.loadEventFired', 15000);
  await cdp.send('Page.reload', { ignoreCache: true });
  await loaded;
}

async function startServer() {
  const server = createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
    const keyword = url.searchParams.get('q') || '';
    response.writeHead(200, {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store',
    });
    response.end(result.fetch(keyword));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  return {
    server,
    base: `http://127.0.0.1:${server.address().port}`,
  };
}

async function main() {
  if (typeof WebSocket === 'undefined') {
    throw new Error('浏览器回归测试需要 Node 22+（内置 WebSocket）');
  }

  const pageErrors = [];
  let cdp;
  let chrome;
  let local;

  try {
    local = await startServer();
    chrome = await launchChrome();

    const browserUrl = new URL(chrome.wsUrl);
    const targets = await (await fetch(`http://${browserUrl.hostname}:${browserUrl.port}/json/list`)).json();
    const page = targets.find(target => target.type === 'page');
    if (!page) throw new Error('Chrome 没有可用的页面目标');

    cdp = await Cdp.connect(page.webSocketDebuggerUrl);
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    cdp.on('Runtime.exceptionThrown', ({ exceptionDetails }) => {
      pageErrors.push(exceptionDetails.exception?.description || exceptionDetails.text || '未知脚本异常');
    });

    const resetErrors = () => { pageErrors.length = 0; };
    const assertNoErrors = () => assert(pageErrors.length === 0, `页面不应有脚本异常：${pageErrors.join('; ')}`);

    await testAsync('1440 空态：顶部对齐、中部提示、没有最近搜索', async () => {
      resetErrors();
      await setViewport(cdp, 1440, 900);
      await navigate(cdp, local.base + '/');
      const state = await evaluate(cdp, `(() => {
        const container = document.querySelector('.container');
        const hint = document.querySelector('.empty-hint');
        const topbar = document.querySelector('.topbar').getBoundingClientRect();
        const search = document.querySelector('.search-container').getBoundingClientRect();
        const hintBox = hint.getBoundingClientRect();
        return {
          isEmpty: container.classList.contains('is-empty'),
          hintDisplay: getComputedStyle(hint).display,
          hintText: hint.innerText.replace(/\\s+/g, ' ').trim(),
          hasRecent: Boolean(document.querySelector('#recentSearches')),
          topbarTop: Math.round(topbar.top),
          searchTop: Math.round(search.top),
          hintCenter: Math.round(hintBox.top + hintBox.height / 2),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      })()`);

      assert(state.isEmpty, '首页应有 is-empty 标记');
      assert(state.hintDisplay === 'flex', `提示应显示，实际 ${state.hintDisplay}`);
      assert(state.hintText.includes('从一个关键词开始'), '提示标题应存在');
      assert(state.hintText.includes('一次输入，选一个站点继续搜'), '提示应说明选站点的入口流程');
      assert(!state.hasRecent, '不应再渲染最近搜索');
      assert(state.topbarTop === 24, `页头应有 24px 顶部留白，实际 ${state.topbarTop}`);
      assert(state.searchTop < 120, `搜索框应靠上，实际 ${state.searchTop}`);
      assert(state.hintCenter > 900 * 0.45 && state.hintCenter < 900 * 0.7, `提示应落在空白区中部，实际 ${state.hintCenter}`);
      assert(!state.overflow, '1440 不应横向溢出');
      assertNoErrors();
    });

    await testAsync('12 条历史：面板加高、列表内部滚动', async () => {
      resetErrors();
      await setViewport(cdp, 1440, 900);
      await navigate(cdp, local.base + '/');
      await evaluate(cdp, `localStorage.setItem('search_history', JSON.stringify(
        Array.from({ length: 12 }, (_, index) => '测试关键词 ' + (index + 1))
      ))`);
      await reload(cdp);
      await evaluate(cdp, `document.querySelector('#historyDropdownBtn').click()`);
      await waitForFunction(cdp, `document.querySelectorAll('#historyList .history-item').length === 12`);

      const state = await evaluate(cdp, `(() => {
        const panel = document.querySelector('#historyDropdown');
        const list = document.querySelector('#historyList');
        const rows = list.querySelectorAll('.history-item');
        const panelBox = panel.getBoundingClientRect();
        return {
          visible: panel.classList.contains('show') && getComputedStyle(panel).display !== 'none',
          rows: rows.length,
          panelHeight: Math.round(panelBox.height),
          listClient: list.clientHeight,
          listScroll: list.scrollHeight,
          rowHeight: rows[0] ? Math.round(rows[0].getBoundingClientRect().height) : 0,
          panelBottom: Math.round(panelBox.bottom),
          heading: document.querySelector('.history-heading').innerText.replace(/\\s+/g, ' ').trim(),
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      })()`);

      assert(state.visible, '历史面板应展开');
      assert(state.rows === 12, `应有 12 条历史，实际 ${state.rows}`);
      assert(state.heading.includes('搜索历史'), '标题应为“搜索历史”');
      assert(!state.heading.includes('最近搜索'), '标题不应再出现“最近搜索”');
      assert(state.panelHeight > 500, `面板应加高，实际 ${state.panelHeight}`);
      assert(state.listClient >= 440 && state.listClient <= 480, `列表高度应接近 480，实际 ${state.listClient}`);
      assert(state.listScroll > state.listClient, '12 条时列表应内部滚动');
      assert(state.rowHeight >= 44, `行高应至少 44，实际 ${state.rowHeight}`);
      assert(state.panelBottom <= 900, `面板不应超出视口，实际底部 ${state.panelBottom}`);
      assert(!state.overflow, '展开历史不应横向溢出');
      assertNoErrors();
    });

    await testAsync('结果页到清空：14 个入口，清空后回空态', async () => {
      resetErrors();
      await setViewport(cdp, 1440, 900);
      await navigate(cdp, local.base + '/?q=Cloudflare%20Workers');

      const before = await evaluate(cdp, `(() => ({
        cards: document.querySelectorAll('.button').length,
        groups: document.querySelectorAll('.engine-group').length,
        hint: getComputedStyle(document.querySelector('.empty-hint')).display,
        isEmpty: document.querySelector('.container').classList.contains('is-empty'),
        currentSearch: getComputedStyle(document.querySelector('#currentSearchDisplay')).display,
      }))()`);
      assert(before.cards === 14, `结果页应有 14 个入口，实际 ${before.cards}`);
      assert(before.groups === 4, `结果页应有 4 组入口，实际 ${before.groups}`);
      assert(before.hint === 'none', '结果页不应显示空态提示');
      assert(!before.isEmpty, '结果页不应带 is-empty 标记');
      assert(before.currentSearch === 'none', '当前搜索应默认隐藏');

      await evaluate(cdp, `document.querySelector('#clearButton').click()`);
      await waitForFunction(cdp, `location.pathname === '/' && document.querySelector('.container').classList.contains('is-empty')`);

      const after = await evaluate(cdp, `(() => ({
        cards: document.querySelectorAll('.button').length,
        hint: getComputedStyle(document.querySelector('.empty-hint')).display,
        input: document.querySelector('#searchInput').value,
        path: location.pathname + location.search,
      }))()`);
      assert(after.cards === 0, `清空后不应保留入口，实际 ${after.cards}`);
      assert(after.hint === 'flex', '清空后空态提示应出现');
      assert(after.input === '', '清空后输入框应为空');
      assert(after.path === '/', `清空后地址应回到 /，实际 ${after.path}`);
      assertNoErrors();
    });

    await testAsync('390 空态：提示和面板不出屏，无横向溢出', async () => {
      resetErrors();
      await setViewport(cdp, 390, 844, true);
      await navigate(cdp, local.base + '/');

      const state = await evaluate(cdp, `(() => {
        const hint = document.querySelector('.empty-hint');
        const sub = document.querySelector('.empty-hint-sub');
        const topbar = document.querySelector('.topbar').getBoundingClientRect();
        const hintBox = hint.getBoundingClientRect();
        const subBox = sub.getBoundingClientRect();
        return {
          topbarTop: Math.round(topbar.top),
          hintDisplay: getComputedStyle(hint).display,
          hintText: hint.innerText.replace(/\\s+/g, ' ').trim(),
          hintCenter: Math.round(hintBox.top + hintBox.height / 2),
          subRight: Math.round(subBox.right),
          width: innerWidth,
          overflow: document.documentElement.scrollWidth > innerWidth,
        };
      })()`);
      assert(state.topbarTop === 16, `390 页头应有 16px 顶部留白，实际 ${state.topbarTop}`);
      assert(state.hintDisplay === 'flex', '窄屏空态提示应显示');
      assert(state.hintText.includes('一次输入，选一个站点继续搜'), '窄屏提示文案应存在');
      assert(state.subRight <= state.width, `提示不应超出视口，实际 ${state.subRight}/${state.width}`);
      assert(!state.overflow, '390 不应横向溢出');
      assert(state.hintCenter > 844 * 0.4 && state.hintCenter < 844 * 0.75, `提示应在空白区中部，实际 ${state.hintCenter}`);

      await evaluate(cdp, `document.querySelector('#historyDropdownBtn').click()`);
      const panel = await evaluate(cdp, `(() => {
        const dropdown = document.querySelector('#historyDropdown');
        const box = dropdown.getBoundingClientRect();
        return {
          visible: dropdown.classList.contains('show'),
          left: Math.round(box.left),
          right: Math.round(box.right),
          width: innerWidth,
        };
      })()`);
      assert(panel.visible, '窄屏历史面板应展开');
      assert(panel.left >= 0 && panel.right <= panel.width, `历史面板不应出屏：${panel.left}-${panel.right}/${panel.width}`);
      assertNoErrors();
    });
  } finally {
    cdp?.close();
    if (local) {
      local.server.closeAllConnections?.();
      await new Promise(resolve => local.server.close(resolve));
    }
    await stopChrome(chrome?.child, chrome?.userDataDir);
  }

  finish('浏览器回归测试完成');
}

main().catch(error => {
  console.error(`✗ 浏览器回归测试无法启动: ${error.message}`);
  process.exit(1);
});
