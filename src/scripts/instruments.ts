type RouteState = { compiled: { layers: unknown[] }; initial: number[]; layer: number; includeGamma: boolean };
type RouteStudy = { getState(): RouteState; setState(next: { layer: number }): void; pause(): void; destroy(): void };
type InstrumentHost = HTMLElement & { routeStudy?: RouteStudy; measurementStudy?: { destroy(): void } };
type RouteForm = { setState(next: RouteState): void; resize(): void; destroy(): void };
type PairState = { selection: { edited: string; compared: string; angleDegrees: number } };
type PairForm = { setState(next: { angle: number }): void; getState(): { angle: number }; resize(): void; destroy(): void };
type ScientificWindow = Window & {
  initRouteStudies?: (scope: HTMLElement) => void;
  initMeasurementStudies?: (scope: HTMLElement) => void;
  createRouteSculpture?: (host: HTMLElement, state: RouteState) => RouteForm | null;
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
  if (!button || !mount || !status || !base) continue;
  const kind = section.dataset.paperInstrument;
  button.hidden = false;
  let loaded = false;
  let widget: InstrumentHost | null = null;
  let form: RouteForm | PairForm | null = null;
  let disconnect = () => {};
  button.addEventListener('click', async () => {
    if (loaded) {
      mount.hidden = !mount.hidden;
      button.setAttribute('aria-expanded', String(!mount.hidden));
      button.textContent = mount.hidden ? (kind === 'route' ? 'Show circuit ↓' : 'Show atlas ↓') : (kind === 'route' ? 'Hide circuit ↑' : 'Hide atlas ↑');
      if (mount.hidden) widget?.routeStudy?.pause();
      else form?.resize();
      return;
    }
    button.disabled = true;
    status.textContent = 'Loading the model…';
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
      object.className = `instrument-form__object${kind === 'route' ? ' ri-gpu-sculpture' : ''}`;
      object.dataset.sculptureX = '.5';
      object.dataset.sculptureY = '.5';
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
        await Promise.all([loadStyle(`${base}route-study.css`), loadStyle(`${base}route-object.css`), loadScript(`${base}compiler.js`), loadScript(`${base}source-data.js`)]);
        await loadScript(`${base}route-study.js`);
        await loadScript(`${base}route-object.js`);
        if (!scientificWindow.initRouteStudies) throw new Error('Circuit initializer is missing.');
        scientificWindow.initRouteStudies(section);
        if (!host.routeStudy || !scientificWindow.createRouteSculpture) throw new Error('Circuit form initializer is missing.');
        const sculpture = scientificWindow.createRouteSculpture(object, host.routeStudy.getState());
        form = sculpture;
        note.textContent = 'Drag the clay collar or use the circuit controls. The spatial fold is an authored view of mode histories.';
        const update = (state: RouteState) => {
          sculpture?.setState({ compiled: state.compiled, initial: state.initial, layer: state.layer, includeGamma: state.includeGamma });
          current.textContent = `Compiled mode histories · Layer ${state.layer} / ${state.compiled.layers.length}`;
        };
        const routeChange = (event: Event) => update((event as CustomEvent<RouteState>).detail);
        const scrub = (event: Event) => {
          const layer = (event as CustomEvent<{ layer: number }>).detail.layer;
          if (host.routeStudy && host.routeStudy.getState().layer !== layer) host.routeStudy.setState({ layer });
        };
        host.addEventListener('routechange', routeChange);
        object.addEventListener('routescrub', scrub);
        disconnect = () => { host.removeEventListener('routechange', routeChange); object.removeEventListener('routescrub', scrub); };
        update(host.routeStudy.getState());
        if (!sculpture) figure.hidden = true;
      } else {
        await Promise.all([loadStyle(`${base}measurement-study.css`), loadStyle(`${base}measurement-object.css`), loadScript(`${base}measurement-study.js`), loadScript(`${base}measurement-object.js`)]);
        if (!scientificWindow.initMeasurementStudies) throw new Error('Measurement initializer is missing.');
        scientificWindow.initMeasurementStudies(section);
        const initial = scientificWindow.MeasurementAtlas?.getState(host);
        if (!initial || !scientificWindow.createMeasurementObject) throw new Error('Measurement form initializer is missing.');
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
        note.textContent = 'A view of their relative basis angle. Use the Atlas controls; its values remain authoritative.';
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
        form = { ...pair, resize: resizePair };
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
      form?.resize();
    } catch {
      disconnect();
      form?.destroy();
      form = null;
      widget?.routeStudy?.destroy();
      mount.replaceChildren();
      status.textContent = 'The model did not load. Try again, or use the paper and source links above.';
    } finally { button.disabled = false; }
  });
}
