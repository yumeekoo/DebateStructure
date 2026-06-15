import { readFileSync, writeFileSync } from 'node:fs';
import { Graphviz } from '@hpcc-js/wasm-graphviz';
import { Resvg } from '@resvg/resvg-js';

const [dotPath, svgPath, pngPath] = process.argv.slice(2);
const dot = readFileSync(dotPath, 'utf8');

const graphviz = await Graphviz.load();
const svg = graphviz.dot(dot);
writeFileSync(svgPath, svg, 'utf8');

const resvg = new Resvg(svg, {
  fitTo: { mode: 'zoom', value: 2 },
  font: { loadSystemFonts: true, defaultFontFamily: 'Arial' },
});
writeFileSync(pngPath, resvg.render().asPng());

console.log('OK · svg bytes =', svg.length);
