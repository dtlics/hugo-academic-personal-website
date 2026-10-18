import { defineConfig } from 'astro/config';

// A project preview and the custom domain use the same source.
const inputBase = process.env.WEBSITE_BASE || '/';
if (!/^\/(?:[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*\/?)?$/.test(inputBase) || inputBase.split('/').some(segment => segment === '.' || segment === '..')) {
  throw new Error('WEBSITE_BASE must be / or a path such as /website-preview/.');
}
const base = `${inputBase.replace(/\/$/, '')}/`;
const origin = new URL(process.env.WEBSITE_ORIGIN || 'https://www.dantongli.com');
if (!['https:', 'http:'].includes(origin.protocol) || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error('WEBSITE_ORIGIN must be an HTTP(S) origin with no path or credentials.');
}
if (!['', 'false', 'true'].includes(process.env.WEBSITE_INDEXABLE || '')) {
  throw new Error('WEBSITE_INDEXABLE must be true, false, or unset.');
}
export default defineConfig({
  site: origin.origin,
  base,
  trailingSlash: 'always',
  output: 'static',
  build: { format: 'directory' },
  devToolbar: { enabled: false },
});
