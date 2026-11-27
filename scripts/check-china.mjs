#!/usr/bin/env node
/**
 * 边界数据校验：确认「只画国内行政区划、不画国界」这条约定没有被改回去。
 *
 * 四条判据（任一不满足即非零退出）：
 *   1. assets/vendor/china-provinces.json 是 35 个 feature：34 个省级 + 1 条九段线；
 *   2. 34 个省级里必须有台湾省(710000)、香港(810000)、澳门(820000)，且都是数字 adcode；
 *   3. 代码里不再出现被删的国界数据集（countries-110m / geoBorders）；
 *   4. 底图代码确实画了省界与九段线（.province / .nine-dash），而不是只删了国界。
 *
 * 为什么把「不出现国界数据集」也做成脚本判据：这条约定靠人记不住，
 * 下次有人为了「边界更清楚」把 world-atlas 的 countries 拿回来，这里会先红。
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const errors = [];

const provPath = join(ROOT, "assets/vendor/china-provinces.json");
if (!existsSync(provPath)) {
  errors.push("assets/vendor/china-provinces.json 不存在");
} else {
  const geo = JSON.parse(readFileSync(provPath, "utf8"));
  const fs = geo.features || [];
  const jd = fs.filter((f) => f.properties && f.properties.adcode === "100000_JD");
  const prov = fs.filter((f) => f.properties && f.properties.adcode !== "100000_JD");
  console.log(`省级轮廓 ${prov.length} 个，九段线要素 ${jd.length} 条，共 ${fs.length} 个 feature`);
  if (fs.length !== 35) errors.push(`feature 数应为 35，实为 ${fs.length}`);
  if (prov.length !== 34) errors.push(`省级轮廓应为 34，实为 ${prov.length}`);
  if (jd.length !== 1) errors.push(`九段线要素应为 1，实为 ${jd.length}`);
  const need = { 710000: "台湾省", 810000: "香港特别行政区", 820000: "澳门特别行政区" };
  for (const [code, name] of Object.entries(need)) {
    const hit = prov.find((f) => String(f.properties.adcode) === code);
    if (!hit) errors.push(`缺少 ${name}（adcode ${code}）`);
    else if (hit.properties.name !== name) errors.push(`${code} 的 name 应为「${name}」，实为「${hit.properties.name}」`);
  }
  for (const f of prov) {
    if (typeof f.properties.adcode !== "number") errors.push(`adcode 不是数字：${JSON.stringify(f.properties)}`);
    if (f.properties.name && f.properties.name.includes("国")) errors.push(`省级地名里出现「国」：${f.properties.name}（疑似混入了国界数据集）`);
  }
}

const app = readFileSync(join(ROOT, "assets/js/app.js"), "utf8");
for (const banned of ["countries-110m", "geoBorders"]) {
  if (app.includes(banned)) errors.push(`assets/js/app.js 仍引用 ${banned}（国界数据集应已不再加载）`);
}
for (const need of ['"class", "province"', '"class", "nine-dash"']) {
  if (!app.includes(need)) errors.push(`assets/js/app.js 缺少 ${need} 的绘制`);
}

if (existsSync(join(ROOT, "assets/vendor/countries-110m.json"))) {
  errors.push("assets/vendor/countries-110m.json 仍在仓库里（应删除）");
}

if (errors.length) {
  for (const e of errors) console.error(`❌ ${e}`);
  process.exit(1);
}
console.log("OK：34 个省级轮廓（含台港澳）+ 1 条九段线，未加载国界数据集");
