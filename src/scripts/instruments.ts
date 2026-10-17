type RouteState = { compiled: { layers: unknown[] }; initial: number[]; layer: number; includeGamma: boolean };
type RouteStudy = { getState(): RouteState; setState(next: { layer: number }): void; pause(): void; destroy(): void };
type InstrumentHost = HTMLElement & { routeStudy?: RouteStudy; measurementStudy?: { destroy(): void } };
type Companion = { resize(): void; destroy(): void };
type RouteScene = Companion & { setInteraction(next: { layer: number }): void; setRouteState?: (next: RouteState) => void };
type PairState = { selection: { edited: string; compared: string; angleDegrees: number } };
type PairForm = Companion & { setState(next: { angle: number }): void; getState(): { angle: number } };
type ScientificWindow = Window & {
  initRouteStudies?: (scope: HTMLElement) => void;
  initMeasurementStudies?: (scope: HTMLElement) => void;
  createExhibitionScene?: (host: HTMLElement, options: RouteState & { solo: number }) => RouteScene | null;
  createMeasurementObject?: (host: HTMLElement, options: { angle: number; controls: boolean; showReadout: boolean; showNotes: boolean; fit: boolean }) => PairForm;
  MeasurementAtlas?: { getState(root: HTMLElement): PairState | null };
};
const scientificWindow = window as ScientificWindow;
const assets = new Map<string, Promise<void>>();

function loadScript(src: string): Promise<void> {
  const previous = assets.get(src);
  if (previous) return previous;
  const pending = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => { script.remove(); assets.delete(src); reject(new Error('Instrument source did not load.')); };
    document.head.append(script);
  });
  assets.set(src, pending);
  return pending;
}

function loadStyle(href: string): Promise<void> {
  const previous = assets.get(href);
  if (previous) return previous;
  const pending = new Promise<void>((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet'; link.href = href;
    link.onload = () => resolve();
    link.onerror = () => { link.remove(); assets.delete(href); reject(new Error('Instrument style did not load.')); };
    document.head.append(link);
  });
  assets.set(href, pending);
  return pending;
}

for (const section of document.querySelectorAll<HTMLElement>('[data-paper-instrument]')) {
  const button = section.querySelector<HTMLButtonElement>('[data-load-instrument]');
  const mount = section.querySelector<HTMLElement>('[data-instrument-mount]');
  const status = section.querySelector<HTMLElement>('[data-instrument-status]');
  const base = section.dataset.assetBase;
  const exhibitionBase = section.dataset.exhibitionBase;
  if (!button || !mount || !status || !base || !exhibitionBase) continue;
  const kind = section.dataset.paperInstrument;
  button.hidden = false;
  let loaded = false;
  let widget: InstrumentHost | null = null;
  let companion: Companion | null = null;
  let disconnect = () => {};
  button.addEventListener('click', async () => {
    if (loaded) {
      mount.hidden = !mount.hidden;
      button.setAttribute('aria-expanded', String(!mount.hidden));
      button.textContent = mount.hidden ? (kind === 'route' ? 'Show circuit ↓' : 'Show atlas ↓') : (kind === 'route' ? 'Hide circuit ↑' : 'Hide atlas ↑');
      if (mount.hidden) widget?.routeStudy?.pause();
      else companion?.resize();
      return;
    }
    button.disabled = true;
    status.textContent = 'Opening the example…';
    try {
      const host = document.createElement('div') as InstrumentHost;
      host.className = kind === 'route' ? 'route-study' : 'measurement-study';
      widget = host;
      const field = document.createElement('div');
      field.className = `instrument-field instrument-field--${kind}`;
      const figure = document.createElement('figure');
      figure.className = `instrument-form instrument-form--${kind}`;
      const stage = document.createElement('div');
      stage.className = 'instrument-form__stage';
      const object = document.createElement('div');
      object.className = `instrument-form__object${kind === 'route' ? ' instrument-route-scene' : ''}`;
      const caption = document.createElement('figcaption');
      const current = document.createElement('span');
      current.className = 'instrument-form__current';
      const note = document.createElement('span');
      note.className = 'instrument-form__note';
      caption.append(current, note);
      stage.append(object);
      figure.append(stage, caption);
      field.append(figure, host);
      mount.replaceChildren(field);
      // Keep the empty mount hidden until all same-origin assets are ready.
      // The widget also auto-initializes on load, so explicit init is idempotent.
      if (kind === 'route') {
        await Promise.all([loadStyle(`${base}route-study.css`), loadScript(`${base}compiler.js`), loadScript(`${base}source-data.js`)]);
        await loadScript(`${base}route-study.js`);
        await loadScript(`${exhibitionBase}scene.js`);
        if (!scientificWindow.initRouteStudies) throw new Error('Circuit initializer is missing.');
        scientificWindow.initRouteStudies(section);
        if (!host.routeStudy || !scientificWindow.createExhibitionScene) throw new Error('Circuit scene initializer is missing.');
        let scene: RouteScene | null = null;
        let routeKey = '';
        let syncing = false;
        companion = { resize: () => scene?.resize(), destroy: () => { scene?.destroy(); scene = null; } };
        note.textContent = 'Drag across the route to choose a circuit step, or use the controls. The drawing follows the compiled mode positions.';
        const update = (state: RouteState) => {
          const next = { compiled: state.compiled, initial: state.initial, layer: state.layer, includeGamma: state.includeGamma };
          const key = JSON.stringify({ layers: state.compiled.layers, initial: state.initial, includeGamma: state.includeGamma });
          syncing = true;
          try {
            if (!scene) scene = scientificWindow.createExhibitionScene?.(object, { ...next, solo: 0 }) || null;
            else if (key !== routeKey) {
              if (scene.setRouteState) scene.setRouteState(next);
              else { scene.destroy(); scene = scientificWindow.createExhibitionScene?.(object, { ...next, solo: 0 }) || null; }
            }
            scene?.setInteraction({ layer: state.layer });
            routeKey = key;
            figure.hidden = !scene;
            current.textContent = `Circuit step ${state.layer} of ${state.compiled.layers.length}`;
          } finally { syncing = false; }
        };
        const routeChange = (event: Event) => update((event as CustomEvent<RouteState>).detail);
        const scrub = (event: Event) => {
          const detail = (event as CustomEvent<{ layer: number; activeIndex: number; reason: string }>).detail;
          if (syncing || detail.reason !== 'pointer' || detail.activeIndex !== 0 || !Number.isInteger(detail.layer)) return;
          if (host.routeStudy && host.routeStudy.getState().layer !== detail.layer) host.routeStudy.setState({ layer: detail.layer });
        };
        host.addEventListener('routechange', routeChange);
        object.addEventListener('exhibitioninteraction', scrub);
        disconnect = () => { host.removeEventListener('routechange', routeChange); object.removeEventListener('exhibitioninteraction', scrub); };
        update(host.routeStudy.getState());
      } else {
        await Promise.all([loadStyle(`${base}measurement-study.css`), loadStyle(`${base}measurement-object.css`), loadScript(`${base}measurement-study.js`), loadScript(`${base}measurement-object.js`)]);
        if (!scientificWindow.initMeasurementStudies) throw new Error('Measurement initializer is missing.');
        scientificWindow.initMeasurementStudies(section);
        const initial = scientificWindow.MeasurementAtlas?.getState(host);
        if (!initial || !scientificWindow.createMeasurementObject) throw new Error('Measurement example initializer is missing.');
        const pair = scientificWindow.createMeasurementObject(object, { angle: initial.selection.angleDegrees, controls: false, showReadout: false, showNotes: false, fit: true });
        // The Atlas is the only input source. The frozen pair renderer keeps its
        // own handle even with controls:false, so make this companion inert.
        object.setAttribute('aria-hidden', 'true');
        object.inert = true;
        object.querySelectorAll<HTMLInputElement | HTMLButtonElement>('input,button').forEach(control => { control.disabled = true; control.tabIndex = -1; });
        const handle = object.querySelector<HTMLButtonElement>('.mo-handle');
        if (handle) handle.hidden = true;
        const movingLabel = document.createElement('span');
        movingLabel.className = 'mo-axis-label instrument-form__moving-axis';
        object.querySelector('.mo-stage')?.append(movingLabel);
        note.textContent = 'The rings show the pair’s relative angle in a standard view. Use the controls below for exact values.';
        let selection = initial.selection;
        const positionLabels = () => {
          const { edited, compared } = selection;
          const fixedLabel = object.querySelector<HTMLElement>('[data-mo-a]');
          if (fixedLabel) fixedLabel.textContent = edited;
          movingLabel.textContent = pair.getState().angle === 0 ? `${edited} / ${compared}` : compared;
          if (handle) { movingLabel.style.left = handle.style.left; movingLabel.style.top = handle.style.top; }
        };
        const update = (state: PairState) => {
          selection = state.selection;
          pair.setState({ angle: state.selection.angleDegrees });
          const { edited, compared } = state.selection;
          current.textContent = `Selected pair · ${edited} / ${compared}`;
          figure.dataset.selectedPair = `${edited}/${compared}`;
          positionLabels();
        };
        const resizePair = () => { pair.resize(); positionLabels(); };
        companion = { ...pair, resize: resizePair };
        const pairObserver = new ResizeObserver(resizePair);
        pairObserver.observe(stage);
        const measurementChange = (event: Event) => update((event as CustomEvent<PairState>).detail);
        host.addEventListener('measurementchange', measurementChange);
        disconnect = () => { host.removeEventListener('measurementchange', measurementChange); pairObserver.disconnect(); };
        update(initial);
      }
      loaded = true;
      mount.hidden = false;
      button.textContent = kind === 'route' ? 'Hide circuit ↑' : 'Hide atlas ↑';
      button.setAttribute('aria-expanded', 'true');
      status.textContent = '';
      companion?.resize();
    } catch {
      loaded = false;
      disconnect();
      disconnect = () => {};
      companion?.destroy();
      companion = null;
      widget?.routeStudy?.destroy();
      widget = null;
      mount.replaceChildren();
      mount.hidden = true;
      button.setAttribute('aria-expanded', 'false');
      button.textContent = kind === 'route' ? 'Explore the exact circuit ↓' : 'Explore the measurement atlas ↓';
      status.textContent = 'Could not open this example. Try again, or read the paper above.';
    } finally { button.disabled = false; }
  });
}
