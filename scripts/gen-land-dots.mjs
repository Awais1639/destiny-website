#!/usr/bin/env node
/**
 * Generates src/data/land-dots.json — an evenly spaced grid of points on land, used by the
 * 3D hero globe. Run once (`node scripts/gen-land-dots.mjs`); the output is committed so the
 * website itself needs no map libraries. Map data: Natural Earth via world-atlas (public domain).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve('world-atlas/land-110m.json'), 'utf8'));
const land = feature(topo, topo.objects.land);
const STEP = 1.9; // degrees between dots
const dots = [];
for (let lat = -58; lat <= 82; lat += STEP) {
  const lonStep = STEP / Math.max(0.25, Math.cos((lat * Math.PI) / 180));
  for (let lon = -180; lon < 180; lon += lonStep) {
    if (geoContains(land, [lon, lat])) dots.push([+lat.toFixed(1), +lon.toFixed(1)]);
  }
}
writeFileSync(new URL('../src/data/land-dots.json', import.meta.url), JSON.stringify(dots));
console.log(`${dots.length} land dots written`);
