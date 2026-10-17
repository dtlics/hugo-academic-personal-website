/* Native scroll changes the viewpoint. Only explicit controls change science. */
(() => {
  'use strict';
  const root=document.querySelector('[data-exhibition]');if(!root)return;
  const q=s=>root.querySelector(s),world=q('.exhibition-world'),track=q('.exhibition-track'),sceneHost=q('[data-scene]');
  const stories=Array.from(root.querySelectorAll('[data-story]')),count=stories.length;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,t)=>a+(b-a)*t;
  const ease=x=>{x=clamp(x);return x*x*(3-2*x)},step=(p,a,b)=>ease((p-a)/(b-a));
  const compiled=window.ROUTE_SOURCE&&window.RouteCompiler?.compile(window.ROUTE_SOURCE.fixtures[0].perm,window.ROUTE_SOURCE.gammaLayers);
  const scene=compiled&&window.createExhibitionScene?.(q('[data-scene]'),{compiled,initial:window.ROUTE_SOURCE.fixtures[0].witnessBits});
  const controls=scene&&window.createStudyControls?.(q('[data-scene]'),scene,{visible:false});
  if(!scene)root.classList.add('no-scene');root.classList.add('is-ready');
  let raf=0,phase=0,current=0,viewportHeight=0;
  function pose(el,x,y,scale){el.style.transform=`translate3d(${(x*world.clientWidth).toFixed(2)}px,${(y*world.clientHeight).toFixed(2)}px,0) scale(${scale.toFixed(4)})`;}
  function render(){
    raf=0;const height=innerHeight,w=world.clientWidth,h=world.clientHeight;if(!w||!h)return;
    const start=scrollY+track.getBoundingClientRect().top;phase=clamp((scrollY-start)/height,0,12.15);
    const narrow=innerWidth<=560,shortPhone=narrow&&height<=700,tinyPhone=narrow&&height<=620,shortWide=innerWidth>=1000&&height<=650,arrival=reduced.matches?0:step(phase,0,1.0);
    const photoScale=mix(1,narrow?(tinyPhone?.24:shortPhone?.28:.36):.46,arrival),nameScale=mix(1,narrow?(tinyPhone?.53:shortPhone?.60:.67):.53,arrival);
    if(narrow){const photoStart=Math.max(.29,(h*.05+Math.min(innerWidth*.1624,62)+100)/h);pose(q('[data-photo]'),mix(.25,.03,arrival),mix(photoStart,shortPhone?.015:.02,arrival),photoScale);pose(q('[data-name]'),mix(.03,.36,arrival),mix(.05,shortPhone?.025:.03,arrival),nameScale);}
    else{pose(q('[data-photo]'),mix(.395,.035,arrival),mix(.13,.27,arrival),photoScale);pose(q('[data-name]'),mix(.03,.035,arrival),mix(.14,.025,arrival),nameScale);}
    q('[data-name] .mono').style.fontSize=(11/nameScale).toFixed(2)+'px';q('.exhibition-photo>span').style.fontSize=(11/photoScale).toFixed(2)+'px';q('.exhibition-photo>span').textContent=q('[data-photo]').offsetWidth*photoScale<155?'00 / DL':'Dantong Li / 00';
    const profile=q('.exhibition-profile');profile.hidden=narrow&&phase>.08&&!reduced.matches;if(!narrow)profile.style.opacity=String(phase<.42?1-step(phase,.1,.4):step(phase,.74,.99));
    if(shortWide)profile.style.top=`${mix(h*.65,h*.27+q('[data-photo]').offsetHeight*photoScale+14,arrival)}px`;else profile.style.removeProperty('top');
    const position=clamp((phase-1.1)/1.65,0,count-1),at=Math.floor(position),fraction=position-at;
    // Reserve the full reading space before fitting the sculpture. Laptop-height
    // viewports need the same separation as tall screens and phones.
    const readingSpace=q('.exhibition-stories').offsetTop+Math.max(...stories.map(story=>story.offsetHeight))+16;
    const sceneTop=shortWide?h*.04:mix(h*(narrow?.48:.15),readingSpace,reduced.matches?0:step(phase,.55,1.15));
    sceneHost.style.top=`${sceneTop.toFixed(2)}px`;
    // A reading pause, then a shared eased move; no hard chapter cuts.
    const cameraPosition=at+step(fraction,.60,1);scene?.setView({arrival,travel:cameraPosition/(count-1)});current=Math.min(count-1,Math.floor(position+.22));
    let active=-1;
    stories.forEach((story,i)=>{const delta=position-i,entry=i===0?step(phase,.95,1.4):step(delta,-.24,.04),exit=1-step(delta,.60,.86),alpha=reduced.matches?0:entry*exit;story.style.opacity=alpha.toFixed(4);story.style.visibility=alpha>.005?'visible':'hidden';story.style.transform=`translate3d(${(step(delta,.60,.86)*-24).toFixed(2)}px,${((1-entry)*38-step(delta,.6,.86)*30).toFixed(2)}px,0)`;story.style.filter=`blur(${((1-alpha)*3).toFixed(2)}px)`;const visible=alpha>.55;story.inert=!visible;story.setAttribute('aria-hidden',String(!visible));if(visible)active=i;});
    controls?.setVisible(active>=0&&!reduced.matches&&phase<=10.7);
    q('[data-current-label]').textContent=phase<1.1?'00 / Identity and practice':`${String(current+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;
    q('[data-scroll-cue]').textContent=phase<.6?'Scroll to begin the research ↓':phase<10.6?'Scroll through the work ↓':'More to explore ↓';q('[data-end-link]').hidden=phase<10.7||reduced.matches;
    root.dataset.phase=phase.toFixed(3);root.dataset.study=String(active);root.dataset.travel=(cameraPosition/(count-1)).toFixed(4);
  }
  function request(){if(!raf)raf=requestAnimationFrame(render)}
  function resize(){
    const start=scrollY+track.getBoundingClientRect().top,within=viewportHeight&&scrollY>=start&&scrollY<start+viewportHeight*12.15,readingPhase=viewportHeight?clamp((scrollY-start)/viewportHeight,0,12.15):0;
    root.style.setProperty('--stage-h',innerHeight+'px');root.style.setProperty('--world-h',Math.max(280,innerHeight-(innerWidth<=560?(innerHeight<=620?112:innerHeight<=700?136:154):142))+'px');track.style.height=innerHeight*12.15+'px';
    if(within&&scene&&!reduced.matches)scrollTo({top:start+readingPhase*innerHeight,behavior:'instant'});
    viewportHeight=innerHeight;scene?.resize();request();
  }
  addEventListener('scroll',request,{passive:true});addEventListener('resize',resize,{passive:true});reduced.addEventListener('change',resize);
  addEventListener('pagehide',event=>{if(!event.persisted){controls?.destroy?.();scene?.destroy?.();}});addEventListener('pageshow',event=>{if(event.persisted)resize()});resize();
  if(location.hash==='#about'){const about=document.querySelector('.site-header nav a[href$="about/"]');if(about)location.replace(about.href);}
  else if(location.hash==='#featured')scrollTo({top:innerHeight*1.6,behavior:'auto'});
})();
