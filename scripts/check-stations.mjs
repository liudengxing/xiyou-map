// 站点数据与「关于」文案的一致性校验（无 npm 依赖，node 直接跑）
//
//   node scripts/check-stations.mjs
//
// 校验四件事：
//   1. 站点数 48、回目 100 条、八十一难 1–81 无缺无重，坐标都在东半球图幅内；
//   2. 每站的 nan 都落在 1–81、chapter 都在 1–100，且西行段回目沿站序递增；
//   3. 按 modern 字段把 48 站分成「今地可考 / 虚构境域与国度 / 小说地名 / 另有出典」四类；
//   4. index.html「关于」里那三个中文数字（八站 / 十五站 / 二十四站）与分类结果一致，
//      且虚构合计占比仍在「八成以上」的说法里。
//
// 为什么从 index.html 抠数字而不是写死在脚本里：文案是给人看的，脚本是给文案把关的，
// 两边各写一份常量就永远会对不上。这里只把页面当「被测样本」，不对它做格式假设以外的期待。

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "assets", "js", "data.js");
const PAGE = join(ROOT, "index.html");

const errors = [];
const warns = [];
const err = (m) => errors.push(m);

// ---------- 载入数据（与页面同一份源） ----------
const src = readFileSync(DATA, "utf8");
const D = new Function("window", src + "\n;return window.XIYOU_DATA;")({});

const stations = [...(D.prologue || []), ...(D.journey || [])];
const chapters = D.chapters || [];
const nan = D.nan || [];

// ---------- 1. 规模 ----------
if (stations.length !== 48) err(`站点数应为 48，实际 ${stations.length}`);
if (chapters.length !== 101) err(`回目表应为 101 项（含空占位 0），实际 ${chapters.length}`);
if (nan.length !== 81) err(`难簿应为 81 条，实际 ${nan.length}`);
for (let i = 1; i < chapters.length; i++) {
  if (!chapters[i] || !chapters[i].trim()) err(`第 ${i} 回回目为空`);
}

// ---------- 2. 难号 / 回目 ----------
const seenNan = new Map();
stations.forEach((n, i) => {
  (n.nan || []).forEach((k) => {
    if (!Number.isInteger(k) || k < 1 || k > 81) err(`#${i} ${n.id} 的难号 ${k} 越界`);
    if (seenNan.has(k)) err(`第 ${k} 难同时挂在 #${seenNan.get(k)} 与 #${i}（${n.id}）`);
    else seenNan.set(k, i);
  });
  if (!Array.isArray(n.chapter) || n.chapter.length !== 2) {
    err(`#${i} ${n.id} 的 chapter 不是 [from, to]`);
  } else {
    const [a, b] = n.chapter;
    if (!(a >= 1 && b <= 100 && a <= b)) err(`#${i} ${n.id} 的回目区间 ${a}–${b} 不合法`);
  }
  if (typeof n.lon !== "number" || typeof n.lat !== "number") err(`#${i} ${n.id} 缺经纬度`);
  else if (n.lon < 50 || n.lon > 140 || n.lat < -5 || n.lat > 50) {
    err(`#${i} ${n.id} 的坐标 [${n.lon}, ${n.lat}] 在图幅外`);
  }
});
for (let k = 1; k <= 81; k++) if (!seenNan.has(k)) err(`第 ${k} 难没有挂到任何一站`);

// 西行段回目沿站序单调不减（等距取靠后一站的做法依赖这个前提）
let prev = 0;
(D.journey || []).forEach((n, i) => {
  const from = n.chapter ? n.chapter[0] : 0;
  if (from < prev) err(`西行第 ${i + 1} 站 ${n.id} 的回目起点 ${from} 小于前一站的 ${prev}`);
  prev = from;
});

// ---------- 3. 按 modern 分类 ----------
// 判定顺序即优先级：「小说虚拟」是明确编出来的境域；「虚构」是编出来的国度；
// 「小说地名 / 无确指 / 示意位置」是没有实地可指的荒山涧岭；剩下的才看「今」。
// 顺序不能颠倒：西梁女国写的是「小说虚构 · 一说今新疆库车一带」，它有「今」但仍属虚构。
function classify(s) {
  const m = s.modern || "";
  if (m.includes("小说虚拟")) return "virtualRealm";
  if (m.includes("虚构")) return "fictionalState";
  if (m.includes("小说地名") || m.includes("无确指") || m.includes("示意位置")) return "novelPlace";
  if (m.includes("今") || m.includes("多比定")) return "realToday";
  return "otherSource";
}

const buckets = { realToday: [], fictionalState: [], novelPlace: [], virtualRealm: [], otherSource: [] };
stations.forEach((n) => buckets[classify(n)].push(n.name));

const real = buckets.realToday.length;
const fict = buckets.virtualRealm.length + buckets.fictionalState.length;
const novel = buckets.novelPlace.length;
const other = buckets.otherSource.length;

const sum = real + buckets.virtualRealm.length + buckets.fictionalState.length + novel + other;
if (sum !== stations.length) err(`四类合计 ${sum} ≠ 站点数 ${stations.length}`);

// 虚构（境域 + 国度 + 小说地名）占全图的比例，要与文案「八成以上」一致
const fictRatio = (fict + novel) / stations.length;
if (fictRatio < 0.8) {
  err(`虚构合计 ${fict + novel}/${stations.length} = ${(fictRatio * 100).toFixed(1)}%，页面写的是「八成以上」`);
}

// ---------- 4. 与「关于」文案比对 ----------
const CN = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
function cnToNum(s) {
  if (/^\d+$/.test(s)) return Number(s);
  let total = 0, section = 0, num = 0;
  for (const ch of s) {
    if (ch in CN) num = CN[ch];
    else if (ch === "十") { section += (num || 1) * 10; num = 0; }
    else if (ch === "百") { section += (num || 1) * 100; num = 0; }
    else return null;
  }
  total += section + num;
  return total;
}

const html = readFileSync(PAGE, "utf8");
const nums = [...html.matchAll(/<b>([一二三四五六七八九十\d]+)站<\/b>/g)].map((m) => cnToNum(m[1]));

if (nums.length < 3) {
  err(`index.html 里没找到三段「<b>N站</b>」的文案（找到 ${nums.length} 段），无法比对`);
} else {
  const [claimReal, claimFict, claimNovel] = nums;
  if (claimReal !== real) err(`文案「今地可考 ${claimReal} 站」，数据算出 ${real} 站`);
  if (claimFict !== fict) err(`文案「虚构境域与国度 ${claimFict} 站」，数据算出 ${fict} 站`);
  if (claimNovel !== novel) err(`文案「小说地名 ${claimNovel} 站」，数据算出 ${novel} 站`);
  if (claimReal + claimFict + claimNovel + 1 !== stations.length) {
    warnOnce(`文案三段 ${claimReal}+${claimFict}+${claimNovel} 再加灵山 1 站 = ${claimReal + claimFict + claimNovel + 1}，站点数 ${stations.length}`);
  }
}
if (other !== 1) err(`「另有出典」应为 1 站（灵山），实际 ${other}：${buckets.otherSource.join("、") || "无"}`);
if (buckets.otherSource[0] && buckets.otherSource[0] !== "灵山") {
  err(`「另有出典」应当是灵山，实际是 ${buckets.otherSource[0]}`);
}

function warnOnce(m) { warns.push(m); }

// ---------- 输出 ----------
console.log("站点 %d（西行 %d + 前传 %d）· 回目 %d 条 · 难簿 %d 条",
  stations.length, (D.journey || []).length, (D.prologue || []).length, chapters.length - 1, nan.length);
console.log("今地可考 %d：%s", real, buckets.realToday.join("、"));
console.log("虚构境域 %d：%s", buckets.virtualRealm.length, buckets.virtualRealm.join("、"));
console.log("虚构国度 %d：%s", buckets.fictionalState.length, buckets.fictionalState.join("、"));
console.log("小说地名 %d：%s", novel, buckets.novelPlace.join("、"));
console.log("另有出典 %d：%s", other, buckets.otherSource.join("、") || "无");
console.log("虚构合计 %d/%d = %s%%（页面口径：八成以上）", fict + novel, stations.length, (fictRatio * 100).toFixed(1));

if (warns.length) warns.forEach((w) => console.warn("⚠  " + w));

if (errors.length) {
  console.error(`\n❌ ${errors.length} 项不一致：`);
  errors.forEach((e, i) => console.error(`  ${i + 1}. ${e}`));
  console.error("\nFAIL");
  process.exit(1);
}
console.log("\nOK：站点、回目、难号与「关于」里的分类数字都对得上");