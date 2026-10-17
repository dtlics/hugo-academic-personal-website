import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

// The default build is a review preview. Publication must be explicit.
const indexable = process.env.WEBSITE_INDEXABLE === 'true';
await writeFile(resolve('dist', 'robots.txt'), indexable
  ? 'User-agent: *\nAllow: /\n'
  : 'User-agent: *\nDisallow: /\n');
console.log(`Search indexing: ${indexable ? 'allowed' : 'preview blocked'}.`);
