/* Controls stay at the working part of each study. No rotation toolbar. */
(() => {
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const definitions=[
    {key:'layer',min:0,max:27,step:1,label:'Circuit layer',verb:'Trace a layer',hint:'Drag to move a circuit layer. One path follows the selected mode.'},
    {key:'repair',choices:[['0','Sample'],['1','Check'],['2','Combine']],label:'Detection and cancellation',hint:'A concept sketch. Signed weights change the estimate, not the quantum state.'},
    {key:'window',min:0,max:2,step:1,label:'Peephole step',verb:'Move the window',hint:'A small identity circuit. Only the selected gates change.'},
    {key:'gradient',min:-1,max:1,step:.02,label:'Circuit angle',verb:'Change the angle',hint:'Exact Y-rotation example. Mean product of X and Z outcomes = derivative.'},
    {key:'distance',choices:[['5','d = 5'],['7','d = 7'],['9','d = 9']],label:'Code distance',hint:'The same model structure transfers. Each new code size still needs training.'},
    {key:'order',choices:[['ab','A → B'],['coherent','Coherent'],['ba','B → A']],label:'Quantum-switch order',hint:'Example target: an equal mixture of qubit states 0 and 1.'},
  ];
  const degrees=x=>`${Math.round(x)}°`;
  function compact(x){return Math.abs(x)<.0005?'0':Number(x).toFixed(2).replace(/\.00$/,'');}
  globalThis.createStudyControls=function createStudyControls(host,scene,options={}){
    const root=document.createElement('div');root.className='study-actions';root.hidden=options.visible===false;
    const guides=document.createElementNS('http://www.w3.org/2000/svg','svg');guides.classList.add('study-guides');guides.setAttribute('aria-hidden','true');
    host.append(root);
    let index=-1,state=null,visible=options.visible!==false,grips=[],choices=[],resourceGroups=[],markers=[],pointer=null,modeButton=null;
    const readout=document.createElement('p');readout.className='study-actions__readout';readout.setAttribute('aria-live','polite');readout.setAttribute('aria-atomic','true');
    const hint=document.createElement('p');hint.className='study-actions__hint';
    const caption=document.createElement('div');caption.className='study-caption';caption.append(readout,hint);
    const setText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
    const compactAnnotations=()=>(host.ownerDocument?.defaultView?.innerWidth??globalThis.innerWidth??host.clientWidth)<=560;
    function send(key,value){scene.setInteraction({[key]:value});update();}
    function createGrip(def){
      const button=document.createElement('button');button.type='button';button.className='study-grip';button.setAttribute('role','slider');button.setAttribute('aria-label',def.label);button.setAttribute('aria-orientation','horizontal');button.dataset.parameter=def.key;
      const label=document.createElement('span');label.className='study-grip__label';label.textContent=def.verb;button.append(label);
      button.addEventListener('keydown',event=>{
        const max=def.key==='layer'?(state?.routeLayers||state?.routeSnapshot?.layers||27):def.max;
        let next=Number(state?.[def.key]??def.min),amount=def.step*(event.shiftKey?5:1);
        if(event.key==='ArrowRight'||event.key==='ArrowUp')next+=amount;
        else if(event.key==='ArrowLeft'||event.key==='ArrowDown')next-=amount;
        else if(event.key==='Home')next=def.min;
        else if(event.key==='End')next=max;
        else if(event.key==='PageUp')next+=def.step*5;
        else if(event.key==='PageDown')next-=def.step*5;
        else return;
        event.preventDefault();send(def.key,clamp(Math.round(next/def.step)*def.step,def.min,max));
      });
      button.addEventListener('pointerdown',event=>{if(event.button!==0)return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY,start:Number(state?.[def.key]??def.min),button,def,engaged:false};});
      button.addEventListener('pointermove',event=>{
        if(!pointer||pointer.button!==button||event.pointerId!==pointer.id)return;
        const dx=event.clientX-pointer.x,dy=event.clientY-pointer.y;
        if(!pointer.engaged&&Math.abs(dx)>4&&Math.abs(dx)>Math.abs(dy)*1.15){pointer.engaged=true;button.setPointerCapture(event.pointerId);}
        if(!pointer.engaged)return;
        if(event.cancelable)event.preventDefault();
        const max=def.key==='layer'?(state?.routeLayers||27):def.max;
        const next=pointer.start+dx/Math.max(200,host.clientWidth)*(max-def.min)*1.8;
        send(def.key,clamp(Math.round(next/def.step)*def.step,def.min,max));
      });
      const end=event=>{if(pointer?.button===button&&event.pointerId===pointer.id){if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);pointer=null;}};
      button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
      root.append(button);grips.push({button,def});
    }
    function createChoice(key,value,label,name,parent=root){const button=document.createElement('button');button.type='button';button.className='study-choice';button.textContent=label;button.setAttribute('aria-label',`${name}: ${label}`);button.dataset.choice=value;button.dataset.parameter=key;button.addEventListener('click',()=>send(key,['repair','derivativeOrder','distance'].includes(key)?Number(value):value));parent.append(button);choices.push({button,key,value});}
    function createResourceGroup(key,prefix,items,name){
      const node=document.createElement('div');node.className='study-resource-group';node.dataset.resourceGroup=key;node.setAttribute('role','group');node.setAttribute('aria-label',name);
      const label=document.createElement('span');label.className='study-resource-group__label';label.textContent=prefix;node.append(label);
      for(const [value,text]of items)createChoice(key,value,text,name,node);
      root.append(node);resourceGroups.push({node,key,point:null});
    }
    function build(next){
      index=next;grips=[];choices=[];resourceGroups=[];markers=[];modeButton=null;root.replaceChildren();root.dataset.study=String(index);
      const def=definitions[index];
      if(def){
        if(def.choices){
          if(def.key==='distance')createResourceGroup('distance','Code distance',[['5','5'],['7','7'],['9','9']],def.label);
          else for(const [value,label]of def.choices)createChoice(def.key,value,label,def.label);
        }else createGrip(def);
        if(index===3)createResourceGroup('derivativeOrder','Order',[['1','1st'],['2','2nd'],['3','3rd']],'Derivative order');
        if(index===5)createGrip({key:'angle',min:0,max:180,step:1,label:'Measurement basis angle',verb:'Change the bases'});
        hint.textContent=def.hint;
      }else hint.textContent='Relations learned by a decoder. A concept view of transfer across code sizes.';
      if(index===0){
        modeButton=document.createElement('button');modeButton.type='button';modeButton.className='study-choice study-mode';
        modeButton.addEventListener('click',()=>send('selectedMode',((state?.selectedMode??1)+1)%16));root.append(modeButton);
      }
      root.append(guides,caption);
    }
    function anchor(key,value){const handles=state?.handles||[];return handles.find(h=>h.key===key&&(value===undefined||String(h.value)===String(value)))||handles.find(h=>h.key===key);}
    function position(node,point,fallback){const x=clamp(Number(point?.x??fallback[0]),.075,.925),y=clamp(Number(point?.y??fallback[1]),.1,.79);node.style.left=`${x*100}%`;node.style.top=`${y*100}%`;node.dataset.side=x>.72?'left':'right';node.dataset.vertical=y>.65?'above':'center';}
    function update(next,fromDraw=false){
      state=next?.activeIndex!==undefined?next:scene.getState();
      if(!state)return;
      const nextIndex=options.index??state.activeIndex;
      if(nextIndex!==index)build(nextIndex);
      root.hidden=!visible||!state.ready;
      for(const {button,def}of grips){
        const value=Number(state[def.key]??def.min),max=def.key==='layer'?(state.routeLayers||27):def.max;
        button.setAttribute('aria-valuemin',String(def.min));button.setAttribute('aria-valuemax',String(max));button.setAttribute('aria-valuenow',String(value));
        button.setAttribute('aria-valuetext',def.key==='angle'?degrees(value):def.key==='gradient'?`θ ${compact(value*Math.PI)} radians`:String(value));
        position(button,anchor(def.key),def.key==='angle'?[.7,.55]:[.69,.5]);
      }
      for(let i=0;i<choices.length;i++){const {button,key,value}=choices[i];button.setAttribute('aria-pressed',String(String(state[key]??(key==='distance'?5:key==='derivativeOrder'?1:''))===value));if(button.closest('.study-resource-group'))continue;let point=anchor(key,value);if(index===5&&value==='coherent'&&compactAnnotations()&&host.clientWidth<360&&point)point={...point,x:point.x-10/host.clientWidth,y:point.y-18/host.clientHeight};position(button,point,[.34+i*.16,.75]);}
      for(const group of resourceGroups){const points=(state.handles||[]).filter(item=>item.key===group.key);group.point=points.length?{x:points.reduce((sum,item)=>sum+item.x,0)/points.length,y:points.reduce((sum,item)=>sum+item.y,0)/points.length}:{x:.5,y:.35};position(group.node,group.point,[.5,.25]);}
      if(modeButton){
        const mode=state.selectedMode??1;setText(modeButton,`Mode ${mode} ↻`);modeButton.setAttribute('aria-label',`Select next fermionic mode. Current mode ${mode}. Modes 0 to 15.`);
        const board=state.stations?.find(item=>item.index===0)?.bounds,point=anchor('layer');
        position(modeButton,{x:clamp((board?.left??.25)-46/Math.max(1,host.clientWidth),.105,.85),y:point?.y??.25},[.12,.4]);
      }
      let text='';
      if(index===0)text=`Layer ${state.layer??0} / ${state.routeLayers||27} · relative phase ${state.routeSnapshot?.phase===1?'−1':'+1'}`;
      if(index===1)text=['Sample the PEC operations with signed weights.','Use error checks to reject flagged runs.','Combine the accepted, signed results.'][state.repair||0];
      if(index===2)text=['4 gates · each half stays unchanged on its own.','2 gates · H H cancels at the seam. X X remains.','0 gates · X X cancels. The circuit is the identity.'][state.window||0];
      if(index===3){const example=state.example?.gradient,order=state.derivativeOrder||1,theta=(state.gradient||0)*Math.PI,derivative=example?.kthDerivative??Math.cos(theta+order*Math.PI/2);text=`Order ${order} · θ ${compact(theta)} rad · joint readout ${compact(example?.jointExpectation??derivative)}`;}
      if(index===4)text=`Code distance ${state.distance||5} · shared transformer → local proposals → residual decoder`;
      if(index===5){
        const angle=Number(state.angle??52),med=Math.abs(Math.sin(angle*Math.PI/180))/Math.SQRT2,coherent=state.order==='coherent',port=coherent?med*med/2:.5;
        text=`θ ${degrees(angle)} · minus port ${(port*100).toFixed(1)}% · ${coherent?`MED ${med.toFixed(3)}`:'MED not inferred'}`;
      }
      if(state.transition?.active&&state.transition.kind==='peephole'&&index===2)text='Rewriting the selected gates…';
      if(state.transition?.active&&state.transition.kind==='route'&&index===0)text=`Moving to layer ${state.layer} / ${state.routeLayers||27}…`;
      if(state.transition?.active&&state.transition.kind==='derivativeOrder'&&index===3)text='Changing the control registers…';
      if(state.transition?.active&&state.transition.kind==='distance'&&index===4)text='Changing the code size…';
      setText(readout,text);
      const choiceLabels=new Set(choices.map(item=>item.button.textContent));
      const readoutLabels=new Set(['Keep / discard','Move to the seam','Open the seam','H H → I','X X → I','Coherent order control','Definite order','Random order','Tangent','Input grid']);
      const data=(state.markers||[]).filter(item=>!choiceLabels.has(item.text)&&!readoutLabels.has(item.text)&&!(modeButton&&item.text.startsWith('Mode '))&&!(index===2&&state.transition?.active&&/gates$/.test(item.text)));
      while(markers.length>data.length)markers.pop().remove();
      while(markers.length<data.length){const label=document.createElement('span');label.className='study-marker';label.setAttribute('aria-hidden','true');root.append(label);markers.push(label);}
      data.forEach((item,i)=>{setText(markers[i],item.text);position(markers[i],item,[.5,.5]);});
      layoutAnnotations(data,fromDraw);
      root.dataset.parameter=definitions[index]?.key||'none';
    }
    function layoutAnnotations(data,fromDraw=false){
      if(root.hidden)return;
      const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;const compact=compactAnnotations();
      const origin=root.getBoundingClientRect(),captionBox=caption.getBoundingClientRect(),limit=captionBox.top-origin.top-18;
      const box=state.stations?.find(item=>item.index===index)?.bounds;root.dataset.activeBounds=JSON.stringify(box||null);
      const active=box?{left:box.left*w,right:box.right*w,top:box.top*h,bottom:box.bottom*h}:null;
      const occupied=[],background=[],lines=[];
      const story=host.closest('[data-exhibition]')?.querySelector('[data-story][aria-hidden="false"]');if(story){const r=story.getBoundingClientRect();occupied.push({left:r.left-origin.left-12,right:r.right-origin.left+12,top:r.top-origin.top-12,bottom:r.bottom-origin.top+16});}
      for(const station of state.stations||[]){if(station.index===index||!station.bounds)continue;const b=station.bounds;background.push({left:b.left*w-16,right:b.right*w+16,top:b.top*h-16,bottom:b.bottom*h+16});}
      const rectFor=node=>{const b=node.getBoundingClientRect();return {left:b.left-origin.left,right:b.right-origin.left,top:b.top-origin.top,bottom:b.bottom-origin.top};};
      const overlap=(a,b,pad=9)=>Math.max(0,Math.min(a.right+pad,b.right)-Math.max(a.left-pad,b.left))*Math.max(0,Math.min(a.bottom+pad,b.bottom)-Math.max(a.top-pad,b.top));
      if(compact&&data.length)occupied.push({left:0,right:w,top:0,bottom:Math.ceil(data.length/(data.length>3?3:data.length))*40+4});
      const buttons=[...root.querySelectorAll('.study-grip'),...root.querySelectorAll('.study-choice')].filter(node=>!node.closest('.study-resource-group'));
      for(const node of buttons){
        const original=rectFor(node),bw=original.right-original.left,bh=original.bottom-original.top,cx=(original.left+original.right)/2,cy=(original.top+original.bottom)/2;
        const candidates=[[cx,cy],[cx,cy-52],[cx,cy+52],[cx-66,cy],[cx+66,cy],[cx-66,cy-52],[cx+66,cy-52]];
        if(node.classList.contains('study-choice')&&active)candidates.push([active.left-bw/2-18,cy],[active.right+bw/2+18,cy],[cx,active.top-bh/2-18],[cx,active.bottom+bh/2+18]);
        for(const y of[110,162,214,limit-bh/2])for(const x of[30,w*.25,w*.5,w*.75,w-30])candidates.push([x,y]);
        let best=null;
        for(let [x,y]of candidates){x=clamp(x,bw/2+8,w-bw/2-8);y=clamp(y,bh/2+14,Math.max(bh/2+14,limit-bh/2));const area={left:x-bw/2,right:x+bw/2,top:y-bh/2,bottom:y+bh/2};let score=Math.hypot(x-cx,y-cy);for(const other of occupied)score+=overlap(area,other,6)*1000000;for(const other of background)score+=overlap(area,other,8)*100;if(node.classList.contains('study-choice')&&active)score+=overlap(area,active,12)*10000;if(!best||score<best.score)best={x,y,area,score};}
        if(best){node.style.left=`${best.x}px`;node.style.top=`${best.y}px`;occupied.push(best.area);if(Math.hypot(best.x-cx,best.y-cy)>14)lines.push(`<path d="M${cx.toFixed(1)},${cy.toFixed(1)} L${best.x.toFixed(1)},${best.y.toFixed(1)}"/>`);}
      }
      // A resource count is one ordered choice, not three different model parts.
      // Move the complete text row; its native44px buttons keep their order.
      for(const group of resourceGroups){
        const node=group.node,r=rectFor(node),bw=r.right-r.left,bh=r.bottom-r.top,target={x:group.point.x*w,y:group.point.y*h},x=clamp(target.x,bw/2+10,w-bw/2-10);
        const placementKey=`${w}x${h}:${compact?'phone':'desktop'}:${Number(state.travel||0).toFixed(4)}:${Number(state.arrival??1).toFixed(4)}`;
        const narrow=compact,paintTop=narrow?Math.min((active?.bottom??84)+4,captionBox.top-origin.top-19):null;
        const candidates=narrow?[[w/2,paintTop+bh/2],[w/2+20,paintTop+bh/2],[w/2-20,paintTop+bh/2]]:[[x,bh/2]];let best=null;
        for(let [cx,cy]of candidates){cx=clamp(cx,bw/2+10,w-bw/2-10);if(!narrow)cy=clamp(cy,bh/2,Math.max(bh/2,limit-bh/2));const area={left:cx-bw/2,right:cx+bw/2,top:cy-bh/2,bottom:cy+bh/2},paint={...area,bottom:area.top+18};let score=Math.hypot(cx-target.x,cy-target.y);for(const other of occupied)score+=overlap(area,other,2)*1000000;if(active)score+=overlap(paint,active,4)*100;for(const other of background)score+=overlap(paint,other,5)*10;if(!best||score<best.score)best={x:cx,y:cy,area,paint,score};}
        if(group.placement?.key===placementKey)best=group.placement.value;
        else if(best&&fromDraw)group.placement={key:placementKey,value:best};
        if(best){node.style.left=`${best.x}px`;node.style.top=`${best.y}px`;occupied.push(narrow?best.paint:best.area);const edge={x:clamp(target.x,best.area.left+8,best.area.right-8),y:best.area.top+19};if(Math.hypot(edge.x-target.x,edge.y-target.y)>14)lines.push(`<path class="study-group-leader" d="M${target.x.toFixed(1)},${target.y.toFixed(1)} L${edge.x.toFixed(1)},${edge.y.toFixed(1)}"/>`);}
      }
      guides.setAttribute('viewBox',`0 0 ${w} ${h}`);
      const place=(node,point,isGrip=false)=>{
        const r=node.getBoundingClientRect(),rw=r.width,rh=r.height,target={x:point.x*w,y:point.y*h};
        if(!rw||!rh)return;
        const candidates=[];
        if(active){
          const top=Math.max(18,active.top-25-rh/2),bottom=Math.min(limit-rh/2,active.bottom+25+rh/2);
          candidates.push([target.x,top],[active.left-20-rw/2,target.y],[active.right+20+rw/2,target.y],[target.x,bottom]);
          for(const dx of[-110,110,-220,220])candidates.push([target.x+dx,top]);
        }
        candidates.push([target.x,target.y-27],[target.x,target.y+27]);
        if(!compact)for(const y of[36,h*.28,h*.48,h*.64,limit-rh/2])for(const x of[rw/2+10,w*.25,w*.5,w*.75,w*.85,w-rw/2-10])candidates.push([x,y]);
        let best=null;
        for(let [x,y]of candidates){x=clamp(x,rw/2+10,w-rw/2-10);y=clamp(y,rh/2+14,Math.max(rh/2+14,limit-rh/2));const area={left:x-rw/2,right:x+rw/2,top:y-rh/2,bottom:y+rh/2};let score=Math.hypot(x-target.x,y-target.y);
          for(const other of occupied)score+=overlap(area,other)*(compact?1000:1000000);
          for(const other of background)score+=overlap(area,other)*(compact?20:4000);
          if(active)score+=overlap(area,active,10)*(compact?30:8000);
          if(!best||score<best.score)best={x,y,area,score};
        }
        if(!best)return;occupied.push(best.area);
        if(isGrip){const parent=node.parentElement.getBoundingClientRect();node.style.left=`${best.x-(parent.left-origin.left)}px`;node.style.top=`${best.y-(parent.top-origin.top)}px`;node.style.right='auto';node.style.width=`${Math.min(112,w*.33)}px`;node.style.transform='translate(-50%,-50%)';node.style.textAlign='center';}
        else{node.style.left=`${best.x}px`;node.style.top=`${best.y}px`;}
        if(Math.hypot(best.x-target.x,best.y-target.y)>24)lines.push(`<path d="M${target.x.toFixed(1)},${target.y.toFixed(1)} L${best.x.toFixed(1)},${best.y.toFixed(1)}"/>`);
      };
      if(compact){
        const columns=data.length>3?3:Math.max(1,data.length),gap=10,slot=(w-20)/columns;
        data.forEach((item,i)=>{const node=markers[i],x=10+slot*(i%columns+.5),y=24+Math.floor(i/columns)*40;node.style.left=`${x}px`;node.style.top=`${y}px`;node.style.width=`${Math.min(slot-gap,116)}px`;node.style.maxWidth='none';const target={x:item.x*w,y:item.y*h};occupied.push(rectFor(node));if(Math.hypot(x-target.x,y-target.y)>24)lines.push(`<path d="M${target.x.toFixed(1)},${target.y.toFixed(1)} L${x.toFixed(1)},${y.toFixed(1)+12}"/>`);});
      }else data.forEach((item,i)=>place(markers[i],item));
      for(const {button,def}of grips){const label=button.querySelector('.study-grip__label');if(label&&getComputedStyle(label).display!=='none'){const point=anchor(def.key);if(point)place(label,point,true);}}
      const markup=lines.join('');if(guides.innerHTML!==markup)guides.innerHTML=markup;
    }
    const draw=()=>update(undefined,true);host.addEventListener('exhibitionscenedraw',draw);update();
    return {update,setVisible(value){visible=Boolean(value);update();},destroy(){host.removeEventListener('exhibitionscenedraw',draw);root.remove();}};
  };
})();
