/* Native scroll changes the viewpoint. Only explicit controls change science. */
(() => {
  'use strict';
  const root=document.querySelector('[data-exhibition]');if(!root)return;
  const q=s=>root.querySelector(s),world=q('.exhibition-world'),track=q('.exhibition-track'),sceneHost=q('[data-scene]');
  const stories=Array.from(root.querySelectorAll('[data-story]')),coda=root.querySelector('[data-coda]'),count=stories.length;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)},step=(p,a,b)=>ease((p-a)/(b-a));
  const compiled=window.ROUTE_SOURCE&&window.RouteCompiler?.compile(window.ROUTE_SOURCE.fixtures[0].perm,window.ROUTE_SOURCE.gammaLayers);
  const scene=compiled&&window.createExhibitionScene?.(q('[data-scene]'),{compiled,initial:window.ROUTE_SOURCE.fixtures[0].witnessBits});
  const controls=scene&&window.createStudyControls?.(q('[data-scene]'),scene,{visible:false});
  if(!scene)root.classList.add('no-scene');root.classList.add('is-ready');
  let raf=0,phase=0,current=0,viewportHeight=0;
  function pose(el,x,y,scale){el.style.transform=`translate3d(${x.toFixed(2)}px,${y.toFixed(2)}px,0) scale(${scale.toFixed(4)})`;}
  // Name metrics in unscaled pixels of the name block, from the real type.
  let metricsCache=null;
  function identityMetrics(){
    const name=q('[data-name]'),h1=name.querySelector('h1'),style=getComputedStyle(h1),key=[innerWidth,innerHeight,style.fontSize,document.fonts?.status].join(':');
    if(metricsCache?.key===key)return metricsCache;
    const box=name.getBoundingClientRect(),s=box.width/Math.max(1,name.offsetWidth)||1,range=document.createRange(),rect=node=>{range.selectNodeContents(node);return range.getBoundingClientRect();};
    const first=rect(h1.querySelector('.name-first')),last=rect(h1.querySelector('.name-last')),whole=rect(h1);
    const ctx=document.createElement('canvas').getContext('2d');ctx.font=`${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;if('letterSpacing'in ctx)ctx.letterSpacing=style.letterSpacing;
    const li=ctx.measureText('Li'),dantong=ctx.measureText('Dantong'),ascent=li.fontBoundingBoxAscent||parseFloat(style.fontSize)*.95;
    const lastLeft=(last.left-box.left)/s,lastTop=(last.top-box.top)/s,firstLeft=(first.left-box.left)/s,firstTop=(first.top-box.top)/s;
    metricsCache={key,fontSize:parseFloat(style.fontSize),firstBaseline:firstTop+ascent,firstWidth:first.width/s,wholeWidth:whole.width/s,liLeft:lastLeft-li.actualBoundingBoxLeft,liRight:lastLeft+li.actualBoundingBoxRight,liCapTop:lastTop+ascent-li.actualBoundingBoxAscent,liBaseline:lastTop+ascent,firstRight:firstLeft+dantong.actualBoundingBoxRight,firstCapTop:firstTop+ascent-dantong.actualBoundingBoxAscent,firstDescent:firstTop+ascent+dantong.actualBoundingBoxDescent};
    return metricsCache;
  }
  let notchKey='';
  function setNotch(width,height){const key=`${width.toFixed(1)}:${height.toFixed(1)}`;if(key===notchKey)return;notchKey=key;const x=(width*1000).toFixed(1),y=(height*1000).toFixed(1);q('#portrait-cut path')?.setAttribute('d',width>0?`M${x} 0H1000V1000H0V${y}H${x}Z`:'M0 0H1000V1000H0Z');}
  function render(){
    raf=0;const height=innerHeight,w=world.clientWidth,h=world.clientHeight;if(!w||!h)return;
    const start=scrollY+track.getBoundingClientRect().top;phase=clamp((scrollY-start)/height,0,12.5);
    const narrow=innerWidth<=560,shortPhone=narrow&&height<=700,tinyPhone=narrow&&height<=620,side=!narrow&&innerWidth>=900&&height<=760&&innerWidth/height>=1.55,arrival=reduced.matches?0:step(phase,0,1.0);
    // Wide, short screens read the story as a column; the model keeps the full height beside it.
    root.dataset.layout=side?'side':narrow?'phone':'stage';
    const photo=q('[data-photo]'),name=q('[data-name]'),profile=q('.exhibition-profile'),natural=photo.offsetWidth||1,m=identityMetrics();
    let nameScale=1;
    if(narrow){
      // Phone: a compact identity row. The portrait docks top left, the name
      // beside it, and the story keeps the rest of the screen.
      const nameMove=reduced.matches?0:step(phase,0,.55),photoMove=reduced.matches?0:step(phase,.22,1.0),sizeMove=reduced.matches?0:step(phase,.12,.78);
      const photoStart=Math.max(.29,(h*.05+Math.min(innerWidth*.1624,62)+100)/h)*h,dockSize=clamp(w*.22,tinyPhone?54:shortPhone?60:70,92),dockTop=h*(shortPhone?.012:.02),nameLeft=w*.03+dockSize+14,nameDock=Math.min(.6,(w-nameLeft-6)/Math.max(1,m.wholeWidth));
      setNotch(0,0);
      pose(photo,mix(w*.25,w*.03,photoMove),mix(photoStart,dockTop,photoMove),mix(1,dockSize/natural,sizeMove));
      nameScale=mix(1,nameDock,nameMove);pose(name,mix(w*.03,nameLeft,nameMove),mix(h*.05,dockTop+2,nameMove),nameScale);
      q('.exhibition-stories').style.top=`${(dockTop+dockSize+14).toFixed(1)}px`;
    }else{q('.exhibition-stories').style.removeProperty('top');
      // Name and photograph move as one mark. The cut always holds a glyph of
      // the name: the end of "Dantong" at the opening, "Li" when docked; between
      // the two the photograph slides beneath the name on the same curve.
      const move=reduced.matches?0:step(phase,0,.94),nameDock=side?.34:.38,descent=Math.max(m.firstDescent,m.firstBaseline+.23*m.fontSize);
      nameScale=mix(1,nameDock,move);const sNow=nameScale,nameX=mix(.03*w,.035*w,move),nameY=mix(.14*h,.025*h,move);
      // Docked geometry: the cut fits "Li"; the photograph's top edge clears the descender; its width is the width of "Dantong".
      const dX=.035*w,dY=.025*h,dLiLeft=dX+m.liLeft*nameDock,dLiRight=dX+m.liRight*nameDock,dBase=dY+m.liBaseline*nameDock,dTop=Math.max(dY+m.liCapTop*nameDock-2,dY+descent*nameDock+9),room=h-dTop-profile.offsetHeight-34,dockSize=clamp(Math.min(m.firstWidth*nameDock,room),110,w*.26);
      const notchW=(dLiRight-dLiLeft+14)/dockSize,notchH=(dBase-dTop+10)/dockSize;setNotch(notchW,notchH);
      const openSize=Math.min(natural,h*.84,(h-20-(.14*h+descent))/Math.max(.2,1-notchH)),size=mix(openSize,dockSize,move);
      // Two anchors measured on the name as it is drawn now.
      const gX=nameX+m.firstRight*sNow+8-notchW*size,gY=nameY+descent*sNow+8-notchH*size,liX=nameX+m.liLeft*sNow,liY=Math.max(nameY+m.liCapTop*sNow-2,nameY+descent*sNow+9);
      pose(photo,mix(gX,liX,move),mix(gY,liY,move),size/natural);pose(name,nameX,nameY,nameScale);
      profile.style.top=`${mix(h*.7,dTop+dockSize+20,arrival).toFixed(1)}px`;profile.style.left=`${mix(.04*w,dLiLeft,arrival).toFixed(1)}px`;
    }
    q('[data-name] .mono').style.fontSize=(11/nameScale).toFixed(2)+'px';
    // Phone: the full role fades as the identity docks; a short role returns under the name.
    const role=q('.name-role');role.style.fontSize=(10/nameScale).toFixed(2)+'px';role.style.opacity=narrow&&!reduced.matches?step(phase,.7,1).toFixed(3):'0';
    if(narrow&&!reduced.matches)profile.style.opacity=String(1-step(phase,0,.22));
    profile.hidden=narrow&&phase>.22&&!reduced.matches;if(!narrow)profile.style.opacity=String(phase<.42?1-step(phase,.1,.4):step(phase,.74,.99));
    if(narrow)profile.style.removeProperty('top'),profile.style.removeProperty('left');
    const position=clamp((phase-1.1)/1.65,0,count-1),at=Math.floor(position),fraction=position-at;
    // Reserve the full reading space before fitting the sculpture.
    const readingSpace=q('.exhibition-stories').offsetTop+Math.max(...stories.map(story=>story.offsetHeight))+16;
    // The canvas runs edge to edge; positions are measured in its own pixels.
    const sceneTop=0,field=sceneHost.getBoundingClientRect(),readRight=side?inkRight()-field.left+32:0,readLeft=q('.exhibition-stories').getBoundingClientRect().left-field.left;
    const identityRight=Math.max(...['[data-photo] .exhibition-photo','[data-name] h1','.exhibition-profile'].map(s=>{const r=q(s).getBoundingClientRect();return r.width?r.right:0;}))-field.left;
    sceneHost.style.top=`${sceneTop}px`;
    // The readout and hint share the story's left edge (or the band's, beside a story column).
    sceneHost.style.setProperty('--read-left',`${(narrow?Math.max(18,readLeft):side?readRight:readLeft).toFixed(1)}px`);
    const captionHeight=sceneHost.querySelector('.study-caption')?.offsetHeight||0;
    const identityBottom=Math.max(...['[data-photo] .exhibition-photo','.exhibition-profile'].map(s=>{const r=q(s).getBoundingClientRect();return r.height&&!q(s).hidden?r.bottom:0;}))-field.top;
    scene?.setView({layout:{caption:captionHeight,identityBottom:Math.round(identityBottom),mode:side?'side':narrow?'phone':'stage',readTop:side?0:readingSpace-sceneTop-field.top+world.getBoundingClientRect().top,readLeft,readRight,identityRight:Math.round(identityRight)}});
    // A reading pause, then a shared eased move; no hard chapter cuts. After
    // the last reading pause the works gather into one trail: a coda, not a cut.
    const close=reduced.matches?0:step(phase,10.3,10.95),cameraPosition=at+step(fraction,.60,1);scene?.setView({arrival,travel:cameraPosition/(count-1),coda:close});current=Math.min(count-1,Math.floor(position+.22));
    let active=-1;
    // Words leave as the works begin to move and the next words arrive while
    // the next work comes forward: the stage is never left without either.
    stories.forEach((story,i)=>{const delta=position-i,entry=i===0?step(phase,.9,1.15):step(delta,-.26,-.12),leave=i===count-1?step(phase,10.25,10.45):step(delta,.56,.7),alpha=reduced.matches?0:entry*(1-leave);story.style.opacity=alpha.toFixed(4);story.style.visibility=alpha>.005?'visible':'hidden';story.style.transform=`translate3d(0,${((1-entry)*24-leave*20).toFixed(2)}px,0)`;story.style.filter=alpha>.995?'':`blur(${((1-alpha)*3).toFixed(2)}px)`;const visible=alpha>.55;story.inert=!visible;story.setAttribute('aria-hidden',String(!visible));if(visible)active=i;});
    const codaAlpha=reduced.matches?0:step(phase,10.5,10.75);coda.style.opacity=codaAlpha.toFixed(4);coda.style.visibility=codaAlpha>.005?'visible':'hidden';coda.style.transform=`translate3d(0,${((1-codaAlpha)*24).toFixed(2)}px,0)`;coda.inert=codaAlpha<.55;coda.setAttribute('aria-hidden',String(codaAlpha<.55));
    // A study's labels and controls appear once its work has settled and leave
    // before it moves; they fade rather than switch.
    const settledIn=step(phase,1.1+1.65*at,1.24+1.65*at),leaving=at===count-1?step(phase,10.15,10.27):step(fraction,.48,.58),presence=reduced.matches?0:Math.min(settledIn,1-leaving);
    root.style.setProperty('--presence',presence.toFixed(3));
    controls?.setVisible(presence>.01&&!reduced.matches&&phase<=10.3,presence);
    q('[data-current-label]').textContent=phase<1.1?'00 / Identity and practice':phase>=10.5?'Six works / 2023–2026':`${String(current+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;
    const cueText=phase<.6?'Scroll to begin the research ↓':phase<10.3?'Scroll through the work ↓':'More to explore ↓';if(q('[data-scroll-cue]').textContent!==cueText)q('[data-scroll-cue]').textContent=cueText;
    root.dataset.phase=phase.toFixed(3);root.dataset.study=String(active);root.dataset.travel=(cameraPosition/(count-1)).toFixed(4);root.dataset.presence=presence.toFixed(3);root.dataset.trail=(reduced.matches?0:step(phase,10.85,11.05)).toFixed(3);
  }
  function inkRight(){const range=document.createRange();let right=0;for(const story of stories)for(const part of story.querySelectorAll('.study-identity,h2>span,.study-note,.study-links')){range.selectNodeContents(part);right=Math.max(right,range.getBoundingClientRect().right,part.getBoundingClientRect().left);}return right;}
  // The prior and the next work carry a quiet name; choosing one travels there
  // through the same passage. Only settled reading states show them.
  const contextLinks=Array.from(root.querySelectorAll('[data-context]')),contextOf=i=>({number:stories[i].querySelector('.study-number').textContent,label:stories[i].querySelector('.study-title').textContent});
  function placeContext(stations){
    const side=root.dataset.layout==='side';
    const reading=Number(root.dataset.study),presence=Number(root.dataset.presence)||0,settled=reading>=0&&!reduced.matches&&presence>.01&&Math.abs(Number(root.dataset.travel)*(count-1)-reading)<.001;
    const box=sceneHost.getBoundingClientRect(),origin=world.getBoundingClientRect();
    contextLinks.forEach(link=>{
      const target=reading+(link.dataset.context==='next'?1:-1),station=stations?.find(s=>s.index===target),b=station?.bounds;
      link.hidden=!settled||!b||target<0||target>=count;if(link.hidden)return;
      const info=contextOf(target);link.textContent=`${info.number} ${info.label} ${link.dataset.context==='next'?'→':'←'}`;link.href=`#work-${target+1}`;link.dataset.target=String(target);
      // Below the object if that is clear of the study's own labels, else above it, else not at all.
      // Left-aligned under an earlier work, right-aligned under the next one.
      const w=link.offsetWidth,h=link.offsetHeight,objLeft=box.left-origin.left+b.left*box.width,objRight=box.left-origin.left+b.right*box.width,x=clamp(link.dataset.context==='next'?objRight-w/2:objLeft+w/2,w/2+8,origin.width-w/2-8);
      const active=stations?.find(s=>s.index===reading)?.bounds,busy=Array.from(sceneHost.querySelectorAll('.study-marker:not([hidden]),.study-grip__label:not([hidden]),.study-resource-group,.study-caption')).map(node=>node.getBoundingClientRect()).filter(r=>r.width).map(r=>({left:r.left-40,right:r.right+40,top:r.top,bottom:r.bottom}));
      const story=stories[reading];if(story)for(const part of story.querySelectorAll('.study-identity,h2,.study-note,.study-links')){const r=part.getBoundingClientRect();if(r.width)busy.push({left:r.left-12,right:r.right+12,top:r.top-6,bottom:r.bottom+6});}
      for(const node of[q('.exhibition-profile'),q('[data-photo] .exhibition-photo')]){const r=node.getBoundingClientRect();if(r.width&&!node.hidden)busy.push({left:r.left-16,right:r.right+16,top:r.top-8,bottom:r.bottom+8});}
      if(active)busy.push({left:box.left+active.left*box.width-12,right:box.left+active.right*box.width+12,top:box.top+active.top*box.height-8,bottom:box.top+active.bottom*box.height+8});
      const clear=y=>y>16&&!busy.some(r=>r.left-origin.left<x+w/2&&r.right-origin.left>x-w/2&&r.top-origin.top<y+h&&r.bottom-origin.top>y);
      const below=box.top-origin.top+b.bottom*box.height+6,above=box.top-origin.top+b.top*box.height-h-4,y=clear(below)?below:clear(above)?above:null;
      link.hidden=y===null;if(link.hidden)return;
      link.style.left=`${x.toFixed(1)}px`;link.style.top=`${y.toFixed(1)}px`;link.style.opacity=presence.toFixed(3);link.style.pointerEvents=presence>.95?'':'none';
    });
  }
  // Travel to a work. From the keyboard the passage moves at once and focus
  // lands on that work's first link, so Tab can continue through it.
  function goTo(index,keyboard){
    const anchor=document.getElementById(`work-${index+1}`);if(!anchor)return;
    if(!keyboard){anchor.scrollIntoView({behavior:reduced.matches?'auto':'smooth',block:'start'});return;}
    anchor.scrollIntoView({behavior:'instant',block:'start'});render();
    const target=reduced.matches||!scene?root.querySelectorAll('.exhibition-static article a')[index]:stories[index]?.querySelector('.study-links a');target?.focus({preventScroll:true});
  }
  contextLinks.forEach(link=>link.addEventListener('click',event=>{event.preventDefault();goTo(Number(link.dataset.target),event.detail===0);}));
  const cue=q('[data-scroll-cue]');
  cue?.addEventListener('click',event=>{
    if(phase>=10.3){event.preventDefault();const footer=document.getElementById('contact');footer?.scrollIntoView({behavior:reduced.matches||event.detail===0?'auto':'smooth'});if(event.detail===0)footer?.querySelector('a')?.focus({preventScroll:true});return;}
    event.preventDefault();goTo(phase<1.1?0:Math.min(count-1,Number(root.dataset.study)>=0?Number(root.dataset.study)+1:current+1),event.detail===0);
  });
  // In the coda each work in the trail carries its name: the trail is an index.
  const trailLinks=Array.from(root.querySelectorAll('[data-trail]'));
  function placeTrail(stations){
    const alpha=Number(root.dataset.trail)||0,box=sceneHost.getBoundingClientRect(),origin=world.getBoundingClientRect();
    trailLinks.forEach(link=>{const b=stations?.find(s=>s.index===Number(link.dataset.trail))?.bounds;link.hidden=alpha<.01||!b;if(link.hidden)return;
      // Beside the work on the open side: right if it fits, else left.
      const h=link.offsetHeight,lw=link.offsetWidth,right=box.left-origin.left+b.right*box.width+10,left=box.left-origin.left+b.left*box.width-10-lw,x=right+lw<=origin.width-6?right:Math.max(6,left),y=box.top-origin.top+(b.top+b.bottom)/2*box.height-h/2;
      link.style.left=`${x.toFixed(1)}px`;link.style.top=`${y.toFixed(1)}px`;link.style.opacity=alpha.toFixed(3);link.style.pointerEvents=alpha>.9?'':'none';});
  }
  sceneHost.addEventListener('exhibitionscenedraw',event=>{placeContext(event.detail.stations);placeTrail(event.detail.stations);});
  function request(){if(!raf)raf=requestAnimationFrame(render)}
  function resize(){
    const start=scrollY+track.getBoundingClientRect().top,within=viewportHeight&&scrollY>=start&&scrollY<start+viewportHeight*12.5,readingPhase=viewportHeight?clamp((scrollY-start)/viewportHeight,0,12.5):0;
    root.style.setProperty('--stage-h',innerHeight+'px');root.style.setProperty('--world-h',Math.max(280,innerHeight-(innerWidth<=560?(innerHeight<=620?110:innerHeight<=700?114:118):142))+'px');track.style.height=innerHeight*12.5+'px';
    if(within&&scene&&!reduced.matches)scrollTo({top:start+readingPhase*innerHeight,behavior:'instant'});
    viewportHeight=innerHeight;scene?.resize();request();
  }
  addEventListener('scroll',request,{passive:true});addEventListener('resize',resize,{passive:true});reduced.addEventListener('change',resize);
  addEventListener('pagehide',event=>{if(!event.persisted){controls?.destroy?.();scene?.destroy?.();}});addEventListener('pageshow',event=>{if(event.persisted)resize()});resize();
  document.fonts?.ready.then(()=>{metricsCache=null;notchKey='';resize();});
  if(globalThis.ResizeObserver)new ResizeObserver(()=>{metricsCache=null;request();}).observe(q('.exhibition-stories'));
  if(location.hash==='#about'){const about=document.querySelector('.site-header nav a[href$="about/"]');if(about)location.replace(about.href);}
  else if(location.hash==='#featured')scrollTo({top:innerHeight*1.6,behavior:'auto'});
  const staticTarget=/^#work-(\d)$/.exec(location.hash);if(staticTarget&&(reduced.matches||!scene))root.querySelectorAll('.exhibition-static article')[Number(staticTarget[1])-1]?.scrollIntoView();
})();
