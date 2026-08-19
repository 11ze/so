// 配置由服务端经 template.html 的 JSON 数据岛注入
const CONFIG = JSON.parse(document.getElementById('client-config').textContent);

// 搜索历史管理
const SEARCH_HISTORY_KEY = 'search_history';
const SEARCH_INPUT_ID = 'searchInput';
const MOBILE_REGEX = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

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
  } catch (e) {
    console.error('Failed to delete search history item:', e);
  }
}

// 渲染搜索历史下拉框
function renderHistoryDropdown() {
  const historyList = document.getElementById('historyList');
  if (!historyList) return;

  const history = getSearchHistory();

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

    const textSpan = document.createElement('span');
    textSpan.className = 'history-item-text';
    textSpan.textContent = query;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'history-item-delete';
    deleteBtn.textContent = '×';
    deleteBtn.dataset.query = encodeURIComponent(query);
    deleteBtn.setAttribute('aria-label', '删除此历史记录');
    deleteBtn.title = '删除此历史记录';

    itemDiv.appendChild(textSpan);
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
  dropdown.classList.add('show');
  btn.classList.add('active');
}

// 隐藏搜索历史下拉框
function hideHistoryDropdown() {
  const dropdown = document.getElementById('historyDropdown');
  const btn = document.getElementById('historyDropdownBtn');

  if (!dropdown || !btn) return;

  dropdown.classList.remove('show');
  btn.classList.remove('active');
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

    // 监听输入框内容变化
    searchInput.addEventListener("input", toggleClearButton);

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

    // 页面加载时，如果搜索框有内容，将其添加到搜索历史
    if (searchInput.value.trim() !== "") {
      saveSearchHistory(searchInput.value.trim());
    }
  }
});

// 全局快捷键监听器
document.addEventListener("keydown", function(e) {
    // "/" 键且不在输入框中时，聚焦搜索框
    if (e.key === "/" && document.activeElement.id !== SEARCH_INPUT_ID) {
        e.preventDefault();
        document.getElementById(SEARCH_INPUT_ID).focus();
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

function clearSearch() {
    const searchInput = document.getElementById(SEARCH_INPUT_ID);
    searchInput.value = "";
    searchInput.focus();
    const currentSearchDisplay = document.getElementById("currentSearchDisplay");
    if (currentSearchDisplay) {
      currentSearchDisplay.style.display = "none";
    }
    toggleClearButton();
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
    if (!searchInput || !searchInput.value) return;

    // 只导航不落历史：由服务端接受的落地页在 DOMContentLoaded 时保存，
    // 避免把服务端必拒的查询（超长/攻击模式）持久化成永远搜不出结果的死条目
    window.location.href = '/?q=' + encodeURIComponent(searchInput.value.trim());
}
