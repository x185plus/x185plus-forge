/**
 * 🛡️ X185Plus Forge — Community Rule Catalog Client
 *
 * Handles filtering, drawer inspection, rule comparison,
 * live fixture highlights, and client-side catalog downloads.
 */

(function () {
  'use strict';

  const data = window.CATALOG || { rules: [], stats: {}, operatorRef: [], pillars: [] };
  const allRules = data.rules || [];

  // State
  let currentCategory = 'all';
  let currentSeverity = 'all';
  let currentPerf = 'all';
  let searchQuery = '';
  let selectedRuleIds = new Set();
  let currentInspectedRule = null;

  // DOM Elements
  const rulesGrid = document.getElementById('rules-grid');
  const searchInput = document.getElementById('search-input');
  const btnClearSearch = document.getElementById('btn-clear-search');
  const categoryChips = document.getElementById('category-filter-chips');
  const severityFilter = document.getElementById('severity-filter');
  const perfFilter = document.getElementById('perf-filter');
  const resultsCountText = document.getElementById('results-count-text');
  const btnResetFilters = document.getElementById('btn-reset-filters');
  const btnDownloadCatalog = document.getElementById('btn-download-catalog');

  // Tabs
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabPanes = document.querySelectorAll('.tab-pane');
  const tabCountCatalog = document.getElementById('tab-count-catalog');
  const tabCountCompare = document.getElementById('tab-count-compare');

  // Drawer Elements
  const drawer = document.getElementById('inspector-drawer');
  const drawerBackdrop = document.getElementById('drawer-backdrop');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const drawerRuleId = document.getElementById('drawer-rule-id');
  const drawerSeverityBadge = document.getElementById('drawer-severity-badge');
  const drawerDesc = document.getElementById('drawer-desc');
  const drawerApproach = document.getElementById('drawer-approach');
  const drawerPatternCode = document.getElementById('drawer-pattern-code');
  const drawerFixCode = document.getElementById('drawer-fix-code');
  const drawerFixWrapper = document.getElementById('drawer-fix-wrapper');
  const drawerHandlerCode = document.getElementById('drawer-handler-code');
  const drawerHandlerWrapper = document.getElementById('drawer-handler-wrapper');
  const drawerFixturePreview = document.getElementById('drawer-fixture-preview');
  const drawerMetaCwe = document.getElementById('drawer-meta-cwe');
  const drawerMetaPillar = document.getElementById('drawer-meta-pillar');
  const drawerMetaPerf = document.getElementById('drawer-meta-perf');
  const drawerMetaConfidence = document.getElementById('drawer-meta-confidence');
  const drawerMetaLimitations = document.getElementById('drawer-meta-limitations');
  const drawerMetaAliases = document.getElementById('drawer-meta-aliases');
  const btnCopyPattern = document.getElementById('btn-copy-pattern');

  // Compare Elements
  const compareContainer = document.getElementById('compare-container');
  const btnClearCompare = document.getElementById('btn-clear-compare');

  // 1. Initialize UI
  function init() {
    tabCountCatalog.textContent = allRules.length;
    renderRules();
    setupEventListeners();
  }

  // 2. Filter Rules
  function getFilteredRules() {
    return allRules.filter(rule => {
      // Category filter
      if (currentCategory !== 'all' && rule.category !== currentCategory) {
        return false;
      }
      // Severity filter
      if (currentSeverity !== 'all' && rule.severity.toLowerCase() !== currentSeverity) {
        return false;
      }
      // Performance filter
      if (currentPerf !== 'all' && rule.perf !== currentPerf) {
        return false;
      }
      // Search query filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const inId = rule.ruleId.toLowerCase().includes(q);
        const inDesc = (rule.description || '').toLowerCase().includes(q);
        const inCwe = (rule.cwe || '').toLowerCase().includes(q);
        const inTags = (rule.tags || []).some(t => t.toLowerCase().includes(q));
        if (!inId && !inDesc && !inCwe && !inTags) return false;
      }
      return true;
    });
  }

  // 3. Render Rule Cards Grid
  function renderRules() {
    const filtered = getFilteredRules();
    resultsCountText.textContent = `Showing ${filtered.length} of ${allRules.length} rules`;

    // Show/hide reset button
    const isFiltered = currentCategory !== 'all' || currentSeverity !== 'all' || currentPerf !== 'all' || searchQuery;
    btnResetFilters.style.display = isFiltered ? 'inline-block' : 'none';

    if (filtered.length === 0) {
      rulesGrid.innerHTML = `
        <div class="compare-empty-state" style="grid-column: 1 / -1;">
          <div class="compare-empty-icon">🔍</div>
          <h3 style="color: #fff; margin-bottom: 6px;">No rules matched your criteria</h3>
          <p style="color: var(--text-muted); font-size: 13px;">Try clearing filters or search terms to see available community patterns.</p>
        </div>
      `;
      return;
    }

    rulesGrid.innerHTML = filtered.map(rule => {
      const sevClass = `badge-${rule.severity.toLowerCase()}`;
      const isChecked = selectedRuleIds.has(rule.ruleId);
      const snippet = rule.pattern ? `pattern: /${rule.pattern}/` : `handler: ${rule.handler}`;

      const tagsHtml = (rule.tags || []).slice(0, 3).map(t => `<span class="card-tag">#${t}</span>`).join('');

      return `
        <article class="rule-card" data-rule-id="${rule.ruleId}">
          <div class="card-top">
            <div class="card-badges">
              <span class="badge ${sevClass}">${rule.severity}</span>
              <span class="badge version-badge">${rule.category}</span>
            </div>
            <label class="card-compare-check" onclick="event.stopPropagation()">
              <input type="checkbox" class="compare-checkbox" data-rule-id="${rule.ruleId}" ${isChecked ? 'checked' : ''}>
              <span>Compare</span>
            </label>
          </div>

          <h3 class="card-rule-id">${rule.ruleId}</h3>
          <p class="card-desc">${escapeHtml(rule.description)}</p>

          <div class="card-snippet" title="${escapeHtml(snippet)}">${escapeHtml(snippet)}</div>

          <div class="card-footer">
            <div class="card-tags">${tagsHtml}</div>
            <span class="card-view-btn">Inspect →</span>
          </div>
        </article>
      `;
    }).join('');

    // Attach click events
    rulesGrid.querySelectorAll('.rule-card').forEach(card => {
      card.addEventListener('click', () => {
        const ruleId = card.getAttribute('data-rule-id');
        openDrawer(ruleId);
      });
    });

    rulesGrid.querySelectorAll('.compare-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const ruleId = e.target.getAttribute('data-rule-id');
        toggleCompare(ruleId, e.target.checked);
      });
    });
  }

  // 4. Drawer Inspector Logic
  function openDrawer(ruleId) {
    const rule = allRules.find(r => r.ruleId === ruleId);
    if (!rule) return;
    currentInspectedRule = rule;

    drawerRuleId.textContent = rule.ruleId;
    drawerSeverityBadge.className = `badge badge-lg badge-${rule.severity.toLowerCase()}`;
    drawerSeverityBadge.textContent = `${rule.severity} · ${rule.confidence || 'pilot'}`;
    drawerDesc.textContent = rule.description;
    drawerApproach.textContent = rule.approach || 'No custom approach note provided.';

    // Pattern & Fix
    drawerPatternCode.textContent = rule.pattern ? rule.pattern : 'N/A (AST Handler rule)';
    if (rule.fix !== null && rule.fix !== undefined && rule.fix !== '') {
      drawerFixWrapper.style.display = 'block';
      drawerFixCode.textContent = rule.fix;
    } else {
      drawerFixWrapper.style.display = 'none';
    }

    if (rule.handler) {
      drawerHandlerWrapper.style.display = 'block';
      drawerHandlerCode.textContent = rule.handler;
    } else {
      drawerHandlerWrapper.style.display = 'none';
    }

    // Fixture Preview with Highlights
    renderFixturePreview(rule);

    // Metadata
    drawerMetaCwe.textContent = rule.cwe || 'N/A';
    drawerMetaPillar.textContent = rule.pillar || 'General';
    drawerMetaPerf.textContent = (rule.perf || 'cheap').toUpperCase();
    drawerMetaConfidence.textContent = (rule.confidence || 'pilot').toUpperCase();
    drawerMetaLimitations.textContent = rule.limitations || 'None documented.';
    drawerMetaAliases.textContent = (rule.aliases && rule.aliases.length > 0) ? rule.aliases.join(', ') : 'None';

    drawer.classList.add('open');
    drawerBackdrop.classList.add('active');
    drawer.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawerBackdrop.classList.remove('active');
    drawer.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    currentInspectedRule = null;
  }

  // Render Fixture with Semgrep-style Highlights
  function renderFixturePreview(rule) {
    if (!rule.fixture) {
      drawerFixturePreview.innerHTML = '<div style="color: var(--text-muted); font-size: 12px;">No fixture file available.</div>';
      return;
    }

    const lines = rule.fixture.split('\n');
    let html = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let lineClass = '';

      if (line.includes(`// ruleid:`) || line.includes(`# ruleid:`)) {
        lineClass = 'fixture-match';
      } else if (line.includes(`// ok`) || line.includes(`# ok`)) {
        lineClass = 'fixture-guard';
      }

      html += `
        <div class="fixture-line ${lineClass}">
          <span class="fixture-line-num">${i + 1}</span>
          <span class="fixture-line-content">${escapeHtml(line)}</span>
        </div>
      `;
    }

    drawerFixturePreview.innerHTML = html;
  }

  // 5. Compare Selection Logic
  function toggleCompare(ruleId, isChecked) {
    if (isChecked) {
      if (selectedRuleIds.size >= 4) {
        alert('You can compare a maximum of 4 rules simultaneously.');
        renderRules();
        return;
      }
      selectedRuleIds.add(ruleId);
    } else {
      selectedRuleIds.delete(ruleId);
    }
    tabCountCompare.textContent = selectedRuleIds.size;
    renderComparePane();
  }

  function renderComparePane() {
    if (selectedRuleIds.size === 0) {
      compareContainer.innerHTML = `
        <div class="compare-empty-state">
          <div class="compare-empty-icon">⚖️</div>
          <h3 style="color: #fff; margin-bottom: 6px;">No rules selected for comparison</h3>
          <p style="color: var(--text-muted); font-size: 13px;">Check the "Compare" box on 2 to 4 rule cards in the catalog to inspect them side-by-side.</p>
        </div>
      `;
      return;
    }

    const rulesToCompare = allRules.filter(r => selectedRuleIds.has(r.ruleId));

    let headersHtml = '<th>Dimension</th>';
    for (const r of rulesToCompare) {
      headersHtml += `<th><code>${r.ruleId}</code></th>`;
    }

    function makeRow(label, fn) {
      let rowHtml = `<tr><td>${label}</td>`;
      for (const r of rulesToCompare) {
        rowHtml += `<td>${fn(r)}</td>`;
      }
      rowHtml += `</tr>`;
      return rowHtml;
    }

    const tableHtml = `
      <div class="compare-table-wrapper">
        <table class="compare-table">
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${makeRow('Category', r => `<span class="badge version-badge">${r.category}</span>`)}
            ${makeRow('Severity', r => `<span class="badge badge-${r.severity.toLowerCase()}">${r.severity}</span>`)}
            ${makeRow('Confidence', r => `<span class="badge badge-success">${r.confidence || 'pilot'}</span>`)}
            ${makeRow('Description', r => escapeHtml(r.description))}
            ${makeRow('Pattern / Handler', r => r.pattern ? `<code>${escapeHtml(r.pattern)}</code>` : `<code>${r.handler}</code>`)}
            ${makeRow('Rewrite Fix', r => r.fix ? `<code>${escapeHtml(r.fix)}</code>` : 'None / Handled')}
            ${makeRow('Performance Class', r => `<strong>${(r.perf || 'cheap').toUpperCase()}</strong>`)}
            ${makeRow('CWE Mapping', r => r.cwe || 'N/A')}
            ${makeRow('Limitations', r => `<small>${escapeHtml(r.limitations || 'None')}</small>`)}
          </tbody>
        </table>
      </div>
    `;

    compareContainer.innerHTML = tableHtml;
  }

  // 6. Download Catalog JSON
  function downloadCatalog() {
    const filtered = getFilteredRules();
    const exportObject = {
      name: "@x185plus/forge-community-rules",
      version: "1.0.0",
      downloadedAt: new Date().toISOString(),
      ruleCount: filtered.length,
      rules: filtered.map(r => ({
        ruleId: r.ruleId,
        description: r.description,
        category: r.category,
        severity: r.severity,
        confidence: r.confidence,
        pattern: r.pattern,
        fix: r.fix,
        handler: r.handler,
        flags: r.flags,
        aliases: r.aliases,
        tags: r.tags
      }))
    };

    const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `x185plus-forge-catalog-${filtered.length}-rules.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // 7. Event Listeners
  function setupEventListeners() {
    // Search
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      btnClearSearch.style.display = searchQuery ? 'block' : 'none';
      renderRules();
    });

    btnClearSearch.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      btnClearSearch.style.display = 'none';
      renderRules();
      searchInput.focus();
    });

    // Category chips
    categoryChips.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        categoryChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentCategory = chip.getAttribute('data-category');
        renderRules();
      });
    });

    // Select filters
    severityFilter.addEventListener('change', (e) => {
      currentSeverity = e.target.value;
      renderRules();
    });

    perfFilter.addEventListener('change', (e) => {
      currentPerf = e.target.value;
      renderRules();
    });

    // Reset filters
    btnResetFilters.addEventListener('click', () => {
      currentCategory = 'all';
      currentSeverity = 'all';
      currentPerf = 'all';
      searchQuery = '';
      searchInput.value = '';
      btnClearSearch.style.display = 'none';
      severityFilter.value = 'all';
      perfFilter.value = 'all';
      categoryChips.querySelectorAll('.chip').forEach(c => {
        c.classList.toggle('active', c.getAttribute('data-category') === 'all');
      });
      renderRules();
    });

    // Tabs
    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`pane-${tabId}`).classList.add('active');
      });
    });

    // Drawer close
    btnCloseDrawer.addEventListener('click', closeDrawer);
    drawerBackdrop.addEventListener('click', closeDrawer);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawer.classList.contains('open')) {
        closeDrawer();
      }
    });

    // Copy Pattern
    btnCopyPattern.addEventListener('click', () => {
      if (!currentInspectedRule) return;
      const textToCopy = currentInspectedRule.pattern || currentInspectedRule.handler;
      navigator.clipboard.writeText(textToCopy).then(() => {
        const orig = btnCopyPattern.textContent;
        btnCopyPattern.textContent = 'Copied!';
        setTimeout(() => { btnCopyPattern.textContent = orig; }, 1500);
      });
    });

    // Terminal command copy
    document.querySelectorAll('.btn-copy[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cmd = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(cmd).then(() => {
          const orig = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = orig; }, 1500);
        });
      });
    });

    // Clear compare
    btnClearCompare.addEventListener('click', () => {
      selectedRuleIds.clear();
      tabCountCompare.textContent = '0';
      renderRules();
      renderComparePane();
    });

    // Download catalog
    btnDownloadCatalog.addEventListener('click', downloadCatalog);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Start app
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
