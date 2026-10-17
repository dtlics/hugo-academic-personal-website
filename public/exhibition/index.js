(() => {
  'use strict';
  const root = document.querySelector('[data-research-overview]');
  if (!root) return;
  const q = selector => root.querySelector(selector);
  const host = q('[data-research-scene]');
  const labels = Array.from(root.querySelectorAll('[data-research-label]'));
  const works = JSON.parse(q('[data-research-data]').textContent);
  const range = q('[data-research-orbit]');
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const phone = [[.28,.13],[.75,.27],[.25,.34],[.76,.70],[.25,.81],[.72,.92]];
  const fallback = [[.19,.19],[.71,.13],[.88,.50],[.72,.84],[.24,.84],[.10,.53]];
  let orbit = 0, active = -1, scene = null, stations = [], pointer = null, lastDrag = false;
  function layout(next) {
    if (next) stations = next;
    const narrow = root.clientWidth <= 700;
    labels.forEach((label,i) => {
      const station = stations.find(s => s.index === i);
      const projected = station?.labelProjected || station?.projected;
      let point = projected || (narrow ? {x:phone[i][0],y:phone[i][1]} : {x:fallback[i][0],y:fallback[i][1]});
      let x = point.x, y = point.y;
      if (projected) x += (x < .5 ? -.012 : .012);
      const half = Math.min(105,root.clientWidth*.105) / root.clientWidth;
      x = clamp(x,narrow?.23:half+.025,narrow?.77:1-half-.025);
      y = clamp(y,narrow?.30:.12,narrow?.94:.88);
      label.style.left = (x*100).toFixed(3)+'%';
      label.style.top = (y*100).toFixed(3)+'%';
    });
  }
  function select(index) {
    if (index === active) return;
    active = index;
    labels.forEach((label,i) => label.dataset.active = String(index === i));
    q('[data-research-intro]').hidden = index >= 0;
    q('[data-research-detail]').hidden = index < 0;
    root.dataset.active = String(index);
    if (index < 0) return;
    const work = works[index];
    q('[data-research-headline]').replaceChildren(...work.headline.map(line => { const span=document.createElement('span');span.textContent=line;return span; }));
    q('[data-research-page]').href = work.page;
    q('[data-research-source]').href = work.source;
    q('[data-research-source]').textContent = work.status === 'Preprint' ? 'Preprint ↗' : 'Paper ↗';
  }
  function turn(value) {
    orbit = clamp(Number(value)||0,-35,35);
    range.value = String(Math.round(orbit));
    scene?.setView({overview:true,orbit});
    if (scene?.getState) layout(scene.getState().stations);
  }
  labels.forEach((label,i) => {
    label.addEventListener('pointerenter',event => { if (event.pointerType !== 'touch') select(i); });
    label.addEventListener('focus',() => select(i));
  });
  q('[data-research-clear]').addEventListener('click',() => select(-1));
  root.addEventListener('keydown',event => { if (event.key === 'Escape') select(-1); });
  range.addEventListener('input',event => turn(event.target.value));
  host.addEventListener('pointerdown',event => { if (event.button !== 0) return;pointer={id:event.pointerId,x:event.clientX,start:orbit};lastDrag=false;host.setPointerCapture?.(event.pointerId); });
  host.addEventListener('pointermove',event => { if (!pointer || event.pointerId !== pointer.id) return;const delta=event.clientX-pointer.x;if(Math.abs(delta)>5)lastDrag=true;if(lastDrag)turn(pointer.start+delta/root.clientWidth*100); });
  const end = () => {pointer=null;};
  host.addEventListener('pointerup',end);host.addEventListener('pointercancel',end);
  host.addEventListener('click',() => {if(lastDrag){lastDrag=false;return;}select(-1);});
  root.addEventListener('exhibitionscenedraw',event => {root.dataset.ready=String(Boolean(event.detail.ready));layout(event.detail.stations);});
  try {
    const source=window.ROUTE_SOURCE,compiler=window.RouteCompiler;
    if (source && compiler && window.createExhibitionScene) {
      const compiled=compiler.compile(source.fixtures[0].perm,source.gammaLayers);
      scene=window.createExhibitionScene(host,{compiled,initial:source.fixtures[0].witnessBits,overview:true,orbit:0});
      scene?.setView({overview:true,orbit:0});
      root.dataset.ready=String(Boolean(scene?.getState?.().ready));
      layout(scene?.getState?.().stations);
    } else layout();
  } catch {root.dataset.ready='false';layout();}
  const observer = new ResizeObserver(() => {scene?.resize?.();layout(scene?.getState?.().stations);});
  observer.observe(root);
  window.addEventListener('pagehide',event => {if(!event.persisted){observer.disconnect();scene?.destroy?.();}});
  window.addEventListener('pageshow',event => {if(event.persisted){scene?.resize?.();scene?.setView?.({overview:true,orbit});layout(scene?.getState?.().stations);}});
  const hash=decodeURIComponent(location.hash.slice(1));const selected=works.findIndex(work=>work.id===hash);if(selected>=0)select(selected);
})();
