/* Semantic research studies in one native WebGL exhibition.
   Exact numerical examples use the validated local compiler and analytic models.
   Circuit diagrams and gallery positions are authored presentation geometry. */
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
  const warm=rgb('#ce8758'), inner=rgb('#211b29');
  const VS=`attribute vec3 aPosition;attribute vec3 aNormal;attribute vec3 aColor;
    uniform mat4 uProjection;uniform mat4 uModel;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;
    void main(){vec4 p=uModel*vec4(aPosition,1.0);vPosition=p.xyz;vNormal=mat3(uModel)*aNormal;vColor=aColor;gl_Position=uProjection*p;}`;
  const FS=`precision highp float;varying vec3 vPosition;varying vec3 vNormal;varying vec3 vColor;
    uniform vec3 uEye;uniform float uRoughness;uniform float uFloor;uniform vec3 uStations[6];uniform float uContext;uniform vec3 uGround;uniform float uSolo;uniform float uShadowOnly;
    vec3 aces(vec3 x){return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14),0.0,1.0);}
    void main(){if(uFloor>0.5){float shadow=0.0;for(int i=0;i<6;i++){if(uSolo>=0.0&&abs(float(i)-uSolo)>.1)continue;vec2 centre=uStations[i].xz;vec2 d=(vPosition.xz-centre)*vec2(.62,.68);shadow+=exp(-dot(d,d))*.17;}if(uShadowOnly>.5){if(shadow<.002)discard;gl_FragColor=vec4(.18,.13,.2,shadow*.6);return;}vec3 c=vColor*(1.0-min(.24,shadow));gl_FragColor=vec4(pow(c,vec3(1.0/2.2)),1.0);return;}vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;vec3 v=normalize(uEye-vPosition);
      vec3 l=normalize(vec3(-0.75,1.5,2.3));vec3 h=normalize(l+v);float ndl=max(dot(n,l),0.0);
      float sky=0.5+0.5*n.y;vec3 ambient=mix(vec3(0.31,0.27,0.32),vec3(0.68,0.73,0.79),sky);
      float power=mix(88.0,19.0,uRoughness);float spec=pow(max(dot(n,h),0.0),power)*0.047;
      float fresnel=pow(1.0-max(dot(n,v),0.0),4.0);float edge=0.032*fresnel;
      vec3 diffuse=vColor*(ambient*0.54+vec3(1.0,0.9,0.79)*ndl*1.22);
      vec3 rim=vec3(0.45,0.54,0.69)*pow(max(dot(n,normalize(vec3(1.8,0.7,-1.4))),0.0),2.0)*0.15;
      vec3 color=mix(aces(diffuse+spec+rim+edge),uGround,uContext);gl_FragColor=vec4(pow(color,vec3(1.0/2.2)),1.0);}`;

  function shader(gl,type,source){const result=gl.createShader(type);gl.shaderSource(result,source);gl.compileShader(result);if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(result);gl.deleteShader(result);throw new Error(error);}return result;}
  function program(gl){const p=gl.createProgram(),v=shader(gl,gl.VERTEX_SHADER,VS),f=shader(gl,gl.FRAGMENT_SHADER,FS);gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);if(!gl.getProgramParameter(p,gl.LINK_STATUS)){const error=gl.getProgramInfoLog(p);gl.deleteProgram(p);throw new Error(error);}return p;}
  function modelMatrix(yaw,pitch,x,y){const cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch);return new Float32Array([cy,sx*sy,-cx*sy,0,0,cx,sx,0,sy,-sx*cy,cx*cy,0,x,y,0,1]);}

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

  // Mesh primitives share one material and perspective space. Spatial spacing
  // is editorial; numerical metadata states which examples are exact.
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
/* Integrate this function in scene.js, where semanticBuilder and labeled exist.
   Architectural schematic, verified against arXiv:2311.16082, Section 3,
   Figures 4 and 6. No trained model is run by this view. */
function transformerIllustration(optionalDistance=5,visualDistance=optionalDistance){
  const distance=[5,7,9].includes(Number(optionalDistance))?Number(optionalDistance):5;
  const displayedDistance=clamp(Number(visualDistance)||5,5,9),displayedInputSide=displayedDistance+1,displayedQuerySide=displayedDistance;
  const b=semanticBuilder(),green=rgb('#527568'),sage=rgb('#8ba895'),porcelain=rgb('#d9cfbd'),plum=rgb('#88718f'),quiet=rgb('#b3b9ad'),ink=rgb('#384e46');
  let displayedInputPoints=0,displayedQueryPoints=0;
  const inputSide=distance+1,querySide=distance,inputSpan=.73+(displayedDistance-5)*.065,querySpan=.53+(displayedDistance-5)*.045;
  function arrow(a,c,color=green,r=.032){
    b.line(a,c,r,color);
    const direction=unit(sub(c,a)),side=unit(cross(direction,[0,0,1]));
    for(const sign of[-1,1])b.line(c,add(sub(c,mul(direction,.13)),mul(side,.075*sign)),r,color);
  }
  function curvedArrow(fn,color=green,r=.032){
    b.curve(fn,r,color,40);
    arrow(fn(.94),fn(1),color,r);
  }
  function ring(centre,r,color){b.curve(t=>add(centre,[r*Math.cos(t*TAU),r*Math.sin(t*TAU),0]),.035,color,48);}
  function xor(centre,r=.15){ring(centre,r,plum);b.symbol('+',centre[0],centre[1],centre[2]+.03,r*1.35,ink);}
  function letterP(x,y,z,size,color){
    for(const q of[[0,-.4,0,.4],[0,.4,.3,.4],[.3,.4,.3,.02],[.3,.02,0,.02]])b.line([x+q[0]*size,y+q[1]*size,z],[x+q[2]*size,y+q[3]*size,z],.024,color);
  }
  // Three time slices are a representative subset of the padded input volume.
  // Their material values distinguish depth, not measured syndrome values.
  const inputCentre=[-2.06,.57,-.12];
  for(let time=0;time<3;time++){
    const z=(time-1)*.30,xShift=(time-1)*.09,yShift=(time-1)*.075;
    for(let row=0;row<Math.ceil(displayedInputSide);row++)for(let col=0;col<Math.ceil(displayedInputSide);col++){
      const strength=Math.min(clamp(displayedInputSide-row,0,1),clamp(displayedInputSide-col,0,1));if(strength<.001)continue;
      const x=inputCentre[0]+(col/(displayedInputSide-1)-.5)*inputSpan+xShift,y=inputCentre[1]+(row/(displayedInputSide-1)-.5)*inputSpan+yShift;
      const size=(.040+(9-displayedDistance)*.003)*Math.sqrt(strength);displayedInputPoints++;
      b.box(x,y,z,size,size,.10,time===2?sage:porcelain,green);
    }
  }
  // The representative model assembly is constant across distances. It depicts
  // encoder self-attention/FFN and decoder context/query relations; the three
  // visible routes are not learned attention strengths or a head-count claim.
  const encoder=[-.66,.66,0],decoder=[.61,.66,.20];
  for(const [centre,color]of[[encoder,green],[decoder,plum]]){
    for(let head=0;head<3;head++){
      const y=centre[1]+(head-1)*.29,z=centre[2]+(head-1)*.20;
      b.box(centre[0]-.10,y,z,.32,.20,.24,color,ink);
      b.line([centre[0]+.07,y,z],[centre[0]+.26,y,centre[2]],.033,color);
    }
    b.box(centre[0]+.28,centre[1],centre[2],.15,.94,.46,porcelain,color);
    // Quiet parallel connections show a residual route inside each model block.
    b.curve(t=>[centre[0]-.31+.66*t,centre[1]+.64*Math.sin(Math.PI*t),centre[2]-.27],.023,quiet,32);
  }
  for(let link=0;link<3;link++){
    const a=[-1.48,.57+(link-1)*.25,(link-1)*.20],c=[encoder[0]-.27,encoder[1]+(link-1)*.29,(link-1)*.20];
    curvedArrow(t=>[mix(a[0],c[0],t),mix(a[1],c[1],t)+.075*Math.sin(Math.PI*t),mix(a[2],c[2],t)],green,.027);
  }
  // Encoder context crosses to the decoder in depth, so the two model volumes
  // remain separately legible from the front and the elevated overview.
  curvedArrow(t=>[mix(-.28,.33,t),.66+.10*Math.sin(Math.PI*t),mix(0,.20,t)],green,.045);
  // A second, lower field supplies positional queries for data locations.
  // It is not an error prediction, a syndrome sample, or a physical-qubit count.
  const queryCentre=[.50,-.31,.54];
  for(let time=0;time<3;time++)for(let row=0;row<Math.ceil(displayedQuerySide);row++)for(let col=0;col<Math.ceil(displayedQuerySide);col++){
    const strength=Math.min(clamp(displayedQuerySide-row,0,1),clamp(displayedQuerySide-col,0,1));if(strength<.001)continue;
    const x=queryCentre[0]+(col/(displayedQuerySide-1)-.5)*querySpan+(time-1)*.07,y=queryCentre[1]+(row/(displayedQuerySide-1)-.5)*querySpan+(time-1)*.045,z=queryCentre[2]+(time-1)*.19,size=.030*Math.sqrt(strength);displayedQueryPoints++;
    b.box(x,y,z,size,size,.07,time===2?porcelain:rgb('#a6b3a2'),sage);
  }
  curvedArrow(t=>[mix(.50,.53,t),mix(.03,.37,t),mix(.72,.30,t)],plum,.036);
  // P is the architecture's local physical-error proposal stage. No binary
  // proposal, confidence, predicted chain, or decoder result is invented here.
  arrow([.98,.66,.20],[1.63,.66,.20],plum,.044);
  b.box(1.89,.66,.20,.47,.54,.30,porcelain,green);letterP(1.80,.66,.38,.43,green);
  // The original syndrome and the proposal's boundary both enter the residual
  // reconciliation node. The path sits behind the positional-query field.
  const residual=[.10,-1.05,-.17],globalDecoder=[1.08,-1.05,0],final=[2.14,-1.05,.20];
  curvedArrow(t=>[-1.78+1.74*t,.09-1.14*Math.sin(t*Math.PI/2),mix(-.34,-.17,t)],quiet,.026);
  curvedArrow(t=>[1.89-1.65*t,.36-1.41*t,-.12-.05*t-.20*Math.sin(Math.PI*t)],green,.031);
  xor(residual,.14);arrow([.27,-1.05,-.15],[.73,-1.05,0],green,.037);
  // The conventional global decoder is deliberately distinct from the two
  // multi-head model volumes: one solid, bevelled classical process block.
  b.box(globalDecoder[0],globalDecoder[1],globalDecoder[2],.54,.42,.36,sage,green);
  for(let k=0;k<3;k++)b.line([.94+k*.14,-1.17,.20],[.94+k*.14,-.93,.20],.018,ink);
  arrow([1.38,-1.05,.05],[1.95,-1.05,.18],green,.037);
  // The proposal parity takes the separate right-hand branch into the final
  // XOR. The other input is the conventional decoder's global parity.
  curvedArrow(t=>[1.89+.25*t+.37*Math.sin(Math.PI*t),.36-1.25*t,.21],plum,.033);
  xor(final,.16);arrow([2.32,-1.05,.20],[2.61,-1.05,.20],plum,.035);
  b.ball([2.65,-1.05,.20],.065,porcelain);
  // A quiet connector gives the three native distance choices an input-field
  // anchor. The page controller can route their 44 px targets if needed.
  b.line([-2.06,-.01,.18],[-2.06,-1.25,.18],.018,quiet);
  const handles=[5,7,9].map((value,i)=>({key:'distance',value,point:[-2.55+i,-1.45,.45]}));
  const markers=[
    {text:'Syndrome + positions',point:[-2.06,1.34,.15]},
    {text:'Encoder → Decoder',point:[-.02,1.49,.20]},
    {text:'Data-position queries',point:[.50,-.74,.76]},
    {text:'Local proposal',point:[1.89,1.25,.38]},
    {text:'Residual → global decoder → XOR',point:[1.16,-1.69,.25]}
  ];
  return labeled(b.result(),handles,markers,{transformer:{
    distance,visualDistance:displayedDistance,paddedInputSide:inputSide,querySide,tokenVolume:inputSide**3,queryVolume:querySide**3,
    displayedTimeSlices:3,displayedInputPoints,displayedQueryPoints,
    sampling:'Representative positions only; padded feature cells and position queries are not physical-qubit counts.',
    modelArchitecture:'Reused encoder/decoder architecture; weights are fine-tuned on data for the new code distance.',
    representativeRelationLinks:3,attentionWeights:null,proposal:null,inferredParity:null,
    workflow:['syndrome features and 3D positions','encoder','decoder with data-position queries','local physical-error proposal P','residual syndrome s XOR boundary(P)','conventional global decoder G','parity(P) XOR parity(G)'],
    scope:'architecture view; no trained weights or decoder inference',
    source:'https://arxiv.org/html/2311.16082v1#S3'
  }});
}

  function floorSeam(){const pos=[],normal=[],color=[],r=GALLERY_RADIUS+.3;for(let i=0;i<192;i++){const a=i/192*TAU,b=(i+1)/192*TAU;for(const [t,s]of[[a,0],[b,0],[b,.012],[a,0],[b,.012],[a,.012]]){pos.push((r+s)*Math.sin(t),FLOOR+.003,-GALLERY_RADIUS+(r+s)*Math.cos(t));normal.push(0,1,0);color.push(...rgb('#c9c6c1'));}}return{position:new Float32Array(pos),normal:new Float32Array(normal),baseColor:new Float32Array(color),count:pos.length/3};}

  function joinMeshes(parts){const count=parts.reduce((n,p)=>n+p.position.length,0),position=new Float32Array(count),normal=new Float32Array(count),baseColor=new Float32Array(count);let at=0;for(const part of parts){position.set(part.position,at);normal.set(part.normal,at);baseColor.set(part.baseColor,at);at+=part.position.length;}return{position,normal,baseColor,count:count/3};}
  function movedMesh(data,m){const position=new Float32Array(data.position.length),normal=new Float32Array(data.normal.length);for(let i=0;i<data.position.length;i+=3){const v=Array.from(data.position.slice(i,i+3)),n=Array.from(data.normal.slice(i,i+3));for(let r=0;r<3;r++){position[i+r]=m[r]*v[0]+m[4+r]*v[1]+m[8+r]*v[2]+m[12+r];normal[i+r]=m[r]*n[0]+m[4+r]*n[1]+m[8+r]*n[2];}}return{position,normal,baseColor:data.baseColor,count:data.count};}
  function semanticBuilder(){
    const lines=illustrationBuilder(),parts=[];
    function line(a,b,r,color){lines.band(t=>add(a,mul(sub(b,a),t)),r,r,color,0,8);}
    function curve(fn,r,color,steps=48){lines.band(fn,r,r,color,0,steps);}
    function quad(points,n,color){const p=[],nn=[],c=[];for(const i of[0,1,2,0,2,3]){p.push(...points[i]);nn.push(...n);c.push(...color);}parts.push({position:new Float32Array(p),normal:new Float32Array(nn),baseColor:new Float32Array(c),count:6});}
    function box(x,y,z,w,h,d,color,edgeColor=color){if(w<.13&&h<.13){const p=(a,b,c)=>[x+a*w/2,y+b*h/2,z+c*d/2];quad([p(-1,-1,1),p(1,-1,1),p(1,1,1),p(-1,1,1)],[0,0,1],color);quad([p(1,-1,-1),p(-1,-1,-1),p(-1,1,-1),p(1,1,-1)],[0,0,-1],edgeColor);quad([p(1,-1,1),p(1,-1,-1),p(1,1,-1),p(1,1,1)],[1,0,0],edgeColor);quad([p(-1,-1,-1),p(-1,-1,1),p(-1,1,1),p(-1,1,-1)],[-1,0,0],edgeColor);quad([p(-1,1,1),p(1,1,1),p(1,1,-1),p(-1,1,-1)],[0,1,0],edgeColor);quad([p(-1,-1,-1),p(1,-1,-1),p(1,-1,1),p(-1,-1,1)],[0,-1,0],edgeColor);return;}const b=Math.min(.055,w*.18,h*.18,d*.3),r=Math.min(.12,w/5,h/5),profile=(ww,hh,rr)=>{const result=[];for(let k=0;k<4;k++){const cx=(k===0||k===3?1:-1)*(ww/2-rr),cy=(k<2?1:-1)*(hh/2-rr);for(let j=0;j<=3;j++){const a=k*Math.PI/2+j*Math.PI/6;result.push([cx+rr*Math.cos(a),cy+rr*Math.sin(a)]);}}return result;},outer=profile(w,h,r),innerProfile=profile(w-b*2,h-b*2,Math.max(.0001,r-b)),p=(v,zz)=>[x+v[0],y+v[1],z+zz];for(let i=0;i<outer.length;i++){const j=(i+1)%outer.length,a=outer[i],bb=outer[j],ia=innerProfile[i],ib=innerProfile[j],side=unit([a[0]+bb[0],a[1]+bb[1],0]),bevel=unit(add(side,[0,0,1]));quad([p(a,-d/2),p(bb,-d/2),p(bb,d/2-b),p(a,d/2-b)],side,edgeColor);quad([p(a,d/2-b),p(bb,d/2-b),p(ib,d/2),p(ia,d/2)],bevel,edgeColor);quad([[x,y,z+d/2],p(ia,d/2),p(ib,d/2),[x,y,z+d/2]],[0,0,1],color);quad([[x,y,z-d/2],p(bb,-d/2),p(a,-d/2),[x,y,z-d/2]],[0,0,-1],edgeColor);}}
    function ball(point,r,color,detail=8){const sectors=detail+4;for(let a=0;a<detail;a++)for(let b=0;b<sectors;b++){const v=(i,j)=>{const u=i/detail*Math.PI,vv=j/sectors*TAU;return[Math.sin(u)*Math.cos(vv),Math.cos(u),Math.sin(u)*Math.sin(vv)];},normals=[v(a,b),v(a,b+1),v(a+1,b+1),v(a+1,b)],points=normals.map(n=>add(point,mul(n,r)));quad(points,unit(add(add(normals[0],normals[1]),add(normals[2],normals[3]))),color);}}
    function symbol(letter,x,y,z,size,color){const maps={H:[[-.32,-.45,-.32,.45],[.32,-.45,.32,.45],[-.32,0,.32,0]],X:[[-.32,-.45,.32,.45],[-.32,.45,.32,-.45]],I:[[-.3,.45,.3,.45],[0,.45,0,-.45],[-.3,-.45,.3,-.45]],A:[[-.34,-.45,0,.45],[0,.45,.34,-.45],[-.2,-.05,.2,-.05]],B:[[-.3,-.45,-.3,.45],[-.3,.45,.18,.45],[.18,.45,.34,.23],[.34,.23,.18,0],[.18,0,-.3,0],[.18,0,.34,-.23],[.34,-.23,.18,-.45],[.18,-.45,-.3,-.45]],'+':[[-.35,0,.35,0],[0,-.35,0,.35]],'-':[[-.35,0,.35,0]]};for(const s of maps[letter]||[])line([x+s[0]*size,y+s[1]*size,z],[x+s[2]*size,y+s[3]*size,z],.025*size,color);}
    function gate(letter,x,y,color=rgb('#ded5c5'),size=.62){box(x,y,0,size,size,.24,color);symbol(letter,x,y,.155,size*.62,inner);}
    function bracket(x,y,w,h,color=warm){const z=.28,l=.2;for(const sx of[-1,1])for(const sy of[-1,1]){const p=[x+sx*w/2,y+sy*h/2,z];line(p,[p[0]-sx*l,p[1],z],.045,color);line(p,[p[0],p[1]-sy*l,z],.045,color);}}
    return{line,curve,box,ball,symbol,gate,bracket,add:data=>parts.push(data),result:()=>joinMeshes([...parts,lines.result()])};
  }
  function labeled(mesh,handles,markers,example){return Object.assign(mesh,{localHandles:handles,localMarkers:markers,example});}
  function routeGrid(spec,selectedMode,visualLayer=spec.layer){const b=semanticBuilder(),count=spec.compiled.layers.length,states=Array.from({length:count+1},(_,layer)=>global.RouteCompiler.simulate(spec.compiled,spec.initial,layer,spec.includeGamma)),snapshot=states[spec.layer],display=clamp(visualLayer,0,count),at=count?display/count:0,point=(position,t)=>[mix(-1.05,1.05,t)+(position%4-1.5)*.48,mix(-.25,.3,t)+(1.5-Math.floor(position/4))*.48,mix(-1.65,1.65,t)];
    // Six sparse moment sections carry actual grid coordinates. Only one mode
    // has a continuous path. Depth is circuit progress, not a physical wire.
    const milestones=[0];let total=0;for(const stage of spec.compiled.stages){total+=stage.length;if(!milestones.includes(total))milestones.push(total);}for(const layer of milestones){const t=count?layer/count:0,color=layer===spec.layer?rgb('#9e899e'):rgb('#b7aab7');for(let r=0;r<4;r++){const a=point(r*4,t),z=point(r*4+3,t);b.line(a,z,.016,color);}for(let index=0;index<16;index++)b.ball(point(index,t),.045,color,4);}
    const selectedAt=layer=>states[layer].modes.indexOf(selectedMode),routePoint=value=>{const k=clamp(value,0,count),lo=Math.floor(k),hi=Math.min(count,lo+1),q=k-lo;return add(mul(point(selectedAt(lo),count?lo/count:0),1-q),mul(point(selectedAt(hi),count?hi/count:0),q));};
    if(count){b.curve(t=>routePoint(t*count),.034,rgb('#8d7895'),Math.max(36,count*3));if(display>.0001)b.curve(t=>routePoint(t*display),.052,warm,Math.max(12,Math.ceil(display*3)));}
    const p=routePoint(display),ports=states[Math.round(display)].modes.map((mode,position)=>({mode,position,point:point(position,at)}));for(let r=0;r<4;r++){b.line(point(r*4,at),point(r*4+3,at),.025,warm);}for(const port of ports)b.ball(port.point,port.mode===selectedMode?.12:.055,port.mode===selectedMode?warm:rgb('#6f5b78'),4);b.ball(p,.125,warm);b.ball(add(p,[0,0,.1]),.045,inner,4);
    const pos=snapshot.modes.indexOf(selectedMode),input=point(0,0),output=point(15,1);return labeled(b.result(),[{key:'layer',value:spec.layer,point:add(p,[0,0,.12])}],[{text:`Mode ${selectedMode}`,point:add(p,[0,.34,.06])},{text:'Input',point:add(input,[-.15,.42,0])},{text:'Output',point:add(output,[.1,-.38,0])},{text:spec.layer?spec.compiled.layers[spec.layer-1]?.name:'Input grid',point:[.15,1.65,.6]}],{route:{selectedMode,position:pos,row:Math.floor(pos/4),column:pos%4,stage:spec.layer?spec.compiled.layers[spec.layer-1]?.name:'Input',snapshot,ports,visualLayer:display,milestones,projection:'one selected mode through exact moment positions; depth spacing is editorial'}});
  }
  function errorWorkflow(stage){const b=semanticBuilder(),quiet=rgb('#b3a4b4'),active=i=>i===stage?warm:rgb('#76677b');
    // PEC sampling is before execution. The final signed combination is a
    // classical estimator, never a physical inverse-noise or repair gate.
    b.line([-2.3,-.2,0],[2.25,-.2,0],.055,quiet);b.box(-1.55,-.2,0,.68,.68,.23,active(0));b.symbol('+',-1.67,-.2,.15,.35,inner);b.symbol('-',-1.39,-.2,.15,.35,inner);
    b.box(-.1,-.2,0,.65,.8,.23,active(1));b.line([-.29,-.2,.16],[-.11,-.39,.16],.035,inner);b.line([-.11,-.39,.16],[.22,.11,.16],.035,inner);
    b.curve(t=>[mix(-.1,.75,t),-.2-1.05*Math.sin(t*Math.PI/2),0],.045,stage===1?warm:quiet);b.line([.55,-1.05,.05],[.95,-1.45,.05],.045,inner);b.line([.55,-1.45,.05],[.95,-1.05,.05],.045,inner);
    b.ball([.85,-.2,0],.12,rgb('#76977e'));b.line([1.1,-.2,0],[1.6,.33,0],.04,active(2));b.line([1.1,-.2,0],[1.6,-.73,0],.04,active(2));b.symbol('+',1.63,.33,.08,.5,active(2));b.symbol('-',1.63,-.73,.08,.5,active(2));b.line([1.85,.33,0],[2.28,-.2,0],.04,active(2));b.line([1.85,-.73,0],[2.28,-.2,0],.04,active(2));b.ball([2.28,-.2,0],.12,active(2));
    b.curve(t=>[mix(-1.8,-.2,t),1.15+.2*Math.sin(Math.PI*t),-.2],.035,quiet);b.box(-1.8,1.15,-.2,.5,.4,.15,rgb('#d2baa5'));b.box(-.2,1.15,-.2,.6,.4,.15,rgb('#d2baa5'));b.curve(t=>[-.2-1.35*t,1.15-1.0*t,-.2],.025,quiet);
    return labeled(b.result(),[{key:'repair',value:0,point:[-1.55,-.67,.1]},{key:'repair',value:1,point:[-.1,-.77,.1]},{key:'repair',value:2,point:[1.72,-1.15,.1]}],[{text:'Learn noise → weights',point:[-1,1.68,-.2]},{text:'Sample',point:[-1.55,.38,.1]},{text:'Check',point:[-.1,.45,.1]},{text:'Keep / discard',point:[.75,-1.7,0]},{text:'Signed estimate',point:[1.9,.85,.1]}],{logical:{stage,kind:'operational schematic',samplingBeforeExecution:true,weighting:'classical signed estimator'}});
  }
  function peepholeStudy(step,visualStep=step){const b=semanticBuilder(),sourceY=.85,resultY=-.7,labels=['X','H','H','X'],v=clamp(visualStep,0,2),first=clamp(v,0,1),second=clamp(v-1,0,1),current=step===2?['X','X']:labels,selected=step===0?[0,1]:step===1?[1,2]:[0,1],upperX=mix(1.65,.55,second),lowerX=mix(1.65,.55,first)*(1-second);b.line([-2.25,sourceY,0],[2.25,sourceY,0],.045,rgb('#a395a5'));b.line([-2.25,resultY,0],[2.25,resultY,0],.055,rgb('#7b6a80'));
    for(const side of[-1,1]){b.gate('X',side*upperX,sourceY,step===0&&side===-1||step===2?warm:rgb('#d7cbbb'),.62);if(second<.999)b.gate('H',side*.55*(1-second),sourceY,step===1?warm:rgb('#d7cbbb'),.62*(1-second));if(second<.999)b.gate('X',side*lowerX,resultY,rgb('#d7cbbb'),.62*(1-second));if(first<.999)b.gate('H',side*.55*(1-first),resultY,rgb('#d7cbbb'),.62*(1-first));}if(second>.001)b.symbol('I',0,resultY,.1,.8*second,warm);const centre=[mix(-1.1,0,first),sourceY],w=1.9;b.bracket(centre[0],centre[1],w,.95);b.ball([centre[0]+w/2,centre[1]-.48,.28],.09,warm);
    return labeled(b.result(),[{key:'window',value:step,point:[centre[0]+w/2,centre[1]-.48,.28]}],[{text:'Before',point:[-2.5,sourceY,0]},{text:'After',point:[-2.55,resultY,0]},{text:step===0?'Move to the seam':step===1?'H H → I':'X X → I',point:[0,-1.5,.1]},{text:`${[4,2,0][step]} gates`,point:[2.45,-.7,0]}],{peephole:{step,visualStep:v,gateCount:[4,2,0][step],input:['X','H','H','X'],currentInput:current,selectedPair:selected,output:step===0?['X','H','H','X']:step===1?['X','X']:[],unitary:'identity',scope:'exact teaching example; moving meshes interpolate the rewrite'}});
  }
  // Exact small k-fold Hadamard-test example, with an authored 3D layout.
  // Each ancilla starts in |-y> = (|0> - i|1>)/sqrt(2), controls one Y,
  // and is measured in X. The system starts in Ry(theta)|0> and is measured
  // in Z. The mean of ALL outcome products equals cos(theta + k*pi/2).
  // The depth offsets clarify connections; they do not specify hardware.
  function gradientStudy(sample, optionalDerivativeOrder = 2, visualDerivativeOrder = optionalDerivativeOrder) {
    const b = semanticBuilder();
    const normalizedSample = clamp(Number(sample) || 0, -1, 1);
    const derivativeOrder = clamp(Math.round(Number(optionalDerivativeOrder) || 2), 1, 3);
    const displayedOrder = clamp(Number(visualDerivativeOrder) || derivativeOrder, 1, 3);
    const theta = normalizedSample * Math.PI;
    const value = Math.cos(theta);
    const slope = -Math.sin(theta);
    const secondDerivative = -Math.cos(theta);
    const thirdDerivative = Math.sin(theta);
    const kthDerivative = [slope, secondDerivative, thirdDerivative][derivativeOrder - 1];
    const quantum = rgb('#8c798f');
    const quiet = rgb('#b4a4b5');
    const pale = rgb('#e0d5c5');
    const systemClay = rgb('#b4a2b9');
    const classical = rgb('#b4937f');
    const systemY = -1.1;
    const systemZ = .17;
    const leftX = -2.35;
    const readoutX = 1.43;
    const parameterX = -1.57;
    const collector = [2.17, -.12, .62];
    const outputX = 2.69;
    const ancillas = [
      { y: .35, z: -.5, controlX: -.57 },
      { y: .78, z: -.02, controlX: .05 },
      { y: 1.21, z: .46, controlX: .67 }
    ];

    // The short embossed strokes remain legible on actual bevelled volumes.
    // X and H reuse the common gallery alphabet. No font or flat image is used.
    const strokes = {
      Y: [[-.32,.45,0,0],[.32,.45,0,0],[0,0,0,-.45]],
      Z: [[-.32,.45,.32,.45],[.32,.45,-.32,-.45],[-.32,-.45,.32,-.45]],
      S: [[.32,.4,-.2,.4],[-.2,.4,-.32,.22],[-.32,.22,-.2,.02],[-.2,.02,.2,-.02],[.2,-.02,.32,-.22],[.32,-.22,.2,-.4],[.2,-.4,-.32,-.4]]
    };
    function glyph(letter, x, y, z, size, color = inner) {
      if (!strokes[letter]) { b.symbol(letter, x, y, z, size, color); return; }
      for (const s of strokes[letter]) {
        b.line([x+s[0]*size,y+s[1]*size,z], [x+s[2]*size,y+s[3]*size,z], .025*size, color);
      }
    }
    const reveal=(color,strength)=>color.map((v,i)=>mix(GROUND[i],v,strength));
    function gate(letter, x, y, z, color, size = .39, strength = 1) {
      b.box(x, y, z, size, size, .24, reveal(color,strength), reveal(quantum,strength));
      glyph(letter, x, y, z+.145, size*.66, reveal(inner,strength));
    }
    function dagger(x, y, z, size, strength = 1) {
      b.line([x,y-size*.2,z], [x,y+size*.35,z], .018, reveal(inner,strength));
      b.line([x-size*.16,y+size*.15,z], [x+size*.16,y+size*.15,z], .018, reveal(inner,strength));
    }
    function outcome(letter, y, z, strength = 1) {
      // Identical X/Z blocks give the measured system factor equal status.
      gate(letter, readoutX, y, z, pale, .42, strength);
      const from = [readoutX+.23,y,z];
      const via = [2.0,y,z+.23];
      b.curve(t => {
        const s = 1-t;
        return [
          s*s*from[0]+2*s*t*via[0]+t*t*collector[0],
          s*s*from[1]+2*s*t*via[1]+t*t*collector[1],
          s*s*from[2]+2*s*t*via[2]+t*t*collector[2]
        ];
      }, .031, reveal(classical,strength), 36);
    }

    // One continuous system, with k controlled generator insertions.
    b.line([leftX,systemY,systemZ], [readoutX-.2,systemY,systemZ], .048, quantum);
    b.ball([leftX,systemY,systemZ], .082, quantum);
    b.box(parameterX, systemY, systemZ, .7, .66, .3, systemClay, quantum);
    // A real angle on the Ry block is the drag target. The pointer, not the
    // entire circuit, turns when theta changes.
    const dialZ = systemZ+.19;
    b.curve(t => [parameterX+.225*Math.cos(t*TAU),systemY+.225*Math.sin(t*TAU),dialZ], .018, pale, 48);
    const parameterPoint = [parameterX+.225*Math.cos(theta),systemY+.225*Math.sin(theta),dialZ+.025];
    b.line([parameterX,systemY,dialZ+.025], parameterPoint, .027, warm);
    b.ball(parameterPoint, .073, warm);

    for (let i = 0; i < Math.ceil(displayedOrder); i++) {
      const strength=clamp(displayedOrder-i,0,1);if(strength<.001)continue;
      const original=ancillas[i],a={...original,y:original.y+.12*(1-strength),z:original.z-.32*(1-strength)};
      b.line([leftX,a.y,a.z], [readoutX-.2,a.y,a.z], .04, reveal(quantum,strength));
      b.ball([leftX,a.y,a.z], .078, reveal(i===derivativeOrder-1 ? warm : quantum,strength));
      // H followed by S-dagger prepares |-y>. Their spatial depth follows
      // their own ancilla rail, including the controlled-one connection.
      gate('H', -1.91, a.y, a.z, pale, .34, strength);
      gate('S', -1.34, a.y, a.z, pale, .34, strength);
      dagger(-1.20, a.y+.115, a.z+.15, .20, strength);
      const control = [a.controlX,a.y,a.z];
      const target = [a.controlX,systemY,systemZ];
      b.ball(control, .085, reveal(warm,strength));
      b.curve(t => [
        a.controlX,
        mix(control[1],target[1],t),
        mix(control[2],target[2],t)+.12*Math.sin(Math.PI*t)
      ], .032, reveal(warm,strength), 32);
      gate('Y', target[0], target[1], target[2], pale, .41, strength);
      outcome('X', a.y, a.z, strength);
    }
    outcome('Z', systemY, systemZ);

    // These wires are classical: every shot multiplies all measured +/-1
    // outcomes. Repetition gives the mean. No extra quantum gate occurs here.
    b.ball(collector, .135, systemClay);
    b.line([collector[0]-.045,collector[1]-.045,collector[2]+.13], [collector[0]+.045,collector[1]+.045,collector[2]+.13], .016, inner);
    b.line([collector[0]-.045,collector[1]+.045,collector[2]+.13], [collector[0]+.045,collector[1]-.045,collector[2]+.13], .016, inner);
    b.line([collector[0]+.13,collector[1],collector[2]], [outputX,collector[1],collector[2]], .034, classical);
    // The signed stem encodes the exact mean for the selected example.
    const meanY = collector[1]+.73*kthDerivative;
    b.line([outputX,collector[1]-.78,collector[2]], [outputX,collector[1]+.78,collector[2]], .014, quiet);
    b.line([outputX-.075,collector[1],collector[2]], [outputX+.075,collector[1],collector[2]], .019, quiet);
    if (Math.abs(kthDerivative) > 1e-9) {
      b.line([outputX,collector[1],collector[2]], [outputX,meanY,collector[2]], .055, warm);
    }
    b.ball([outputX,meanY,collector[2]], .084, warm);

    const handles = [
      { key:'gradient', value:normalizedSample, point:parameterPoint },
      ...ancillas.map((a,i) => ({ key:'derivativeOrder', value:i+1, point:[leftX,a.y,a.z] }))
    ];
    const markers = [
      { text:`${derivativeOrder} ancilla${derivativeOrder===1?'':'s'} · |−y〉`, point:[-1.66,1.74,.2] },
      { text:'Ry(θ)', point:[parameterX,-1.67,systemZ] },
      { text:'Controlled Y', point:[.08,-1.67,systemZ] },
      { text:'X factors × Z', point:[1.25,1.74,.2] },
      { text:'Mean · repeated shots', point:[2.57,1.05,.62] }
    ];
    return labeled(b.result(), handles, markers, {
      gradient: {
        theta, value, slope, secondDerivative, thirdDerivative,
        curvature:secondDerivative,
        derivativeOrder, visualDerivativeOrder:displayedOrder, kthDerivative, jointExpectation:kthDerivative,
        ancillaCount:derivativeOrder,
        ancillaState:'(|0>-i|1>)/sqrt(2)',
        preparation:['H','S†'],
        controlledGenerator:'Y',
        systemState:'Ry(theta)|0>',
        systemReadout:'Z',
        ancillaReadout:'X',
        outcomeFactors:derivativeOrder+1,
        estimator:'mean of the product of all ancilla X outcomes and the system Z outcome',
        scope:'exact Ry/Z teaching example of one k-fold Hadamard-test circuit form; repeated shots',
        mechanismReference:'arXiv:2408.05406v1, Eq. 15, Algorithm III.2 and Fig. 5',
        hardwareLayout:false
      }
    });
  }

  function switchStudy(angle,order){const b=semanticBuilder(),coherent=order==='coherent',random=order==='random',ab=coherent||random||order==='ab',ba=coherent||random||order==='ba',quiet=rgb('#c3b8c5'),active=rgb('#88718f'),theta=angle*Math.PI/180,med=Math.abs(Math.sin(theta))/Math.SQRT2,pminus=coherent?Math.sin(theta)**2/4:.5;
    b.add(movedMesh(pairedRings(angle),transform(-1.85,0,0,.58)));const split=[-.8,0,0],join=[1.5,0,0],control=[-1.15,1.8,.05];b.line([-1.02,0,0],split,.045,active);b.ball(split,.09,coherent?warm:quiet);b.curve(t=>[mix(control[0],split[0],t)-.18*Math.sin(Math.PI*t),mix(control[1],split[1],t),.03],.035,coherent?warm:quiet,40);b.ball(control,.13,coherent?warm:rgb('#a28da9'));if(coherent)b.symbol('+',control[0],control[1],.19,.25,inner);
    for(const [upper,enabled]of[[true,ab],[false,ba]]){const y=upper?.76:-.76,color=enabled?(coherent?active:warm):quiet;b.curve(t=>[mix(split[0],join[0],t),y*Math.sin(Math.PI*t),0],.05,color,56);b.gate(upper?'A':'B',-.1,y,enabled?rgb('#d8c9b7'):rgb('#d4cbd5'),.44);b.gate(upper?'B':'A',.7,y,enabled?rgb('#aa94ae'):rgb('#d4cbd5'),.44);}
    b.box(1.57,0,0,.5,.55,.2,coherent?warm:rgb('#aa9aae'));b.symbol('X',1.57,0,.14,.3,inner);b.line([1.84,0,0],[2.13,.5,0],.035,active);b.line([1.84,0,0],[2.13,-.5,0],.035,active);if(1-pminus>1e-8)b.line([2.13,.5,0],[2.13+(1-pminus)*.85,.5,0],.08,rgb('#76977e'));if(pminus>1e-8)b.line([2.13,-.5,0],[2.13+pminus*.85,-.5,0],.08,active);
    const axis=[Math.cos(theta),Math.sin(theta),0],right=[.780869,-.624695,0],up=[-.331295,-.414119,.848048],depth=cross(right,up),point=[-1.85+dot(axis,right)*1.82*.58,dot(axis,up)*1.82*.58,dot(axis,depth)*1.82*.58];b.line([-1.85,0,0],point,.025,warm);b.ball(point,.085,warm);
    return labeled(b.result(),[{key:'angle',value:angle,point},{key:'order',value:'ab',point:[.3,1.24,0]},{key:'order',value:'coherent',point:control},{key:'order',value:'ba',point:[.3,-1.24,0]}],[{text:'Bases A, B',point:[-1.85,1.2,0]},{text:coherent?'|+⟩ control':random?'I/2 control':order==='ab'?'|0⟩ control':'|1⟩ control',point:[control[0],2.45,.05]},{text:'Control ± readout',point:[2.25,1.0,0]}],{switch:{angle,order,med,pMinus:pminus,pPlus:1-pminus,inferredMED:coherent?Math.sqrt(2*pminus):null,target:'maximally mixed qubit',scope:'calculated quantum-switch example; order histories, not two independent runs'}});
  }

  global.createExhibitionScene=function createExhibitionScene(host,options={}){
    if(!host||!options.compiled||!global.RouteCompiler)return null;
    const solo=Number.isInteger(options.solo)&&options.solo>=0&&options.solo<6?options.solo:null;
    let gl,p,disposed=false,lost=false,raf=0,observer=null,width=0,height=0,travel=0,arrival=1,overview=Boolean(options.overview),orbit=Number(options.orbit)||0,layer=clamp(Math.round(Number(options.layer)||0),0,options.compiled.layers.length),angle=52,repair=0,windowStep=0,gradient=.25,derivativeOrder=2,distance=5,order='coherent',selectedMode=1,visualLayer=layer,visualWindow=0,visualDerivativeOrder=2,visualDistance=5,renderFocal=1,transitions={route:null,peephole:null,derivativeOrder:null,distance:null},meshes=[],camera={eye:[0,.8,6.5],look:[0,.7,0]},viewProjection=null,drag=null;
    let routeSpec={compiled:options.compiled,initial:(options.initial||Array(16).fill(0)).slice(),layer,includeGamma:options.includeGamma!==false};
    const canvas=document.createElement('canvas');canvas.className='exhibition-scene-canvas';canvas.setAttribute('aria-hidden','true');canvas.style.cssText='display:block;width:100%;height:100%;touch-action:pan-y;cursor:ew-resize;pointer-events:auto';host.appendChild(canvas);host.dataset.sceneReady='false';
    const identity=transform(0,0,0),floorData=surface([[-65,FLOOR,65],[65,FLOOR,65],[65,FLOOR,-75],[-65,FLOOR,-75]],GROUND);
    const makeStudy=i=>i===0?routeGrid(routeSpec,selectedMode,visualLayer):i===1?errorWorkflow(repair):i===2?peepholeStudy(windowStep,visualWindow):i===3?gradientStudy(gradient,derivativeOrder,visualDerivativeOrder):i===4?transformerIllustration(distance,visualDistance):switchStudy(angle,order);
    const data=STATIONS.map((s,i)=>makeStudy(i)),scales=[1.05,1.0,1.05,1.02,1.2,.94],heights=[.12,-.4,-.8,-.42,-.17,-.85],pitches=[.03,0,0,0,0,0];
    const definitions=[{data:floorData,model:identity,floor:true},{data:floorSeam(),model:identity,floor:true},...data.map((mesh,i)=>({data:mesh,floor:false,station:i,model:null}))],boundsCache=new WeakMap();
    function bounds(mesh){if(boundsCache.has(mesh))return boundsCache.get(mesh);const lo=[Infinity,Infinity,Infinity],hi=[-Infinity,-Infinity,-Infinity];for(let i=0;i<mesh.position.length;i++){const k=i%3;lo[k]=Math.min(lo[k],mesh.position[i]);hi[k]=Math.max(hi[k],mesh.position[i]);}const result={lo,hi};boundsCache.set(mesh,result);return result;}
    function narrowOverview(){return solo===null&&overview&&width<=700;}
    function overviewPhonePosition(index){const aspect=width/Math.max(1,height),distance=Math.hypot(45,10),tanHalf=9/(distance*Math.max(.25,aspect)),row=Math.floor(index/2),target=[.43,.65,.86][row]+[0,.012,-.008,.006,0,.008][index],n=1-2*target,upY=10/distance,upZ=-45/distance,depth0=45*(45/distance)+7*(10/distance),z=(n*tanHalf*depth0+45*upY+7*upZ)/(upZ+n*tanHalf*(10/distance)),depth=depth0-z*(10/distance),x=([.255,.745,.265,.735,.25,.75][index]*2-1)*depth*tanHalf*aspect;return[x,0,z];}
    function positionFor(index){if(solo===index)return[0,0,0];if(narrowOverview())return overviewPhonePosition(index);const original=STATIONS[index].position;if(overview||solo!==null||index===activeIndex())return original;const theta=travel*5*TAU/6,angular=Math.acos(Math.cos(STATIONS[index].yaw-theta))/(TAU/6),weight=clamp((angular-.55)/.4,0,1);if(!weight)return original;const right=[Math.cos(theta),0,-Math.sin(theta)],radial=[Math.sin(theta),0,Math.cos(theta)],centre=[GALLERY_RADIUS*radial[0],0,-GALLERY_RADIUS+GALLERY_RADIUS*radial[2]],relative=sub(original,centre),horizontal=dot(relative,right),depth=mix(13,6.5,arrival*arrival*(3-2*arrival))-dot(relative,radial),side=Math.sign(horizontal)||Math.sign(index-travel*5)||1,edge=.78+.035*Math.max(0,angular-1),target=side*edge*depth*(width/Math.max(1,height))/Math.max(.1,renderFocal),smooth=weight*weight*(3-2*weight);return add(original,mul(right,(target-horizontal)*smooth));}
    function modelFor(index){const s=STATIONS[index],position=positionFor(index);if(solo===null&&overview&&!narrowOverview())return transform(position[0],heights[index],position[2],scales[index],[-.12,.14,-.1,.1,.16,-.16][index],-.95+pitches[index]);if(!narrowOverview()){const scale=scales[index]*(solo===null&&!overview&&width>560&&[1,2,5].includes(index)?1.15:1);return transform(position[0],heights[index],position[2],scale,solo===index?0:s.yaw,pitches[index]);}const model=transform(position[0],0,position[2],scales[index],[-.15,.2,-.12,.18,.1,-.18][index],-.95+pitches[index]),b=bounds(data[index]);let bottom=Infinity;for(let k=0;k<8;k++){const v=[k&1?b.hi[0]:b.lo[0],k&2?b.hi[1]:b.lo[1],k&4?b.hi[2]:b.lo[2]];bottom=Math.min(bottom,model[1]*v[0]+model[5]*v[1]+model[9]*v[2]);}model[13]=FLOOR-bottom+.015;return model;}
    function upload(def){const buffers=[];for(const[name,values]of[['aPosition',def.data.position],['aNormal',def.data.normal],['aColor',def.data.baseColor]]){const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,values,gl.STATIC_DRAW);buffers.push({buffer,location:gl.getAttribLocation(p,name),name});}return{...def,buffers};}
    function init(){gl=canvas.getContext('webgl',{alpha:true,antialias:true,preserveDrawingBuffer:false,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)throw new Error('WebGL unavailable');p=program(gl);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.clearColor(0,0,0,0);meshes=definitions.map(upload);}
    function readingHeight(value){const at=clamp(value*5,0,5),lo=Math.floor(at),hi=Math.min(5,lo+1),q=at-lo,ease=q*q*(3-2*q),centre=index=>{const m=modelFor(index),b=bounds(data[index]),v=b.lo.map((n,i)=>(n+b.hi[i])/2);return m[1]*v[0]+m[5]*v[1]+m[9]*v[2]+m[13];};return mix(centre(lo),centre(hi),ease);}
    function path(value){if(solo!==null){const y=[0,-.25,-.65,-.35,-.25,-.6][solo];return{eye:[.1,y+.8,6.8],look:[.1,y,0]};}if(narrowOverview()){const theta=orbit*.15*Math.PI/180;return{eye:[10*Math.sin(theta),45,-3+10*Math.cos(theta)],look:[0,0,-3]};}if(overview){const theta=orbit*Math.PI/180;return{eye:[24*Math.sin(theta),35,-GALLERY_RADIUS+24*Math.cos(theta)],look:[0,0,-GALLERY_RADIUS]};}const theta=value*5*TAU/6,a=arrival*arrival*(3-2*arrival),distance=mix(13,6.5,a),radius=GALLERY_RADIUS+distance;return{eye:[radius*Math.sin(theta),.8,-GALLERY_RADIUS+radius*Math.cos(theta)],look:[GALLERY_RADIUS*Math.sin(theta),mix(.7,readingHeight(value)-(width<=560?.16:.45),a),-GALLERY_RADIUS+GALLERY_RADIUS*Math.cos(theta)]};}
    function activeIndex(){return solo===null?clamp(Math.round(travel*5),0,5):solo;}
    function fitFov(fallback,aspect,view){if(overview||solo!==null)return fallback;const index=activeIndex(),m=multiply(view,modelFor(index)),b=bounds(data[index]),xs=[],ys=[];for(let k=0;k<8;k++){const v=[k&1?b.hi[0]:b.lo[0],k&2?b.hi[1]:b.lo[1],k&4?b.hi[2]:b.lo[2],1],q=Array.from({length:3},(_,r)=>v.reduce((sum,value,c)=>sum+value*m[c*4+r],0)),depth=-q[2];if(depth>.2){xs.push(q[0]/depth);ys.push(q[1]/depth);}}if(!xs.length)return fallback;const ease=arrival*arrival*(3-2*arrival),targetWidth=(width<=560?.74:.64)*mix(.45,1,ease),targetHeight=(width<=560?.40:.70)*mix(.45,1,ease),rangeX=Math.max(.01,Math.max(...xs)-Math.min(...xs)),rangeY=Math.max(.01,Math.max(...ys)-Math.min(...ys)),focal=Math.min(targetWidth*2*aspect/rangeX,targetHeight*2/rangeY),fit=clamp(2*Math.atan(1/focal),24*Math.PI/180,95*Math.PI/180),distance=Math.abs(travel*5-index),hold=1-clamp(distance/.48,0,1),blend=hold*hold*(3-2*hold);return mix(fallback,fit,blend);}
    const clock=()=>global.performance?.now?.()??Date.now();
    const reducedMotion=()=>Boolean(global.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
    function setVisual(kind,value){if(kind==='route')visualLayer=value;else if(kind==='peephole')visualWindow=value;else if(kind==='derivativeOrder')visualDerivativeOrder=value;else if(kind==='distance')visualDistance=value;}
    function startAnimation(kind,from,to){if(reducedMotion()||Math.abs(to-from)<.0001){setVisual(kind,to);transitions[kind]=null;return;}transitions[kind]={kind,from,to,started:clock(),durationMs:kind==='route'?Math.min(620,300+Math.abs(to-from)*9):kind==='peephole'?680:240,progress:0};}
    function advanceAnimations(now){for(const kind of Object.keys(transitions)){const motion=transitions[kind];if(!motion)continue;const progress=reducedMotion()?1:clamp((now-motion.started)/motion.durationMs,0,1),ease=progress*progress*(3-2*progress),value=mix(motion.from,motion.to,ease);motion.progress=progress;setVisual(kind,value);replaceStudy({route:0,peephole:2,derivativeOrder:3,distance:4}[kind]);if(progress>=1)transitions[kind]=null;}}
    function transitionState(){const motions=Object.values(transitions).filter(Boolean),motion=motions[0];return motion?{active:true,kind:motion.kind,progress:motion.progress,from:motion.from,to:motion.to,durationMs:motion.durationMs,all:motions.map(m=>({...m}))}:{active:false,kind:'',progress:1,from:null,to:null,durationMs:0,all:[]};}
    function project(point,model=identity){if(!viewProjection)return null;const m=multiply(viewProjection,model),v=[...point,1],q=Array.from({length:4},(_,r)=>v.reduce((s,x,k)=>s+x*m[k*4+r],0)),x=(q[0]/q[3]+1)/2,y=(1-q[1]/q[3])/2;return{x,y,depth:q[3],visible:q[3]>0&&x>=0&&x<=1&&y>=0&&y<=1};}
    function localItems(type){const index=activeIndex(),model=modelFor(index);return(data[index][type]||[]).map(item=>{const point=project(item.point,model);return point?{...item,...point,point:undefined}:null;}).filter(Boolean);}
    function handles(){return localItems('localHandles');}
    function markers(){return localItems('localMarkers');}
    function draw(now){raf=0;if(disposed||lost||!width||!height)return;try{advanceAnimations(Number(now)||clock());
      const ratio=Math.min(global.devicePixelRatio||1,1.65),w=Math.max(1,Math.round(width*ratio)),h=Math.max(1,Math.round(height*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}camera=path(travel);const aspect=width/height,base=44*Math.PI/180,minWidth=solo!==null?Math.tan(29*Math.PI/180):overview?Math.tan(Math.PI/6):width<=560?.53:1,defaultFov=narrowOverview()?2*Math.atan(9/(Math.hypot(45,10)*Math.max(.25,aspect))):Math.max(base,2*Math.atan(minWidth/Math.max(.36,aspect))),view=lookAt(camera.eye,camera.look),fov=fitFov(defaultFov,aspect,view);renderFocal=1/Math.tan(fov/2);viewProjection=multiply(perspective(fov,aspect,.12,110),view);
      gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(p);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uProjection'),false,viewProjection);gl.uniform3fv(gl.getUniformLocation(p,'uEye'),camera.eye);gl.uniform1f(gl.getUniformLocation(p,'uRoughness'),.74);gl.uniform3fv(gl.getUniformLocation(p,'uStations[0]'),STATIONS.flatMap((s,i)=>positionFor(i)));gl.uniform3fv(gl.getUniformLocation(p,'uGround'),GROUND);gl.uniform1f(gl.getUniformLocation(p,'uSolo'),solo===null?-1:solo);gl.uniform1f(gl.getUniformLocation(p,'uShadowOnly'),solo===null?0:1);
      for(let i=0;i<meshes.length;i++){if((narrowOverview()||solo!==null)&&i===1)continue;const mesh=meshes[i];if(solo!==null&&mesh.station!==undefined&&mesh.station!==solo)continue;mesh.model=mesh.station===undefined?identity:modelFor(mesh.station);gl.uniformMatrix4fv(gl.getUniformLocation(p,'uModel'),false,mesh.model);gl.uniform1f(gl.getUniformLocation(p,'uFloor'),mesh.floor?1:0);let context=0;if(!overview&&solo===null&&mesh.station!==undefined){const distance=Math.acos(Math.cos(STATIONS[mesh.station].yaw-travel*5*TAU/6))/(TAU/6),focus=clamp(1-distance,0,1);context=.42*(1-focus*focus*(3-2*focus));}gl.uniform1f(gl.getUniformLocation(p,'uContext'),context);for(const entry of mesh.buffers){gl.bindBuffer(gl.ARRAY_BUFFER,entry.buffer);gl.vertexAttribPointer(entry.location,3,gl.FLOAT,false,0,0);gl.enableVertexAttribArray(entry.location);}gl.drawArrays(gl.TRIANGLES,0,mesh.data.count);}
      const motion=transitionState();host.dataset.sceneTransitionActive=String(motion.active);host.dataset.sceneTransitionKind=motion.kind;host.dataset.sceneTransitionProgress=String(motion.progress);host.dataset.sceneReady=String(gl.getError()===gl.NO_ERROR);host.dataset.sceneTravel=travel.toFixed(4);host.dataset.sceneActive=STATION_IDS[activeIndex()];for(const[key,value]of Object.entries({Layer:layer,Angle:angle,Repair:repair,Window:windowStep,Gradient:gradient,Order:order}))host.dataset['scene'+key]=String(value);
      host.dispatchEvent(new CustomEvent('exhibitionscenedraw',{bubbles:true,detail:{ready:host.dataset.sceneReady==='true',overview,activeIndex:activeIndex(),stations:stationState(),handles:handles(),markers:markers()}}));
      if(Object.values(transitions).some(Boolean))request();
    }catch(error){host.dataset.sceneReady='false';host.dataset.sceneError='render';}}
    function request(){if(!disposed&&!lost&&!raf)raf=requestAnimationFrame(draw);}
    function resize(){if(disposed)return;const box=host.getBoundingClientRect();width=box.width;height=box.height;request();}
    function setView(view){if(disposed)return;if(view&&'travel'in view)travel=clamp(Number(view.travel)||0,0,1);if(view&&'arrival'in view)arrival=clamp(Number(view.arrival)||0,0,1);if(view&&'overview'in view)overview=Boolean(view.overview);if(view&&'orbit'in view)orbit=Number(view.orbit)||0;request();}
    function interactionState(){return{activeIndex:activeIndex(),activeId:STATION_IDS[activeIndex()],angle,layer,routeLayers:routeSpec.compiled.layers.length,repair,window:windowStep,gradient,derivativeOrder,distance,order,selectedMode};}
    function replaceStudy(index){data[index]=makeStudy(index);definitions[index+2].data=data[index];if(gl&&!lost&&meshes[index+2]){for(const entry of meshes[index+2].buffers)gl.deleteBuffer(entry.buffer);meshes[index+2]=upload(definitions[index+2]);}}
    function emit(reason){host.dispatchEvent(new CustomEvent('exhibitioninteraction',{bubbles:true,detail:{...interactionState(),reason}}));if(reason==='pointer'&&activeIndex()===0)host.dispatchEvent(new CustomEvent('routescrub',{bubbles:true,detail:{layer,reason}}));}
    function setInteraction(values,reason='api'){if(disposed||lost||!values)return;const dirty=new Set();if('layer'in values){const next=clamp(Math.round(Number(values.layer)||0),0,routeSpec.compiled.layers.length);if(next!==layer){startAnimation('route',visualLayer,next);layer=next;routeSpec.layer=layer;dirty.add(0);}}if('selectedMode'in values){const next=clamp(Math.round(Number(values.selectedMode)||0),0,15);if(next!==selectedMode){selectedMode=next;dirty.add(0);}}if('angle'in values){const next=clamp(Math.round((Number(values.angle)||0)*10)/10,0,180);if(next!==angle){angle=next;dirty.add(5);}}if('order'in values&&['coherent','ab','ba','random'].includes(values.order)&&values.order!==order){order=values.order;dirty.add(5);}if('repair'in values){const next=clamp(Math.round(Number(values.repair)||0),0,2);if(next!==repair){repair=next;dirty.add(1);}}if('window'in values){const next=clamp(Math.round(Number(values.window)||0),0,2);if(next!==windowStep){startAnimation('peephole',visualWindow,next);windowStep=next;dirty.add(2);}}if('gradient'in values){const next=clamp(Number(values.gradient)||0,-1,1);if(next!==gradient){gradient=next;dirty.add(3);}}if('derivativeOrder'in values){const next=clamp(Math.round(Number(values.derivativeOrder)||1),1,3);if(next!==derivativeOrder){startAnimation('derivativeOrder',visualDerivativeOrder,next);derivativeOrder=next;dirty.add(3);}}if('distance'in values){const next=[5,7,9].includes(Number(values.distance))?Number(values.distance):5;if(next!==distance){startAnimation('distance',visualDistance,next);distance=next;dirty.add(4);}}for(const index of dirty)replaceStudy(index);request();emit(reason);}
    function setRouteState(next={}){if(disposed)return;routeSpec={compiled:next.compiled||routeSpec.compiled,initial:next.initial?next.initial.slice():routeSpec.initial,includeGamma:'includeGamma'in next?next.includeGamma!==false:routeSpec.includeGamma,layer};layer=clamp(Math.round('layer'in next?Number(next.layer)||0:layer),0,routeSpec.compiled.layers.length);routeSpec.layer=layer;visualLayer=layer;transitions.route=null;replaceStudy(0);request();emit('api');}
    function pickActive(clientX,clientY){if(!viewProjection)return null;const index=activeIndex(),model=modelFor(index),b=bounds(data[index]),points=[];for(let k=0;k<8;k++)points.push(project([k&1?b.hi[0]:b.lo[0],k&2?b.hi[1]:b.lo[1],k&4?b.hi[2]:b.lo[2]],model));const box=host.getBoundingClientRect(),x=(clientX-box.left)/box.width,y=(clientY-box.top)/box.height;if(x>=Math.min(...points.map(p=>p.x))-.04&&x<=Math.max(...points.map(p=>p.x))+.04&&y>=Math.min(...points.map(p=>p.y))-.04&&y<=Math.max(...points.map(p=>p.y))+.04)return{index,id:STATION_IDS[index]};return null;}
    function nearestHandle(x,y){const box=host.getBoundingClientRect();return handles().map(h=>({...h,distance:Math.hypot(x-box.left-h.x*width,y-box.top-h.y*height)})).sort((a,b)=>a.distance-b.distance)[0];}
    function down(event){if(overview||event.button!==0||disposed||lost||!pickActive(event.clientX,event.clientY))return;const index=activeIndex(),near=nearestHandle(event.clientX,event.clientY),key=near&&near.distance<44&&['derivativeOrder','distance','order'].includes(near.key)?near.key:index===0?'layer':index===1?'repair':index===2?'window':index===3?'gradient':index===4?'distance':'angle';drag={id:event.pointerId,x:event.clientX,y:event.clientY,active:index,key,start:key==='window'?windowStep:interactionState()[key],choice:near?.value,engaged:false};}
    function move(event){if(!drag||event.pointerId!==drag.id||drag.active!==activeIndex()||['order','derivativeOrder','distance'].includes(drag.key))return;const dx=event.clientX-drag.x,dy=event.clientY-drag.y;if(!drag.engaged&&Math.abs(dx)>5&&Math.abs(dx)>Math.abs(dy)*1.15){drag.engaged=true;canvas.setPointerCapture(event.pointerId);}if(!drag.engaged)return;if(event.cancelable)event.preventDefault();const max=drag.key==='layer'?routeSpec.compiled.layers.length:drag.key==='angle'?180:drag.key==='gradient'?1:2,min=drag.key==='gradient'?-1:0,raw=drag.start+dx/Math.max(160,width*.4)*(max-min),value=['layer','repair','window'].includes(drag.key)?Math.round(raw):raw;setInteraction({[drag.key]:clamp(value,min,max)},'pointer');}
    function up(event){if(!drag||event.pointerId!==drag.id)return;const last=drag;drag=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);if(last.engaged||Math.hypot(event.clientX-last.x,event.clientY-last.y)>6)return;if(['order','derivativeOrder','distance'].includes(last.key)){if(last.choice!==undefined)setInteraction({[last.key]:last.choice},'pointer');return;}if(last.active===1){const box=host.getBoundingClientRect(),choices=handles().filter(h=>h.key==='repair').sort((a,b)=>Math.hypot(event.clientX-box.left-a.x*width,event.clientY-box.top-a.y*height)-Math.hypot(event.clientX-box.left-b.x*width,event.clientY-box.top-b.y*height));if(choices[0])setInteraction({repair:choices[0].value},'pointer');}else if(last.active===2)setInteraction({window:(windowStep+1)%3},'pointer');else if(last.active===0){const model=modelFor(0),box=host.getBoundingClientRect();let found=null;for(const port of data[0].example.route.ports){const point=project(port.point,model),d=Math.hypot(event.clientX-box.left-point.x*width,event.clientY-box.top-point.y*height);if(!found||d<found.d)found={d,mode:port.mode};}if(found&&found.d<35)setInteraction({selectedMode:found.mode},'pointer');}}
    function cancel(event){if(!drag||event.pointerId!==drag.id)return;drag=null;if(canvas.hasPointerCapture(event.pointerId))canvas.releasePointerCapture(event.pointerId);}
    function contextLost(event){event.preventDefault();lost=true;if(raf)cancelAnimationFrame(raf);raf=0;host.dataset.sceneReady='false';meshes=[];drag=null;}
    function contextRestored(){if(disposed)return;lost=false;try{init();resize();}catch(error){host.dataset.sceneError='unavailable';}}
    function stationState(){return STATIONS.map(s=>{const position=positionFor(s.index),model=modelFor(s.index),b=bounds(data[s.index]),points=[];for(let k=0;k<8;k++)points.push(project([k&1?b.hi[0]:b.lo[0],k&2?b.hi[1]:b.lo[1],k&4?b.hi[2]:b.lo[2]],model));const valid=points.filter(Boolean),box=valid.length?{left:Math.min(...valid.map(p=>p.x)),right:Math.max(...valid.map(p=>p.x)),top:Math.min(...valid.map(p=>p.y)),bottom:Math.max(...valid.map(p=>p.y))}:null,projected=project([position[0],model[13],position[2]]),labelProjected=box?{x:(box.left+box.right)/2,y:box.top-35/Math.max(1,height),depth:projected?.depth,visible:solo===null||solo===s.index}:null;return{...s,position:position.slice(),galleryPosition:s.position.slice(),projected,labelProjected,bounds:box};});}
    function getState(){const snapshot=data[0].example.route.snapshot;return{transition:transitionState(),visualLayer,visualWindow,visualDerivativeOrder,visualDistance,travel,arrival,overview,orbit,solo,camera:{eye:camera.eye.slice(),look:camera.look.slice()},...interactionState(),routeLayer:layer,includeGamma:routeSpec.includeGamma,routeSnapshot:{bits:snapshot.bits.slice(),modes:snapshot.modes.slice(),phase:snapshot.phase,layers:routeSpec.compiled.layers.length},pairAngle:angle,pairMED:data[5].example.switch.med,example:Object.assign({},...data.map(d=>d.example||{})),handles:handles(),markers:markers(),stations:stationState(),ready:host.dataset.sceneReady==='true'};}
    function destroy(){if(disposed)return;disposed=true;if(raf)cancelAnimationFrame(raf);observer?.disconnect();global.removeEventListener('resize',resize);for(const[type,fn]of[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['webglcontextlost',contextLost],['webglcontextrestored',contextRestored]])canvas.removeEventListener(type,fn);if(gl&&!lost){for(const mesh of meshes)for(const entry of mesh.buffers)gl.deleteBuffer(entry.buffer);gl.deleteProgram(p);}canvas.remove();host.dataset.sceneReady='false';}
    try{init();for(const[type,fn]of[['pointerdown',down],['pointermove',move],['pointerup',up],['pointercancel',cancel],['lostpointercapture',cancel],['webglcontextlost',contextLost],['webglcontextrestored',contextRestored]])canvas.addEventListener(type,fn);if(global.ResizeObserver){observer=new ResizeObserver(resize);observer.observe(host);}else global.addEventListener('resize',resize);resize();return{setView,setInteraction,setRouteState,resize,getState,pickActive,destroy};}catch(error){destroy();host.dataset.sceneError='unavailable';return null;}
  };
})(window);
