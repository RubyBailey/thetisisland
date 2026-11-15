// Run with Node 22+ from the extracted patch folder: node test-fire-worker.mjs
import assert from 'node:assert/strict';
import worker from './fire-hazard/src/index.ts';
let state = JSON.stringify({rating:'HIGH',updated_at:new Date().toISOString(),consecutive_failures:0});
let puts=0;
const env = { ALLOWED_ORIGINS:'https://thetisisland.net,https://staging.thetisisland.pages.dev', FIRE_KV:{async get(){return state}, async put(_key,value){puts++;state=value}}};
const url='https://thetisisland-fire-hazard.example/rating';
const hit=(path, method='GET', origin) => worker.fetch(new Request(path,{method,headers:origin?{Origin:origin}:{}}),env);
let r=await hit(url,'GET','https://staging.thetisisland.pages.dev');
assert.equal(r.status,200);assert.equal((await r.json()).rating,'HIGH');
assert.equal(r.headers.get('Access-Control-Allow-Origin'),'https://staging.thetisisland.pages.dev');
r=await hit(url,'GET','https://attacker.example');assert.equal(r.headers.get('Access-Control-Allow-Origin'),null);
r=await hit(url,'OPTIONS','https://attacker.example');assert.equal(r.status,403);
r=await hit(url,'OPTIONS','https://staging.thetisisland.pages.dev');assert.equal(r.status,204);
r=await hit(url,'POST');assert.equal(r.status,405);
r=await hit('https://thetisisland-fire-hazard.example/scrape');assert.equal(r.status,404);assert.equal(puts,0);
state='not-json';r=await hit(url);assert.deepEqual((await r.json()).rating,null);
state=JSON.stringify({rating:'HIGH',updated_at:'2000-01-01T00:00:00Z',consecutive_failures:0});r=await hit(url);assert.equal((await r.json()).stale,true);
state=JSON.stringify({rating:'UNSAFE',updated_at:new Date().toISOString(),consecutive_failures:0});r=await hit(url);assert.equal((await r.json()).rating,null);
console.log('PASS: public GET, allowed/disallowed CORS, preflight, method restrictions, /scrape removal, KV validity and staleness.');
const nativeFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => new Response('<img src="hazard-bar-MODERATE.jpg">',{status:200});
  state=JSON.stringify({rating:'LOW',updated_at:new Date().toISOString(),consecutive_failures:2});
  await worker.scheduled({},env,{});
  const updated=JSON.parse(state);
  assert.equal(updated.rating,'MODERATE');assert.equal(updated.consecutive_failures,0);
  console.log('PASS: scheduled update parses hazard-bar image and resets failure counter.');
} finally {globalThis.fetch = nativeFetch;}
