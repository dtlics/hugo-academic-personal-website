/* Each paper keeps its teaching example in the page. */
(() => {
  'use strict';
  for(const root of document.querySelectorAll('[data-concept-study]')){
    const host=root.querySelector('[data-concept-scene]'),source=window.ROUTE_SOURCE,compiler=window.RouteCompiler,index=Number(root.dataset.study);
    if(!host||!source||!compiler||!window.createExhibitionScene)continue;
    const compiled=compiler.compile(source.fixtures[0].perm,source.gammaLayers);
    const scene=window.createExhibitionScene(host,{compiled,initial:source.fixtures[0].witnessBits,solo:index});
    if(!scene)continue;
    scene.setInteraction({gradient:.2,repair:0,window:0,order:'coherent',angle:45});
    const controls=window.createStudyControls?.(host,scene,{index});
    addEventListener('pagehide',event=>{if(!event.persisted){controls?.destroy();scene.destroy();}});
    addEventListener('pageshow',event=>{if(event.persisted){scene.resize();controls?.update();}});
  }
})();
