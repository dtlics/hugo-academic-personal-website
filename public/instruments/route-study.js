/* Exact L=4 UI adapter for the validated MIT-licensed author-source port.
 * Computation remains in compiler.js. See LICENSE-source.txt and route-contract.json.
 */
(function(root){
  'use strict';
  if(root.initRouteStudies?.routeWidgetVersion==='1') return;
  const C=root.RouteCompiler,S=root.ROUTE_SOURCE;
  if(!C||!S) throw new Error('Load compiler.js and source-data.js before route-study.js.');
  const instances=new WeakMap();
  const copy=x=>JSON.parse(JSON.stringify(x));
  const pad=x=>String(x).padStart(2,'0');
  const equal=(a,b)=>a.length===b.length&&a.every((v,i)=>v===b[i]);
  const setText=(el,text)=>{if(el.textContent!==text)el.textContent=text;};
  function mount(el){
    if(instances.has(el)) return instances.get(el);
    const doc=el.ownerDocument;
    function make(tag,className,text){const e=doc.createElement(tag);if(className)e.className=className;if(text!==undefined)e.textContent=text;return e;}
    function button(text,label){const b=make('button','',text);b.type='button';if(label)b.setAttribute('aria-label',label);return b;}
    const fragment=doc.createDocumentFragment();
    const intro=make('p','route-study__intro','Choose a route. Step through it. Test what happens when Γ is removed.');fragment.append(intro);
    const controls=make('div','route-study__controls');
    const presetLabel=make('label','route-study__preset','Mode destinations'),preset=make('select');preset.setAttribute('aria-label','Mode destination pattern');
    const presetNames={'transpose':'Transpose','reverse':'Reverse','seeded-shuffle':'Shuffle'};
    S.fixtures.forEach(f=>{const op=make('option','',presetNames[f.id]||f.id);op.value=f.id;preset.append(op);});
    const customOption=make('option','','Custom');customOption.value='custom';customOption.hidden=true;preset.append(customOption);presetLabel.append(preset);
    const gammaLabel=make('label','route-study__gamma'),gamma=make('input');gamma.type='checkbox';gamma.checked=true;gammaLabel.append(gamma,doc.createTextNode('Keep both Γ blocks'));controls.append(presetLabel,gammaLabel);fragment.append(controls);
    const stageBox=make('div','route-study__stages');stageBox.setAttribute('aria-label','Circuit stages');
    const stageTitles=['Row A','Γ · first','Bare column','Γ · second','Row B'];
    const stageButtons=['Row A','Γ 1','Column','Γ 2','Row B'].map((name,i)=>{const b=button(name);b.title=stageTitles[i];stageBox.append(b);return b;});fragment.append(stageBox);
    const canvas=make('div','route-study__canvas');
    const svg=doc.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 320 280');svg.setAttribute('role','img');svg.setAttribute('aria-label','Stored bits, mode route, and current local gates');
    const legend=make('p','route-study__legend');const dot=make('i');legend.append(dot,doc.createTextNode('bit 1 · open circle: bit 0 · m = mode'));canvas.append(svg,legend);fragment.append(canvas);
    const playback=make('div','route-study__playback'),previous=button('←','Previous circuit layer'),play=button('Play','Play circuit layers'),next=button('→','Next circuit layer'),counter=make('output','route-study__counter');counter.setAttribute('aria-live','off');
    const rangeLabel=make('label','route-study__range-label','Completed layers'),range=make('input');range.type='range';range.min='0';range.step='1';range.value='0';range.setAttribute('aria-label','Completed circuit layers');rangeLabel.append(range);playback.append(previous,play,next,counter,rangeLabel);fragment.append(playback);
    const layerNote=make('p','route-study__layer-note');fragment.append(layerNote);
    const summary=make('div','route-study__summary'),nowBox=make('div'),expectedBox=make('div'),phaseNow=make('strong'),phaseExpected=make('strong'),depth=make('p','route-study__depth');nowBox.append(make('span','','Phase now'),phaseNow);expectedBox.append(make('span','','Target at the end'),phaseExpected);summary.append(nowBox,expectedBox,depth);fragment.append(summary);
    const finalCheck=make('p','route-study__check');finalCheck.setAttribute('aria-live','polite');fragment.append(finalCheck);
    const edit=make('details','route-study__details');edit.append(make('summary','','Change destinations and occupation'));
    edit.append(make('p','','Select two source cells to exchange their destinations. Each cell shows mode → destination.'));
    const destGrid=make('div','route-study__matrix');destGrid.setAttribute('aria-label','Source mode destinations');const destButtons=Array.from({length:16},()=>{const b=button('');destGrid.append(b);return b;});edit.append(destGrid);
    const selection=make('p','route-study__selection','Select the first source cell.');selection.setAttribute('aria-live','polite');edit.append(selection);
    edit.append(make('p','route-study__subheading','Initial occupation'),make('p','','Select occupied modes. The encoded input has equal vacuum and occupation branches. The sign is relative to the vacuum branch.'));
    const occGrid=make('div','route-study__matrix');occGrid.setAttribute('aria-label','Initial mode occupation');const occButtons=Array.from({length:16},()=>{const b=button('');occGrid.append(b);return b;});edit.append(occGrid);
    const witness=button('Use a phase-error example');witness.className='route-study__witness';edit.append(witness);fragment.append(edit);
    const scope=make('details','route-study__details');scope.append(make('summary','','Scope and source'));
    scope.append(make('p','','Exact 4 × 4 compiler · snake Jordan–Wigner order · folded Γ · no noise · no extra qubits. Hall matching and sorting are computed for the selected valid destination pattern. The L = 4 Γ schedule comes from the pinned public source.'));
    scope.append(make('p','','Inside Γ, stored bits can encode parity. They are not mode occupations. Mode labels follow FSWAPs only. CNOT-equivalent depth counts each FSWAP moment as two and each CNOT/CZ moment as one. The circuit counter also includes single-qubit Z-only moments, which do not add CNOT-equivalent depth.'));
    scope.append(make('p','','The phase readout follows a nonempty occupation branch relative to the vacuum branch. The empty pattern has no distinct relative phase. The final check applies to the chosen occupation pattern; it is not a test of every state.'));
    const provenance=make('p');const source=make('a','','Pinned code · 87eac17');source.href='https://github.com/dtlics/fast-fermionic-permutation/tree/87eac17bdf30017f5de90f5eeea14a679809242e';const paper=make('a','','Paper');paper.href='https://arxiv.org/abs/2605.26041';provenance.append(source,doc.createTextNode(' · '),paper);scope.append(provenance,make('p','','Version note: this uses the public repository’s folded construction. The earlier arXiv HTML v1 describes an older pipelined construction. Depth is calculated from the selected circuit.'));
    const motionNote=make('p','route-study__motion-note');scope.append(motionNote);fragment.append(scope);el.append(fragment);
    let perm=[...S.fixtures[0].perm],initial=[...S.fixtures[0].witnessBits],compiled=C.compile(perm,S.gammaLayers),layer=0,selected=null,timer=null,destroyed=false;
    const reduceMotion=root.matchMedia?.('(prefers-reduced-motion: reduce)');
    function isVisible(){
      if(doc.hidden||!el.isConnected)return false;
      for(let a=el;a;a=a.parentElement){if(a.hidden||a.getAttribute('aria-hidden')==='true')return false;const style=root.getComputedStyle(a);if(style.display==='none'||style.visibility==='hidden')return false;}
      return true;
    }
    function pause(){if(timer!==null){root.clearInterval(timer);timer=null;}setText(play,'Play');play.setAttribute('aria-label','Play circuit layers');}
    function state(){return copy({perm,compiled,snapshot:C.simulate(compiled,initial,layer,gamma.checked),layer,includeGamma:gamma.checked,resources:C.resources(compiled,gamma.checked),expected:C.exactTarget(perm,initial),initial});}
    function point(i){return [50+(i%4)*73,39+Math.floor(i/4)*66];}
    function draw(s){
      const current=layer?compiled.layers[layer-1]:null,omitted=current&&!gamma.checked&&[1,3].includes(current.stageIndex),parts=['<title>Stored bits and local gates after '+layer+' completed circuit layers</title>'];
      if(current&&!omitted)for(const [kind,a,b]of current.gates){
        const [x,y]=point(a);
        if(kind==='z'){parts.push(`<circle cx="${x}" cy="${y}" r="26" fill="none" stroke="var(--route-gate)" stroke-width="2"/><text x="${x+24}" y="${y-23}" font-size="15" fill="var(--route-gate)">Z</text>`);continue;}
        const [u,v]=point(b),mx=(x+u)/2,my=(y+v)/2,lx=mx+(x===u?20:0),ly=my+(y===v?-20:0);
        parts.push(`<line x1="${x}" y1="${y}" x2="${u}" y2="${v}" stroke="var(--route-gate)" stroke-width="3"/><rect x="${lx-13}" y="${ly-9}" width="26" height="18" fill="var(--route-surface)"/><text x="${lx}" y="${ly+5}" text-anchor="middle" font-size="15" fill="var(--route-gate)">${kind==='fswap'?'FS':kind.toUpperCase()}</text>`);
        if(kind==='cx'){const len=Math.hypot(u-x,v-y),dx=(u-x)/len,dy=(v-y)/len,tx=u-dx*24,ty=v-dy*24;parts.push(`<path d="M ${tx-dx*7-dy*4} ${ty-dy*7+dx*4} L ${tx} ${ty} L ${tx-dx*7+dy*4} ${ty-dy*7-dx*4}" fill="none" stroke="var(--route-gate)" stroke-width="2"/>`);}
      }
      s.snapshot.bits.forEach((bit,i)=>{const [x,y]=point(i),ink=bit?'var(--route-accent-ink)':'var(--route-muted)';parts.push(`<g><circle cx="${x}" cy="${y}" r="23" fill="${bit?'var(--route-accent)':'var(--route-surface)'}" stroke="var(--route-rule)"/><text x="${x}" y="${y-3}" font-size="18" text-anchor="middle" fill="${ink}">${bit}</text><text x="${x}" y="${y+15}" font-size="15" text-anchor="middle" fill="${ink}">m${pad(s.snapshot.modes[i])}</text></g>`);});
      svg.innerHTML=parts.join('');
    }
    function render(reason){
      if(destroyed)return;
      const s=state(),last=compiled.layers.length,hasOccupation=initial.some(Boolean),full=C.simulate(compiled,initial,last,gamma.checked),destinationOK=full.modes.every((src,dst)=>perm[src]===dst),bitsOK=equal(full.bits,s.expected.bits),phaseOK=full.phase===s.expected.phase;
      range.max=last;range.value=layer;counter.value=`${layer} / ${last}`;counter.textContent=`${layer} / ${last}`;previous.disabled=layer===0;next.disabled=layer===last;play.disabled=!!reduceMotion?.matches;
      setText(motionNote,reduceMotion?.matches?'Reduced motion is on. Use the step or layer controls.':'Playback starts only when you select Play. It pauses when this study is hidden or leaves view.');
      stageButtons.forEach((b,i)=>{const count=compiled.stages[i].length;b.dataset.active=String(layer>0&&compiled.layers[layer-1]?.stageIndex===i);b.dataset.omitted=String(!gamma.checked&&[1,3].includes(i));b.setAttribute('aria-label',`Go to end of ${stageTitles[i]}, ${count} circuit layers`);});
      destButtons.forEach((b,i)=>{setText(b,`${pad(i)} → ${pad(perm[i])}`);b.dataset.selected=String(selected===i);b.setAttribute('aria-label',`Source mode ${i}, destination ${perm[i]}${selected===i?', selected':''}`);});
      occButtons.forEach((b,i)=>{setText(b,`${pad(i)} · ${initial[i]}`);b.setAttribute('aria-pressed',String(!!initial[i]));b.setAttribute('aria-label',`Initial mode ${i}, ${initial[i]?'occupied':'empty'}`);});
      const current=layer?compiled.layers[layer-1]:null,omitted=current&&!gamma.checked&&[1,3].includes(current.stageIndex);
      setText(layerNote,current?`${current.name} · ${current.localIndex+1} / ${compiled.stages[current.stageIndex].length}${omitted?' · skipped':' · '+[...new Set(current.gates.map(g=>g[0]==='fswap'?'FSWAP':g[0].toUpperCase()))].join(' + ')}`:'Initial state · no circuit layer completed');
      setText(phaseNow,hasOccupation?(s.snapshot.phase?'−1 · π':'+1 · 0'):'vacuum');setText(phaseExpected,hasOccupation?(s.expected.phase?'−1 · π':'+1 · 0'):'vacuum');
      setText(depth,`CNOT-equivalent depth: ${s.resources.cnotDepth} · 0 extra qubits`);
      finalCheck.dataset.correct=String(destinationOK&&bitsOK&&phaseOK);
      setText(finalCheck,`${destinationOK&&bitsOK?'Final route: 16 / 16 positions correct.':'Final route check failed.'} ${hasOccupation?(phaseOK?'Phase matches the target.':'Phase is wrong: the Γ correction is needed.'):'Vacuum only: no distinct relative phase.'}${!gamma.checked&&phaseOK&&hasOccupation?' This pattern does not expose a phase error.':''}`);
      draw(s);
      if(reason)el.dispatchEvent(new CustomEvent('routechange',{bubbles:true,detail:{...s,reason}}));
    }
    function recompile(reason){pause();compiled=C.compile(perm,S.gammaLayers);layer=0;render(reason);}
    function setState(patch={}){
      if(!patch||typeof patch!=='object'||Array.isArray(patch))throw new TypeError('Route state must be an object.');
      if(destroyed)throw new Error('This route study has been destroyed.');
      const nextPerm=patch.perm===undefined?[...perm]:[...patch.perm];C.validatePermutation(nextPerm);
      const nextInitial=patch.initial===undefined?[...initial]:[...patch.initial];
      if(nextInitial.length!==16||nextInitial.some(x=>x!==0&&x!==1))throw new TypeError('Initial occupation must contain exactly 16 binary values.');
      if(patch.includeGamma!==undefined&&typeof patch.includeGamma!=='boolean')throw new TypeError('includeGamma must be boolean.');
      if(patch.layer!==undefined&&(!Number.isFinite(patch.layer)||typeof patch.layer!=='number'))throw new TypeError('Layer must be a finite number.');
      const permChanged=!equal(nextPerm,perm),nextCompiled=permChanged?C.compile(nextPerm,S.gammaLayers):compiled;
      const nextLayer=Math.max(0,Math.min(nextCompiled.layers.length,Math.floor(patch.layer===undefined?layer:patch.layer)));
      const nextGamma=patch.includeGamma===undefined?gamma.checked:patch.includeGamma;
      const changed=permChanged||!equal(nextInitial,initial)||nextLayer!==layer||nextGamma!==gamma.checked;
      pause();
      if(!changed)return state();
      perm=nextPerm;initial=nextInitial;compiled=nextCompiled;layer=nextLayer;gamma.checked=nextGamma;selected=null;
      preset.value=S.fixtures.find(f=>equal(f.perm,perm))?.id||'custom';setText(selection,'Select the first source cell.');render('external');return state();
    }
    preset.addEventListener('change',()=>{const f=S.fixtures.find(x=>x.id===preset.value);if(!f)return;perm=[...f.perm];initial=[...f.witnessBits];selected=null;setText(selection,'Select the first source cell.');recompile('preset');});
    gamma.addEventListener('change',()=>{pause();render('gamma');});
    stageButtons.forEach((b,i)=>b.addEventListener('click',()=>{pause();layer=compiled.stages.slice(0,i+1).reduce((sum,x)=>sum+x.length,0);render('stage');}));
    previous.addEventListener('click',()=>{pause();layer=Math.max(0,layer-1);render('previous');});next.addEventListener('click',()=>{pause();layer=Math.min(compiled.layers.length,layer+1);render('next');});
    range.addEventListener('input',()=>{pause();layer=Number(range.value);render('scrub');});
    play.addEventListener('click',()=>{
      if(timer!==null){pause();return;}
      if(reduceMotion?.matches||!isVisible())return;
      if(layer===compiled.layers.length){layer=0;render('restart');}
      setText(play,'Pause');play.setAttribute('aria-label','Pause circuit layers');
      timer=root.setInterval(()=>{if(!isVisible()||reduceMotion?.matches){pause();return;}layer++;if(layer>=compiled.layers.length){layer=compiled.layers.length;pause();}render('play');},650);
    });
    destButtons.forEach((b,i)=>b.addEventListener('click',()=>{
      if(selected===null){selected=i;setText(selection,`Mode ${i} selected. Select another source cell.`);render();}
      else if(selected===i){selected=null;setText(selection,'Select the first source cell.');render();}
      else{[perm[selected],perm[i]]=[perm[i],perm[selected]];selected=null;preset.value='custom';setText(selection,'Destinations exchanged. The route is compiled again.');recompile('destinations');}
    }));
    occButtons.forEach((b,i)=>b.addEventListener('click',()=>{pause();initial[i]^=1;render('occupation');}));
    witness.addEventListener('click',()=>{
      pause();
      for(let a=0;a<16;a++)for(let b=a+1;b<16;b++){const bits=Array(16).fill(0);bits[a]=bits[b]=1;const bad=C.simulate(compiled,bits,compiled.layers.length,false),target=C.exactTarget(perm,bits);if(bad.phase!==target.phase){initial=bits;layer=0;render('witness');return;}}
      setText(selection,'This permutation has no two-mode phase-error witness.');
    });
    const onVisibility=()=>{if(doc.hidden)pause();},onReduced=()=>{pause();render();};doc.addEventListener('visibilitychange',onVisibility);reduceMotion?.addEventListener?.('change',onReduced);
    const visibilityObserver=root.MutationObserver?new MutationObserver(()=>{if(!isVisible())pause();}):null;
    for(let a=el;a;a=a.parentElement)visibilityObserver?.observe(a,{attributes:true,attributeFilter:['hidden','aria-hidden','class','style']});
    const intersectionObserver=root.IntersectionObserver?new IntersectionObserver(entries=>{if(entries.some(x=>!x.isIntersecting))pause();}):null;intersectionObserver?.observe(el);
    const api={getState:state,setState,pause,destroy(){pause();destroyed=true;visibilityObserver?.disconnect();intersectionObserver?.disconnect();doc.removeEventListener('visibilitychange',onVisibility);reduceMotion?.removeEventListener?.('change',onReduced);instances.delete(el);delete el.routeStudy;el.replaceChildren();}};
    instances.set(el,api);el.routeStudy=api;render('init');return api;
  }
  function initRouteStudies(scope=root.document){const list=[];if(scope.matches?.('.route-study'))list.push(scope);list.push(...scope.querySelectorAll('.route-study'));return list.map(mount);}
  initRouteStudies.routeWidgetVersion='1';root.initRouteStudies=initRouteStudies;
  if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',()=>initRouteStudies(),{once:true});else initRouteStudies();
})(globalThis);
