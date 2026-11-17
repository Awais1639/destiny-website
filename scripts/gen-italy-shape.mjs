#!/usr/bin/env node
/** Generates src/data/italy-shape.json (SVG outline of Italy for page artwork). Map data: Natural Earth via world-atlas (public domain). */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoMercator, geoPath } from 'd3-geo';
const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/countries-50m.json'), 'utf8'));
const italy = feature(topo, topo.objects.countries).features.find((f) => f.id === '380');
const W = 420, H = 480;
const proj = geoMercator().fitExtent([[10, 10], [W - 10, H - 10]], italy);
const d = geoPath(proj)(italy).replace(/(\d+\.\d)\d+/g, '$1');
// a few reference cities for the artwork (lon, lat) — university cities
const cities = { Milan: [9.19, 45.46], Turin: [7.69, 45.07], Padua: [11.88, 45.41], Bologna: [11.34, 44.49], Florence: [11.26, 43.77], Pisa: [10.4, 43.72], Rome: [12.5, 41.9], Naples: [14.27, 40.85], Bari: [16.87, 41.12], Palermo: [13.36, 38.12], Genoa: [8.93, 44.41], Trento: [11.12, 46.07], "L'Aquila": [13.4, 42.35], Cagliari: [9.11, 39.22], Catania: [15.09, 37.5] };
const pts = Object.fromEntries(Object.entries(cities).map(([k, v]) => [k, proj(v).map((n) => +n.toFixed(1))]));
writeFileSync(new URL('../src/data/italy-shape.json', import.meta.url), JSON.stringify({ W, H, d, cities: pts }));
console.log('italy-shape.json', d.length, 'chars');
