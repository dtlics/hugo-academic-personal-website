/* Original graphic projection of the validated compiler's mode histories.
   Native WebGL; no library, remote assets, timer or animation loop.
   The authored spatial fold is not a quantitative circuit geometry. */
(function (global) {
  'use strict';
  const TAU = Math.PI * 2;
  const add=(a,b)=>a.map((x,i)=>x+b[i]);
  const sub=(a,b)=>a.map((x,i)=>x-b[i]);
  const mul=(a,k)=>a.map(x=>x*k);
  const dot=(a,b)=>a.reduce((s,x,i)=>s+x*b[i],0);
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const unit=a=>mul(a,1/(Math.hypot(...a)||1));
  const mix=(a,b,t)=>a+(b-a)*t;
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const rgb=hex=>[1,3,5].map(i=>Math.pow(parseInt(hex.slice(i,i+2),16)/255,2.2));
  // Four related clays keep the source rows readable without turning the
  // sculpture into sixteen unrelated coloured wires.
  const materials=['#302936','#544858','#887989','#e5ddce'].map(rgb);
  const warm=rgb('#ce8758'), inner=rgb('#211b29'), seam=rgb('#a96247');
  const VS=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;
    uniform mat4 uProjection;uniform mat4 uModel;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;
    void main(){vec4 p=uModel*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=mat3(uModel)*aNormal;vColor=aColor;gl_Position=uProjection*p;}`;
  const FS=`precision highp float;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;
    uniform vec3 uEye;uniform float uRoughness;
    vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
    void main(){vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 v=normalize(uEye-vPosition);
      vec3 l=normalize(vec3(-0.75,1.5,2.3));vec3 h=normalize(l+v);float ndl=max(dot(n,l),0.0);
      float sky=0.5+0.5*n.y;vec3 ambient=mix(vec3(0.31,0.27,0.32),vec3(0.68,0.73,0.79),sky);
      float power=mix(88.0,19.0,uRoughness);float spec=pow(max(dot(n,h),0.0),power)*0.047;
      float fresnel=pow(1.0-max(dot(n,v),0.0),4.0);float edge=0.032*fresnel;
      vec3 diffuse=vColor*(ambient*0.54+vec3(1.0,0.9,0.79)*ndl*1.22);
      vec3 rim=vec3(0.45,0.54,0.69)*pow(max(dot(n,normalize(vec3(1.8,0.7,-1.4))),0.0),2.0)*0.15;
      vec3 color=aces(diffuse+spec+rim+edge);gl_FragColor=vec4(pow(color,vec3(1.0/2.2)),1.0);}`;

  function shader(gl,type,source){const result=gl.createShader(type);gl.shaderSource(result,source);gl.compileShader(result);if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(result);gl.deleteShader(result);throw new Error(error);}return result;}
  function program(gl){const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VS),f=shader(gl,gl.FRAGMENT_SHADER,FS);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const error=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw new Error(error);}return p;}
  function ortho(left,right,bottom,top,near,far){return new Float32Array([2/(right-left),0,0,0,0,2/(top-bottom),0,0,0,0,-2/(far-near),0,-(right+left)/(right-left),-(top+bottom)/(top-bottom),-(far+near)/(far-near),1]);}
  function modelMatrix(yaw,pitch,x,y){const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch);return new Float32Array([cy,sx*sy,-cx*sy,0,0,cx,sx,0,sy,-sx*cy,cx*cy,0,x,y,0,1]);}

  // An open, asymmetric fold leaves a large quiet void. Layer is the path axis;
  // grid row and column are its two cross-section coordinates.
  function bezier(a,b,c,d,t){const s=1-t;return a.map((v,i)=>s*s*s*v+3*s*s*t*b[i]+3*s*t*t*c[i]+t*t*t*d[i]);}
  function spine(t){return t<.5?bezier([1.34,-1.32,.63],[-.3,-1.66,.3],[-2.03,-1.17,-1.03],[-1.26,.43,-1.04],t*2):bezier([-1.26,.43,-1.04],[-.49,2.03,-1.05],[.85,1.37,-.56],[1.48,.83,1.13],t*2-1);}
  function frame(t){const c=spine(t),tangent=unit(sub(spine(Math.min(1,t+0.0005)),spine(Math.max(0,t-0.0005)))),baseSide=unit(cross(tangent,[0,0,1])),baseDepth=unit(cross(baseSide,tangent)),twist=.12+.64*Math.sin(t*Math.PI)-.23*Math.sin(t*TAU),side=add(mul(baseSide,Math.cos(twist)),mul(baseDepth,Math.sin(twist))),depth=add(mul(baseDepth,Math.cos(twist)),mul(baseSide,-Math.sin(twist)));return {c,tangent,side,depth};}
  function roundedProfile(size,radius){const result=[];for(let corner=0;corner<4;corner++){const sx=corner===0||corner===3?1:-1,sy=corner<2?1:-1;const start=corner*Math.PI/2;for(let k=0;k<4;k++){const a=start+k*Math.PI/6;result.push([sx*(size-radius)+Math.cos(a)*radius,sy*(size-radius)+Math.sin(a)*radius]);}}return result;}
  const profile=roundedProfile(0.158,0.055);

  function geometry(compiled,initial,compiler){
    const count=compiled.layers.length,states=Array.from({length:count+1},(_,layer)=>compiler.simulate(compiled,initial,layer,true));
    const positions=states.map(s=>{const p=Array(16);s.modes.forEach((mode,position)=>p[mode]=position);return p;});
    const divisions=Math.max(84,count*3),paths=[];
    for(let mode=0;mode<16;mode++){
      const points=[];
      for(let step=0;step<=divisions;step++){
        const t=step/divisions,k=t*count,at=Math.min(count-1,Math.floor(k)),q=t===1?1:k-at,e=q*q*(3-2*q),p0=positions[at]?.[mode]??mode,p1=positions[at+1]?.[mode]??p0;
        const r0=Math.floor(p0/4),c0=p0%4,r1=Math.floor(p1/4),c1=p1%4;
        let row=mix(r0,r1,e)-1.5,col=mix(c0,c1,e)-1.5;
        // Grade separation is an authored interpolation between exact layer
        // positions, not an additional gate or a claim about physical wires.
        const lift=Math.sin(q*Math.PI)*0.41;
        if(r0===r1&&c0!==c1)row+=(c1>c0?1:-1)*lift;
        if(c0===c1&&r0!==r1)col+=(r1>r0?1:-1)*lift;
        const f=frame(t);points.push({p:add(f.c,add(mul(f.side,row*0.362),mul(f.depth,col*0.362))),f,t});
      }
      paths.push(points);
    }
    const vertices=[],normals=[],colors=[],segmentRanges=[];
    function triangle(a,b,c,na,nb,nc,color){vertices.push(...a,...b,...c);normals.push(...na,...nb,...nc);colors.push(...color,...color,...color);}
    function quad(a,b,c,d,na,nb,nc,nd,color){triangle(a,b,c,na,nb,nc,color);triangle(a,c,d,na,nc,nd,color);}
    for(let mode=0;mode<16;mode++){
      const points=paths[mode],base=materials[Math.floor(mode/4)],sections=[];
      for(let j=0;j<points.length;j++){
        const p=points[j],tangent=unit(sub(points[Math.min(points.length-1,j+1)].p,points[Math.max(0,j-1)].p)),side=unit(cross(tangent,p.f.depth)),depth=unit(cross(side,tangent));
        sections.push(profile.map(([x,y],index)=>{const a=Math.floor(index/4)*Math.PI/2+(index%4)*Math.PI/6;return {p:add(p.p,add(mul(side,x),mul(depth,y))),n:unit(add(mul(side,Math.cos(a)),mul(depth,Math.sin(a))))};}));
      }
      for(let j=0;j<sections.length-1;j++){
      const start=colors.length;
      for(let k=0;k<profile.length;k++){
        const next=(k+1)%profile.length,a=sections[j][k],b=sections[j+1][k],c=sections[j+1][next],d=sections[j][next];
        // The fixed seam identifies mode zero. The active collar is updated
        // separately, so dragging does not rebuild or resimulate the model.
        const trace=mode===0 && k===2;
        quad(a.p,b.p,c.p,d.p,a.n,b.n,c.n,d.n,trace?seam:base);
      }
      segmentRanges.push({t:(j+.5)/divisions,start,end:colors.length});
      }
      // Recessed dark end centres and bevels make the 4×4 mouth a real volume.
      for(const end of [0,sections.length-1]){
        const isOutput=end>0,centre=points[end].p,f=points[end].f,n=mul(f.tangent,isOutput?1:-1),section=sections[end];
        const recessed=add(centre,mul(n,-.045));
        for(let k=0;k<profile.length;k++){
          const next=(k+1)%profile.length,a=section[k].p,b=section[next].p,ia=add(recessed,mul(sub(a,centre),.76)),ib=add(recessed,mul(sub(b,centre),.76));
          quad(a,b,ib,ia,n,n,n,n,isOutput?base:inner);
          triangle(ia,ib,recessed,n,n,n,inner);
        }
      }
    }
    return {position:new Float32Array(vertices),normal:new Float32Array(normals),baseColor:new Float32Array(colors),count:vertices.length/3,states,paths,segmentRanges,divisions};
  }

  global.createRouteSculpture=function createRouteSculpture(host,initialState){
    if(!host||!global.RouteCompiler)return null;
    let gl,drawProgram,mesh=null,disposed=false,lost=false,raf=0,observer=null,state={},meshKey='',yaw=-.09,pitch=.065,width=0,height=0,projectedSpine=[],drag=null;
    const canvas=document.createElement('canvas');canvas.className='ri-sculpture-canvas';canvas.setAttribute('aria-hidden','true');canvas.tabIndex=-1;
    const ns='http://www.w3.org/2000/svg',hitSvg=document.createElementNS(ns,'svg'),hitPath=document.createElementNS(ns,'path'),handle=document.createElementNS(ns,'circle'),dragLabel=document.createElement('output');
    hitSvg.classList.add('ri-route-hit-area');hitSvg.setAttribute('aria-hidden','true');hitPath.classList.add('ri-route-hit-path');hitPath.setAttribute('fill','none');hitPath.setAttribute('stroke','transparent');handle.classList.add('ri-route-handle');handle.setAttribute('r','5.5');handle.setAttribute('fill','#ce8758');handle.setAttribute('stroke','#f0e9dd');handle.setAttribute('stroke-width','1.5');hitSvg.append(hitPath,handle);
    dragLabel.className='ri-route-drag-label';dragLabel.setAttribute('aria-hidden','true');
    host.dataset.sculptureReady='false';host.dataset.scrubbing='false';host.append(canvas,hitSvg,dragLabel);
    const buffers=[];
    function ready(value){if(host.dataset.sculptureReady===String(value))return;host.dataset.sculptureReady=String(value);host.dispatchEvent(new CustomEvent('sculptureready',{bubbles:false,detail:{ready:value}}));}
    function init(){gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:false,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)throw new Error('WebGL unavailable');drawProgram=program(gl);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);}
    function clearMesh(){while(buffers.length)gl.deleteBuffer(buffers.pop());mesh=null;}
    function colourLayer(){if(!mesh||disposed||lost)return;const {data}=mesh,colors=new Float32Array(data.baseColor),at=state.layer/Math.max(1,state.compiled.layers.length);
      // A complete cross-section receives the collar, including the first and
      // last layer. Its width is fixed in sample space, not a false time scale.
      for(const segment of data.segmentRanges)if(Math.abs(segment.t-at)<.78/data.divisions)for(let i=segment.start;i<segment.end;i+=3){colors[i]=warm[0];colors[i+1]=warm[1];colors[i+2]=warm[2];}
      gl.bindBuffer(gl.ARRAY_BUFFER,mesh.colourBuffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,colors);host.dataset.sculptureLayer=String(state.layer);host.dataset.sculptureLayers=String(state.compiled.layers.length);
    }
    function rebuild(){if(disposed||lost||!state.compiled)return;clearMesh();const data=geometry(state.compiled,state.initial||Array(16).fill(0),global.RouteCompiler);mesh={count:data.count,buffers:[],data};for(const [name,values] of [['aPosition',data.position],['aNormal',data.normal],['aColor',data.baseColor]]){const buffer=gl.createBuffer();buffers.push(buffer);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,values,name==='aColor'?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);mesh.buffers.push({buffer,location:gl.getAttribLocation(drawProgram,name)});if(name==='aColor')mesh.colourBuffer=buffer;}colourLayer();host.dataset.sculptureVertices=String(data.count);}
    function project(point,model,viewWidth,span){const x=model[0]*point[0]+model[4]*point[1]+model[8]*point[2]+model[12],y=model[1]*point[0]+model[5]*point[1]+model[9]*point[2]+model[13];return {x:(.5+x/viewWidth)*width,y:(.5-y/span)*height};}
    function positionHitPath(model,viewWidth,span){projectedSpine=Array.from({length:121},(_,i)=>({...project(spine(i/120),model,viewWidth,span),t:i/120}));hitSvg.setAttribute('viewBox',`0 0 ${width} ${height}`);hitPath.setAttribute('d',projectedSpine.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '));hitPath.setAttribute('stroke-width',String(Math.max(44,1.8*height/span)));const point=project(spine(state.layer/Math.max(1,state.compiled.layers.length)),model,viewWidth,span);handle.setAttribute('cx',point.x.toFixed(2));handle.setAttribute('cy',point.y.toFixed(2));}
    function draw(){raf=0;if(disposed||lost||!mesh||!width||!height)return;try{
      const ratio=Math.min(global.devicePixelRatio||1,1.65),pixelWidth=Math.round(width*ratio),pixelHeight=Math.round(height*ratio);if(canvas.width!==pixelWidth||canvas.height!==pixelHeight){canvas.width=pixelWidth;canvas.height=pixelHeight;}gl.viewport(0,0,pixelWidth,pixelHeight);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(drawProgram);
      const scene=host.closest('.ri-scene'),sceneBox=scene?.getBoundingClientRect(),narrow=sceneBox&&sceneBox.width<=760,hostBox=host.getBoundingClientRect();
      const aspect=width/height,span=narrow?Math.max(6.8,height/sceneBox.width*6.1):5.65,viewWidth=span*aspect,x=narrow?(sceneBox.left+sceneBox.width*.54-hostBox.left)/width:Number(host.dataset.sculptureX||.61),y=Number(host.dataset.sculptureY||.44),projection=ortho(-viewWidth/2,viewWidth/2,-span/2,span/2,-20,20),model=modelMatrix(yaw,pitch,(x-.5)*viewWidth,(.5-y)*span);
      host.dataset.sculptureProjection=[viewWidth,span].map(value=>value.toFixed(2)).join(' × ');
      positionHitPath(model,viewWidth,span);
      gl.uniformMatrix4fv(gl.getUniformLocation(drawProgram,'uProjection'),false,projection);gl.uniformMatrix4fv(gl.getUniformLocation(drawProgram,'uModel'),false,model);gl.uniform3f(gl.getUniformLocation(drawProgram,'uEye'),0,0,15);gl.uniform1f(gl.getUniformLocation(drawProgram,'uRoughness'),.64);
      for(const entry of mesh.buffers){gl.bindBuffer(gl.ARRAY_BUFFER,entry.buffer);gl.vertexAttribPointer(entry.location,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(entry.location);}gl.drawArrays(gl.TRIANGLES,0,mesh.count);
      if(gl.getError()!==gl.NO_ERROR)throw new Error('WebGL draw failed');ready(true);
    }catch(error){ready(false);host.dataset.sculptureError='render';}}
    function requestDraw(){if(!disposed&&!lost&&!raf)raf=requestAnimationFrame(draw);}
    function resize(){if(disposed)return;const box=host.getBoundingClientRect();width=box.width;height=box.height;requestDraw();}
    function setState(detail){if(disposed)return;const incoming=detail||{},oldLayer=state.layer;state={...state,...incoming};if(incoming.perm&&!incoming.compiled&&global.ROUTE_SOURCE)state.compiled=global.RouteCompiler.compile(incoming.perm,global.ROUTE_SOURCE.gammaLayers);state.layer=clamp(Math.floor(Number(state.layer)||0),0,state.compiled?.layers.length||0);try{const key=state.compiled?JSON.stringify(state.compiled.layers.map(layer=>layer.gates))+'|'+(state.initial||[]).join(','):'';if(!mesh||key!==meshKey){rebuild();meshKey=key;}else if(oldLayer!==state.layer)colourLayer();resize();}catch(error){ready(false);host.dataset.sculptureError='geometry';}}
    const reducedMotion=global.matchMedia?.('(prefers-reduced-motion: reduce)');
    function nearestLayer(x,y){let best=Infinity;const candidates=[];for(let i=1;i<projectedSpine.length;i++){const a=projectedSpine[i-1],b=projectedSpine[i],dx=b.x-a.x,dy=b.y-a.y,q=clamp(((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy||1),0,1),px=a.x+dx*q,py=a.y+dy*q,d=Math.hypot(x-px,y-py);best=Math.min(best,d);candidates.push({d,t:mix(a.t,b.t,q)});}const current=state.layer/Math.max(1,state.compiled?.layers.length||0),ties=candidates.filter(candidate=>candidate.d<=best+7);ties.sort((a,b)=>Math.abs(a.t-current)-Math.abs(b.t-current)||a.d-b.d);return Math.round((ties[0]?.t||0)*(state.compiled?.layers.length||0));}
    function scrub(event,force=false){if(!state.compiled||!projectedSpine.length)return;const box=host.getBoundingClientRect(),x=event.clientX-box.left,y=event.clientY-box.top,next=nearestLayer(x,y);dragLabel.value=`Layer ${next} / ${state.compiled.layers.length}`;dragLabel.style.left=`${clamp(x+18,10,Math.max(10,width-130))}px`;dragLabel.style.top=`${clamp(y-46,8,Math.max(8,height-35))}px`;if(force||next!==state.layer){setState({layer:next});host.dispatchEvent(new CustomEvent('routescrub',{bubbles:true,detail:{layer:next,reason:'pointer'}}));}}
    function pointerDown(event){if(event.button!==0||disposed||lost||!mesh)return;event.preventDefault();event.stopPropagation();drag={id:event.pointerId};host.dataset.scrubbing='true';hitPath.setPointerCapture(event.pointerId);scrub(event,true);}
    function pointerMove(event){if(drag){if(drag.id!==event.pointerId)return;event.preventDefault();event.stopPropagation();scrub(event);return;}if(reducedMotion?.matches||event.pointerType==='touch')return;const box=host.getBoundingClientRect();yaw=-.09+(clamp((event.clientX-box.left)/box.width,0,1)-.5)*.095;pitch=.065+(clamp((event.clientY-box.top)/box.height,0,1)-.5)*.055;requestDraw();}
    function leave(){if(drag)return;yaw=-.09;pitch=.065;requestDraw();}
    function pointerEnd(event){if(!drag||drag.id!==event.pointerId)return;event.stopPropagation();drag=null;host.dataset.scrubbing='false';if(hitPath.hasPointerCapture(event.pointerId))hitPath.releasePointerCapture(event.pointerId);leave();}
    function stopClick(event){event.stopPropagation();}
    function contextLost(event){event.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);raf=0;if(drag&&hitPath.hasPointerCapture(drag.id))hitPath.releasePointerCapture(drag.id);drag=null;host.dataset.scrubbing='false';buffers.length=0;mesh=null;ready(false);}
    function contextRestored(){if(disposed)return;lost=false;try{init();rebuild();resize();}catch(error){ready(false);}}
    function destroy(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);observer?.disconnect();global.removeEventListener('resize',resize);hitPath.removeEventListener('pointerdown',pointerDown);hitPath.removeEventListener('pointermove',pointerMove);hitPath.removeEventListener('pointerleave',leave);hitPath.removeEventListener('pointerup',pointerEnd);hitPath.removeEventListener('pointercancel',pointerEnd);hitPath.removeEventListener('lostpointercapture',pointerEnd);hitPath.removeEventListener('click',stopClick);canvas.removeEventListener('webglcontextlost',contextLost);canvas.removeEventListener('webglcontextrestored',contextRestored);if(gl&&!lost){clearMesh();gl.deleteProgram(drawProgram);}canvas.remove();hitSvg.remove();dragLabel.remove();host.dataset.scrubbing='false';ready(false);}
    try{init();canvas.addEventListener('webglcontextlost',contextLost);canvas.addEventListener('webglcontextrestored',contextRestored);hitPath.addEventListener('pointerdown',pointerDown);hitPath.addEventListener('pointermove',pointerMove);hitPath.addEventListener('pointerleave',leave);hitPath.addEventListener('pointerup',pointerEnd);hitPath.addEventListener('pointercancel',pointerEnd);hitPath.addEventListener('lostpointercapture',pointerEnd);hitPath.addEventListener('click',stopClick);if(global.ResizeObserver){observer=new ResizeObserver(resize);observer.observe(host);}else global.addEventListener('resize',resize);setState(initialState);return {setState,resize,destroy};}catch(error){destroy();host.dataset.sculptureError='unavailable';return null;}
  };
})(window);
