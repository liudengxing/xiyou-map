// 把 assets/vendor 下两份地理数据合成一支可直接 <script> 的全局包。
// 用途：file:// 下 fetch 会被 CORS 拦，双击打开 index.html 时底图整片空白。
// 用法：node scripts/build-geo-inline.mjs
import { readFileSync, writeFileSync } from "node:fs";

const read = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), "utf8"));
const land = read("../assets/vendor/land-110m.json");
const china = read("../assets/vendor/china-provinces.json");

const head = `/* 地理底图内联包 — 由 scripts/build-geo-inline.mjs 生成，勿手改。
 * 原因：file:// 下 fetch 被 CORS 拦，双击 index.html 时底图空白。
 * 这里把两份数据挂到全局，app.js 优先用它，取不到再退回 fetch（http 场景）。*/
window.__XIYOU_GEO = {land: `;
const body = `,\nchina: `;
const out = head + JSON.stringify(land) + body + JSON.stringify(china) + "};\n";
writeFileSync(new URL("../assets/vendor/geo-inline.js", import.meta.url), out);
console.log(`geo-inline.js ${Buffer.byteLength(out)} B（land ${JSON.stringify(land).length} B / china ${JSON.stringify(china).length} B）`);
