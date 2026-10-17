/* Controls stay at the working part of each study. No rotation toolbar. */
(() => {
  'use strict';
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const definitions=[
    {key:'layer',min:0,max:27,step:1,label:'Circuit layer',verb:'Trace a layer',hint:'Drag across the 4 × 4 grid. Choose a mode beside it.'},
    {key:'repair',choices:[['0','Sample'],['1','Check'],['2','Combine']],label:'Detection and cancellation',hint:'A concept sketch. Signed weights change the estimate, not the quantum state.'},
    {key:'window',min:0,max:2,step:1,label:'Peephole step',verb:'Move the window',hint:'A small identity circuit. Only the selected gates change.'},
    {key:'gradient',min:-1,max:1,step:.02,label:'Gradient sample',verb:'Move the sample',hint:'Teaching example: f(θ) = cos θ.'},
    null,
    {key:'order',choices:[['ab','A → B'],['coherent','Coherent'],['ba','B → A']],label:'Quantum-switch order',hint:'Example target: an equal mixture of qubit states 0 and 1.'},
  ];
  const degrees=x=>`${Math.round(x)}°`;
  function compact(x){return Math.abs(x)<.0005?'0':Number(x).toFixed(2).replace(/\.00$/,'');}
  globalThis.createStudyControls=function createStudyControls(host,scene,options={}){
    const root=document.createElement('div');root.className='study-actions';root.hidden=options.visible===false;
    host.append(root);
    let index=-1,state=null,visible=options.visible!==false,grips=[],choices=[],markers=[],pointer=null,modeButton=null;
    const readout=document.createElement('p');readout.className='study-actions__readout';readout.setAttribute('aria-live','polite');readout.setAttribute('aria-atomic','true');
    const hint=document.createElement('p');hint.className='study-actions__hint';
    const setText=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
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
    function build(next){
      index=next;grips=[];choices=[];markers=[];modeButton=null;root.replaceChildren();root.dataset.study=String(index);
      const def=definitions[index];
      if(def){
        if(def.choices){
          for(const [value,label]of def.choices){const button=document.createElement('button');button.type='button';button.className='study-choice';button.textContent=label;button.setAttribute('aria-label',`${def.label}: ${label}`);button.dataset.choice=value;button.dataset.parameter=def.key;button.addEventListener('click',()=>send(def.key,def.key==='repair'?Number(value):value));root.append(button);choices.push({button,key:def.key,value});}
        }else createGrip(def);
        if(index===5)createGrip({key:'angle',min:0,max:180,step:1,label:'Measurement basis angle',verb:'Change the bases'});
        hint.textContent=def.hint;
      }else hint.textContent='Relations learned by a decoder. A concept view of transfer across code sizes.';
      if(index===0){
        modeButton=document.createElement('button');modeButton.type='button';modeButton.className='study-choice study-mode';
        modeButton.addEventListener('click',()=>send('selectedMode',((state?.selectedMode??1)+1)%16));root.append(modeButton);
      }
      root.append(readout,hint);
    }
    function anchor(key,value){const handles=state?.handles||[];return handles.find(h=>h.key===key&&(value===undefined||String(h.value)===String(value)))||handles.find(h=>h.key===key);}
    function position(node,point,fallback){const x=clamp(Number(point?.x??fallback[0]),.075,.925),y=clamp(Number(point?.y??fallback[1]),.1,.79);node.style.left=`${x*100}%`;node.style.top=`${y*100}%`;node.dataset.side=x>.72?'left':'right';node.dataset.vertical=y>.65?'above':'center';}
    function update(next){
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
      for(let i=0;i<choices.length;i++){const {button,key,value}=choices[i];button.setAttribute('aria-pressed',String(String(state[key])===value));let point=anchor(key,value);if(index===5&&value==='coherent'&&host.clientWidth<360&&point)point={...point,x:point.x-10/host.clientWidth,y:point.y-18/host.clientHeight};position(button,point,[.34+i*.16,.75]);}
      if(modeButton){
        const mode=state.selectedMode??1;setText(modeButton,`Mode ${mode} ↻`);modeButton.setAttribute('aria-label',`Select next fermionic mode. Current mode ${mode}. Modes 0 to 15.`);
        const board=state.stations?.find(item=>item.index===0)?.bounds,point=anchor('layer');
        position(modeButton,{x:clamp((board?.left??.25)-46/Math.max(1,host.clientWidth),.105,.85),y:point?.y??.25},[.12,.4]);
      }
      let text='';
      if(index===0)text=`Layer ${state.layer??0} / ${state.routeLayers||27} · relative phase ${state.routeSnapshot?.phase===1?'−1':'+1'}`;
      if(index===1)text=['Sample the PEC operations with signed weights.','Use error checks to reject flagged runs.','Combine the accepted, signed results.'][state.repair||0];
      if(index===2)text=['4 gates · each half stays unchanged on its own.','2 gates · H H cancels at the seam. X X remains.','0 gates · X X cancels. The circuit is the identity.'][state.window||0];
      if(index===3){const theta=(state.gradient||0)*Math.PI;text=`θ ${compact(theta)} rad · slope ${compact(-Math.sin(theta))} · second derivative ${compact(-Math.cos(theta))}`;}
      if(index===4)text='Local error checks → decoder → correction';
      if(index===5){
        const angle=Number(state.angle??52),med=Math.abs(Math.sin(angle*Math.PI/180))/Math.SQRT2,coherent=state.order==='coherent',port=coherent?med*med/2:.5;
        text=`θ ${degrees(angle)} · minus port ${(port*100).toFixed(1)}% · ${coherent?`MED ${med.toFixed(3)}`:'MED needs coherent order'}`;
      }
      setText(readout,text);
      const choiceLabels=new Set(choices.map(item=>item.button.textContent));
      const readoutLabels=new Set(['Keep / discard','Open the seam','H H → I','X X → I','Coherent order control','Definite order','Random order','Tangent']);
      const data=(state.markers||[]).filter(item=>!choiceLabels.has(item.text)&&!readoutLabels.has(item.text)&&!(modeButton&&item.text.startsWith('Mode ')));
      while(markers.length>data.length)markers.pop().remove();
      while(markers.length<data.length){const label=document.createElement('span');label.className='study-marker';label.setAttribute('aria-hidden','true');root.append(label);markers.push(label);}
      data.forEach((item,i)=>{setText(markers[i],item.text);position(markers[i],item,[.5,.5]);});
      root.dataset.parameter=definitions[index]?.key||'none';
    }
    const draw=()=>update();host.addEventListener('exhibitionscenedraw',draw);update();
    return {update,setVisible(value){visible=Boolean(value);update();},destroy(){host.removeEventListener('exhibitionscenedraw',draw);root.remove();}};
  };
})();
