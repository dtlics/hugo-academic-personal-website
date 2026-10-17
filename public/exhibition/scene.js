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
    uniform vec3 uEye;uniform float uRoughness;uniform float uFloor;uniform vec3 uStations[6];
    vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
    void main(){if(uFloor>0.5){float shadow=0.0;for(int i=0;i<6;i++){vec2 centre=uStations[i].xz;vec2 d=(vPosition.xz-centre)*vec2(.62,.68);shadow+=exp(-dot(d,d))*.17;}vec3 c=vColor*(1.0-min(.24,shadow));gl_FragColor=vec4(pow(c,vec3(1.0/2.2)),1.0);return;}vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 v=normalize(uEye-vPosition);
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

  /* One perspective scene. The validated route histories above are copied
     unchanged from route-object.js. Their spatial fold is authored, not a
     physical circuit layout. Scroll changes the camera only. Scientific values
     default to moment0/pair52deg and change only through explicit interaction.
     Soft floor marks below are analytic contact-shadow approximations. */
  const FLOOR=-2.15,GALLERY_RADIUS=12,GROUND=rgb('#deded7');
  const STATION_IDS=['fermionic','logical','optimization','gradient','transformer','measurement'];
  const STATIONS=STATION_IDS.map((id,i)=>{const yaw=i*TAU/6;return {id,index:i,yaw,position:[GALLERY_RADIUS*Math.sin(yaw),0,-GALLERY_RADIUS+GALLERY_RADIUS*Math.cos(yaw)],illustrative:i>0&&i<5};});
  function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function lookAt(eye,at){const z=unit(sub(eye,at)),x=unit(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
  function transform(x,y,z,scale=1,yaw=0,pitch=0){const m=modelMatrix(yaw,pitch,x,y);for(const i of [0,1,2,4,5,6,8,9,10])m[i]*=scale;m[14]=z;return m;}
  function surface(points,color){const a=points[0],b=points[1],c=points[2],d=points[3],normal=unit(cross(sub(b,a),sub(c,a)));return {position:new Float32Array([...a,...b,...c,...a,...c,...d]),normal:new Float32Array(Array.from({length:6},()=>normal).flat()),baseColor:new Float32Array(Array.from({length:6},()=>color).flat()),count:6};}
  function pairedRings(degrees=52){
    // Same normals, annulus radii and thickness as measurement-object.js.
    // Its established viewing basis becomes an object-space rigid transform;
    // here both annuli share the perspective camera and floor with the route.
    const right=[.780869,-.624695,0],up=[-.331295,-.414119,.848048],depth=cross(right,up);
    const orient=p=>[dot(p,right),dot(p,up),dot(p,depth)];
    const vertices=[],normals=[],colors=[];
    function quad(points,normal,color){const p=points.map(orient),n=orient(normal);for(const i of [0,1,2,0,2,3]){vertices.push(...p[i]);normals.push(...n);colors.push(...color);}}
    function ring(normal,material,outer,innerRadius){const tangent=[-normal[1],normal[0],0],vertical=[0,0,1],half=.095;
      const point=(radius,angle,d)=>add(mul(normal,d),add(mul(tangent,radius*Math.cos(angle)),mul(vertical,radius*Math.sin(angle))));
      for(let i=0;i<96;i++){const a=i/96*TAU,b=(i+1)/96*TAU,mid=(a+b)/2,radial=add(mul(tangent,Math.cos(mid)),mul(vertical,Math.sin(mid)));
        quad([point(outer,a,half),point(outer,b,half),point(innerRadius,b,half),point(innerRadius,a,half)],normal,material);
        quad([point(outer,b,-half),point(outer,a,-half),point(innerRadius,a,-half),point(innerRadius,b,-half)],mul(normal,-1),material);
        quad([point(outer,a,-half),point(outer,b,-half),point(outer,b,half),point(outer,a,half)],radial,material);
        quad([point(innerRadius,b,-half),point(innerRadius,a,-half),point(innerRadius,a,half),point(innerRadius,b,half)],mul(radial,-1),material);
      }
    }
    ring([1,0,0],rgb('#76977e'),1.35,1.02);const angle=degrees*Math.PI/180;
    ring([Math.cos(angle),Math.sin(angle),0],rgb('#d3aab3'),.94,.57);
    return {position:new Float32Array(vertices),normal:new Float32Array(normals),baseColor:new Float32Array(colors),count:vertices.length/3};
  }

  // The next four forms are original editorial illustrations. Their materials,
  // folds and joins refer to the paper topics; they do not encode a simulation,
  // a measured error rate, gate count, learned attention weight, or derivative.
  function illustrationBuilder(){
    const vertices=[],normals=[],colors=[];
    function tri(a,b,c,na,nb,nc,color){vertices.push(...a,...b,...c);normals.push(...na,...nb,...nc);colors.push(...color,...color,...color);}
    function quad(a,b,c,d,na,nb,nc,nd,color){tri(a,b,c,na,nb,nc,color);tri(a,c,d,na,nc,nd,color);}
    function band(fn,width,thickness,color,twist=0,steps=84){
      const sections=[],sides=12;
      for(let j=0;j<=steps;j++){const t=j/steps,p=fn(t),tangent=unit(sub(fn(Math.min(1,t+.0001)),fn(Math.max(0,t-.0001))));let side=cross(tangent,[0,0,1]);if(Math.hypot(...side)<.05)side=cross(tangent,[0,1,0]);side=unit(side);let depth=unit(cross(side,tangent));const a=typeof twist==='function'?twist(t):twist,ss=add(mul(side,Math.cos(a)),mul(depth,Math.sin(a))),dd=add(mul(depth,Math.cos(a)),mul(side,-Math.sin(a))),w=typeof width==='function'?width(t):width;
        sections.push(Array.from({length:sides},(_,i)=>{const angle=i/sides*TAU,c=Math.cos(angle),s=Math.sin(angle);return {p:add(p,add(mul(ss,w*c),mul(dd,thickness*s))),n:unit(add(mul(ss,c/Math.max(.01,w)),mul(dd,s/thickness)))};}));
      }
      for(let j=0;j<steps;j++)for(let k=0;k<sides;k++){const next=(k+1)%sides,a=sections[j][k],b=sections[j+1][k],c=sections[j+1][next],d=sections[j][next];quad(a.p,b.p,c.p,d.p,a.n,b.n,c.n,d.n,color);}
      for(const j of [0,steps]){const centre=fn(j/steps),n=mul(unit(sub(fn(Math.min(1,j/steps+.0001)),fn(Math.max(0,j/steps-.0001)))),j===0?-1:1);for(let k=0;k<sides;k++)tri(centre,sections[j][k].p,sections[j][(k+1)%sides].p,n,n,n,color);}
    }
    return {band,result:()=>({position:new Float32Array(vertices),normal:new Float32Array(normals),baseColor:new Float32Array(colors),count:vertices.length/3})};
  }
  function logicalIllustration(){const b=illustrationBuilder();
    // Two coupled, woven shells: detection and mitigation as a joint design.
    b.band(t=>[1.18*Math.sin(TAU*t),1.7*Math.cos(TAU*t),.45*Math.sin(2*TAU*t)],.27,.085,rgb('#8d7a92'),t=>.28*Math.sin(TAU*t));
    b.band(t=>[1.04*Math.sin(TAU*t+.48),1.55*Math.cos(TAU*t+.48),-.45*Math.sin(2*TAU*t+.96)+.18],.23,.08,rgb('#d2baa5'),t=>-.35*Math.sin(TAU*t));
    for(const sign of [-1,1])b.band(t=>[mix(-.65,.65,t),sign*1.24,.28*Math.sin(Math.PI*t)],.09,.075,warm,0,24);
    return b.result();
  }
  function optimizationIllustration(){const b=illustrationBuilder(),clays=['#4f4356','#83718a','#b09cad','#e5ddce'];
    // A locally compressed pleat, deliberately horizontal rather than a ring.
    for(let s=0;s<4;s++)b.band(t=>[(t-.5)*3.9,(s-1.5)*.52+.42*Math.cos(3*Math.PI*t),.48*Math.sin(TAU*t+s*.35)],t=>.22-.06*Math.sin(Math.PI*t),.095,rgb(clays[s]),t=>.65*Math.sin(3*Math.PI*t),96);
    b.band(t=>[.25+.18*Math.sin(Math.PI*t),mix(-1.22,1.22,t),.55],.085,.07,warm,0,28);
    return b.result();
  }
  function gradientIllustration(){const b=illustrationBuilder();
    // Balanced split/rejoin branches refer to the Hadamard-test construction.
    for(const side of [-1,1])for(let s=0;s<3;s++)b.band(t=>[side*(.16+1.22*Math.sin(Math.PI*t)),mix(-1.65,1.65,t),(s-1)*.34+.25*Math.sin(TAU*t)],.16,.075,rgb(s===1?'#c79370':s===0?'#5e5165':'#ded5c5'),t=>side*.38*Math.sin(Math.PI*t));
    b.band(t=>[mix(-1.2,1.2,t),.05,.18*Math.sin(Math.PI*t)],.075,.07,rgb('#9b7185'),0,32);return b.result();
  }
  function transformerIllustration(){const b=illustrationBuilder(),clays=['#527568','#8ba895','#d9cfbd'];
    // Layered, connected ribbons suggest transferable relations in a decoder.
    for(let layer=0;layer<3;layer++){
      const z=(layer-1)*.46;
      for(let k=0;k<3;k++)b.band(t=>[mix(-1.5,1.5,t),(k-1)*.95+.22*Math.sin(Math.PI*t+layer*.5),z+.16*Math.sin(TAU*t)],.115,.08,rgb(clays[layer]),t=>.22*Math.sin(TAU*t),64);
      for(let k=0;k<3;k++)b.band(t=>[(k-1)*1.1+.2*Math.sin(Math.PI*t),mix(-1.5,1.5,t),z+.19*Math.cos(TAU*t)],.105,.08,rgb(clays[layer]),.12,64);
    }
    b.band(t=>[mix(-1.34,1.34,t),mix(-1.32,1.32,t),mix(-.6,.6,t)],.10,.075,warm,.15,48);return b.result();
  }
  function floorSeam(){const pos=[],normal=[],color=[],r=GALLERY_RADIUS+.3;for(let i=0;i<192;i++){const a=i/192*TAU,b=(i+1)/192*TAU;for(const [t,s]of[[a,0],[b,0],[b,.012],[a,0],[b,.012],[a,.012]]){pos.push((r+s)*Math.sin(t),FLOOR+.003,-GALLERY_RADIUS+(r+s)*Math.cos(t));normal.push(0,1,0);color.push(...rgb('#c9c6c1'));}}return{position:new Float32Array(pos),normal:new Float32Array(normal),baseColor:new Float32Array(color),count:pos.length/3};}

  global.createExhibitionScene=function createExhibitionScene(host,options){
    if(!host||!options?.compiled||!global.RouteCompiler)return null;
    let gl,p,disposed=false,lost=false,raf=0,observer=null,width=0,height=0,travel=0,arrival=1,overview=Boolean(options.overview),orbit=Number(options.orbit)||0,layer=0,angle=52,meshes=[],camera={eye:[0,.8,8.5],look:[0,.7,0]},viewProjection=null,drag=null;
    const turns=Array(6).fill(0),canvas=document.createElement('canvas');canvas.className='exhibition-scene-canvas';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab;pointer-events:auto';host.appendChild(canvas);host.dataset.sceneReady='false';
    const routeData=geometry(options.compiled,options.initial||Array(16).fill(0),global.RouteCompiler),originalRouteColors=new Float32Array(routeData.baseColor),identity=transform(0,0,0);
    const floorData=surface([[-65,FLOOR,65],[65,FLOOR,65],[65,FLOOR,-75],[-65,FLOOR,-75]],GROUND);
    const data=[routeData,logicalIllustration(),optimizationIllustration(),gradientIllustration(),transformerIllustration(),pairedRings(angle)];
    const scales=[.96,1.06,1.15,1.12,1.2,1.48],heights=[.12,-.03,-.33,-.1,-.17,-.2],pitches=[.065,0,0,0,0,0];
    const definitions=[{data:floorData,model:identity,floor:true},{data:floorSeam(),model:identity,floor:true},...data.map((mesh,i)=>({data:mesh,floor:false,station:i,model:null}))];
    const boundsCache=new WeakMap();
    function bounds(mesh){if(boundsCache.has(mesh))return boundsCache.get(mesh);const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<mesh.position.length;i++){const k=i%3;lo[k]=Math.min(lo[k],mesh.position[i]);hi[k]=Math.max(hi[k],mesh.position[i]);}const result={lo,hi};boundsCache.set(mesh,result);return result;}
    function narrowOverview(){return overview&&width<=700;}
    function overviewPhonePosition(index){
      // An editorial two-column arrangement in world space. Invert the actual
      // camera projection at the floor so three rows use the available height.
      // These positions affect overview composition only, never the home walk.
      const aspect=width/Math.max(1,height),distance=Math.hypot(45,10),tanHalf=9/(distance*Math.max(.25,aspect)),row=Math.floor(index/2),target=[.43,.65,.86][row]+[0,.012,-.008,.006,0,.008][index],n=1-2*target,upY=10/distance,upZ=-45/distance,depth0=45*(45/distance)+7*(10/distance),z=(n*tanHalf*depth0+45*upY+7*upZ)/(upZ+n*tanHalf*(10/distance)),depth=depth0-z*(10/distance),x=([.255,.745,.265,.735,.25,.75][index]*2-1)*depth*tanHalf*aspect;return [x,0,z];
    }
    function positionFor(index){return narrowOverview()?overviewPhonePosition(index):STATIONS[index].position;}
    function modelFor(index){const s=STATIONS[index],position=positionFor(index);if(!narrowOverview())return transform(position[0],heights[index],position[2],scales[index],s.yaw+(index===0?-.09:0)+turns[index]*Math.PI/180,pitches[index]);const model=transform(position[0],0,position[2],scales[index],[-.15,.2,-.12,.18,.1,-.18][index]+turns[index]*Math.PI/180,-.95+pitches[index]),b=bounds(data[index]);let bottom=Infinity;for(let k=0;k<8;k++){const v=[k&1?b.hi[0]:b.lo[0],k&2?b.hi[1]:b.lo[1],k&4?b.hi[2]:b.lo[2]];bottom=Math.min(bottom,model[1]*v[0]+model[5]*v[1]+model[9]*v[2]);}model[13]=FLOOR-bottom+.015;return model;}
    function collar(){const colors=new Float32Array(originalRouteColors),at=layer/Math.max(1,options.compiled.layers.length);for(const segment of routeData.segmentRanges)if(Math.abs(segment.t-at)<.78/routeData.divisions)for(let i=segment.start;i<segment.end;i+=3){colors[i]=warm[0];colors[i+1]=warm[1];colors[i+2]=warm[2];}routeData.baseColor=colors;}
    function upload(def){const buffers=[];for(const[name,values]of[['aPosition',def.data.position],['aNormal',def.data.normal],['aColor',def.data.baseColor]]){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,values,name==='aColor'?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);buffers.push({buffer,location:gl.getAttribLocation(p,name),name});}return {...def,buffers};}
    function build(){collar();meshes=definitions.map(upload);}
    function init(){gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:false,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)throw new Error('WebGL unavailable');p=program(gl);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.clearColor(0,0,0,0);build();}
    function path(value){if(narrowOverview()){const theta=orbit*.15*Math.PI/180;return {eye:[10*Math.sin(theta),45,-3+10*Math.cos(theta)],look:[0,0,-3]};}if(overview){const theta=orbit*Math.PI/180;return {eye:[24*Math.sin(theta),35,-GALLERY_RADIUS+24*Math.cos(theta)],look:[0,0,-GALLERY_RADIUS]};}const theta=value*5*TAU/6,a=arrival*arrival*(3-2*arrival),distance=mix(13,6.5,a),radius=GALLERY_RADIUS+distance;return {eye:[radius*Math.sin(theta),.8,-GALLERY_RADIUS+radius*Math.cos(theta)],look:[GALLERY_RADIUS*Math.sin(theta),.7,-GALLERY_RADIUS+GALLERY_RADIUS*Math.cos(theta)]};}
    function activeIndex(){return clamp(Math.round(travel*5),0,5);}
    function project(point,model=identity){if(!viewProjection)return null;const m=multiply(viewProjection,model),v=[...point,1],p4=Array.from({length:4},(_,r)=>v.reduce((s,x,k)=>s+x*m[k*4+r],0)),x=(p4[0]/p4[3]+1)/2,y=(1-p4[1]/p4[3])/2;return {x,y,depth:p4[3],visible:p4[3]>0&&x>=0&&x<=1&&y>=0&&y<=1};}
    function draw(){raf=0;if(disposed||lost||!width||!height)return;try{
      const ratio=Math.min(global.devicePixelRatio||1,1.65),w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      camera=path(travel);const aspect=width/height,base=44*Math.PI/180,minimumHalfWidth=overview?Math.tan(Math.PI/6):1,fov=narrowOverview()?2*Math.atan(9/(Math.hypot(45,10)*Math.max(.25,aspect))):Math.max(base,2*Math.atan(minimumHalfWidth/Math.max(.36,aspect)));viewProjection=multiply(perspective(fov,aspect,.12,110),lookAt(camera.eye,camera.look));
      gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(p);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uProjection'),false,viewProjection);gl.uniform3fv(gl.getUniformLocation(p,'uEye'),camera.eye);gl.uniform1f(gl.getUniformLocation(p,'uRoughness'),.69);
      gl.uniform3fv(gl.getUniformLocation(p,'uStations[0]'),STATIONS.flatMap((s,i)=>positionFor(i)));
      for(let i=0;i<meshes.length;i++){if(narrowOverview()&&i===1)continue;const mesh=meshes[i];mesh.model=mesh.station===undefined?identity:modelFor(mesh.station);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uModel'),false,mesh.model);gl.uniform1f(gl.getUniformLocation(p,'uFloor'),mesh.floor?1:0);for(const entry of mesh.buffers){gl.bindBuffer(gl.ARRAY_BUFFER,entry.buffer);gl.vertexAttribPointer(entry.location,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(entry.location);}gl.drawArrays(gl.TRIANGLES,0,mesh.data.count);}
      host.dataset.sceneReady=String(gl.getError()===gl.NO_ERROR);host.dataset.sceneTravel=travel.toFixed(4);host.dataset.sceneActive=STATION_IDS[activeIndex()];host.dataset.sceneLayer=String(layer);host.dataset.sceneAngle=String(angle);host.dataset.sceneTurn=String(turns[activeIndex()]);
      host.dispatchEvent(new CustomEvent('exhibitionscenedraw',{bubbles:true,detail:{ready:host.dataset.sceneReady==='true',overview,activeIndex:activeIndex(),stations:stationState()}}));
    }catch(error){host.dataset.sceneReady='false';host.dataset.sceneError='render';}}
    function request(){if(!disposed&&!lost&&!raf)raf=requestAnimationFrame(draw);}
    function resize(){if(disposed)return;const box=host.getBoundingClientRect();width=box.width;height=box.height;request();}
    function setView(view){if(disposed)return;if(view&&'travel'in view)travel=clamp(Number(view.travel)||0,0,1);if(view&&'arrival'in view)arrival=clamp(Number(view.arrival)||0,0,1);if(view&&'overview'in view)overview=Boolean(view.overview);if(view&&'orbit'in view)orbit=Number(view.orbit)||0;request();}
    function interactionState(){return {activeIndex:activeIndex(),activeId:STATION_IDS[activeIndex()],angle,layer,turn:turns[activeIndex()],reason:'api'};}
    function setInteraction(values,reason='api'){
      if(disposed||lost||!values)return;
      if('layer'in values){const next=clamp(Math.round(Number(values.layer)||0),0,options.compiled.layers.length);if(next!==layer){layer=next;collar();const mesh=meshes[2],entry=mesh?.buffers.find(b=>b.name==='aColor');if(entry){gl.bindBuffer(gl.ARRAY_BUFFER,entry.buffer);gl.bufferSubData(gl.ARRAY_BUFFER,0,routeData.baseColor);}}}
      if('angle'in values){const next=clamp(Math.round((Number(values.angle)||0)*10)/10,0,180);if(next!==angle){angle=next;data[5]=pairedRings(angle);definitions[7].data=data[5];for(const entry of meshes[7].buffers)gl.deleteBuffer(entry.buffer);meshes[7]=upload(definitions[7]);}}
      if('turn'in values)turns[activeIndex()]=clamp(Number(values.turn)||0,-85,85);
      request();host.dispatchEvent(new CustomEvent('exhibitioninteraction',{bubbles:true,detail:{...interactionState(),reason}}));
    }
    function pickActive(clientX,clientY){if(!viewProjection)return null;const index=activeIndex(),mesh=data[index],model=modelFor(index),lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<mesh.position.length;i++){const k=i%3;lo[k]=Math.min(lo[k],mesh.position[i]);hi[k]=Math.max(hi[k],mesh.position[i]);}const points=[];for(let k=0;k<8;k++)points.push(project([k&1?hi[0]:lo[0],k&2?hi[1]:lo[1],k&4?hi[2]:lo[2]],model));const box=host.getBoundingClientRect(),x=(clientX-box.left)/box.width,y=(clientY-box.top)/box.height;if(x>=Math.min(...points.map(p=>p.x))-.03&&x<=Math.max(...points.map(p=>p.x))+.03&&y>=Math.min(...points.map(p=>p.y))-.03&&y<=Math.max(...points.map(p=>p.y))+.03)return {index,id:STATION_IDS[index]};return null;}
    function down(event){if(overview||event.button!==0||disposed||lost||!pickActive(event.clientX,event.clientY))return;drag={id:event.pointerId,x:event.clientX,y:event.clientY,turn:turns[activeIndex()],active:activeIndex(),engaged:false};}
    function move(event){if(!drag||event.pointerId!==drag.id)return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.engaged&&Math.abs(dx)>6&&Math.abs(dx)>Math.abs(dy)*1.15){drag.engaged=true;canvas.setPointerCapture(event.pointerId);canvas.style.cursor='grabbing';}if(!drag.engaged)return;if(event.cancelable)event.preventDefault();if(drag.active===activeIndex())setInteraction({turn:drag.turn+dx*.35},'pointer');}
    function up(event){if(!drag||event.pointerId!==drag.id)return;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);drag=null;canvas.style.cursor='grab';}
    function contextLost(event){event.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);raf=0;host.dataset.sceneReady='false';meshes=[];drag=null;}
    function contextRestored(){if(disposed)return;lost=false;try{init();resize();}catch(error){host.dataset.sceneError='unavailable';}}
    function stationState(){return STATIONS.map(s=>{const position=positionFor(s.index),model=modelFor(s.index),b=bounds(data[s.index]),points=[];for(let k=0;k<8;k++)points.push(project([k&1?b.hi[0]:b.lo[0],k&2?b.hi[1]:b.lo[1],k&4?b.hi[2]:b.lo[2]],model));const valid=points.filter(Boolean),box=valid.length?{left:Math.min(...valid.map(p=>p.x)),right:Math.max(...valid.map(p=>p.x)),top:Math.min(...valid.map(p=>p.y)),bottom:Math.max(...valid.map(p=>p.y))}:null,projected=project([position[0],model[13],position[2]]),labelProjected=box?{x:(box.left+box.right)/2,y:box.top-35/Math.max(1,height),depth:projected?.depth,visible:true}:null;return {...s,position:position.slice(),galleryPosition:s.position.slice(),projected,labelProjected,bounds:box};});}
    function getState(){const snapshot=routeData.states[layer];return {travel,arrival,overview,orbit,camera:{eye:camera.eye.slice(),look:camera.look.slice()},...interactionState(),routeLayer:layer,routeSnapshot:snapshot?{bits:snapshot.bits.slice(),modes:snapshot.modes.slice(),phase:snapshot.phase}:null,pairAngle:angle,pairMED:Math.abs(Math.sin(angle*Math.PI/180))/Math.SQRT2,turns:turns.slice(),stations:stationState(),ready:host.dataset.sceneReady==='true'};}
    function destroy(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);observer?.disconnect();global.removeEventListener('resize',resize);for(const[type,fn]of[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['lostpointercapture',up],['webglcontextlost',contextLost],['webglcontextrestored',contextRestored]])canvas.removeEventListener(type,fn);if(gl&&!lost){for(const mesh of meshes)for(const entry of mesh.buffers)gl.deleteBuffer(entry.buffer);gl.deleteProgram(p);}canvas.remove();host.dataset.sceneReady='false';}
    try{init();for(const[type,fn]of[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',up],['lostpointercapture',up],['webglcontextlost',contextLost],['webglcontextrestored',contextRestored]])canvas.addEventListener(type,fn);if(global.ResizeObserver){observer=new ResizeObserver(resize);observer.observe(host);}else global.addEventListener('resize',resize);resize();return {setView,setInteraction,resize,getState,pickActive,destroy};}catch(error){destroy();host.dataset.sceneError='unavailable';return null;}
  };
})(window);
