/* Controls stay at the working part of each study. No rotation toolbar. */
(() => {
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const definitions=[
    {key:'layer',min:0,max:27,step:1,label:'Circuit layer',verb:'Trace a layer',hint:'Drag the marked point to trace layers. Click Mode to change paths.'},
    {key:'repair',choices:[['0','Sample'],['1','Check'],['2','Combine']],label:'Detection and cancellation',hint:'Click a stage. Signed weights change the estimate, not the quantum state.'},
    {key:'window',min:0,max:2,step:1,label:'Peephole step',verb:'Move the window',hint:'Drag the window, or click the gates to step through this identity rewrite.'},
    {key:'gradient',min:-1,max:1,step:.02,label:'Circuit angle',verb:'Change the angle',hint:'Drag the angle marker. For this Y rotation, mean X/Z products give the derivative.'},
    {key:'distance',choices:[['5','d = 5'],['7','d = 7'],['9','d = 9']],label:'Code distance',hint:'Drag the model to turn it. Each new code size still needs training.'},
    {key:'order',choices:[['ab','A → B'],['coherent','Coherent'],['ba','B → A']],label:'Quantum-switch order',hint:'Drag the marked axis to turn the bases. Target: equal mixture of 0 and 1.'},
  ];
  const degrees=x=>`${Math.round(x)}°`;
  function compact(x){return Math.abs(x)<.0005?'0':Number(x).toFixed(2).replace(/\.00$/,'');}
  globalThis.createStudyControls=function createStudyControls(host,scene,options={}){
    const root=document.createElement('div');root.className='study-actions';root.hidden=options.visible===false;
    const guides=document.createElementNS('http://www.w3.org/2000/svg','svg');guides.classList.add('study-guides');guides.setAttribute('aria-hidden','true');
    host.append(root);
    let index=-1,state=null,visible=options.visible!==false,grips=[],choices=[],resourceGroups=[],markers=[],pointer=null,modeButton=null,modePoint=null;
    let annotationView='',annotationPositions=new Map(),captionReserve=0,captionView='';
    const readout=document.createElement('p');readout.className='study-actions__readout';readout.setAttribute('aria-live','polite');readout.setAttribute('aria-atomic','true');
    const hint=document.createElement('p');hint.className='study-actions__hint';
    const caption=document.createElement('div');caption.className='study-caption';caption.append(readout,hint);
    const setText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
    function annotationText(node,value){let text=node.querySelector('.study-annotation-text');if(!text){text=document.createElement('span');text.className='study-annotation-text';node.replaceChildren(text);}setText(text,value);}
    const compactAnnotations=()=>(host.ownerDocument?.defaultView?.innerWidth??globalThis.innerWidth??host.clientWidth)<=560;
    const phoneHomeAnnotations=()=>compactAnnotations()&&Boolean(host.classList?.contains('exhibition-scene'));
    const shortHomeAnnotations=()=>phoneHomeAnnotations()&&(host.ownerDocument?.defaultView?.innerHeight??globalThis.innerHeight??1000)<=700;
    const tinyHomeAnnotations=()=>shortHomeAnnotations()&&(host.ownerDocument?.defaultView?.innerHeight??globalThis.innerHeight??1000)<=620;
    function send(key,value){scene.setInteraction({[key]:value});update();}
    function createGrip(def){
      const button=document.createElement('button');button.type='button';button.className='study-grip';button.setAttribute('role','slider');button.setAttribute('aria-label',def.label);button.setAttribute('aria-orientation','horizontal');button.dataset.parameter=def.key;
      const label=document.createElement('span');label.className='study-grip__label';annotationText(label,def.verb);button.append(label);
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
        if(!pointer.engaged&&Math.abs(dx)>4&&Math.abs(dx)>Math.abs(dy)*1.15){pointer.engaged=true;button.dataset.dragging='true';button.setPointerCapture(event.pointerId);}
        if(!pointer.engaged)return;
        if(event.cancelable)event.preventDefault();
        const max=def.key==='layer'?(state?.routeLayers||27):def.max;
        const next=pointer.start+dx/Math.max(200,host.clientWidth)*(max-def.min)*1.8;
        send(def.key,clamp(Math.round(next/def.step)*def.step,def.min,max));
      });
      const end=event=>{if(pointer?.button===button&&event.pointerId===pointer.id){button.dataset.dragging='false';if(button.hasPointerCapture(event.pointerId))button.releasePointerCapture(event.pointerId);pointer=null;}};
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
      index=next;grips=[];choices=[];resourceGroups=[];markers=[];modeButton=null;modePoint=null;annotationView='';annotationPositions.clear();captionReserve=0;captionView='';caption.style.minHeight='';root.replaceChildren();root.dataset.study=String(index);
      const def=definitions[index];
      if(def){
        if(def.choices){
          if(def.key==='distance')createResourceGroup('distance','Code distance',[['5','5'],['7','7'],['9','9']],def.label);
          else if(def.key==='repair')createResourceGroup('repair','Stage',def.choices,def.label);
          else if(def.key==='order')createResourceGroup('order','Order',def.choices,def.label);
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
    function position(node,point,fallback){const x=Number(point?.x??fallback[0]),y=Number(point?.y??fallback[1]);node.style.left=`${x*100}%`;node.style.top=`${y*100}%`;node.hidden=point?.visible===false;}
    function update(next,fromDraw=false){
      state=next?.activeIndex!==undefined?next:scene.getState();
      if(!state)return;
      const nextIndex=options.index??state.activeIndex;
      if(nextIndex!==index)build(nextIndex);
      const phoneHome=phoneHomeAnnotations(),shortHome=shortHomeAnnotations(),tinyHome=tinyHomeAnnotations();
      setText(hint,shortHome&&index===1?'Click a stage; weights change the estimate.':shortHome&&index===2?'Drag the window. The final circuit stays the same.':shortHome&&index===3?'Drag the angle; exact Y rotation, joint X/Z products.':shortHome&&index===4?'Drag to turn; new code sizes still need training.':definitions[index]?.hint||'Relations learned by a decoder. A concept view of transfer across code sizes.');
      if(tinyHome){const hints={0:'Drag the marker; click Mode to change paths.',2:'Drag the window; keep the operation.',3:'Drag angle; exact Y rotation, X/Z products.',4:'Drag to turn; new sizes need training.',5:'Drag the axis. Target: equal mix of 0 and 1.'};if(hints[index])setText(hint,hints[index]);}
      if(phoneHome&&index===3)setText(hint,'Drag angle; exact Y rotation, joint X/Z products.');
      if(phoneHome&&index===4)setText(hint,'Drag to turn; transfer still needs training.');
      root.hidden=!visible||!state.ready;
      const nextCaptionView=host.clientWidth+'x'+host.clientHeight+':'+shortHome+':'+tinyHome;
      if(nextCaptionView!==captionView){captionView=nextCaptionView;captionReserve=0;caption.style.minHeight='';}
      for(const {button,def}of grips){
        const value=Number(state[def.key]??def.min),max=def.key==='layer'?(state.routeLayers||27):def.max;
        button.setAttribute('aria-valuemin',String(def.min));button.setAttribute('aria-valuemax',String(max));button.setAttribute('aria-valuenow',String(value));
        button.setAttribute('aria-valuetext',def.key==='angle'?degrees(value):def.key==='gradient'?`θ ${compact(value*Math.PI)} radians`:String(value));
        position(button,anchor(def.key),def.key==='angle'?[.7,.55]:[.69,.5]);
      }
      for(const {button,key,value}of choices)button.setAttribute('aria-pressed',String(String(state[key]??(key==='distance'?5:key==='derivativeOrder'?1:''))===value));
      for(const group of resourceGroups){const points=(state.handles||[]).filter(item=>item.key===group.key);group.point=points.length?{x:points.reduce((sum,item)=>sum+item.x,0)/points.length,y:points.reduce((sum,item)=>sum+item.y,0)/points.length}:{x:.5,y:.35};position(group.node,group.point,[.5,.25]);}
      if(modeButton){
        const mode=state.selectedMode??1;setText(modeButton,`Mode ${mode} ↻`);modeButton.setAttribute('aria-label',`Select next fermionic mode. Current mode ${mode}. Modes 0 to 15.`);
        modePoint=anchor('selectedMode')||anchor('layer');
      }
      let text='';
      if(index===0){const stage=state.example?.route?.stageIndex??-1,name=['Row A','Γ first','Column','Γ second','Row B'][stage]||'Input';text=`${name} · ${state.layer??0} / ${state.routeLayers||27} · relative phase ${state.routeSnapshot?.phase===1?'−1':'+1'}`;}
      if(index===1)text=(shortHome?['Sample signed operations.','Reject flagged runs.','Combine accepted, signed results.']:['Sample the PEC operations with signed weights.','Use error checks to reject flagged runs.','Combine the accepted, signed results.'])[state.repair||0];
      if(index===2)text=['4 gates · each half stays unchanged on its own.','2 gates · H H cancels at the seam. X X remains.','0 gates · X X cancels. The circuit is the identity.'][state.window||0];
      if(index===3){const example=state.example?.gradient,order=state.derivativeOrder||1,theta=(state.gradient||0)*Math.PI,derivative=example?.kthDerivative??Math.cos(theta+order*Math.PI/2);text=`Order ${order} · θ ${compact(theta)} rad · joint readout ${compact(example?.jointExpectation??derivative)}`;}
      if(index===4)text=shortHome?`d = ${state.distance||5} · local proposal → residual decoder`:`Code distance ${state.distance||5} · shared transformer → local proposals → residual decoder`;
      if(index===5){
        const angle=Number(state.angle??52),med=Math.abs(Math.sin(angle*Math.PI/180))/Math.SQRT2,coherent=state.order==='coherent',port=coherent?med*med/2:.5;
        text=`θ ${degrees(angle)} · minus port ${(port*100).toFixed(1)}% · ${coherent?`MED ${med.toFixed(3)}`:'MED not inferred'}`;
        if(tinyHome)text=`θ ${degrees(angle)} · p(−) ${(port*100).toFixed(1)}% · ${coherent?`MED ${med.toFixed(3)}`:'no inferred MED'}`;
      }
      if(tinyHome&&index===2)text=['4 → 4 gates · local window','4 → 2 gates · cancel H H','2 → 0 gates · cancel X X'][state.window||0];
      if(phoneHome&&index===3){const order=state.derivativeOrder||1,theta=(state.gradient||0)*Math.PI; text=`Order ${order} · θ ${compact(theta)} rad · mean ${compact(state.example?.gradient?.jointExpectation??Math.cos(theta+order*Math.PI/2))}`;}
      if(phoneHome&&index===4)text=`d = ${state.distance||5} · proposal → residual decoder`;
      if(state.transition?.active&&state.transition.kind==='peephole'&&index===2)text='Rewriting the selected gates…';
      if(state.transition?.active&&state.transition.kind==='route'&&index===0)text=`Moving to layer ${state.layer} / ${state.routeLayers||27}…`;
      if(state.transition?.active&&state.transition.kind==='derivativeOrder'&&index===3)text='Changing the control registers…';
      if(state.transition?.active&&state.transition.kind==='distance'&&index===4)text='Changing the code size…';
      setText(readout,text);
      const choiceLabels=new Set(choices.map(item=>item.button.textContent));
      const readoutLabels=new Set(['Keep / discard','Move to the seam','Open the seam','H H → I','X X → I','Coherent order control','Definite order','Random order','Tangent','Input grid']);
      let data=(state.markers||[]).filter(item=>item.id!=='route-stage'&&!choiceLabels.has(item.text)&&!readoutLabels.has(item.text)&&!(modeButton&&item.text.startsWith('Mode '))&&!(index===2&&state.transition?.active&&/gates$/.test(item.text)));
      if(phoneHome&&index===3)data=data.filter(item=>['gradient-ancillas','gradient-control','gradient-factors'].includes(item.id)).map(item=>({...item,text:item.id==='gradient-ancillas'?`${state.derivativeOrder||2} control qubits`:item.id==='gradient-factors'?'Joint X…X × Z':item.text}));
      if(tinyHome&&index===3)data=data.filter(item=>item.id==='gradient-control');
      if(phoneHome&&index===4)data=data.filter(item=>['transformer-input','transformer-model','transformer-residual'].includes(item.id)).map(item=>({...item,text:item.id==='transformer-model'?'Transformer':item.text}));
      data=data.map(item=>item.id==='transformer-residual'?{...item,text:'Residual decoder'}:item);
      while(markers.length>data.length)markers.pop().remove();
      while(markers.length<data.length){const label=document.createElement('span');label.className='study-marker';label.setAttribute('aria-hidden','true');root.append(label);markers.push(label);}
      data.forEach((item,i)=>{annotationText(markers[i],item.text);markers[i].dataset.annotation=item.id||item.text.replace(/\d+/g,'#');});
      captionReserve=Math.max(captionReserve,caption.offsetHeight);caption.style.minHeight=`${captionReserve}px`;
      const budget=`${phoneHome}:${captionReserve}`,previousBudget=root.dataset.layoutBudget,budgetChanged=previousBudget!==budget,reflowShortBudget=budgetChanged&&(phoneHome||previousBudget?.startsWith('true:'));root.dataset.layoutBudget=budget;
      if(reflowShortBudget)scene.resize?.();
      layoutAnnotations(data,fromDraw&&!reflowShortBudget);
      root.dataset.parameter=definitions[index]?.key||'none';
    }
    function layoutAnnotations(data,fromDraw=false){
      if(root.hidden)return;
      const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
      const compact=compactAnnotations(),origin=root.getBoundingClientRect(),captionBox=caption.getBoundingClientRect();
      const limit=Math.max(45,captionBox.top-origin.top-12);
      // Parameter values and changing mesh bounds are deliberately absent.
      const view=[index,w,h,Boolean(state.solo!==null&&state.solo!==undefined),Number(state.travel||0).toFixed(3),Number(state.arrival??1).toFixed(3),shortHomeAnnotations()].join(':');
      if(view!==annotationView){annotationView=view;annotationPositions.clear();}
      const px=point=>({x:Number(point?.x??.5)*w,y:Number(point?.y??.5)*h,visible:point?.visible!==false});
      const targetOf=item=>px(item?.target||item);
      const preferredOf=item=>px(item?.layoutPoint||item);
      const rect=(x,y,rw,rh)=>({left:x-rw/2,right:x+rw/2,top:y-rh/2,bottom:y+rh/2});
      const areaOverlap=(a,b,pad=0)=>Math.max(0,Math.min(a.right+pad,b.right)-Math.max(a.left-pad,b.left))*Math.max(0,Math.min(a.bottom+pad,b.bottom)-Math.max(a.top-pad,b.top));
      const occupied=[],background=[],cores=[],lines=[];
      const box=state.stations?.find(item=>item.index===index)?.bounds;
      root.dataset.activeBounds=JSON.stringify(box||null);
      const active=box?{left:box.left*w,right:box.right*w,top:box.top*h,bottom:box.bottom*h}:null;
      const story=host.closest('[data-exhibition]')?.querySelector('[data-story][aria-hidden="false"]');
      if(story){const r=story.getBoundingClientRect();occupied.push({left:r.left-origin.left-8,right:r.right-origin.left+8,top:r.top-origin.top-8,bottom:r.bottom-origin.top+10});}
      for(const station of state.stations||[]){
        if(station.index===index||!station.bounds)continue;
        const b=station.bounds;background.push({left:b.left*w-5,right:b.right*w+5,top:b.top*h-5,bottom:b.bottom*h+5});
      }
      for(const item of [...data,...(state.handles||[])]){
        const p=targetOf(item);if(p.visible)cores.push(rect(p.x,p.y,14,14));
      }
      function apply(node,p,isGrip=false){
        node.hidden=false;
        if(isGrip){const parent=node.parentElement.getBoundingClientRect();node.style.left=(p.x-(parent.left-origin.left))+'px';node.style.top=(p.y-(parent.top-origin.top))+'px';node.style.right='auto';}
        else{node.style.left=p.x+'px';node.style.top=p.y+'px';}
        node.style.transform='translate(-50%,-50%)';
      }
      function leader(id,target,area){
        const edge={x:clamp(target.x,area.left-3,area.right+3),y:clamp(target.y,area.top-3,area.bottom+3)};
        const distance=Math.hypot(target.x-edge.x,target.y-edge.y);
        if(distance<9||distance>(compact?115:165))return;
        const elbow=Math.abs(target.x-edge.x)>Math.abs(target.y-edge.y)?{x:edge.x+(target.x-edge.x)*.35,y:edge.y}:{x:edge.x,y:edge.y+(target.y-edge.y)*.35};
        const number=n=>n.toFixed(1);
        lines.push('<path data-annotation="'+id.replace(/[^a-zA-Z0-9_-]/g,'-')+'" d="M'+number(edge.x)+','+number(edge.y)+' L'+number(elbow.x)+','+number(elbow.y)+' L'+number(target.x)+','+number(target.y)+'"/><circle cx="'+number(target.x)+'" cy="'+number(target.y)+'" r="1.6"/>');
      }
      function place(node,id,item,kind='marker',preferredOverride=null){
        const target=targetOf(item),preferred=preferredOverride||preferredOf(item);
        if(!target.visible||target.x<0||target.x>w||target.y<0||target.y>h){node.hidden=true;return;}
        node.hidden=false;
        if(kind==='marker'||kind==='grip-label'){
          const short=/^(Before|After|Input|Output|Ry\(θ\)|\d+ gates)$/.test(node.textContent);
          node.style.width=(id==='marker-gradient-control'&&compact?110:short?62:compact?92:120)+'px';node.style.maxWidth='none';
        }
        const b=node.getBoundingClientRect(),rw=b.width,rh=b.height;if(!rw||!rh)return;
        const cached=annotationPositions.get(id);
        const followLayout=(index===4&&kind!=='resource')||id==='selected-mode';
        let best=cached?{x:cached.x+(followLayout?preferred.x-cached.referenceX:0),y:cached.y+(followLayout?preferred.y-cached.referenceY:0)}:null;
        if(!best){
          const reach=compact?90:138,dx=preferred.x-target.x,dy=preferred.y-target.y,length=Math.hypot(dx,dy);
          const local=length>reach?{x:target.x+dx/length*reach,y:target.y+dy/length*reach}:preferred;
          const above=rh/2+18,side=rw/2+18;
          const semanticSides={
            'marker-switch-control':{side:'left',gap:18},
            'marker-logical-estimate':{side:'right',gap:18},
            'marker-gradient-factors':{side:'above',gap:compact?28:32},
            'marker-gradient-control':{side:'below',gap:compact?14:30},
            'marker-transformer-input':{side:'above',gap:52,dx:compact?-32:-14},
            'marker-transformer-model':{side:'above',gap:36,dx:compact?16:0}
          },rule=semanticSides[id];
          let candidates=[[local.x,local.y],[target.x,target.y-above],[target.x,target.y+above],[target.x-side,target.y],[target.x+side,target.y],[target.x-46,target.y-above],[target.x+46,target.y-above],[target.x-46,target.y+above],[target.x+46,target.y+above]];
          if(rule){
            const x=target.x+(rule.dx||0)+(rule.side==='left'?-rw/2-rule.gap:rule.side==='right'?rw/2+rule.gap:0),y=target.y+(rule.side==='above'?-rh/2-rule.gap:rule.side==='below'?rh/2+rule.gap:0);
            candidates=rule.side==='left'||rule.side==='right'?[[x,y],[x,y-16],[x,y+16],[x+(rule.side==='left'?-14:14),y]]:[[x,y],[x-12,y],[x+12,y],[x,y+(rule.side==='above'?-14:12)]];
          }
          for(let [x,y]of candidates){
            x=clamp(x,rw/2+7,Math.max(rw/2+7,w-rw/2-7));y=clamp(y,rh/2+7,Math.max(rh/2+7,limit-rh/2));
            if(Math.hypot(x-target.x,y-target.y)>reach+Math.max(rw,rh)/2)continue;
            const area=rect(x,y,rw,rh);
            let score=Math.hypot(x-target.x,y-target.y)+(preferredOverride?1.6:.35)*Math.hypot(x-local.x,y-local.y);
            for(const other of occupied)score+=areaOverlap(area,other,4)*240;
            for(const other of background)score+=areaOverlap(area,other,3)*12;
            if(kind!=='resource')for(const other of cores)score+=areaOverlap(area,other,5)*70;
            if(!best||score<best.score)best={x,y,score};
          }
          if(best&&fromDraw)annotationPositions.set(id,{x:best.x,y:best.y,referenceX:preferred.x,referenceY:preferred.y});
        }
        if(!best){node.hidden=true;return;}
        best={x:clamp(best.x,rw/2+7,Math.max(rw/2+7,w-rw/2-7)),y:clamp(best.y,rh/2+7,Math.max(rh/2+7,limit-rh/2))};
        apply(node,best,kind==='grip-label');
        const area=rect(best.x,best.y,rw,rh);occupied.push(area);
        const ink=node.querySelector('.study-annotation-text')?.getBoundingClientRect();
        const inkArea=ink?{left:ink.left-origin.left,right:ink.right-origin.left,top:ink.top-origin.top,bottom:ink.bottom-origin.top}:area;
        if(kind!=='resource')leader(id,target,inkArea);
      }
      // The manipulation point stays on the physical part. Only its text moves.
      for(const {button,def}of grips){
        const point=anchor(def.key);if(!point)continue;
        position(button,point,[.5,.5]);if(button.hidden)continue;
        const p=px(point);occupied.push(rect(p.x,p.y,28,28));
      }
      // A code distance, derivative order or stage is one selector, not a part.
      // It has no leader that could be mistaken for a circuit connection.
      for(const group of resourceGroups){
        const b=group.node.getBoundingClientRect();
        if(compact){
          const y=captionBox.top-origin.top-25+b.height/2;
          const p={x:w/2,y};apply(group.node,p);occupied.push({left:p.x-b.width/2,right:p.x+b.width/2,top:y-b.height/2,bottom:y-b.height/2+18});
          continue;
        }
        const p={x:w/2,y:b.height/2+2};
        apply(group.node,p);occupied.push(rect(p.x,p.y,b.width,b.height));
      }
      for(const {button,key,value}of choices){
        if(button.closest('.study-resource-group'))continue;
        const point=anchor(key,value);if(point)place(button,'choice-'+key+'-'+value,point,'choice');
      }
      if(modeButton&&modePoint)place(modeButton,'selected-mode',modePoint,'choice');
      data.forEach((item,i)=>{const p=targetOf(item),preferred=item.id==='switch-bases'?{x:p.x-30,y:p.y-56}:item.id==='transformer-residual'?{x:p.x,y:p.y+30}:null;place(markers[i],'marker-'+(item.id||item.text.replace(/\d+/g,'#')),item,'marker',preferred);});
      for(const {button,def}of grips){
        const label=button.querySelector('.study-grip__label'),point=anchor(def.key);
        if(point&&label&&getComputedStyle(label).display!=='none'&&!button.hidden){const p=targetOf(point),before=data.find(item=>item.id==='peephole-before'),after=data.find(item=>item.id==='peephole-after'),preferred=def.key==='window'?{x:p.x,y:before&&after?(targetOf(before).y+targetOf(after).y)/2:p.y+34}:null;place(label,'grip-label-'+def.key,point,'grip-label',preferred);}
      }
      guides.setAttribute('viewBox','0 0 '+w+' '+h);
      const markup=lines.join('');if(guides.innerHTML!==markup)guides.innerHTML=markup;
      root.dataset.annotationLayout='local-stable';
    }
    const draw=()=>update(undefined,true);host.addEventListener('exhibitionscenedraw',draw);update();
    return {update,setVisible(value){visible=Boolean(value);update();},destroy(){host.removeEventListener('exhibitionscenedraw',draw);root.remove();}};
  };
})();
