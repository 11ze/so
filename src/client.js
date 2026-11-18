// 配置由服务端经 template.html 的 JSON 数据岛注入
const CONFIG = JSON.parse(document.getElementById('client-config').textContent);

// 主题偏好由 template.html 的内联脚本在首屏读取，存储键在 html 元素上单点定义
const THEME_KEY = document.documentElement.dataset.themeKey;

// 搜索历史管理
const SEARCH_HISTORY_KEY = 'search_history';
const SEARCH_INPUT_ID = 'searchInput';
const MOBILE_REGEX = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
const RECENT_SEARCH_LIMIT = 5;

function isMobileDevice() {
  return MOBILE_REGEX.test(navigator.userAgent);
}

// 获取搜索历史
function getSearchHistory() {
  try {
    const history = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (!history) return [];

    const parsed = JSON.parse(history);

    // 验证数据结构
    if (!Array.isArray(parsed)) return [];

    // 过滤非法条目并限制数量、单条长度
    return parsed
      .filter(item => typeof item === 'string' && item.length > 0 && item.length <= CONFIG.maxQueryLength)
      .slice(0, CONFIG.maxHistoryItems);
  } catch (e) {
    console.error('Failed to parse search history:', e);
    // 清除损坏的数据
    try {
      localStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (cleanupError) {
      console.error('Failed to clear corrupted history:', cleanupError);
    }
    return [];
  }
}

// 保存搜索历史（调用方保证传入 trim 过的非空字符串）
function saveSearchHistory(query) {
  const history = getSearchHistory();

  // 移除重复项
  const filteredHistory = history.filter(item => item !== query);

  // 添加到开头
  filteredHistory.unshift(query);

  // 限制数量
  const limitedHistory = filteredHistory.slice(0, CONFIG.maxHistoryItems);

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limitedHistory));
  } catch (e) {
    console.error('Failed to save search history:', e);

    // 如果是配额超限错误,尝试删除最旧的记录后重试
    if (e.name === 'QuotaExceededError' && limitedHistory.length > 1) {
      try {
        const reducedHistory = limitedHistory.slice(0, Math.floor(CONFIG.maxHistoryItems / 2));
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(reducedHistory));
      } catch (retryError) {
        console.error('Failed to save reduced history:', retryError);
      }
    }
  }
}

// 删除搜索历史项（query 来自渲染时 encodeURIComponent 的数据，必为字符串）
function deleteSearchHistoryItem(query) {
  const history = getSearchHistory();
  const filteredHistory = history.filter(item => item !== query);

  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filteredHistory));
    renderHistoryDropdown();
    renderRecentSearches();
  } catch (e) {
    console.error('Failed to delete search history item:', e);
  }
}

// 空页把最近 5 条直接露出来；其他地方保持隐藏，只走时钟入口
function renderRecentSearches() {
  const box = document.getElementById('recentSearches');
  const list = document.getElementById('recentList');
  const container = document.querySelector('.container');
  if (!box || !list) return;

  const emptyView = container ? container.classList.contains('is-empty') : false;
  const history = emptyView ? getSearchHistory().slice(0, RECENT_SEARCH_LIMIT) : [];

  list.replaceChildren();
  if (history.length === 0) {
    box.hidden = true;
    return;
  }

  for (const query of history) {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'recent-chip';
    chip.textContent = query;
    chip.title = query;
    list.appendChild(chip);
  }
  box.hidden = false;
}

// 清空历史是破坏性操作：第一次点改成“确认清空”，3 秒后复位
let clearHistoryArmed = false;
let clearHistoryTimer = null;

function resetClearHistory() {
  clearHistoryArmed = false;
  clearTimeout(clearHistoryTimer);
  const btn = document.getElementById('clearHistoryBtn');
  if (btn) {
    btn.textContent = '清空';
    btn.setAttribute('aria-label', '清空搜索历史');
  }
}

// 渲染搜索历史下拉框
function renderHistoryDropdown() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  const history = getSearchHistory();
  const clearBtn = document.getElementById('clearHistoryBtn');
  if (clearBtn) clearBtn.hidden = history.length === 0;

  if (history.length === 0) {
    historyList.innerHTML = '<div class="history-empty">暂无搜索历史</div>';
    return;
  }

  // 安全地创建 DOM 元素
  historyList.innerHTML = '';

  for (const query of history) {
    const itemDiv = document.createElement('div');
    itemDiv.className = 'history-item';
    itemDiv.dataset.query = encodeURIComponent(query);

    // 重搜动作放在独立 button 上：键盘可聚焦、回车可用，删除按钮仍是它的兄弟节点
    const queryBtn = document.createElement('button');
    queryBtn.type = 'button';
    queryBtn.className = 'history-query';
    queryBtn.dataset.query = encodeURIComponent(query);

    const textSpan = document.createElement('span');
    textSpan.className = 'history-item-text';
    textSpan.textContent = query;
    queryBtn.appendChild(textSpan);

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'history-item-delete';
    const deleteIcon = document.createElement('span');
    deleteIcon.className = 'close-symbol';
    deleteIcon.setAttribute('aria-hidden', 'true');
    deleteBtn.appendChild(deleteIcon);
    deleteBtn.dataset.query = encodeURIComponent(query);
    deleteBtn.setAttribute('aria-label', `删除历史记录：${query}`);
    deleteBtn.title = `删除历史记录：${query}`;

    itemDiv.appendChild(queryBtn);
    itemDiv.appendChild(deleteBtn);
    historyList.appendChild(itemDiv);
  }
  // 事件监听通过事件委托在 DOMContentLoaded 中统一设置
}

// 显示搜索历史下拉框
function showHistoryDropdown() {
  const dropdown = document.getElementById('historyDropdown');
  const btn = document.getElementById('historyDropdownBtn');

  if (!dropdown || !btn) return;

  renderHistoryDropdown();
  resetClearHistory();
  dropdown.classList.add('show');
  btn.classList.add('active');
  btn.setAttribute('aria-expanded', 'true');
}

// 隐藏搜索历史下拉框
function hideHistoryDropdown() {
  const dropdown = document.getElementById('historyDropdown');
  const btn = document.getElementById('historyDropdownBtn');

  if (!dropdown || !btn) return;

  resetClearHistory();
  dropdown.classList.remove('show');
  btn.classList.remove('active');
  btn.setAttribute('aria-expanded', 'false');
}

// 切换搜索历史下拉框显示状态
function toggleHistoryDropdown() {
  const dropdown = document.getElementById('historyDropdown');
  if (!dropdown) return;

  if (dropdown.classList.contains('show')) {
    hideHistoryDropdown();
  } else {
    showHistoryDropdown();
  }
}

// 检测客户端类型并设置合适的placeholder
function getClientSpecificPlaceholder() {
  if (isMobileDevice()) {
    return "搜索...";
  }
  return "输入后回车搜索";
}

// 设置合适的placeholder并聚焦搜索框
document.addEventListener("DOMContentLoaded", function() {
  const searchInput = document.getElementById(SEARCH_INPUT_ID);
  if (searchInput) {
    searchInput.placeholder = getClientSpecificPlaceholder();

    // 非移动设备自动聚焦搜索框
    if (!isMobileDevice()) {
      // 页面加载时自动聚焦到搜索框（仅在桌面端）
      searchInput.focus();
      // 如果有内容，将光标移动到末尾
      if (searchInput.value) {
        searchInput.setSelectionRange(searchInput.value.length, searchInput.value.length);
      }
    }

    // 初始化清空按钮状态
    toggleClearButton();
    syncCurrentSearch();
    renderRecentSearches();

    // 监听输入框内容变化
    searchInput.addEventListener("input", toggleClearButton);
    searchInput.addEventListener("input", syncCurrentSearch);

    // 服务端拒绝时留下的提示，用户重新输入后清掉
    const errorDisplay = document.getElementById("error");
    if (errorDisplay) {
      searchInput.addEventListener("input", function() {
        errorDisplay.textContent = "";
      });
    }

    // 历史下拉框按钮事件
    document.getElementById("historyDropdownBtn").addEventListener("click", function(e) {
      e.preventDefault();
      e.stopPropagation(); // 阻止事件冒泡，防止与 document 点击事件冲突
      toggleHistoryDropdown();
    });

    // 点击页面其他地方关闭历史下拉框
    document.addEventListener("click", function(e) {
      const dropdown = document.getElementById("historyDropdown");
      const btn = document.getElementById("historyDropdownBtn");

      if (!dropdown.contains(e.target) && e.target !== btn) {
        hideHistoryDropdown();
      }
    });

    // 事件委托：历史列表点击事件（只设置一次）
    document.getElementById('historyList').addEventListener('click', function(e) {
      const deleteBtn = e.target.closest('.history-item-delete');
      const historyItem = e.target.closest('.history-item');

      if (deleteBtn) {
        e.stopPropagation();
        const query = decodeURIComponent(deleteBtn.dataset.query);
        deleteSearchHistoryItem(query);
        // 删除后原按钮已销毁，焦点回历史入口，和清空全部一致
        document.getElementById('historyDropdownBtn').focus();
      } else if (historyItem) {
        const query = decodeURIComponent(historyItem.dataset.query);
        const searchInputEl = document.getElementById(SEARCH_INPUT_ID);
        if (searchInputEl) {
          searchInputEl.value = query;
          toggleClearButton();
          hideHistoryDropdown();
          performSearch();
        }
      }
    });

    // 清空全部历史：二次确认后清掉，面板留在空态
    document.getElementById('clearHistoryBtn').addEventListener('click', function() {
      const btn = this;
      if (!clearHistoryArmed) {
        clearHistoryArmed = true;
        btn.textContent = '确认清空';
        btn.setAttribute('aria-label', '确认清空搜索历史');
        clearHistoryTimer = setTimeout(resetClearHistory, 3000);
        return;
      }

      resetClearHistory();
      try {
        localStorage.removeItem(SEARCH_HISTORY_KEY);
      } catch (e) {
        console.error('Failed to clear search history:', e);
      }
      renderHistoryDropdown();
      renderRecentSearches();
      document.getElementById('historyDropdownBtn').focus();
    });

    // 空页最近搜索：点一下等于重搜
    document.getElementById('recentList').addEventListener('click', function(e) {
      const chip = e.target.closest('.recent-chip');
      if (!chip) return;

      searchInput.value = chip.textContent;
      toggleClearButton();
      performSearch();
    });

    // 页面加载时，如果搜索框有内容，将其添加到搜索历史
    if (searchInput.value.trim() !== "") {
      saveSearchHistory(searchInput.value.trim());
    }
  }
});

// 主题切换：按钮标签跟随当前主题，选择写入 localStorage
function updateThemeToggle() {
  const toggle = document.getElementById('themeToggle');
  if (!toggle) return;

  const label = document.documentElement.dataset.theme === 'dark' ? '切换到浅色' : '切换到深色';
  toggle.setAttribute('aria-label', label);
  toggle.title = label;
}

document.addEventListener("DOMContentLoaded", function() {
  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  updateThemeToggle();

  toggle.addEventListener("click", function() {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (e) {
      console.error('Failed to save theme:', e);
    }

    updateThemeToggle();
  });

  // 没手选过时继续跟随系统，避免页面开着时切系统主题不生效
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(event) {
    let saved = null;
    try {
      saved = localStorage.getItem(THEME_KEY);
    } catch (e) {}

    if (saved === 'light' || saved === 'dark') return;

    document.documentElement.dataset.theme = event.matches ? 'dark' : 'light';
    updateThemeToggle();
  });
});

// 全局快捷键监听器
document.addEventListener("keydown", function(e) {
    // "/" 键且不在输入框中时，聚焦搜索框
    if (e.key === "/" && document.activeElement.id !== SEARCH_INPUT_ID) {
        e.preventDefault();
        document.getElementById(SEARCH_INPUT_ID).focus();
    }

    // Escape 关历史面板并把焦点还给入口
    if (e.key === "Escape") {
        const dropdown = document.getElementById("historyDropdown");
        const trigger = document.getElementById("historyDropdownBtn");

        if (dropdown && dropdown.classList.contains("show")) {
            e.preventDefault();
            hideHistoryDropdown();
            if (trigger) trigger.focus();
        }
    }
});

// 搜索框的回车键监听器
document.getElementById(SEARCH_INPUT_ID).addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
    }
});

document.getElementById("clearButton").addEventListener("click", function() {
    clearSearch();
});

// 首页状态：没有关键词时入口卡片、当前搜索、提示一起清掉
function renderEmptyState() {
    const searchInput = document.getElementById(SEARCH_INPUT_ID);
    if (searchInput) searchInput.value = "";

    const errorDisplay = document.getElementById("error");
    if (errorDisplay) errorDisplay.textContent = "";

    const currentSearchDisplay = document.getElementById("currentSearchDisplay");
    if (currentSearchDisplay) {
      currentSearchDisplay.style.display = "none";
      // 空页没有结果，旧关键词必须一起清掉，否则编辑输入框会显示不存在的“当前搜索”
      const keywordEl = currentSearchDisplay.querySelector(".current-search-keyword");
      if (keywordEl) keywordEl.textContent = "";
    }

    const buttonContainer = document.querySelector(".button-container");
    if (buttonContainer) {
      buttonContainer.innerHTML = "";
    }

    const container = document.querySelector(".container");
    if (container) container.classList.add("is-empty");
    renderRecentSearches();

    document.title = CONFIG.title;

    toggleClearButton();
}

function clearSearch() {
    const searchInput = document.getElementById(SEARCH_INPUT_ID);

    renderEmptyState();
    if (searchInput) searchInput.focus();

    // 清空等于回到首页：地址栏也归位
    if (window.location.search) {
      window.history.replaceState(null, "", "/");
    }
}

// 输入值等于已提交值时不重复显示当前搜索；编辑后才出现，说明结果对应哪个词
function syncCurrentSearch() {
  const display = document.getElementById("currentSearchDisplay");
  const input = document.getElementById(SEARCH_INPUT_ID);
  if (!display || !input) return;

  const keywordEl = display.querySelector(".current-search-keyword");
  const keyword = keywordEl ? keywordEl.textContent.trim() : "";
  display.style.display = keyword && input.value.trim() !== keyword ? "flex" : "none";
}

function toggleClearButton() {
    const searchInput = document.getElementById(SEARCH_INPUT_ID);
    const clearButton = document.getElementById("clearButton");

    if (!searchInput || !clearButton) return;

    // 显示/隐藏全由 .show 类驱动（CSS：默认 display:none，.show 为 flex）
    clearButton.classList.toggle("show", searchInput.value.trim() !== "");
}

function performSearch() {
    const searchInput = document.getElementById(SEARCH_INPUT_ID);
    if (!searchInput) return;

    // 只导航不落历史：由服务端接受的页面回写，
    // 避免把服务端必拒的查询（超长/攻击模式）持久化成永远搜不出结果的死条目
    navigateSearch(searchInput.value, { push: true });
}

// 换页只取服务端渲染好的同一份页面，替换结果区，地址栏用 pushState 同步。
// 校验与渲染仍只在服务端发生，客户端不复制规则（见 docs/adr/0001）
let pendingSearch = null;

// 把取到页面里的同名节点换进来
const PAGE_SELECTORS = ["#currentSearchDisplay", ".button-container", "#error"];

// 套用取到的页面；结构对不上就整页都不接，由调用方退回整页导航
function applySearchPage(doc) {
    const searchInput = document.getElementById(SEARCH_INPUT_ID);
    const serverInput = doc.getElementById(SEARCH_INPUT_ID);
    const pairs = PAGE_SELECTORS.map((selector) => [document.querySelector(selector), doc.querySelector(selector)]);

    if (!searchInput || !serverInput || pairs.some(([current, incoming]) => !current || !incoming)) return false;

    for (const [current, incoming] of pairs) current.replaceWith(incoming);

    document.title = doc.title;
    searchInput.value = serverInput.value;
    toggleClearButton();
    syncCurrentSearch();

    const container = document.querySelector(".container");
    if (container) container.classList.remove("is-empty");
    const recent = document.getElementById("recentSearches");
    if (recent) recent.hidden = true;

    if (!isMobileDevice()) searchInput.focus();
    return true;
}

async function navigateSearch(query, { push }) {
    query = query.trim();
    if (!query) return;

    const url = "/?q=" + encodeURIComponent(query);

    // 连点时后一次作废前一次，避免先发的响应盖掉后发的
    if (pendingSearch) pendingSearch.abort();
    const controller = new AbortController();
    pendingSearch = controller;

    try {
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error("HTTP " + response.status);

        const doc = new DOMParser().parseFromString(await response.text(), "text/html");
        if (!applySearchPage(doc)) throw new Error("页面结构与客户端约定不一致");

        const target = new URL(url, window.location.href);
        if (push && target.href !== window.location.href) {
            window.history.pushState(null, "", target.href);
        }

        hideHistoryDropdown();

        // 被拒页面里输入框是空的，历史里不该留死条目；前进后退只还原页面，不动历史
        const serverInput = doc.getElementById(SEARCH_INPUT_ID);
        const keyword = serverInput ? serverInput.value.trim() : "";
        if (push && keyword) saveSearchHistory(keyword);
    } catch (error) {
        if (error.name === "AbortError") return;

        // 离线、Worker 出错、结构变更时不让点击没反应：退回整页导航
        window.location.assign(url);
    } finally {
        if (pendingSearch === controller) pendingSearch = null;
    }
}

// 前进后退以地址栏里的 q 为准，空 q 回到首页
window.addEventListener("popstate", function() {
    const query = new URLSearchParams(window.location.search).get("q") || "";

    if (query) {
        navigateSearch(query, { push: false });
    } else {
        renderEmptyState();
    }
});
