/* ============================================================
   BUDGET TRACKER — app.js
   Single shared JavaScript file for all pages
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   CONSTANTS
   ------------------------------------------------------------ */
const STORAGE_KEYS = {
  TRANSACTIONS: 'bt_transactions',
  CATEGORIES:   'bt_categories',
  BUDGET_LIMITS:'bt_budget_limits',
  THEME:        'bt_theme',
};

const DEFAULT_CATEGORIES = [
  'Food', 'Transport', 'Bills', 'Entertainment', 'Health', 'Salary', 'Shopping', 'Other'
];

const DONUT_COLORS = [
  '#4f6ef7','#22c55e','#f59e0b','#ef4444','#a855f7',
  '#06b6d4','#f97316','#ec4899','#14b8a6','#8b5cf6'
];

/* ------------------------------------------------------------
   DATA LAYER — Local Storage helpers
   ------------------------------------------------------------ */
function getTransactions() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) || [];
  } catch { return []; }
}

function saveTransactions(transactions) {
  localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
}

function getCategories() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEYS.CATEGORIES));
    return stored && stored.length > 0 ? stored : [...DEFAULT_CATEGORIES];
  } catch { return [...DEFAULT_CATEGORIES]; }
}

function saveCategories(categories) {
  localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
}

function getBudgetLimits() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.BUDGET_LIMITS)) || { overall: 0, categories: {} };
  } catch { return { overall: 0, categories: {} }; }
}

function saveBudgetLimits(limits) {
  localStorage.setItem(STORAGE_KEYS.BUDGET_LIMITS, JSON.stringify(limits));
}

function getTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}



/* ------------------------------------------------------------
   UTILITY HELPERS
   ------------------------------------------------------------ */
function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getCurrentYearMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getYearMonthFromDate(dateStr) {
  if (!dateStr) return '';
  return dateStr.substring(0, 7);
}

function filterByMonth(transactions, yearMonth) {
  if (!yearMonth) return transactions;
  return transactions.filter(tx => getYearMonthFromDate(tx.date) === yearMonth);
}

function calcTotals(transactions) {
  let income = 0, expense = 0;
  transactions.forEach(tx => {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  });
  return { income, expense, balance: income - expense };
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function getLast6Months() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
}

/* ------------------------------------------------------------
   THEME MANAGEMENT
   ------------------------------------------------------------ */
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const btn = document.getElementById('themeToggle');
  if (btn) btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

function initTheme() {
  const theme = getTheme();
  applyTheme(theme);

  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      const current = getTheme();
      const next = current === 'dark' ? 'light' : 'dark';
      saveTheme(next);
      applyTheme(next);
    });
  }
}

/* ------------------------------------------------------------
   SVG DONUT CHART
   ------------------------------------------------------------ */
function renderDonutChart(containerId, transactions) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const expenses = transactions.filter(tx => tx.type === 'expense');
  if (expenses.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">No expense data.</p>';
    return;
  }

  // Aggregate by category
  const catMap = {};
  expenses.forEach(tx => {
    catMap[tx.category] = (catMap[tx.category] || 0) + tx.amount;
  });

  const total = Object.values(catMap).reduce((a, b) => a + b, 0);
  const entries = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  const size = 160;
  const cx = size / 2;
  const cy = size / 2;
  const r = 56;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * r;

  let svgCircles = '';
  let offset = 0;
  const legendItems = entries.map(([cat, val], i) => {
    const pct = val / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const color = DONUT_COLORS[i % DONUT_COLORS.length];
    // Rotate so each segment starts where the last ended
    const rotate = -90 + (offset / circumference) * 360;

    svgCircles += `
      <circle
        cx="${cx}" cy="${cy}" r="${r}"
        fill="none"
        stroke="${color}"
        stroke-width="${strokeWidth}"
        stroke-dasharray="${dash.toFixed(2)} ${gap.toFixed(2)}"
        transform="rotate(${rotate.toFixed(2)}, ${cx}, ${cy})"
      />`;
    offset += dash;

    return `
      <div class="legend-item">
        <span class="legend-dot" style="background:${color}"></span>
        <span class="legend-label">${escapeHtml(cat)}</span>
        <span class="legend-pct">${(pct * 100).toFixed(1)}%</span>
      </div>`;
  });

  container.innerHTML = `
    <div class="donut-wrapper">
      <svg class="donut-svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Donut chart of expenses by category">
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--border-color)" stroke-width="${strokeWidth}" />
        ${svgCircles}
        <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-size="11" fill="var(--text-muted)" font-family="var(--font-family)">Total</text>
        <text x="${cx}" y="${cy + 12}" text-anchor="middle" font-size="13" font-weight="bold" fill="var(--text-primary)" font-family="var(--font-family)">${formatCurrency(total)}</text>
      </svg>
      <div class="donut-legend">${legendItems.join('')}</div>
    </div>`;
}

/* ------------------------------------------------------------
   SVG BAR CHART
   ------------------------------------------------------------ */
function renderBarChart(containerId, transactions) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const months = getLast6Months();
  const data = months.map(ym => {
    const txs = filterByMonth(transactions, ym);
    const { income, expense } = calcTotals(txs);
    const label = new Date(ym + '-02').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    return { ym, label, income, expense };
  });

  const maxVal = Math.max(...data.flatMap(d => [d.income, d.expense]), 1);

  const svgW = 460;
  const svgH = 220;
  const padL = 55;
  const padR = 10;
  const padT = 10;
  const padB = 40;
  const chartW = svgW - padL - padR;
  const chartH = svgH - padT - padB;
  const groupW = chartW / data.length;
  const barW = Math.min(groupW * 0.3, 24);
  const gap = barW * 0.4;

  const incomeColor = '#22c55e';
  const expenseColor = '#ef4444';

  let bars = '';
  let xLabels = '';

  data.forEach((d, i) => {
    const gx = padL + i * groupW + groupW / 2;

    const ih = d.income > 0 ? (d.income / maxVal) * chartH : 0;
    const eh = d.expense > 0 ? (d.expense / maxVal) * chartH : 0;

    const ix = gx - barW - gap / 2;
    const ex = gx + gap / 2;

    bars += `
      <rect x="${ix.toFixed(1)}" y="${(padT + chartH - ih).toFixed(1)}" width="${barW}" height="${ih.toFixed(1)}" fill="${incomeColor}" rx="3" opacity="0.85">
        <title>Income: ${formatCurrency(d.income)}</title>
      </rect>
      <rect x="${ex.toFixed(1)}" y="${(padT + chartH - eh).toFixed(1)}" width="${barW}" height="${eh.toFixed(1)}" fill="${expenseColor}" rx="3" opacity="0.85">
        <title>Expense: ${formatCurrency(d.expense)}</title>
      </rect>`;

    xLabels += `<text x="${gx.toFixed(1)}" y="${svgH - 8}" text-anchor="middle" font-size="11" fill="var(--text-muted)" font-family="var(--font-family)">${escapeHtml(d.label)}</text>`;
  });

  // Y-axis gridlines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map(pct => {
    const y = padT + chartH - pct * chartH;
    const val = pct * maxVal;
    return `
      <line x1="${padL}" y1="${y.toFixed(1)}" x2="${svgW - padR}" y2="${y.toFixed(1)}" stroke="var(--border-color)" stroke-width="1" />
      <text x="${(padL - 6).toFixed(1)}" y="${(y + 4).toFixed(1)}" text-anchor="end" font-size="10" fill="var(--text-muted)" font-family="var(--font-family)">${val >= 1000 ? (val / 1000).toFixed(1) + 'k' : val.toFixed(0)}</text>`;
  }).join('');

  // Legend
  const legend = `
    <rect x="${padL}" y="2" width="10" height="10" fill="${incomeColor}" rx="2"/>
    <text x="${padL + 14}" y="11" font-size="10" fill="var(--text-secondary)" font-family="var(--font-family)">Income</text>
    <rect x="${padL + 65}" y="2" width="10" height="10" fill="${expenseColor}" rx="2"/>
    <text x="${padL + 79}" y="11" font-size="10" fill="var(--text-secondary)" font-family="var(--font-family)">Expense</text>`;

  container.innerHTML = `
    <div class="bar-chart-wrapper">
      <svg class="bar-chart-svg" viewBox="0 0 ${svgW} ${svgH}" width="${svgW}" height="${svgH}" role="img" aria-label="Bar chart of monthly income vs expenses">
        ${gridLines}
        ${bars}
        ${xLabels}
        ${legend}
      </svg>
    </div>`;
}

/* ------------------------------------------------------------
   DASHBOARD PAGE
   ------------------------------------------------------------ */
function initDashboard() {
  renderDashboard();

  /* Add transaction form */
  const form = document.getElementById('transactionForm');
  if (form) {
    // Set today's date as default
    const dateInput = document.getElementById('txDate');
    if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = document.querySelector('input[name="txType"]:checked')?.value;
      const amount = parseFloat(document.getElementById('txAmount').value);
      const date = document.getElementById('txDate').value;
      const category = document.getElementById('txCategory').value;
      const description = document.getElementById('txDescription').value.trim();
      const notes = document.getElementById('txNotes').value.trim();
      const payment = document.getElementById('txPayment').value;

      if (!type || isNaN(amount) || amount <= 0 || !date || !category || !description) {
        alert('Please fill in all required fields.');
        return;
      }

      const transactions = getTransactions();
      transactions.push({ id: Date.now(), type, amount, date, category, description, notes, payment });
      saveTransactions(transactions);
      form.reset();
      dateInput.value = new Date().toISOString().split('T')[0];
      renderDashboard();
    });
  }

  /* Overall budget save */
  const saveOverallBtn = document.getElementById('saveOverallBudget');
  if (saveOverallBtn) {
    const limits = getBudgetLimits();
    const overallInput = document.getElementById('overallBudget');
    if (overallInput && limits.overall) overallInput.value = limits.overall;

    saveOverallBtn.addEventListener('click', () => {
      const val = parseFloat(document.getElementById('overallBudget').value) || 0;
      const limits = getBudgetLimits();
      limits.overall = val;
      saveBudgetLimits(limits);
      renderDashboard();
    });
  }

  /* Add category */
  const addCatBtn = document.getElementById('addCategoryBtn');
  if (addCatBtn) {
    addCatBtn.addEventListener('click', () => {
      const input = document.getElementById('newCategoryInput');
      const name = input.value.trim();
      if (!name) return;
      const categories = getCategories();
      if (categories.map(c => c.toLowerCase()).includes(name.toLowerCase())) {
        alert('Category already exists.');
        return;
      }
      categories.push(name);
      saveCategories(categories);
      input.value = '';
      renderDashboard();
    });
    document.getElementById('newCategoryInput')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); addCatBtn.click(); }
    });
  }
}

function renderDashboard() {
  const transactions = getTransactions();
  const currentMonth = getCurrentYearMonth();
  const monthTxs = filterByMonth(transactions, currentMonth);

  renderSummaryCards(monthTxs);
  renderCategoryDropdown('txCategory');
  renderCategoryList();
  renderCategoryBudgets();
  renderBudgetWarning(monthTxs);
  renderRecentTransactions(transactions);
  renderDonutChart('donutChartContainer', monthTxs);
  renderBarChart('barChartContainer', transactions);
}

function renderSummaryCards(monthTxs) {
  const { income, expense, balance } = calcTotals(monthTxs);

  const incomeEl = document.getElementById('totalIncome');
  const expenseEl = document.getElementById('totalExpense');
  const balanceEl = document.getElementById('totalBalance');
  const balanceCard = balanceEl?.closest('.card');

  if (incomeEl) incomeEl.textContent = formatCurrency(income);
  if (expenseEl) expenseEl.textContent = formatCurrency(expense);
  if (balanceEl) {
    balanceEl.textContent = formatCurrency(balance);
    if (balanceCard) {
      balanceCard.classList.toggle('negative', balance < 0);
    }
  }
}

function renderCategoryDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  const categories = getCategories();
  const current = select.value;
  select.innerHTML = categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
  if (categories.includes(current)) select.value = current;
}

function renderCategoryList() {
  const list = document.getElementById('categoryList');
  if (!list) return;
  const categories = getCategories();

  list.innerHTML = categories.map(cat => {
    const isDefault = DEFAULT_CATEGORIES.includes(cat);
    return `
      <li class="category-tag ${isDefault ? 'default-tag' : ''}">
        ${escapeHtml(cat)}
        <button class="tag-delete" data-cat="${escapeHtml(cat)}" ${isDefault ? 'disabled title="Default category cannot be deleted"' : `title="Delete ${escapeHtml(cat)}"`}>✕</button>
      </li>`;
  }).join('');

  list.querySelectorAll('.tag-delete:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const catName = btn.dataset.cat;
      const transactions = getTransactions();
      const inUse = transactions.some(tx => tx.category === catName);
      if (inUse) {
        if (!confirm(`"${catName}" is used in existing transactions. Delete it anyway?`)) return;
      }
      const categories = getCategories().filter(c => c !== catName);
      saveCategories(categories);
      renderDashboard();
    });
  });
}

function renderCategoryBudgets() {
  const container = document.getElementById('categoryBudgets');
  if (!container) return;
  const categories = getCategories();
  const limits = getBudgetLimits();

  container.innerHTML = `
    <p style="font-size:0.82rem;color:var(--text-muted);margin-bottom:10px;">Per-category monthly limits:</p>
    <div class="category-budgets-list">
      ${categories.map(cat => `
        <div class="budget-row">
          <label for="budget_${escapeHtml(cat)}">${escapeHtml(cat)}</label>
          <input type="number" id="budget_${escapeHtml(cat)}" data-cat="${escapeHtml(cat)}" value="${limits.categories[cat] || ''}" placeholder="No limit" min="0" step="1" />
          <button class="btn btn-secondary save-cat-budget" data-cat="${escapeHtml(cat)}" style="padding:6px 10px;font-size:0.8rem;">Save</button>
        </div>`).join('')}
    </div>`;

  container.querySelectorAll('.save-cat-budget').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      const val = parseFloat(document.getElementById(`budget_${cat}`)?.value) || 0;
      const limits = getBudgetLimits();
      if (val > 0) limits.categories[cat] = val;
      else delete limits.categories[cat];
      saveBudgetLimits(limits);
      renderDashboard();
    });
  });
}

function renderBudgetWarning(monthTxs) {
  const banner = document.getElementById('budgetWarning');
  if (!banner) return;
  const limits = getBudgetLimits();
  const { expense } = calcTotals(monthTxs);

  if (limits.overall > 0 && expense > limits.overall) {
    banner.style.display = 'flex';
    banner.textContent = `⚠️ You've exceeded your monthly overall budget limit of ${formatCurrency(limits.overall)}! Current spending: ${formatCurrency(expense)}.`;
  } else {
    banner.style.display = 'none';
  }
}

function renderRecentTransactions(transactions) {
  const tbody = document.getElementById('recentTransactionsBody');
  if (!tbody) return;

  const currentMonth = getCurrentYearMonth();
  const monthTxs = filterByMonth(transactions, currentMonth)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 10);

  if (monthTxs.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="6">No transactions this month. Add one above!</td></tr>';
    return;
  }

  const limits = getBudgetLimits();
  const catSpend = {};
  filterByMonth(transactions, currentMonth)
    .filter(tx => tx.type === 'expense')
    .forEach(tx => { catSpend[tx.category] = (catSpend[tx.category] || 0) + tx.amount; });

  tbody.innerHTML = monthTxs.map(tx => {
    const rowClass = getRowHighlightClass(tx, catSpend, limits);
    return `
      <tr class="${rowClass}">
        <td>${formatDate(tx.date)}</td>
        <td>${escapeHtml(tx.description)}</td>
        <td>${escapeHtml(tx.category)}</td>
        <td>${escapeHtml(tx.payment)}</td>
        <td class="tx-amount-${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}</td>
        <td>
          <button class="btn btn-danger" data-id="${tx.id}" data-action="delete-recent">Delete</button>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-action="delete-recent"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete this transaction?')) return;
      const id = Number(btn.dataset.id);
      saveTransactions(getTransactions().filter(tx => tx.id !== id));
      renderDashboard();
    });
  });
}

function getRowHighlightClass(tx, catSpend, limits) {
  if (tx.type !== 'expense') return '';
  const catLimit = limits.categories[tx.category];
  if (!catLimit) return '';
  const spent = catSpend[tx.category] || 0;
  const pct = spent / catLimit;
  if (pct >= 1) return 'row-warn-red';
  if (pct >= 0.8) return 'row-warn-amber';
  return '';
}

/* ------------------------------------------------------------
   TRANSACTIONS PAGE
   ------------------------------------------------------------ */
function initTransactions() {
  // Set default filter month to current month
  const filterMonth = document.getElementById('filterMonth');
  if (filterMonth) filterMonth.value = getCurrentYearMonth();

  // Attach filter/sort listeners
  ['filterType', 'filterCategory', 'filterMonth', 'sortBy'].forEach(id => {
    document.getElementById(id)?.addEventListener('change', renderAllTransactions);
  });

  document.getElementById('clearFilters')?.addEventListener('click', () => {
    const filterType = document.getElementById('filterType');
    const filterCat = document.getElementById('filterCategory');
    const filterMonth = document.getElementById('filterMonth');
    const sortBy = document.getElementById('sortBy');
    if (filterType) filterType.value = 'all';
    if (filterCat) filterCat.value = 'all';
    if (filterMonth) filterMonth.value = '';
    if (sortBy) sortBy.value = 'date-desc';
    renderAllTransactions();
  });

  // Edit modal
  const closeBtn = document.getElementById('closeEditModal');
  const cancelBtn = document.getElementById('cancelEditModal');
  const overlay = document.getElementById('editModal');

  closeBtn?.addEventListener('click', closeEditModal);
  cancelBtn?.addEventListener('click', closeEditModal);
  overlay?.addEventListener('click', (e) => { if (e.target === overlay) closeEditModal(); });

  document.getElementById('editTransactionForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = Number(document.getElementById('editTxId').value);
    const type = document.querySelector('input[name="editTxType"]:checked')?.value;
    const amount = parseFloat(document.getElementById('editTxAmount').value);
    const date = document.getElementById('editTxDate').value;
    const category = document.getElementById('editTxCategory').value;
    const description = document.getElementById('editTxDescription').value.trim();
    const notes = document.getElementById('editTxNotes').value.trim();
    const payment = document.getElementById('editTxPayment').value;

    if (!type || isNaN(amount) || amount <= 0 || !date || !category || !description) {
      alert('Please fill in all required fields.');
      return;
    }

    const transactions = getTransactions().map(tx =>
      tx.id === id ? { id, type, amount, date, category, description, notes, payment } : tx
    );
    saveTransactions(transactions);
    closeEditModal();
    renderAllTransactions();
  });
}

function renderAllTransactions() {
  const tbody = document.getElementById('allTransactionsBody');
  if (!tbody) return;

  let transactions = getTransactions();

  // Filters
  const typeFilter = document.getElementById('filterType')?.value || 'all';
  const catFilter = document.getElementById('filterCategory')?.value || 'all';
  const monthFilter = document.getElementById('filterMonth')?.value || '';

  if (typeFilter !== 'all') transactions = transactions.filter(tx => tx.type === typeFilter);
  if (catFilter !== 'all') transactions = transactions.filter(tx => tx.category === catFilter);
  if (monthFilter) transactions = filterByMonth(transactions, monthFilter);

  // Sort
  const sortBy = document.getElementById('sortBy')?.value || 'date-desc';
  transactions = sortTransactions(transactions, sortBy);

  if (transactions.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="8">No transactions match the current filters.</td></tr>';
    return;
  }

  // For highlighting
  const limits = getBudgetLimits();
  const currentMonth = getCurrentYearMonth();
  const catSpend = {};
  filterByMonth(getTransactions(), currentMonth)
    .filter(tx => tx.type === 'expense')
    .forEach(tx => { catSpend[tx.category] = (catSpend[tx.category] || 0) + tx.amount; });

  tbody.innerHTML = transactions.map(tx => {
    const rowClass = getRowHighlightClass(tx, catSpend, limits);
    return `
      <tr class="${rowClass}">
        <td>${formatDate(tx.date)}</td>
        <td><span class="tx-type-badge badge-${tx.type}">${tx.type}</span></td>
        <td>${escapeHtml(tx.description)}</td>
        <td>${escapeHtml(tx.category)}</td>
        <td>${escapeHtml(tx.payment)}</td>
        <td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${escapeHtml(tx.notes)}">${escapeHtml(tx.notes) || '—'}</td>
        <td class="tx-amount-${tx.type}">${tx.type === 'income' ? '+' : '-'}${formatCurrency(tx.amount)}</td>
        <td style="white-space:nowrap;">
          <button class="btn btn-edit" data-id="${tx.id}" data-action="edit-tx" style="margin-right:4px;">Edit</button>
          <button class="btn btn-danger" data-id="${tx.id}" data-action="delete-tx">Delete</button>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-action="edit-tx"]').forEach(btn => {
    btn.addEventListener('click', () => openEditModal(Number(btn.dataset.id)));
  });

  tbody.querySelectorAll('[data-action="delete-tx"]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm('Delete this transaction?')) return;
      const id = Number(btn.dataset.id);
      saveTransactions(getTransactions().filter(tx => tx.id !== id));
      renderAllTransactions();
    });
  });
}

function sortTransactions(transactions, sortBy) {
  const sorted = [...transactions];
  switch (sortBy) {
    case 'date-desc':    return sorted.sort((a, b) => new Date(b.date) - new Date(a.date));
    case 'date-asc':     return sorted.sort((a, b) => new Date(a.date) - new Date(b.date));
    case 'amount-desc':  return sorted.sort((a, b) => b.amount - a.amount);
    case 'amount-asc':   return sorted.sort((a, b) => a.amount - b.amount);
    case 'category-asc': return sorted.sort((a, b) => a.category.localeCompare(b.category));
    default:             return sorted;
  }
}

function openEditModal(id) {
  const tx = getTransactions().find(t => t.id === id);
  if (!tx) return;

  document.getElementById('editTxId').value = tx.id;
  const typeRadio = document.querySelector(`input[name="editTxType"][value="${tx.type}"]`);
  if (typeRadio) typeRadio.checked = true;
  document.getElementById('editTxAmount').value = tx.amount;
  document.getElementById('editTxDate').value = tx.date;
  document.getElementById('editTxDescription').value = tx.description;
  document.getElementById('editTxNotes').value = tx.notes || '';
  document.getElementById('editTxPayment').value = tx.payment;

  // Populate category dropdown
  renderCategoryDropdown('editTxCategory');
  document.getElementById('editTxCategory').value = tx.category;

  document.getElementById('editModal').style.display = 'flex';
  document.getElementById('editTxAmount').focus();
}

function closeEditModal() {
  const modal = document.getElementById('editModal');
  if (modal) modal.style.display = 'none';
}

/* ------------------------------------------------------------
   SUMMARY PAGE
   ------------------------------------------------------------ */
let summaryCurrentMonth = getCurrentYearMonth();

function initSummary() {
  document.getElementById('prevMonth')?.addEventListener('click', () => {
    const [y, m] = summaryCurrentMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    summaryCurrentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    renderSummary();
  });

  document.getElementById('nextMonth')?.addEventListener('click', () => {
    const [y, m] = summaryCurrentMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    summaryCurrentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    renderSummary();
  });
}

function renderSummary() {
  const transactions = getTransactions();
  const monthTxs = filterByMonth(transactions, summaryCurrentMonth);
  const limits = getBudgetLimits();

  // Update month label
  const label = document.getElementById('currentMonthLabel');
  if (label) {
    const [y, m] = summaryCurrentMonth.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    label.textContent = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Cards
  const { income, expense, balance } = calcTotals(monthTxs);
  const incomeEl = document.getElementById('summaryIncome');
  const expenseEl = document.getElementById('summaryExpense');
  const balanceEl = document.getElementById('summaryBalance');
  if (incomeEl) incomeEl.textContent = formatCurrency(income);
  if (expenseEl) expenseEl.textContent = formatCurrency(expense);
  if (balanceEl) balanceEl.textContent = formatCurrency(balance);

  // Category breakdown table
  renderSummaryTable(monthTxs, limits);

  // Donut chart for this month
  renderDonutChart('summaryDonutContainer', monthTxs);

  // Budget progress bars
  renderBudgetProgressBars(monthTxs, limits);
}

function renderSummaryTable(monthTxs, limits) {
  const tbody = document.getElementById('summaryTableBody');
  if (!tbody) return;

  const expenses = monthTxs.filter(tx => tx.type === 'expense');
  if (expenses.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5">No expense data for this month.</td></tr>';
    return;
  }

  const catMap = {};
  expenses.forEach(tx => {
    if (!catMap[tx.category]) catMap[tx.category] = { count: 0, total: 0 };
    catMap[tx.category].count++;
    catMap[tx.category].total += tx.amount;
  });

  const rows = Object.entries(catMap).sort((a, b) => b[1].total - a[1].total);

  tbody.innerHTML = rows.map(([cat, data]) => {
    const catLimit = limits.categories[cat] || 0;
    let statusHtml = '—';
    let rowClass = '';

    if (catLimit > 0) {
      const pct = (data.total / catLimit) * 100;
      if (pct >= 100) {
        statusHtml = `<span style="color:var(--color-expense);font-weight:600;">⚠️ Over limit</span>`;
        rowClass = 'row-warn-red';
      } else if (pct >= 80) {
        statusHtml = `<span style="color:var(--color-warn-amber);font-weight:600;">⚠️ Near limit</span>`;
        rowClass = 'row-warn-amber';
      } else {
        statusHtml = `<span style="color:var(--color-income);font-weight:600;">✓ On track</span>`;
      }
    }

    return `
      <tr class="${rowClass}">
        <td>${escapeHtml(cat)}</td>
        <td>${data.count}</td>
        <td class="tx-amount-expense">${formatCurrency(data.total)}</td>
        <td>${catLimit > 0 ? formatCurrency(catLimit) : '—'}</td>
        <td>${statusHtml}</td>
      </tr>`;
  }).join('');
}

function renderBudgetProgressBars(monthTxs, limits) {
  const container = document.getElementById('budgetProgressBars');
  if (!container) return;

  const categories = getCategories();
  const catSpend = {};
  monthTxs.filter(tx => tx.type === 'expense').forEach(tx => {
    catSpend[tx.category] = (catSpend[tx.category] || 0) + tx.amount;
  });

  const hasLimits = categories.some(cat => limits.categories[cat] > 0) || limits.overall > 0;

  if (!hasLimits) {
    container.innerHTML = '<p style="color:var(--text-muted);font-style:italic;">No budget limits set. Configure them on the Dashboard.</p>';
    return;
  }

  let html = '';

  // Overall budget bar
  if (limits.overall > 0) {
    const { expense } = calcTotals(monthTxs);
    const pct = Math.min((expense / limits.overall) * 100, 100);
    const status = expense >= limits.overall ? 'over' : expense >= limits.overall * 0.8 ? 'warn' : 'safe';
    const statusLabel = status === 'over' ? '⚠️ Over limit' : status === 'warn' ? '⚠️ Near limit' : '✓ On track';

    html += `
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label">Overall Monthly Budget</span>
          <span class="progress-values">${formatCurrency(expense)} / ${formatCurrency(limits.overall)}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${status}" style="width:${pct.toFixed(1)}%"></div>
        </div>
        <div class="progress-status ${status}">${statusLabel}</div>
      </div>`;
  }

  // Per-category bars
  categories.forEach(cat => {
    const limit = limits.categories[cat];
    if (!limit) return;
    const spent = catSpend[cat] || 0;
    const pct = Math.min((spent / limit) * 100, 100);
    const status = spent >= limit ? 'over' : spent >= limit * 0.8 ? 'warn' : 'safe';
    const statusLabel = status === 'over' ? '⚠️ Over limit' : status === 'warn' ? '⚠️ Near limit' : '✓ On track';

    html += `
      <div class="progress-item">
        <div class="progress-header">
          <span class="progress-label">${escapeHtml(cat)}</span>
          <span class="progress-values">${formatCurrency(spent)} / ${formatCurrency(limit)}</span>
        </div>
        <div class="progress-bar-bg">
          <div class="progress-bar-fill ${status}" style="width:${pct.toFixed(1)}%"></div>
        </div>
        <div class="progress-status ${status}">${statusLabel}</div>
      </div>`;
  });

  container.innerHTML = html || '<p style="color:var(--text-muted);font-style:italic;">No budget limits set for this month\'s categories.</p>';
}

/* ------------------------------------------------------------
   ROUTER — tab-based SPA navigation
   ------------------------------------------------------------ */
function switchTab(tabId) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  // Deactivate all nav links
  document.querySelectorAll('.nav-tab').forEach(a => a.classList.remove('active'));

  // Show target page
  const target = document.getElementById(tabId);
  if (target) target.classList.add('active');

  // Activate matching nav link
  const link = document.querySelector(`.nav-tab[data-tab="${tabId}"]`);
  if (link) link.classList.add('active');

  // Initialize / re-render the activated page
  if (tabId === 'page-dashboard') {
    renderDashboard();
  } else if (tabId === 'page-transactions') {
    // Re-populate category filter and re-render list
    const filterCat = document.getElementById('filterCategory');
    if (filterCat) {
      const categories = getCategories();
      filterCat.innerHTML = '<option value="all">All Categories</option>' +
        categories.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');
    }
    renderAllTransactions();
  } else if (tabId === 'page-summary') {
    renderSummary();
  }
}

/* ------------------------------------------------------------
   APP INIT
   ------------------------------------------------------------ */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDashboard();
  initTransactions();
  initSummary();

  // Wire up nav tab clicks
  document.querySelectorAll('.nav-tab').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      switchTab(link.dataset.tab);
    });
  });

  // Show dashboard by default
  switchTab('page-dashboard');
});
