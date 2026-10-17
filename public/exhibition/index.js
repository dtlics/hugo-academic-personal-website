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
  let orbit = 0, active = -1, scene = null, stations = [], pointer = null, returningFocus = false;
  const suppressedClicks = new WeakSet();
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
    range.setAttribute('aria-valuenow',String(Math.round(orbit)));
    range.setAttribute('aria-valuetext',Math.abs(orbit)<.5?'Centred':`${Math.round(Math.abs(orbit))} degrees ${orbit<0?'left':'right'}`);
    range.querySelector('[aria-hidden]')?.style.setProperty('transform',`rotate(${orbit*2}deg)`);
    scene?.setView({overview:true,orbit});
    if (scene?.getState) layout(scene.getState().stations);
  }
  function clearSelection() {
    const returnTo = labels[active];
    const focusWillHide = q('[data-research-detail]').contains(document.activeElement);
    select(-1);
    if (returnTo && focusWillHide) {
      returningFocus = true;
      try { returnTo.focus({preventScroll:true}); }
      finally { returningFocus = false; }
    }
  }
  labels.forEach((label,i) => {
    label.addEventListener('pointerenter',event => { if (event.pointerType !== 'touch') select(i); });
    label.addEventListener('focus',() => { if (!returningFocus) select(i); });
  });
  q('[data-research-clear]').addEventListener('click',clearSelection);
  root.addEventListener('keydown',event => { if (event.key === 'Escape') clearSelection(); });
  range.addEventListener('keydown',event => {
    if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown','Home','End'].includes(event.key)){
      event.preventDefault();turn(event.key==='Home'?-35:event.key==='End'?35:orbit+(['ArrowRight','ArrowUp'].includes(event.key)?3:-3));
    }
  });
  q('[data-research-reset]').addEventListener('click',()=>turn(0));
  function finishPointer(event,abort=false) {
    if (!pointer || event.pointerId!==pointer.id) return;
    const finished=pointer;
    pointer=null;
    root.dataset.turning='false';
    if (finished.engaged) suppressedClicks.add(finished.target);
    if (finished.target.hasPointerCapture?.(finished.id)) finished.target.releasePointerCapture(finished.id);
  }
  for (const target of [host,range]) {
    target.addEventListener('pointerdown',event => {
      if (event.button!==0||event.isPrimary===false||pointer) return;
      suppressedClicks.delete(target);
      pointer={id:event.pointerId,x:event.clientX,y:event.clientY,start:orbit,target,touch:event.pointerType==='touch',engaged:false};
    });
    target.addEventListener('pointermove',event => {
      if (!pointer||event.pointerId!==pointer.id||pointer.target!==target) return;
      const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
      if (!pointer.engaged) {
        if (pointer.touch&&Math.abs(dy)>6&&Math.abs(dy)>Math.abs(dx)) {finishPointer(event,true);return;}
        if (Math.abs(dx)<=5||Math.abs(dx)<=Math.abs(dy)*1.15) return;
        pointer.engaged=true;
        root.dataset.turning='true';
        target.setPointerCapture?.(event.pointerId);
      }
      if (event.cancelable) event.preventDefault();
      turn(pointer.start+dx/Math.max(160,root.clientWidth)*100);
    });
    target.addEventListener('pointerup',event=>finishPointer(event));
    target.addEventListener('pointercancel',event=>finishPointer(event,true));
    target.addEventListener('lostpointercapture',event=>finishPointer(event,true));
    target.addEventListener('pointerleave',event=>{if(pointer&&!pointer.engaged)finishPointer(event,true);});
    target.addEventListener('click',event=>{
      if (!suppressedClicks.has(target)) return;
      suppressedClicks.delete(target);
      event.preventDefault();event.stopImmediatePropagation();
    });
  }
  host.addEventListener('click',()=>select(-1));
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
  window.addEventListener('blur',()=>{if(pointer)finishPointer({pointerId:pointer.id},true);});
  window.addEventListener('pagehide',event => {if(pointer)finishPointer({pointerId:pointer.id},true);if(!event.persisted){observer.disconnect();scene?.destroy?.();}});
  window.addEventListener('pageshow',event => {if(event.persisted){scene?.resize?.();scene?.setView?.({overview:true,orbit});layout(scene?.getState?.().stations);}});
  const hash=decodeURIComponent(location.hash.slice(1));const selected=works.findIndex(work=>work.id===hash);if(selected>=0)select(selected);
})();
