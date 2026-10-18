/* Two-basis study. Original code-native graphic; no remote assets or idle loop.
   Exact restricted model: noiseless projective measurements of one qubit.
   Ring normals are the two Bloch axes. The ring bodies are an authored visual
   metaphor, not a physical apparatus. Opposite axes specify the same basis. */
(function (global) {
  'use strict';
  const RAD = Math.PI / 180;
  const MAX = Math.SQRT1_2;
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, Number(x) || 0));
  const add = (a, b) => a.map((x, i) => x + b[i]);
  const scale = (a, k) => a.map(x => x * k);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const unit = a => { const l = Math.hypot(...a); if (!Number.isFinite(l) || l < 1e-12) throw new Error('Axis must be finite and nonzero.'); return scale(a, 1 / l); };
  const clean = x => Math.abs(x) < 1e-12 ? 0 : x;
  const axis = angle => [Math.cos(angle * RAD), Math.sin(angle * RAD), 0].map(clean);
  const med = (n, m) => clean(Math.min(MAX, Math.hypot(...cross(unit(n), unit(m))) / Math.SQRT2));
  const math = { axis, med, max: MAX };
  if (typeof module !== 'undefined' && module.exports) module.exports = math;
  if (!global || typeof document === 'undefined') return;
  const NS = 'http://www.w3.org/2000/svg';
  let serial = 0;
  const RIGHT = [.780869, -.624695, 0];
  const UP = [-.331295, -.414119, .848048];
  const DEPTH = cross(RIGHT, UP);
  const LIGHT = unit([-.6, -1, 2.2]);
  const VIEW = { width: 600, height: 450, x: 300, y: 214, scale: 168 };
  function node(tag, attrs, text) {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) => el.setAttribute(k, String(v)));
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function project(p) { return [VIEW.x + dot(p, RIGHT) * VIEW.scale, VIEW.y - dot(p, UP) * VIEW.scale]; }
  function colour(base, normal, edge) {
    const amount = .68 + .28 * Math.max(0, dot(unit(normal), LIGHT));
    return '#' + base.map(x => Math.round(x * amount + (edge ? 0 : 8)).toString(16).padStart(2, '0')).join('');
  }
  function ring(normal, material, ro, ri) {
    const tangent = [-normal[1], normal[0], 0], vertical = [0, 0, 1];
    const origin = [0, 0, 0];
    const point = (radius, angle, depth) => add(origin, add(scale(normal, depth), add(scale(tangent, radius * Math.cos(angle)), scale(vertical, radius * Math.sin(angle)))));
    const faces = [], count = 72, half = .095;
    const face = (points, n, edge) => faces.push({ points, depth: points.reduce((s, p) => s + dot(p, DEPTH), 0) / points.length, fill: colour(material, n, edge) });
    for (let i = 0; i < count; i++) {
      const a = i / count * Math.PI * 2, b = (i + 1) / count * Math.PI * 2, mid = (a + b) / 2;
      const radial = add(scale(tangent, Math.cos(mid)), scale(vertical, Math.sin(mid)));
      face([point(ro, a, half), point(ro, b, half), point(ri, b, half), point(ri, a, half)], normal, false);
      face([point(ro, b, -half), point(ro, a, -half), point(ri, a, -half), point(ri, b, -half)], scale(normal, -1), false);
      face([point(ro, a, -half), point(ro, b, -half), point(ro, b, half), point(ro, a, half)], radial, true);
      face([point(ri, b, -half), point(ri, a, -half), point(ri, a, half), point(ri, b, half)], scale(radial, -1), true);
    }
    return faces;
  }
  function path(points) { return points.map((p, i) => (i ? 'L' : 'M') + project(p).map(x => x.toFixed(2)).join(',')).join(' ') + 'Z'; }
  function createMeasurementObject(host, options) {
    if (!host || !host.appendChild) throw new Error('A host element is required.');
    options = options || {};
    const id = 'two-basis-' + (++serial);
    const initial = Number.isFinite(Number(options.angle)) ? clamp(options.angle, 0, 180) : 52;
    let angle = initial, destroyed = false, dragging = false, pointerId = null;
    const state = () => {
      const axisA = [1, 0, 0], axisB = axis(angle), value = med(axisA, axisB);
      return { angle, med: value, disturbanceProbability: value * value, axisA, axisB, axes: [axisA.slice(), axisB.slice()], scope: 'two noiseless projective qubit measurements' };
    };
    const root = document.createElement('section');
    root.className = 'measurement-object';
    root.setAttribute('aria-label', 'Two-basis study');
    root.innerHTML = `<div class="mo-stage"><svg viewBox="0 0 600 450" aria-hidden="true" class="mo-svg"><g data-mo-track></g><g data-mo-bodies></g><g data-mo-axes></g></svg><span class="mo-axis-label" data-mo-a>A</span><button type="button" class="mo-handle" role="slider" aria-label="Turn measurement basis B" aria-valuemin="0" aria-valuemax="180" aria-orientation="horizontal" aria-describedby="${id}-help"><span>B</span></button><div class="mo-readout"><span>MED <span class="mo-readout-scope">/ two bases</span></span><output data-mo-value>0.000</output></div></div><div class="mo-controls"><label for="${id}-angle">Angle between axes <output data-mo-angle>52°</output></label><input id="${id}-angle" type="range" min="0" max="180" step="1" value="${initial}" aria-describedby="${id}-help"><div class="mo-presets"><button type="button" data-mo-set="0">Same basis</button><button type="button" data-mo-set="90">Most distinct</button><button type="button" data-mo-set="180">Reverse axis</button></div></div><p class="mo-help" id="${id}-help">Drag B to turn its axis. The ring normals show the two measurement axes.</p><p class="mo-scope">Exact qubit model · MED is not a probability. A reversed axis gives the same basis.</p>`;
    if (options.controls === false) root.classList.add('mo-no-controls');
    if (options.showReadout === false) root.classList.add('mo-no-readout');
    if (options.showNotes === false) root.classList.add('mo-no-notes');
    if (options.fit === true) root.classList.add('mo-fit');
    host.appendChild(root);
    const stage = root.querySelector('.mo-stage'), handle = root.querySelector('.mo-handle');
    const bodies = root.querySelector('[data-mo-bodies]'), axes = root.querySelector('[data-mo-axes]');
    const track = root.querySelector('[data-mo-track]'), fixedLabel = root.querySelector('[data-mo-a]');
    const range = root.querySelector('input'), value = root.querySelector('[data-mo-value]'), angleValue = root.querySelector('[data-mo-angle]');
    const segments = [];
    for (let a = 0; a <= 180; a += 3) segments.push(project(scale(axis(a), 1.82)));
    track.appendChild(node('path', { d: segments.map((p, i) => (i ? 'L' : 'M') + p.join(',')).join(' '), class: 'mo-turn-track' }));
    function position(label, p) {
      const rect = stage.getBoundingClientRect(), fit = Math.min(rect.width / VIEW.width, rect.height / VIEW.height);
      label.style.left = ((rect.width - VIEW.width * fit) / 2 + p[0] * fit) + 'px';
      label.style.top = ((rect.height - VIEW.height * fit) / 2 + p[1] * fit) + 'px';
    }
    function render() {
      if (destroyed) return;
      const moving = axis(angle), current = state();
      const all = ring([1, 0, 0], [118, 151, 126], 1.35, 1.02).concat(ring(moving, [211, 170, 179], .94, .57));
      all.sort((a, b) => a.depth - b.depth);
      const fragment = document.createDocumentFragment();
      all.forEach(face => fragment.appendChild(node('path', { d: path(face.points), fill: face.fill, stroke: face.fill, 'stroke-width': '.6', 'stroke-linejoin': 'round' })));
      bodies.replaceChildren(fragment);
      axes.replaceChildren();
      const base = project([0, 0, 0]), fixed = project(scale([1, 0, 0], 1.82)), move = project(scale(moving, 1.82));
      [[fixed, 'mo-fixed-axis'], [move, 'mo-moving-axis']].forEach(([p, cls]) => axes.appendChild(node('path', { d: `M${base.join(',')}L${p.join(',')}`, class: cls })));
      axes.appendChild(node('circle', { cx: base[0], cy: base[1], r: 3.2, class: 'mo-origin' }));
      position(fixedLabel, fixed); position(handle, move);
      const formatted = angle.toFixed(Number.isInteger(angle) ? 0 : 1) + '°';
      const coincident = Math.abs(angle) <= .05;
      fixedLabel.hidden = coincident;
      handle.querySelector('span').textContent = coincident ? 'A / B' : 'B';
      handle.classList.toggle('mo-coincident', coincident);
      range.value = String(angle); value.textContent = current.med.toFixed(3); angleValue.textContent = formatted;
      handle.setAttribute('aria-valuenow', String(angle));
      handle.setAttribute('aria-valuetext', `${angle.toFixed(Number.isInteger(angle) ? 0 : 1)} degrees; ${coincident ? 'coincident axes A and B; same unordered basis; ' : Math.abs(current.med) < 1e-10 ? 'same unordered basis; ' : ''}MED ${current.med.toFixed(6)}`);
      root.dataset.angle = String(angle); root.dataset.med = current.med.toFixed(9);
    }
    function update(next, reason) {
      if (destroyed) return;
      angle = Math.round(clamp(next, 0, 180) * 10) / 10;
      render();
      host.dispatchEvent(new CustomEvent('measurementobjectchange', { bubbles: true, detail: { ...state(), reason: reason || 'api' } }));
    }
    function eventAngle(event) {
      const rect = stage.getBoundingClientRect();
      const fit = Math.min(rect.width / VIEW.width, rect.height / VIEW.height);
      const x = (event.clientX - rect.left - (rect.width - VIEW.width * fit) / 2) / fit - VIEW.x;
      const y = VIEW.y - (event.clientY - rect.top - (rect.height - VIEW.height * fit) / 2) / fit;
      const determinant = RIGHT[0] * UP[1] - RIGHT[1] * UP[0];
      const vx = (x * UP[1] - RIGHT[1] * y) / determinant;
      const vy = (RIGHT[0] * y - x * UP[0]) / determinant;
      let next = Math.atan2(vy, vx) / RAD;
      if (next < 0) next = Math.abs(next) < 90 ? 0 : 180;
      return clamp(next, 0, 180);
    }
    function pointerDown(event) {
      if (event.button !== 0 && event.pointerType !== 'touch') return;
      dragging = true; pointerId = event.pointerId; handle.focus({ preventScroll: true }); handle.setPointerCapture(pointerId); root.classList.add('mo-is-dragging'); event.preventDefault();
    }
    function pointerMove(event) { if (dragging && event.pointerId === pointerId) update(eventAngle(event), 'drag'); }
    function pointerEnd(event) { if (pointerId !== event.pointerId) return; dragging = false; pointerId = null; root.classList.remove('mo-is-dragging'); }
    function keyDown(event) {
      const shifts = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1, PageUp: 10, PageDown: -10 };
      if (event.key in shifts) { event.preventDefault(); update(angle + shifts[event.key] * (event.shiftKey ? 10 : 1), 'keyboard'); }
      else if (event.key === 'Home' || event.key === 'End') { event.preventDefault(); update(event.key === 'Home' ? 0 : 180, 'keyboard'); }
    }
    function input() { update(range.value, 'range'); }
    function click(event) { const button = event.target.closest('[data-mo-set]'); if (button && root.contains(button)) update(button.dataset.moSet, 'preset'); }
    handle.addEventListener('pointerdown', pointerDown); handle.addEventListener('pointermove', pointerMove);
    handle.addEventListener('pointerup', pointerEnd); handle.addEventListener('pointercancel', pointerEnd); handle.addEventListener('lostpointercapture', pointerEnd);
    handle.addEventListener('keydown', keyDown); range.addEventListener('input', input); root.addEventListener('click', click);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(render) : null;
    if (observer) observer.observe(stage);
    render();
    return { getState: () => state(), setState: next => { if (next && Number.isFinite(Number(next.angle))) update(next.angle, 'api'); }, resize: render, destroy() { destroyed = true; dragging = false; if (observer) observer.disconnect(); root.remove(); } };
  }
  global.MeasurementObjectMath = math;
  global.createMeasurementObject = createMeasurementObject;
})(typeof window === 'undefined' ? null : window);
