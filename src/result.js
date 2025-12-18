import config from './config.js';

export default {
  fetch(searchText) {
    const indexHtml = `<!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🔍</text></svg>">
    <style>
      :root {
        --primary-blue: #2c5aa0;
        --light-blue: #e6f0fa;
        --accent-blue: #4a90e2;
        --hover-blue: #357abd;
        --text-dark: #2c3e50;
        --text-light: #6c757d;
        --white: #ffffff;
        --border-color: #d1e3f3;
        --shadow-light: rgba(44, 90, 160, 0.08);
        --shadow-medium: rgba(44, 90, 160, 0.15);
      }

      * {
        box-sizing: border-box;
      }

      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        background: linear-gradient(135deg, #f5f9ff 0%, #e6f0fa 100%);
        color: var(--text-dark);
        margin: 0;
        padding: 0;
        min-height: 100vh;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 40px 20px;
      }

      h1 {
        color: var(--primary-blue);
        font-size: 3.5rem;
        font-weight: 700;
        margin: 0 0 40px 0;
        text-align: center;
        letter-spacing: -1px;
        text-shadow: 0 2px 4px var(--shadow-light);
      }

      .search-container {
        margin-bottom: 40px;
        position: relative;
        width: 100%;
      }

      #searchForm {
        display: flex;
        justify-content: center;
        align-items: stretch;
        position: relative;
        width: 100%;
      }

      .input-wrapper {
        position: relative;
        flex: 1;
        display: flex;
        align-items: center;
      }

      .form-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        margin: 0 auto;
      }

      .history-dropdown-btn {
        background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
        border: none;
        border-radius: 50px;
        padding: 0 20px;
        height: 64px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px var(--shadow-light);
        min-width: 50px;
        margin-left: 16px;
        color: white;
        font-size: 16px;
        font-weight: 600;
      }

      .history-dropdown-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px var(--shadow-medium);
        background: linear-gradient(135deg, var(--hover-blue) 0%, var(--primary-blue) 100%);
      }

      .history-dropdown-btn::after {
        content: '▼';
        font-size: 12px;
        color: white;
        margin-left: 5px;
        transition: transform 0.3s ease;
      }

      .history-dropdown-btn.active::after {
        transform: rotate(180deg);
      }

      .history-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        width: 100%;
        max-width: 500px;
        background: var(--white);
        border: 1px solid var(--border-color);
        border-radius: 12px;
        box-shadow: 0 8px 24px var(--shadow-medium);
        z-index: 1000;
        display: none;
        margin-top: 8px;
        overflow: hidden;
      }

      .history-dropdown.show {
        display: block;
        animation: fadeIn 0.2s ease;
      }

      .history-list {
        max-height: 300px;
        overflow-y: auto;
      }

      .history-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid var(--border-color);
        transition: background-color 0.2s ease;
        cursor: pointer;
      }

      .history-item:last-child {
        border-bottom: none;
      }

      .history-item:hover {
        background-color: var(--light-blue);
      }

      .history-item-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-dark);
        font-size: 14px;
      }

      .history-item-delete {
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
        opacity: 0.7;
        margin-left: 8px;
        padding: 6px;
      }

      .history-item-delete:hover {
        background-color: rgba(255, 59, 48, 0.1);
        color: rgba(255, 59, 48, 0.8);
        opacity: 1;
      }

      .history-empty {
        padding: 20px;
        text-align: center;
        color: var(--text-light);
        font-size: 14px;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      input[type="text"] {
        width: 100%;
        height: 64px;
        padding: 0 50px 0 24px;
        border: 2px solid var(--border-color);
        border-radius: 50px;
        font-size: 18px;
        background-color: var(--white);
        box-shadow: 0 4px 12px var(--shadow-light);
        transition: all 0.3s ease;
        outline: none;
      }

      .clear-button {
        position: absolute;
        right: 16px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        font-size: 22px;
        font-weight: bold;
        width: 32px;
        height: 32px;
        display: none;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.2s ease;
        opacity: 0.7;
      }

      .clear-button:hover {
        background-color: var(--light-blue);
        color: var(--primary-blue);
        opacity: 1;
      }

      .clear-button:active {
        transform: translateY(-50%) scale(0.9);
      }

      input[type="text"]:focus {
        border-color: var(--accent-blue);
        box-shadow: 0 0 0 4px rgba(74, 144, 226, 0.1), 0 4px 12px var(--shadow-medium);
      }

      input[type="text"]::placeholder {
        color: var(--text-light);
      }

      #searchButton {
        height: 64px;
        padding: 0 32px;
        background: linear-gradient(135deg, var(--primary-blue) 0%, var(--accent-blue) 100%);
        color: white;
        border: none;
        border-radius: 50px;
        cursor: pointer;
        font-size: 18px;
        font-weight: 600;
        margin-left: 16px;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px var(--shadow-light);
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
      }

      #searchButton:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px var(--shadow-medium);
        background: linear-gradient(135deg, var(--hover-blue) 0%, var(--primary-blue) 100%);
      }

      #searchButton:active {
        transform: translateY(0);
        box-shadow: 0 2px 8px var(--shadow-light);
      }

      .current-search {
        padding: 16px 24px;
        background-color: var(--white);
        border-radius: 12px;
        margin-bottom: 30px;
        font-weight: 600;
        color: var(--primary-blue);
        text-align: center;
        box-shadow: 0 4px 12px var(--shadow-light);
        border-left: 4px solid var(--accent-blue);
        display: none;
        animation: slideDown 0.3s ease;
      }

      .button-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 16px;
        margin-top: 20px;
      }

      .button {
        background-color: var(--white);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 4px 12px var(--shadow-light);
        transition: all 0.3s ease;
        border: 1px solid var(--border-color);
        position: relative;
      }

      .button:hover {
        transform: translateY(-4px);
        box-shadow: 0 8px 24px var(--shadow-medium);
        border-color: var(--accent-blue);
      }

      .button:active {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px var(--shadow-medium);
      }

      .button a {
        text-decoration: none;
        color: var(--text-dark);
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 20px 16px;
        font-weight: 500;
        font-size: 16px;
        text-align: center;
        transition: all 0.2s ease;
        position: relative;
        z-index: 1;
        gap: 8px;
      }

      .button-icon {
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        object-fit: contain;
      }

      .button-text {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .button:hover a {
        color: var(--primary-blue);
      }

      .button::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, var(--primary-blue), var(--accent-blue));
        transform: scaleX(0);
        transition: transform 0.3s ease;
        z-index: 0;
      }

      .button:hover::before {
        transform: scaleX(1);
      }

      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @media (max-width: 768px) {
        .container {
          padding: 20px 15px;
        }

        h1 {
          font-size: 2.5rem;
          margin-bottom: 30px;
        }

        #searchForm {
          flex-direction: column;
          gap: 16px;
          align-items: stretch;
          width: 100%;
        }

        .input-wrapper {
          flex-direction: row;
          width: 100%;
        }

        input[type="text"] {
          width: 100%;
          margin-left: 0;
          height: 64px !important;
          min-height: 64px;
          max-height: 64px;
        }

        .clear-button {
          display: none;
          width: 32px;
          height: 32px;
          font-size: 22px;
          font-weight: bold;
        }

        .clear-button.show {
          display: flex;
        }

        #searchButton {
          width: 100%;
          margin-left: 0;
          height: 64px;
        }

        .history-dropdown-btn {
          width: 100%;
          margin-left: 0;
          margin-top: 16px;
          height: 64px;
        }

        .history-dropdown {
          max-width: 100%;
          left: 0;
          right: 0;
        }

        .button-container {
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
      }

      @media (max-width: 480px) {
        .button-container {
          grid-template-columns: 1fr;
        }
      }
    </style>
    </head>
    <body>
    <div class="container">
        <h1>
            so
        </h1>
        <div class="search-container">
            <div class="form-wrapper">
              <form id="searchForm" action="/" method="GET">
                <div class="input-wrapper">
                  <input type="text" id="searchInput" name="query" placeholder="搜索..." value="{{keyword}}"/>
                  <button type="button" id="clearButton" class="clear-button">×</button>
                </div>
                <button type="button" id="searchButton">搜索 ↩︎</button>
                <button type="button" id="historyDropdownBtn" class="history-dropdown-btn" title="搜索历史">搜索历史</button>
                <div id="historyDropdown" class="history-dropdown">
                  <div id="historyList" class="history-list"></div>
                </div>
              </form>
            </div>
        </div>
        <div id="currentSearchDisplay" class="current-search" style="{{current_search_style}}">{{current_search}}</div>
        <div class="button-container">
            {{button_list}}
        </div>
    </div>

    <script>
    // 搜索历史管理
    const SEARCH_HISTORY_KEY = 'search_history';
    const MAX_HISTORY_ITEMS = 10;

    // 获取搜索历史
    function getSearchHistory() {
      try {
        const history = localStorage.getItem(SEARCH_HISTORY_KEY);
        return history ? JSON.parse(history) : [];
      } catch (e) {
        return [];
      }
    }

    // 保存搜索历史
    function saveSearchHistory(query) {
      if (!query || query.trim() === '') return;

      const history = getSearchHistory();
      // 移除重复项
      const filteredHistory = history.filter(item => item !== query);
      // 添加到开头
      filteredHistory.unshift(query);
      // 限制数量
      const limitedHistory = filteredHistory.slice(0, MAX_HISTORY_ITEMS);

      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(limitedHistory));
      } catch (e) {
        console.error('Failed to save search history:', e);
      }
    }

    // 删除搜索历史项
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
      const history = getSearchHistory();

      if (history.length === 0) {
        historyList.innerHTML = '<div class="history-empty">暂无搜索历史</div>';
        return;
      }

      const historyItems = history.map(query =>
        '<div class="history-item" data-query="' + encodeURIComponent(query) + '">' +
          '<span class="history-item-text">' + query + '</span>' +
          '<button class="history-item-delete" data-query="' + encodeURIComponent(query) + '">×</button>' +
        '</div>'
      ).join('');

      historyList.innerHTML = historyItems;

      // 添加点击事件
      document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', function(e) {
          if (e.target.classList.contains('history-item-delete')) {
            e.stopPropagation();
            const query = decodeURIComponent(e.target.dataset.query);
            deleteSearchHistoryItem(query);
          } else {
            const query = decodeURIComponent(this.dataset.query);
            document.getElementById('searchInput').value = query;
            toggleClearButton();
            hideHistoryDropdown();
            performSearch();
          }
        });
      });
    }

    // 显示搜索历史下拉框
    function showHistoryDropdown() {
      const dropdown = document.getElementById('historyDropdown');
      const btn = document.getElementById('historyDropdownBtn');

      renderHistoryDropdown();
      dropdown.classList.add('show');
      btn.classList.add('active');
    }

    // 隐藏搜索历史下拉框
    function hideHistoryDropdown() {
      const dropdown = document.getElementById('historyDropdown');
      const btn = document.getElementById('historyDropdownBtn');

      dropdown.classList.remove('show');
      btn.classList.remove('active');
    }

    // 切换搜索历史下拉框显示状态
    function toggleHistoryDropdown() {
      const dropdown = document.getElementById('historyDropdown');
      if (dropdown.classList.contains('show')) {
        hideHistoryDropdown();
      } else {
        showHistoryDropdown();
      }
    }

    // 检测客户端类型并设置合适的placeholder
    function getClientSpecificPlaceholder() {
      const userAgent = navigator.userAgent.toLowerCase();
      const platform = navigator.platform.toLowerCase();

      // 检测移动设备
      if (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)) {
        return "搜索...";
      }

      // 检测Mac系统
      if (platform.includes('mac') || userAgent.includes('mac')) {
        return "CMD + K 或 CMD + F 或 /";
      }

      // 默认为Windows/Linux系统
      return "CTRL + K 或 CTRL + F 或 /";
    }

    // 设置合适的placeholder并聚焦搜索框
    document.addEventListener("DOMContentLoaded", function() {
      const searchInput = document.getElementById("searchInput");
      if (searchInput) {
        searchInput.placeholder = getClientSpecificPlaceholder();

        // 检测是否为移动设备，如果不是才自动聚焦搜索框
        const userAgent = navigator.userAgent.toLowerCase();
        const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

        if (!isMobile) {
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

        // 页面加载时，如果搜索框有内容，将其添加到搜索历史
        if (searchInput.value.trim() !== "") {
          saveSearchHistory(searchInput.value.trim());
        }
      }
    });

    // 全局快捷键监听器
    document.addEventListener("keydown", function(e) {
        // "/" 键且不在输入框中时
        if (e.key === "/" && document.activeElement.id !== "searchInput") {
            e.preventDefault();
            document.getElementById("searchInput").focus();
            return;
        }

        // Cmd+K 或 Cmd+F (Mac) 或 Ctrl+K/Ctrl+F (Windows/Linux)
        if ((e.metaKey || e.ctrlKey) && ["k", "f"].includes(e.key.toLowerCase())) {
            e.preventDefault();
            document.getElementById("searchInput").focus();
            return;
        }
    });

    // 搜索框的回车键监听器
    document.getElementById("searchInput").addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
            e.preventDefault();
            performSearch();
        }
    });

    document.getElementById("searchButton").addEventListener("click", function() {
        performSearch();
    });

    document.getElementById("clearButton").addEventListener("click", function() {
        clearSearch();
    });

    function clearSearch() {
        var searchInput = document.getElementById("searchInput");
        searchInput.value = "";
        searchInput.focus();
        updateCurrentSearchDisplay();
        toggleClearButton();
    }

    function toggleClearButton() {
        var searchInput = document.getElementById("searchInput");
        var clearButton = document.getElementById("clearButton");

        if (searchInput.value.trim() === "") {
            clearButton.classList.remove("show");
            clearButton.style.display = "none";
        } else {
            clearButton.classList.add("show");
            clearButton.style.display = "flex";
        }
    }

    function performSearch() {
        var query = document.getElementById("searchInput").value;
        if (query.trim() !== "") {
          // 保存搜索历史
          saveSearchHistory(query);
        }
        var url = "{{base}}" + query;
        window.location.href = url;
    }

    // 显示当前搜索内容
    function updateCurrentSearchDisplay() {
        var query = document.getElementById("searchInput").value;
        var currentSearchDiv = document.getElementById("currentSearchDisplay");

        if (query.trim() !== "") {
            currentSearchDiv.textContent = "当前搜索：" + query;
            currentSearchDiv.style.display = "block";
        } else {
            currentSearchDiv.style.display = "none";
        }
    }

    // 页面加载完成后不再自动更新显示，保持与title一致的更新时机
    </script>
    </body>
    </html>
    `;

    let title = config.title;
    const base = config.base;
    const resourceList = config.urls;

    const keyword = searchText || '';

    let html = indexHtml.replace('{{base}}', base).replace('{{keyword}}', keyword);

    const encodeSearchText = encodeURIComponent(searchText);

    // 处理图标的函数
    function getIconHtml(icon) {
      if (!icon || icon.trim() === '') {
        return '';
      }

      // 检查是否是base64图片
      if (icon.startsWith('data:image/')) {
        return `<img src="${icon}" alt="" class="button-icon">`;
      }

      // 否则作为URL处理
      return `<img src="${icon}" alt="" class="button-icon" onerror="this.style.display='none'">`;
    }

    const buttonList = [];
    let currentSearchDisplay = '';
    let currentSearchStyle = 'display: none;';
    if (searchText) {
      for (const resource of resourceList) {
        const finalUrl = resource.url.replace('%s', encodeSearchText);
        const iconHtml = getIconHtml(resource.icon || '');
        buttonList.push(
          `<div class="button"><a href="${finalUrl}">${iconHtml}<span class="button-text">${resource.name}</span></a></div>`
        );
      }
      title += ' - ' + searchText;
      currentSearchDisplay = '当前搜索: ' + searchText;
      currentSearchStyle = 'display: block;';
    }

    return html
      .replace('{{title}}', title)
      .replace('{{button_list}}', buttonList.join('\n'))
      .replace('{{current_search}}', currentSearchDisplay)
      .replace('{{current_search_style}}', currentSearchStyle);
  },
};
