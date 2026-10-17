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
  // Each label sits beside its own model: above it if there is room, else to a
  // side or below, never on another model, another label or the centre text.
  function layout(next) {
    if (next) stations = next;
    const W = root.clientWidth, H = root.clientHeight, narrow = W <= 700;
    if (!W || !H) return;
    const origin = root.getBoundingClientRect();
    const rect = node => { const r = node.getBoundingClientRect(); return {left:r.left-origin.left,right:r.right-origin.left,top:r.top-origin.top,bottom:r.bottom-origin.top}; };
    const overlap = (a,b,pad=0) => Math.max(0,Math.min(a.right+pad,b.right)-Math.max(a.left-pad,b.left))*Math.max(0,Math.min(a.bottom+pad,b.bottom)-Math.max(a.top-pad,b.top));
    const panel = rect(q('.research-current')), top = rect(q('.research-overview__meta')).bottom+6, bottom = rect(q('.research-overview__controls')).top-6;
    const boxes = labels.map((_,i) => { const b = stations.find(s => s.index === i)?.bounds; return b ? {left:b.left*W,right:b.right*W,top:b.top*H,bottom:b.bottom*H} : null; });
    const placed = [];
    labels.forEach((label,i) => {
      const w = label.offsetWidth, h = label.offsetHeight, box = boxes[i];
      if (!box) {
        const point = narrow ? phone[i] : fallback[i];
        label.style.left = (point[0]*100).toFixed(3)+'%'; label.style.top = (point[1]*100).toFixed(3)+'%';
        return;
      }
      const cx = (box.left+box.right)/2, cy = (box.top+box.bottom)/2, gap = 8;
      const candidates = [[cx,box.top-gap-h/2],[box.left+w/2,box.top-gap-h/2],[box.right-w/2,box.top-gap-h/2],[box.left-gap-w/2,cy],[box.right+gap+w/2,cy],[cx,box.bottom+gap+h/2]];
      let best = null;
      candidates.forEach(([x0,y0],k) => {
        const x = clamp(x0,w/2+10,W-w/2-10), y = clamp(y0,top+h/2,Math.max(top+h/2,bottom-h/2));
        const area = {left:x-w/2,right:x+w/2,top:y-h/2,bottom:y+h/2};
        let score = k*30+Math.hypot(x-x0,y-y0)*2;
        boxes.forEach((other,j) => { if (other) score += overlap(area,other,4)*(j===i?2:1.4); });
        placed.forEach(other => { score += overlap(area,other,10)*8; });
        score += overlap(area,panel,12)*8;
        if (!best || score < best.score) best = {x,y,area,score};
      });
      placed.push(best.area);
      label.style.left = best.x.toFixed(1)+'px'; label.style.top = best.y.toFixed(1)+'px';
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
