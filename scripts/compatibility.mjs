import { mkdir, copyFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

const aliases = [
  ['uploads/resume-dantong-li.pdf','uploads/Resume-Dantong-Li.pdf'],
  ['publication/quantummeasurementsincompatibility/index.html','publication/QuantumMeasurementsIncompatibility/index.html'],
  ['publication/quantummeasurementsincompatibility/cite.bib','publication/QuantumMeasurementsIncompatibility/cite.bib'],
  ['publication/quantummeasurementsincompatibility/featured.png','publication/QuantumMeasurementsIncompatibility/featured.png'],
];
if (process.platform==='win32') {
  console.log('Case-only compatibility files require the case-sensitive Linux release build. Canonical lowercase paths are present.');
} else {
  for (const [source,destination] of aliases) {
    const target=resolve('dist',destination);
    await mkdir(dirname(target),{recursive:true});
    await copyFile(resolve('dist',source),target);
  }
  console.log(`Created ${aliases.length} exact-case compatibility files.`);
}
