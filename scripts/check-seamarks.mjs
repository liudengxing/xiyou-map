// 海纹坐标的水面校验：把 assets/js/app.js 里 seaMarks 的每个点
// 拿去和 Natural Earth 110m 陆地轮廓求「是否落在陆地上」。
//
// 为什么要有这个脚本：第 8 轮把海纹从 20 簇加密到 32 簇时，是靠在浏览器里
// 手工注入 d3.geoContains 一段脚本验的。手挑经纬点很容易把一簇点到台湾岛、
// 越南海岸这种小陆块上（当时就中了两个），而这类错误在缩略图里几乎看不出来。
// 校验放进脚本，改点之后一条命令就能挡回来。
//
// 用法（项目根目录）：
//   node scripts/check-seamarks.mjs
// 退出码：0 = 全部在水面；1 = 有点落在陆地上，或数量/范围不符合预期。
//
// 依赖：项目自带的 assets/vendor/lang-110m.json、d3.min.js、topojson-client.min.js
// 都是 UMD 包，在 node 里 require 即可拿到 d3.geoContains / topojson.feature。

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const EXPECT_COUNT = 32;
const BOUNDS = { lon: [50, 140], lat: [-5, 50] };

const d3 = require(join(ROOT, "assets/vendor/d3.min.js"));
const topojson = require(join(ROOT, "assets/vendor/topojson-client.min.js"));

/** 从 app.js 源码里抠出 seaMarks 的字面量。不做静态分析，只认这一种写法。 */
function readSeaMarks() {
  const src = readFileSync(join(ROOT, "assets/js/app.js"), "utf8");
  const start = src.indexOf("var seaMarks = [");
  if (start < 0) throw new Error("在 assets/js/app.js 里没找到 `var seaMarks = [`");
  const open = src.indexOf("[", start);
  const end = src.indexOf("];", open);
  if (end < 0) throw new Error("seaMarks 数组没有闭合的 `];`");
  const body = src
    .slice(open, end + 1)
    .replace(/\/\/[^\n]*/g, "") // 去掉行注释
    .trim();
  return new Function("return " + body)();
}

function readLand() {
  const topo = JSON.parse(readFileSync(join(ROOT, "assets/vendor/land-110m.json"), "utf8"));
  const key = Object.keys(topo.objects)[0];
  return topojson.feature(topo, topo.objects[key]);
}

function main() {
  const pts = readSeaMarks();
  const land = readLand();
  const bad = [];
  const outOfRange = [];

  if (!Array.isArray(pts) || pts.length === 0) {
    console.error("❌ seaMarks 不是非空数组");
    process.exit(1);
  }

  pts.forEach((p, i) => {
    if (!Array.isArray(p) || p.length !== 2 || !isFinite(p[0]) || !isFinite(p[1])) {
      bad.push({ i, p, why: "坐标格式不是 [lon, lat]" });
      return;
    }
    const [lon, lat] = p;
    if (lon < BOUNDS.lon[0] || lon > BOUNDS.lon[1] || lat < BOUNDS.lat[0] || lat > BOUNDS.lat[1]) {
      outOfRange.push({ i, p });
    }
    if (d3.geoContains(land, p)) {
      bad.push({ i, p, why: "落在陆地上" });
    }
  });

  const dupes = [];
  const seen = new Map();
  pts.forEach((p, i) => {
    const k = p.join(",");
    if (seen.has(k)) dupes.push({ i, p, first: seen.get(k) });
    else seen.set(k, i);
  });

  console.log(`seaMarks 共 ${pts.length} 点（期望 ${EXPECT_COUNT}）`);
  console.log(`陆地轮廓：assets/vendor/land-110m.json`);

  let fail = false;

  if (pts.length !== EXPECT_COUNT) {
    console.error(`❌ 点数 ${pts.length} ≠ ${EXPECT_COUNT}`);
    fail = true;
  }
  if (bad.length) {
    fail = true;
    console.error(`❌ ${bad.length} 个点有问题：`);
    for (const b of bad) console.error(`   #${b.i} [${b.p}] —— ${b.why}`);
  }
  if (outOfRange.length) {
    fail = true;
    console.error(`❌ ${outOfRange.length} 个点超出预期范围 lon ${BOUNDS.lon} lat ${BOUNDS.lat}：`);
    for (const b of outOfRange) console.error(`   #${b.i} [${b.p}]`);
  }
  if (dupes.length) {
    console.error(`⚠️ ${dupes.length} 个重复坐标（不算错误，但密度会重叠）：`);
    for (const b of dupes) console.error(`   #${b.i} [${b.p}] 与 #${b.first} 相同`);
  }

  if (fail) {
    console.error("FAIL");
    process.exit(1);
  }
  console.log("OK：全部落在水面上");
}

main();
