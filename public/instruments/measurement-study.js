/* Measurement Atlas. PRL 130, 170201 (2023), Eq. (4).
   Exact restricted model: noiseless projective measurements of one qubit.
   Complete-link grouping below is illustrative, not the paper's k-medoids method. */
(function (host) {
  'use strict';
  const TAU = Math.PI / 180;
  const EPS = 1e-12;
  const MAX_MED = Math.SQRT1_2;
  const DEFAULTS = [
    { id: 'A', polar: 25, azimuth: 20 },
    { id: 'B', polar: 0, azimuth: 0 },
    { id: 'C', polar: 90, azimuth: 0 },
    { id: 'D', polar: 90, azimuth: 25 },
    { id: 'E', polar: 90, azimuth: 90 },
    { id: 'F', polar: 90, azimuth: 65 }
  ];
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Number(x) || 0));
  const clean = x => Math.abs(x) < EPS ? 0 : x;
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  function normalise(v) {
    const size = Math.hypot(...v);
    if (!Number.isFinite(size) || size < EPS) throw new Error('A measurement axis must be nonzero and finite.');
    return v.map(x => x / size);
  }
  function axisVector(polar, azimuth) {
    const p = clamp(polar, 0, 180) * TAU;
    const a = ((Number(azimuth) || 0) % 360) * TAU;
    return [Math.sin(p) * Math.cos(a), Math.sin(p) * Math.sin(a), Math.cos(p)].map(clean);
  }
  function med(a, b) {
    const n = normalise(a), m = normalise(b);
    const cross = [n[1] * m[2] - n[2] * m[1], n[2] * m[0] - n[0] * m[2], n[0] * m[1] - n[1] * m[0]];
    return clean(Math.min(MAX_MED, Math.hypot(...cross) / Math.SQRT2));
  }
  function pairwise(axes) {
    return axes.map((n, i) => axes.map((m, j) => i === j ? 0 : med(n.vector || n, m.vector || m)));
  }
  function completeLink(matrix, threshold) {
    const cutoff = clamp(threshold, 0, MAX_MED);
    let groups = matrix.map((_, i) => [i]);
    while (true) {
      let best = null;
      for (let i = 0; i < groups.length; i++) {
        for (let j = i + 1; j < groups.length; j++) {
          let distance = 0;
          for (const a of groups[i]) for (const b of groups[j]) distance = Math.max(distance, matrix[a][b]);
          if (distance <= cutoff + EPS && (!best || distance < best.distance - EPS)) best = { i, j, distance };
        }
      }
      if (!best) break;
      groups[best.i] = groups[best.i].concat(groups[best.j]).sort((a, b) => a - b);
      groups.splice(best.j, 1);
    }
    return groups;
  }
  const math = { axisVector, med, pairwise, completeLink, max: MAX_MED };
  if (typeof module !== 'undefined' && module.exports) module.exports = math;
  if (!host || typeof document === 'undefined') return;
  if (host.MeasurementAtlas && host.MeasurementAtlas.init) {
    host.MeasurementAtlas.init(document);
    return;
  }
  const instances = new WeakMap();
  let serial = 0;
  const svgNS = 'http://www.w3.org/2000/svg';
  function svgNode(tag, attrs, text) {
    const el = document.createElementNS(svgNS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
    if (text) el.textContent = text;
    return el;
  }
  function prepareAxis(a) {
    const polar = clamp(a.polar, 0, 180);
    const azimuth = ((Number(a.azimuth) || 0) % 360 + 360) % 360;
    return { id: a.id, polar, azimuth, vector: axisVector(polar, azimuth) };
  }
  function build(root) {
    const uid = `measurement-${++serial}`;
    const axes = DEFAULTS.map(prepareAxis);
    const state = { axes, edited: 0, compared: 1, threshold: .32 };
    let previous = '';
    root.innerHTML = `
      <div class="ms-heading">
        <h3>Measurement atlas</h3>
        <p>Move one axis. See how all its relations change.</p>
      </div>
      <p class="ms-scope">One qubit · Six noiseless projective measurements</p>
      <div class="ms-work">
        <div class="ms-geometry">
          <div class="ms-pair-heading"><h4 data-ms-pair-heading>A / B</h4><div><span class="ms-meta">MED</span><output data-ms-med>0.299</output></div></div>
          <div data-ms-visual></div>
          <p class="ms-pair-note"><span data-ms-angle>25°</span> between the two bases. <span data-ms-meaning></span></p>
        </div>
        <div class="ms-editor">
          <fieldset class="ms-axis-choice"><legend>Choose an axis to move</legend><div data-ms-axis-buttons>${axes.map((a, i) => `<button type="button" data-ms-axis="${i}" aria-pressed="${i === 0}">${a.id}</button>`).join('')}</div></fieldset>
          <label class="ms-range-label" for="${uid}-polar"><span>Polar angle θ</span><output data-ms-polar-value>0°</output></label>
          <input id="${uid}-polar" data-ms-polar type="range" min="0" max="180" step="1" value="0">
          <label class="ms-range-label" for="${uid}-azimuth"><span>Azimuth φ</span><output data-ms-azimuth-value>0°</output></label>
          <input id="${uid}-azimuth" data-ms-azimuth type="range" min="0" max="359" step="1" value="0">
          <p class="ms-meta ms-orientation" data-ms-orientation>θ starts at +Z. φ turns around Z.</p>
          <label class="ms-compare-label" for="${uid}-compare"><span>Compare with</span><select id="${uid}-compare" data-ms-compare>${axes.map((a, i) => `<option value="${i}">${a.id}</option>`).join('')}</select></label>
          <div class="ms-actions"><button type="button" data-ms-reverse>Reverse axis</button><button type="button" data-ms-reset>Reset</button></div>
          <p class="ms-meta">Reverse an axis to exchange outcome labels. Its measurement basis stays the same.</p>
        </div>
      </div>
      <div class="ms-bottom">
        <div class="ms-matrix-area">
          <h4>Every pair, at once</h4><p class="ms-meta">Choose a pair to inspect it. MED ranges from 0 to 0.707… Values are rounded.</p>
          <div class="ms-matrix-scroll"><table class="ms-matrix" aria-describedby="${uid}-matrix-help"><caption class="ms-sr-only">Exact pairwise mutual eigenspace disturbance. Rows and columns identify axes.</caption><thead><tr><th scope="col"><span class="ms-sr-only">Axis</span></th>${axes.map(a => `<th scope="col">${a.id}</th>`).join('')}</tr></thead><tbody>${axes.map((a, i) => `<tr><th scope="row">${a.id}</th>${axes.map((b, j) => `<td>${i === j ? '<span class="ms-self" aria-label="Same axis, MED zero">0</span>' : `<button type="button" data-ms-cell="${i},${j}" tabindex="${i === 0 && j === 1 ? 0 : -1}">0.000</button>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
          <p id="${uid}-matrix-help" class="ms-sr-only">Arrow keys move between matrix pairs. Enter selects a pair. Angle sliders also work with arrow keys.</p>
        </div>
        <div class="ms-group-area">
          <h4>Which bases stay close?</h4>
          <label class="ms-range-label" for="${uid}-threshold"><span>Group cutoff</span><output data-ms-threshold-value>0.320</output></label>
          <input id="${uid}-threshold" data-ms-threshold type="range" min="0" max="1000" step="1" value="453">
          <div class="ms-groups" data-ms-groups></div>
          <p class="ms-meta">No pair in a group has MED above the cutoff. This is an illustrative complete-link rule.</p>
        </div>
      </div>
      <p class="ms-result" data-ms-result aria-live="polite" aria-atomic="true"></p>
      <p class="ms-scope ms-not-probability">MED measures mutual eigenspace disturbance. It is not a probability.</p>
      <details class="ms-method"><summary>Model and method</summary><p>Each axis n specifies the projectors (I ± n · σ) / 2. For each pair, MED = |n × m| / √2. Opposite axes define the same unordered basis, so their MED is zero.</p><p>The grouping starts with single axes. It repeatedly joins the two closest groups if their largest pairwise MED is at or below the cutoff. Ties follow axis order. This illustrates complete-link grouping; it does not reproduce the paper’s k-medoids algorithm.</p><a href="https://doi.org/10.1103/PhysRevLett.130.170201" target="_blank" rel="noopener noreferrer">Physical Review Letters 130, 170201 · Equation 4 ↗</a></details>`;

    const $ = selector => root.querySelector(selector);
    const all = selector => [...root.querySelectorAll(selector)];
    const visual = $('[data-ms-visual]');
    const svg = svgNode('svg', { viewBox: '0 0 320 250', role: 'img', 'aria-labelledby': `${uid}-svg-title ${uid}-svg-desc` });
    svg.append(svgNode('title', { id: `${uid}-svg-title` }, 'Two selected measurement bases on a Bloch sphere'));
    const desc = svgNode('desc', { id: `${uid}-svg-desc` }); svg.append(desc);
    const plane = svgNode('g', { class: 'ms-sphere' });
    plane.append(svgNode('circle', { cx: 160, cy: 111, r: 86 }), svgNode('ellipse', { cx: 160, cy: 111, rx: 86, ry: 43 }));
    svg.append(plane);
    // Fixed orthographic projection: viewing direction is not a scientific parameter.
    const project = v => [160 + 86 * (.8660254037844386 * v[0] - .5 * v[1]), 111 + 86 * (.25 * v[0] + .4330127018922193 * v[1] - .8660254037844386 * v[2])];
    for (const [v, label] of [[[1, 0, 0], 'X'], [[0, 1, 0], 'Y'], [[0, 0, 1], 'Z']]) {
      const p = project(v); plane.append(svgNode('line', { x1: 160, y1: 111, x2: p[0], y2: p[1] }), svgNode('text', { x: p[0] + 8, y: p[1] - 7 }, label));
    }
    const arc = svgNode('path', { class: 'ms-angle-arc', fill: 'none' });
    const axisA = svgNode('line', { class: 'ms-axis-a' });
    const axisB = svgNode('line', { class: 'ms-axis-b' });
    const aTip = svgNode('circle', { class: 'ms-tip-a', r: 5 });
    const bTip = svgNode('rect', { class: 'ms-tip-b', width: 9, height: 9 });
    svg.append(arc, axisA, axisB, aTip, bTip, svgNode('circle', { cx: 160, cy: 111, r: 2.5, class: 'ms-origin' }));
    const legendA = svgNode('text', { x: 67, y: 231 });
    const legendB = svgNode('text', { x: 213, y: 231 });
    svg.append(svgNode('line', { x1: 28, y1: 226, x2: 56, y2: 226, class: 'ms-axis-a' }), svgNode('circle', { cx: 42, cy: 226, r: 4, class: 'ms-tip-a' }), legendA);
    svg.append(svgNode('line', { x1: 174, y1: 226, x2: 202, y2: 226, class: 'ms-axis-b' }), svgNode('rect', { x: 184, y: 222, width: 8, height: 8, class: 'ms-tip-b' }), legendB);
    visual.append(svg);

    function snapshot() {
      const matrix = pairwise(state.axes);
      const groups = completeLink(matrix, state.threshold).map(g => g.map(i => state.axes[i].id));
      const n = state.axes[state.edited].vector, m = state.axes[state.compared].vector;
      return {
        axes: state.axes.map(a => ({ ...a, vector: [...a.vector] })), matrix,
        selection: { edited: state.axes[state.edited].id, compared: state.axes[state.compared].id, indices: [state.edited, state.compared], angleDegrees: Math.acos(clamp(Math.abs(dot(n, m)), 0, 1)) / TAU, med: matrix[state.edited][state.compared] },
        threshold: state.threshold, groups
      };
    }
    function render(announce = true) {
      const info = snapshot(), a = state.axes[state.edited], b = state.axes[state.compared];
      const pairMed = info.selection.med, degrees = info.selection.angleDegrees;
      all('[data-ms-axis]').forEach(button => button.setAttribute('aria-pressed', String(Number(button.dataset.msAxis) === state.edited)));
      $('[data-ms-polar]').value = a.polar; $('[data-ms-azimuth]').value = a.azimuth;
      $('[data-ms-polar-value]').textContent = `${a.polar}°`; $('[data-ms-azimuth-value]').textContent = `${a.azimuth}°`;
      $('[data-ms-polar]').setAttribute('aria-label', `Polar angle of axis ${a.id}`);
      $('[data-ms-azimuth]').setAttribute('aria-label', `Azimuth of axis ${a.id}`);
      $('[data-ms-polar]').setAttribute('aria-valuetext', `${a.polar} degrees`);
      $('[data-ms-azimuth]').setAttribute('aria-valuetext', `${a.azimuth} degrees`);
      $('[data-ms-azimuth]').disabled = a.polar === 0 || a.polar === 180;
      $('[data-ms-orientation]').textContent = a.polar === 0 || a.polar === 180 ? 'At a pole, φ does not change the axis. Move θ first.' : 'θ starts at +Z. φ turns around Z.';
      $('[data-ms-compare]').value = state.compared;
      all('[data-ms-compare] option').forEach(option => { option.disabled = Number(option.value) === state.edited; });
      $('[data-ms-pair-heading]').textContent = `${a.id} / ${b.id}`;
      $('[data-ms-med]').textContent = pairMed.toFixed(3);
      $('[data-ms-angle]').textContent = `${degrees.toFixed(1)}°`;
      $('[data-ms-meaning]').textContent = pairMed < EPS ? 'The bases are the same.' : Math.abs(pairMed - MAX_MED) < EPS ? 'The bases are maximally distinct in this model.' : '';
      $('[data-ms-threshold]').value = Math.round(state.threshold / MAX_MED * 1000);
      $('[data-ms-threshold-value]').textContent = state.threshold === MAX_MED ? '0.707…' : state.threshold.toFixed(3);
      $('[data-ms-threshold]').setAttribute('aria-valuetext', `MED ${state.threshold.toFixed(3)}`);
      all('[data-ms-cell]').forEach(button => {
        const [i, j] = button.dataset.msCell.split(',').map(Number), value = info.matrix[i][j];
        const selected = (i === state.edited && j === state.compared) || (j === state.edited && i === state.compared);
        button.textContent = value.toFixed(3);
        button.style.setProperty('--ms-amount', String(.04 + .17 * value / MAX_MED));
        button.setAttribute('aria-label', `${state.axes[i].id} and ${state.axes[j].id}: MED ${value.toFixed(3)}. Inspect this pair.`);
        button.setAttribute('aria-pressed', String(selected));
        button.tabIndex = i === state.edited && j === state.compared ? 0 : -1;
      });
      $('[data-ms-groups]').replaceChildren(...info.groups.map((group, index) => {
        const item = document.createElement('div'); item.className = 'ms-group';
        const label = document.createElement('span'); label.className = 'ms-meta'; label.textContent = `Group ${index + 1}`;
        const members = document.createElement('strong'); members.textContent = group.join(' · ');
        item.append(label, members); return item;
      }));
      const setLine = (line, v) => { const p = project(v), q = project(v.map(x => -x)); ['x1', 'y1', 'x2', 'y2'].forEach((attr, i) => line.setAttribute(attr, [q[0], q[1], p[0], p[1]][i])); return p; };
      const p = setLine(axisA, a.vector), q = setLine(axisB, b.vector);
      aTip.setAttribute('cx', p[0]); aTip.setAttribute('cy', p[1]); bTip.setAttribute('x', q[0] - 4.5); bTip.setAttribute('y', q[1] - 4.5);
      const alignedB = dot(a.vector, b.vector) < 0 ? b.vector.map(x => -x) : b.vector;
      const angle = degrees * TAU, sin = Math.sin(angle); let path = '';
      if (sin > EPS) for (let step = 0; step <= 24; step++) {
        const t = step / 24;
        const v = a.vector.map((x, i) => .46 * (Math.sin((1 - t) * angle) * x + Math.sin(t * angle) * alignedB[i]) / sin);
        const point = project(v); path += `${step ? 'L' : 'M'}${point[0].toFixed(3)},${point[1].toFixed(3)} `;
      }
      arc.setAttribute('d', path);
      legendA.textContent = `Axis ${a.id}`; legendB.textContent = `Axis ${b.id}`;
      desc.textContent = `Solid axis ${a.id} and dashed axis ${b.id} are two unoriented measurement axes. Their basis angle is ${degrees.toFixed(1)} degrees; MED is ${pairMed.toFixed(3)}. This is an orthographic Bloch-sphere view.`;
      root.dataset.med = String(pairMed); root.dataset.groups = String(info.groups.length);
      const signature = JSON.stringify(info);
      if (signature !== previous) {
        previous = signature;
        if (announce) $('[data-ms-result]').textContent = `${a.id} / ${b.id}: MED ${pairMed.toFixed(3)}. ${info.groups.length} ${info.groups.length === 1 ? 'group' : 'groups'} at this cutoff.`;
        root.dispatchEvent(new CustomEvent('measurementchange', { bubbles: true, detail: info }));
      }
      return info;
    }
    all('[data-ms-axis]').forEach(button => button.addEventListener('click', () => {
      state.edited = Number(button.dataset.msAxis); if (state.compared === state.edited) state.compared = (state.edited + 1) % state.axes.length; render();
    }));
    const updateAxis = () => { state.axes[state.edited] = prepareAxis({ id: state.axes[state.edited].id, polar: $('[data-ms-polar]').value, azimuth: $('[data-ms-azimuth]').value }); render(); };
    $('[data-ms-polar]').addEventListener('input', updateAxis); $('[data-ms-azimuth]').addEventListener('input', updateAxis);
    $('[data-ms-compare]').addEventListener('change', event => { state.compared = Number(event.target.value); render(); });
    $('[data-ms-threshold]').addEventListener('input', event => { state.threshold = MAX_MED * Number(event.target.value) / 1000; render(); });
    $('[data-ms-reverse]').addEventListener('click', () => { const a = state.axes[state.edited]; state.axes[state.edited] = prepareAxis({ id: a.id, polar: 180 - a.polar, azimuth: a.azimuth + 180 }); render(); });
    $('[data-ms-reset]').addEventListener('click', () => { state.axes = DEFAULTS.map(prepareAxis); state.edited = 0; state.compared = 1; state.threshold = .32; render(); });
    all('[data-ms-cell]').forEach(button => {
      button.addEventListener('click', () => { [state.edited, state.compared] = button.dataset.msCell.split(',').map(Number); render(); });
      button.addEventListener('keydown', event => {
        const moves = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
        if (!moves[event.key]) return;
        event.preventDefault(); const size = state.axes.length; let [i, j] = button.dataset.msCell.split(',').map(Number), [di, dj] = moves[event.key];
        do { i = (i + di + size) % size; j = (j + dj + size) % size; } while (i === j);
        all('[data-ms-cell]').forEach(cell => { cell.tabIndex = -1; });
        const next = $(`[data-ms-cell="${i},${j}"]`); next.tabIndex = 0; next.focus();
      });
    });
    const api = { getState: snapshot, render };
    instances.set(root, api); root.dataset.measurementReady = 'true'; render(false);
    return api;
  }
  function init(scope) {
    scope = scope || document;
    const roots = [...(scope.querySelectorAll ? scope.querySelectorAll('.measurement-study') : [])];
    if (scope.matches && scope.matches('.measurement-study')) roots.unshift(scope);
    return roots.map(root => instances.get(root) || build(root));
  }
  host.MeasurementAtlas = { init, getState: root => instances.get(root)?.getState() || null, math };
  host.initMeasurementStudies = init;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => init(document), { once: true });
  else init(document);
})(typeof window !== 'undefined' ? window : null);
