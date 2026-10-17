/* Original presentation of published Table II endpoints. No runtime simulation.
   Values and printed precision are preserved in results.js. The log domains
   use all twelve rows and stay fixed when a published depth is selected. */
(function (global) {
  'use strict';
  const protocols = ['Unmitigated', 'QED only', 'PEC only', 'PEC+QED'];
  const depths = [4, 6, 8];
  const displayName = value => value === 'PEC+QED' ? 'PEC + QED' : value;
  const domain = values => [Math.min(...values) / 1.8, Math.max(...values) * 1.8];
  const logScale = (value, bounds, range) => range[0] + (Math.log10(value) - Math.log10(bounds[0])) / (Math.log10(bounds[1]) - Math.log10(bounds[0])) * (range[1] - range[0]);
  const model = { protocols, depths, domain, logScale };
  if (typeof module !== 'undefined' && module.exports) module.exports = model;
  if (!global || typeof document === 'undefined') return;
  function initialize(root) {
  if (root.logicalStudy || !global.LOGICAL_RESULTS) return;
  const source = global.LOGICAL_RESULTS;
  const rows = source.rows;
  if (rows.length !== 12 || rows.some(row => !depths.includes(row.qaoa_depth) || !protocols.includes(row.protocol) || row.absolute_error <= 0 || row.standard_error <= 0)) throw new Error('Invalid published endpoint data.');
  const q = selector => root.querySelector(selector);
  const qa = selector => Array.from(root.querySelectorAll(selector));
  const NS = 'http://www.w3.org/2000/svg';
  let state = { depth: 4, protocol: 'PEC+QED', exact: false };
  const bounds = { x: domain(rows.map(row => row.absolute_error)), y: domain(rows.map(row => row.standard_error)) };
  const colours = ['#39313e', '#39313e', '#9a6472', '#596f60'];
  let chartSvg, plotLayer, markerGroups = [], hitButtons = [], chartSize = null;
  const chartHost = q('[data-chart]');
  chartHost.setAttribute('role', 'group');
  function svg(tag, attrs, content) {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([key, value]) => node.setAttribute(key, String(value)));
    if (content !== undefined) node.textContent = content;
    return node;
  }
  function scientific(text) {
    if (text === '---') return '—';
    const match = /^([\d.]+)e([+-]?\d+)$/.exec(text);
    if (!match) return text;
    return match[1] + ' × 10<sup>' + (Number(match[2]) < 0 ? '−' : '') + Math.abs(Number(match[2])) + '</sup>';
  }
  function spokenScientific(text) {
    const match = /^([\d.]+)e([+-]?\d+)$/.exec(text);
    return match ? match[1] + ' times ten to the ' + match[2] : text;
  }
  function setScientific(selector, value) { q(selector).innerHTML = scientific(value); }
  function text(selector, value) { q(selector).textContent = value; }
  function selectedRows() { return rows.filter(row => row.qaoa_depth === state.depth); }
  function selectedRow() { return rows.find(row => row.qaoa_depth === state.depth && row.protocol === state.protocol); }
  function addMarker(group, index) {
    const colour = colours[index];
    const focus = svg('circle', { r: 15, class: 'ls-mark-focus', fill: 'none', stroke: '#39313e', 'stroke-width': 1, opacity: .8 });
    group.append(focus);
    if (index === 0) group.append(svg('path', { d: 'M-6-6L6 6M-6 6L6-6', stroke: colour, 'stroke-width': 2.5, fill: 'none' }));
    if (index === 1) group.append(svg('circle', { r: 6.5, fill: '#deded7', stroke: colour, 'stroke-width': 2.5 }));
    if (index === 2) group.append(svg('path', { d: 'M0-8L8 0L0 8L-8 0Z', fill: colour }));
    if (index === 3) group.append(svg('rect', { x: -7, y: -7, width: 14, height: 14, fill: colour }));
    group.append(svg('text', { class: 'ls-mark-name', x: 14, y: -14, fill: '#39313e', 'font-size': 12, 'font-family': 'RFArchivo,Arial,sans-serif' }, displayName(protocols[index])));
  }
  function buildChart() {
    const width = Math.round(chartHost.getBoundingClientRect().width);
    const height = Math.round(chartHost.getBoundingClientRect().height);
    if (!width || !height) return;
    const small = width < 390;
    chartSize = { width, height, small, left: small ? 52 : 65, right: width - 20, top: 34, bottom: height - 57 };
    chartHost.replaceChildren();
    chartSvg = svg('svg', { viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': `Reported endpoint error versus standard error. QAOA depth ${state.depth}. Both axes logarithmic.` });
    chartSvg.append(svg('title', {}, 'Endpoint error and standard error at one fixed shot budget'));
    chartSvg.append(svg('desc', {}, 'Four methods on fixed logarithmic axes. Use the method buttons to inspect the same published endpoint. Lower left means smaller absolute endpoint error and smaller standard error.'));
    const { left, right, top, bottom } = chartSize;
    const x = value => logScale(value, bounds.x, [left, right]);
    const y = value => logScale(value, bounds.y, [bottom, top]);
    const grid = svg('g', { 'aria-hidden': 'true' });
    const xTicks = [1e-4, 1e-3, 1e-2];
    const yTicks = [2e-4, 1e-3, 5e-3];
    for (const value of xTicks) {
      const px = x(value);
      grid.append(svg('line', { x1: px, y1: top, x2: px, y2: bottom, stroke: '#b9b3b9', 'stroke-width': 1 }));
      const label = svg('text', { x: px, y: bottom + 21, 'text-anchor': 'middle', fill: '#39313e', 'font-size': 12, 'font-family': 'RFMono,monospace' });
      label.textContent = '1e−' + Math.abs(Math.round(Math.log10(value)));
      grid.append(label);
    }
    for (const value of yTicks) {
      const py = y(value);
      grid.append(svg('line', { x1: left, y1: py, x2: right, y2: py, stroke: '#b9b3b9', 'stroke-width': 1 }));
      const label = svg('text', { x: left - 9, y: py + 4, 'text-anchor': 'end', fill: '#39313e', 'font-size': 12, 'font-family': 'RFMono,monospace' });
      const coefficient = value === 2e-4 ? '2' : value === 5e-3 ? '5' : '1';
      label.append(document.createTextNode(coefficient + 'e' + (value === 2e-4 ? '−4' : '−3')));
      grid.append(label);
    }
    grid.append(svg('rect', { 'data-chart-frame': '', x: left, y: top, width: right - left, height: bottom - top, fill: 'none', stroke: '#aaa5aa', 'stroke-width': 1 }));
    grid.append(svg('text', { x: left, y: 16, fill: '#39313e', 'font-size': 12, 'font-family': 'RFArchivo,Arial,sans-serif', 'data-axis': 'y', class: 'axis-title' }, 'Standard error'));
    grid.append(svg('text', { x: right, y: height - 11, 'text-anchor': 'end', fill: '#39313e', 'font-size': 12, 'font-family': 'RFArchivo,Arial,sans-serif', 'data-axis': 'x', class: 'axis-title' }, 'Endpoint absolute error'));
    chartSvg.append(grid);
    plotLayer = svg('g', { 'aria-hidden': 'true' });
    markerGroups = protocols.map((protocol, index) => {
      const group = svg('g', { class: 'ls-point', 'data-mark': protocol });
      addMarker(group, index);
      plotLayer.append(group);
      return group;
    });
    chartSvg.append(plotLayer);
    chartHost.append(chartSvg);
    hitButtons = protocols.map(protocol => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'ls-point-hit';
      button.dataset.point = protocol;
      button.addEventListener('click', () => setState({ protocol }));
      chartHost.append(button);
      return button;
    });
    updatePoints(false);
  }
  function updatePoints(animate = true) {
    if (!chartSize) return;
    const { width, left, right, top, bottom, small } = chartSize;
    const current = selectedRows();
    chartSvg.setAttribute('aria-label', `Reported endpoint error versus standard error. QAOA depth ${state.depth}. Both axes logarithmic.`);
    current.forEach(row => {
      const index = protocols.indexOf(row.protocol);
      const px = logScale(row.absolute_error, bounds.x, [left, right]);
      const py = logScale(row.standard_error, bounds.y, [bottom, top]);
      const group = markerGroups[index];
      group.style.transition = animate ? '' : 'none';
      group.style.transform = `translate(${px}px,${py}px)`;
      group.dataset.absoluteError = row.absolute_error;
      group.dataset.standardError = row.standard_error;
      group.querySelector('.ls-mark-focus').style.display = state.protocol === row.protocol ? '' : 'none';
      const label = group.querySelector('text');
      const anchorLeft = px > width * .65;
      label.setAttribute('text-anchor', anchorLeft ? 'end' : 'start');
      label.setAttribute('x', anchorLeft ? -14 : 14);
      label.setAttribute('y', row.protocol === 'Unmitigated' || row.protocol === 'QED only' && small ? 24 : -15);
      label.textContent = row.protocol === 'Unmitigated' && small ? 'Unmitigated' : displayName(row.protocol);
      const button = hitButtons[index];
      button.style.transition = animate ? '' : 'none';
      button.style.left = px + 'px';
      button.style.top = py + 'px';
      button.setAttribute('aria-label', `${displayName(row.protocol)}. Endpoint error ${spokenScientific(row.printed_values[0])}; standard error ${spokenScientific(row.printed_values[1])}. Inspect method.`);
      button.setAttribute('aria-pressed', String(state.protocol === row.protocol));
    });
  }
  function renderSchedule() {
    const host = q('[data-schedule]');
    const width = Math.round(host.getBoundingClientRect().width);
    if (!width) return;
    const hasDetection = ['QED only', 'PEC+QED'].includes(state.protocol);
    const mid = width / 2, left = 9, right = width - 10;
    const stage = svg('svg', { viewBox: `0 0 ${width} 82`, role: 'img', 'aria-label': hasDetection ? 'Detection checks at the midpoint and end. Two ordered units. Schematic.' : 'Circuit without detection checks. Schematic.' });
    stage.append(svg('line', { x1: left, y1: 31, x2: right, y2: 31, stroke: '#39313e', 'stroke-width': 2 }));
    stage.append(svg('circle', { cx: left, cy: 31, r: 3, fill: '#39313e' }));
    if (hasDetection) {
      [mid, right].forEach(px => stage.append(svg('rect', { x: px - 5, y: 19, width: 10, height: 24, fill: '#b7795c', stroke: '#39313e', 'stroke-width': 1 })));
      stage.append(svg('text', { x: mid, y: 62, 'text-anchor': 'middle', fill: '#39313e', 'font-size': 12, 'font-family': 'RFArchivo,Arial,sans-serif' }, 'Midpoint check'));
      stage.append(svg('text', { x: right, y: 62, 'text-anchor': 'end', fill: '#39313e', 'font-size': 12, 'font-family': 'RFArchivo,Arial,sans-serif' }, 'End check'));
      stage.append(svg('text', { x: (left + mid) / 2, y: 15, 'text-anchor': 'middle', fill: '#39313e', 'font-size': 12, 'font-family': 'RFMono,monospace' }, 'First unit'));
      stage.append(svg('text', { x: (mid + right) / 2, y: 15, 'text-anchor': 'middle', fill: '#39313e', 'font-size': 12, 'font-family': 'RFMono,monospace' }, 'Second unit'));
    } else {
      stage.append(svg('circle', { cx: right, cy: 31, r: 3, fill: '#39313e' }));
      stage.append(svg('text', { x: left, y: 62, fill: '#39313e', 'font-size': 12, 'font-family': 'RFArchivo,Arial,sans-serif' }, 'No syndrome checks'));
      stage.append(svg('text', { x: right, y: 62, 'text-anchor': 'end', fill: '#39313e', 'font-size': 12, 'font-family': 'RFArchivo,Arial,sans-serif' }, 'End'));
    }
    host.replaceChildren(stage);
    text('[data-schedule-title]', 'Detection schedule / ' + displayName(state.protocol));
    text('[data-interval]', hasDetection ? `${state.depth * 5} layers per interval` : state.protocol === 'PEC only' ? 'Physical-qubit protocol' : 'Unmitigated reference');
    text('[data-schedule-note]', hasDetection ? 'Midpoint and terminal checks. This strip shows circuit order, not gate duration. Acceptance counts the runs that pass both checks.' : state.protocol === 'PEC only' ? 'PEC-only uses physical qubits and quasi-probability weighting. QED acceptance is not applicable.' : 'The unmitigated baseline has no PEC weighting or QED post-selection.');
  }
  function renderTable() {
    const body = q('[data-table]');
    body.replaceChildren();
    selectedRows().forEach(row => {
      const tr = document.createElement('tr');
      tr.setAttribute('aria-selected', String(row.protocol === state.protocol));
      const name = document.createElement('th');
      name.scope = 'row';
      name.textContent = displayName(row.protocol);
      tr.append(name);
      row.printed_values.forEach(value => {
        const td = document.createElement('td');
        td.innerHTML = scientific(value);
        tr.append(td);
      });
      body.append(tr);
    });
    text('[data-table-caption]', `QAOA depth ${state.depth} · Table II · 100,000 attempted shots`);
  }
  function render() {
    const row = selectedRow();
    root.dataset.depth = state.depth;
    root.dataset.protocol = state.protocol;
    qa('[data-depth]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.depth) === state.depth)));
    qa('[data-protocol]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.protocol === state.protocol)));
    text('[data-selected-label]', 'Selected / ' + displayName(state.protocol));
    setScientific('[data-mse]', row.printed_values[2]);
    setScientific('[data-error]', row.printed_values[0]);
    setScientific('[data-se]', row.printed_values[1]);
    text('[data-acceptance]', row.acceptance_percent === null ? 'Not applicable' : row.printed_values[4]);
    text('[data-gamma]', row.gamma === null ? 'Not applicable' : row.printed_values[3]);
    text('[data-method-note]', state.protocol === 'PEC+QED' ? 'Detection and mitigation, with steady-state extraction. Lowest reported MSE at this depth.' : state.protocol === 'QED only' ? 'Detection filters runs. Some residual error remains.' : state.protocol === 'PEC only' ? 'Mitigation on physical qubits. Read endpoint error and uncertainty together.' : 'The unmitigated reference without PEC weighting or QED post-selection.');
    q('[data-inspect]').setAttribute('aria-expanded', String(state.exact));
    q('[data-inspect]').textContent = state.exact ? 'Hide reported values ↑' : 'Show reported values ↓';
    q('[data-exact]').hidden = !state.exact;
    updatePoints();
    renderSchedule();
    renderTable();
    root.dispatchEvent(new CustomEvent('logicalstudychange', { detail: getState(), bubbles: true }));
  }
  function setState(next) {
    if (next.depth !== undefined && !depths.includes(Number(next.depth))) throw new Error('Choose one published QAOA depth.');
    if (next.protocol !== undefined && !protocols.includes(next.protocol)) throw new Error('Choose one reported protocol.');
    state = { depth: next.depth === undefined ? state.depth : Number(next.depth), protocol: next.protocol === undefined ? state.protocol : next.protocol, exact: next.exact === undefined ? state.exact : Boolean(next.exact) };
    render();
  }
  function getState() { return { ...state, row: JSON.parse(JSON.stringify(selectedRow())), budget: source.attempted_shots, bounds: JSON.parse(JSON.stringify(bounds)) }; }
  qa('[data-depth]').forEach(button => button.addEventListener('click', () => setState({ depth: Number(button.dataset.depth) })));
  qa('[data-protocol]').forEach(button => button.addEventListener('click', () => setState({ protocol: button.dataset.protocol })));
  q('[data-inspect]').addEventListener('click', () => {
    setState({ exact: !state.exact });
    if (state.exact) { q('[data-exact-title]').focus({ preventScroll: true }); q('[data-exact]').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'instant' : 'smooth', block: 'start' }); }
  });
  q('[data-close]').addEventListener('click', () => { setState({ exact: false }); q('[data-inspect]').focus(); });
  let resizeFrame = 0;
  const observer = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(() => { buildChart(); renderSchedule(); }); });
  observer.observe(chartHost);
  root.logicalStudy = { getState, setState, destroy() { observer.disconnect(); cancelAnimationFrame(resizeFrame); } };
  buildChart();
  render();
  }
  function initLogicalStudies(scope = document) {
    if (scope.matches && scope.matches('[data-logical-study]')) initialize(scope);
    scope.querySelectorAll('[data-logical-study]').forEach(initialize);
  }
  global.initLogicalStudies = initLogicalStudies;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => initLogicalStudies(), { once: true });
  else initLogicalStudies();
})(typeof window !== 'undefined' ? window : null);
