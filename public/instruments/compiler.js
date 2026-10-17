/* Port of the MIT-licensed pinned author implementation. See LICENSE-source.txt. */
(function (root) {
  'use strict';
  const L = 4, N = 16;
  const clone = (x) => JSON.parse(JSON.stringify(x));
  function validatePermutation(perm) {
    if (!Array.isArray(perm) || perm.length !== N || new Set(perm).size !== N || perm.some(x => !Number.isInteger(x) || x < 0 || x >= N)) throw new Error('Destinations must be a permutation of 0–15.');
  }
  function hallPlan(perm) {
    validatePermutation(perm);
    const multiplicity = Array.from({length:L},()=>Array(L).fill(0));
    const items = Array.from({length:L},()=>Array.from({length:L},()=>[]));
    for(let sr=0;sr<L;sr++) for(let sc=0;sc<L;sc++) {
      const dst=perm[sr*L+sc], dr=Math.floor(dst/L), dc=dst%L;
      multiplicity[sr][dr]++; items[sr][dr].push([sc,dc]);
    }
    const s1=Array.from({length:L},()=>Array(L).fill(0));
    const s2=Array.from({length:L},()=>Array(L).fill(0));
    const s3=Array.from({length:L},()=>Array(L).fill(0));
    for(let k=0;k<L;k++) {
      const dstToSrc=Array(L).fill(-1);
      function augment(src, seen) {
        for(let dst=0;dst<L;dst++) {
          if(multiplicity[src][dst]<=0 || seen[dst]) continue;
          seen[dst]=true;
          if(dstToSrc[dst]===-1 || augment(dstToSrc[dst],seen)) {dstToSrc[dst]=src;return true;}
        }
        return false;
      }
      for(let src=0;src<L;src++) if(!augment(src,Array(L).fill(false))) throw new Error('No perfect matching.');
      const dstForSrc=Array(L).fill(-1);
      dstToSrc.forEach((src,dst)=>dstForSrc[src]=dst);
      dstForSrc.forEach((dr,sr)=>{
        const [sc,dc]=items[sr][dr].shift();
        multiplicity[sr][dr]--; s1[sr][sc]=k; s2[k][sr]=dr; s3[dr][k]=dc;
      });
    }
    return [s1,s2,s3];
  }
  function sortOps(qubits, destinations) {
    const current=[...destinations], ops=[];
    for(let round=0;round<L;round++) {
      let swapped=false;
      for(let i=round%2;i<L-1;i+=2) if(current[i]>current[i+1]) {
        ops.push(['fswap',qubits[i],qubits[i+1]]);
        [current[i],current[i+1]]=[current[i+1],current[i]]; swapped=true;
      }
      if(!swapped && round>0) break;
    }
    return ops;
  }
  function earliestMoments(ops) {
    const last=Array(N).fill(-1), moments=[];
    for(const op of ops) {
      const ids=op.slice(1), at=Math.max(...ids.map(i=>last[i]))+1;
      (moments[at]??=[]).push(op); ids.forEach(i=>last[i]=at);
    }
    return moments.map(layer=>layer.sort((a,b)=>a[1]-b[1] || a.at(-1)-b.at(-1) || a[0].localeCompare(b[0])));
  }
  function compile(perm, gammaLayers) {
    const plans=hallPlan(perm);
    const rows = plan => earliestMoments(plan.flatMap((targets,r)=>sortOps(Array.from({length:L},(_,c)=>r*L+c),targets)));
    const colOps=plans[1].flatMap((targets,c)=>sortOps(Array.from({length:L},(_,r)=>r*L+c),targets));
    const stages=[rows(plans[0]),clone(gammaLayers),earliestMoments(colOps),clone(gammaLayers),rows(plans[2])];
    const names=['Row A','Γ · first','Bare column','Γ · second','Row B'];
    const layers=stages.flatMap((stage,stageIndex)=>stage.map((gates,localIndex)=>({gates,stageIndex,localIndex,name:names[stageIndex]})));
    return {perm:[...perm],plans,stages,layers,names};
  }
  function applyLayer(bits, phase, modes, gates) {
    for(const [kind,a,b] of gates) {
      if(kind==='z') phase ^= bits[a];
      else {
        if(kind==='fswap' || kind==='cz') phase ^= bits[a]&bits[b];
        if(kind==='fswap') {
          [bits[a],bits[b]]=[bits[b],bits[a]];
          if(modes) [modes[a],modes[b]]=[modes[b],modes[a]];
        } else if(kind==='cx') bits[b]^=bits[a];
      }
    }
    return phase;
  }
  function simulate(compiled, initial, stop=compiled.layers.length, includeGamma=true) {
    const bits=[...initial], modes=Array.from({length:N},(_,i)=>i); let phase=0;
    for(const layer of compiled.layers.slice(0,stop)) {
      if(!includeGamma && (layer.stageIndex===1 || layer.stageIndex===3)) continue;
      phase=applyLayer(bits,phase,modes,layer.gates);
    }
    return {bits,phase,modes};
  }
  function jw(index) {const r=Math.floor(index/L),c=index%L;return r*L+(r%2===0?c:L-1-c);}
  function exactTarget(perm, initial) {
    const bits=Array(N).fill(0), order=Array.from({length:N},(_,i)=>i).sort((a,b)=>jw(a)-jw(b)); let phase=0;
    perm.forEach((dst,src)=>bits[dst]=initial[src]);
    for(let i=0;i<N;i++) for(let j=i+1;j<N;j++) {
      const a=order[i], b=order[j];
      if(jw(perm[a])>jw(perm[b])) phase ^= initial[a]&initial[b];
    }
    return {bits,phase};
  }
  function resources(compiled, includeGamma=true) {
    let cnotDepth=0,totalCnots=0,fswaps=0,moments=0;
    compiled.layers.forEach(layer=>{
      if(!includeGamma && [1,3].includes(layer.stageIndex)) return;
      const two=layer.gates.filter(g=>g.length===3);
      if(two.length) {moments++; cnotDepth+=two.some(g=>g[0]==='fswap')?2:1;}
      two.forEach(g=>{totalCnots+=g[0]==='fswap'?2:1;if(g[0]==='fswap') fswaps++;});
    });
    return {cnotDepth,totalCnots,fswaps,moments,ancillas:0};
  }
  root.RouteCompiler={L,N,hallPlan,compile,simulate,exactTarget,resources,validatePermutation};
  if(typeof module!=='undefined') module.exports=root.RouteCompiler;
})(globalThis);
