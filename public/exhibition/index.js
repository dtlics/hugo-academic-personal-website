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
  // Each label sits on the outward side of its own model, away from the
  // centre title, so it turns with the ring and never lands on a neighbour.
  // A label keeps its side until that side becomes blocked.
  const sides = new Map();
  function layout(next) {
    if (next) stations = next;
    const W = root.clientWidth, H = root.clientHeight, narrow = W <= 700;
    if (!W || !H) return;
    const origin = root.getBoundingClientRect();
    const rect = node => { const r = node.getBoundingClientRect(); return {left:r.left-origin.left,right:r.right-origin.left,top:r.top-origin.top,bottom:r.bottom-origin.top}; };
    const overlap = (a,b,pad=0) => Math.max(0,Math.min(a.right+pad,b.right)-Math.max(a.left-pad,b.left))*Math.max(0,Math.min(a.bottom+pad,b.bottom)-Math.max(a.top-pad,b.top));
    const panel = rect(q('.research-current')), top = rect(q('.research-overview__meta')).bottom+6, bottom = rect(q('.research-overview__controls')).top-6;
    const boxes = labels.map((_,i) => { const b = stations.find(s => s.index === i)?.bounds; return b ? {left:b.left*W,right:b.right*W,top:b.top*H,bottom:b.bottom*H} : null; });
    const centre = {x:(panel.left+panel.right)/2,y:(panel.top+panel.bottom)/2};
    const placed = [];
    const order = labels.map((_,i) => i).sort((a,b) => (sides.has(b)?1:0)-(sides.has(a)?1:0));
    for (const i of order) {
      const label = labels[i], w = label.offsetWidth, h = label.offsetHeight, box = boxes[i];
      if (!box) {
        const point = narrow ? phone[i] : fallback[i];
        label.style.left = (point[0]*100).toFixed(3)+'%'; label.style.top = (point[1]*100).toFixed(3)+'%';
        continue;
      }
      const cx = (box.left+box.right)/2, cy = (box.top+box.bottom)/2, gap = 10, outX = cx >= centre.x ? 1 : -1, outY = cy >= centre.y ? 1 : -1;
      const places = {
        above:[cx,box.top-gap-h/2], below:[cx,box.bottom+gap+h/2],
        outer:[outX>0?box.right+gap+w/2:box.left-gap-w/2,cy], inner:[outX>0?box.left-gap-w/2:box.right+gap+w/2,cy],
        corner:[outX>0?box.right-w/2:box.left+w/2,outY>0?box.bottom+gap+h/2:box.top-gap-h/2]
      };
      const preference = narrow ? ['above','below','outer','corner'] : outY < 0 ? ['above','outer','corner','below','inner'] : ['below','outer','corner','above','inner'];
      const test = name => {
        const [x0,y0] = places[name], x = Math.max(w/2+10,Math.min(W-w/2-10,x0)), y = Math.max(top+h/2,Math.min(Math.max(top+h/2,bottom-h/2),y0));
        const area = {left:x-w/2,right:x+w/2,top:y-h/2,bottom:y+h/2};
        let blocked = overlap(area,panel,8) > 0 || placed.some(other => overlap(area,other,6) > 0);
        boxes.forEach((other,j) => { if (other && overlap(area,other,j === i ? 0 : 4) > 0) blocked = true; });
        return {x,y,area,blocked,clamp:Math.hypot(x-x0,y-y0)};
      };
      let choice = null;
      const kept = sides.get(i);
      if (kept) { const t = test(kept); if (!t.blocked && t.clamp < 24) choice = {name:kept,...t}; }
      if (!choice) for (const name of preference) { const t = test(name); if (!t.blocked && t.clamp < 24) { choice = {name,...t}; break; } }
      if (!choice) {
        // Every side is blocked: take the place that covers the least.
        let best = null;
        for (const name of preference) { const t = test(name); let cost = overlap(t.area,panel,8)*3+t.clamp*20; for (const other of placed) cost += overlap(t.area,other,6)*4; boxes.forEach((other,j) => { if (other) cost += overlap(t.area,other,4)*(j === i ? 2 : 1); }); if (!best || cost < best.cost) best = {name,cost,...t}; }
        choice = best;
      }
      // A label that must change side fades to its new place instead of sweeping.
      if (kept && kept !== choice.name && label.animate) label.animate([{opacity:0},{opacity:1}],{duration:240,easing:'ease-out'});
      sides.set(i,choice.name); placed.push(choice.area);
      label.style.left = choice.x.toFixed(1)+'px'; label.style.top = choice.y.toFixed(1)+'px';
    }
  }
  function select(index) {
    if (index === active) return;
    active = index;
    labels.forEach((label,i) => label.dataset.active = String(index === i));
    q('[data-research-intro]').hidden = index >= 0;
    q('[data-research-detail]').hidden = index < 0;
    root.dataset.active = String(index);
    scene?.setView({overview:true,orbit,focus:index});
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
  document.addEventListener('keydown',event => { if (event.key === 'Escape' && active >= 0) clearSelection(); });
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
    target.addEventListener('lostpointercapture',event=>{if(event.target===target)finishPointer(event,true);});
    target.addEventListener('pointerleave',event=>{if(pointer&&!pointer.engaged)finishPointer(event,true);});
    target.addEventListener('click',event=>{
      if (!suppressedClicks.has(target)) return;
      suppressedClicks.delete(target);
      event.preventDefault();event.stopImmediatePropagation();
    });
  }
  const stationAt = event => { const box = host.getBoundingClientRect(), x = (event.clientX-box.left)/box.width, y = (event.clientY-box.top)/box.height; const hit = stations.filter(s => s.bounds && x >= s.bounds.left && x <= s.bounds.right && y >= s.bounds.top && y <= s.bounds.bottom).sort((a,b) => (a.bounds.right-a.bounds.left)-(b.bounds.right-b.bounds.left))[0]; return hit ? hit.index : -1; };
  host.addEventListener('click',event=>{const i=stationAt(event);if(i>=0)location.href=works[i].page;else select(-1);});
  host.addEventListener('pointermove',event=>{if(pointer?.engaged||event.pointerType==='touch')return;const i=stationAt(event);host.style.cursor=i>=0?'pointer':'';if(i>=0)select(i);});
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
  const hash=decodeURIComponent(location.hash.slice(1));const selected=works.findIndex(work=>work.id===hash);if(selected>=0){select(selected);requestAnimationFrame(()=>scrollTo({top:0,behavior:'instant'}));}
})();
