#!/usr/bin/env node
/**
 * 对比度校验（WCAG 2.1）：① 收起态「难号徽标」② 八十一难抽屉的格子数字。
 *
 * 徽标压在详情卡上，而卡不是纯色：底色是 `--paper` 上一层 0.97 不透明的竖向渐变
 * （顶 #f9f2e2 → 底 #f4ebd6），展开态还有一块实色 sticky 卡头。所以这里不拿一个
 * 假想底色算，而是把「可能出现的三种面」都算一遍，取最差的那个比值。
 *
 * 判据：
 *   - 文字（11px 常规字重）对相邻底色 ≥ 4.5:1（WCAG 1.4.3 AA）
 *   - 边框（非文本的 UI 元素）对相邻底色 ≥ 3:1（WCAG 1.4.11）
 *
 * 数值全部从 `assets/css/style.css` 现读，不在脚本里复制一份——改了样式再跑，
 * 脚本会跟着变，而不是出现「脚本绿、页面红」。
 *
 * 用法：node scripts/check-contrast.mjs   退出码 0 = 通过，1 = 有一项不达标。
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CSS = join(ROOT, "assets", "css", "style.css");
const TEXT_MIN = 4.5;
const BORDER_MIN = 3;

let fail = 0;
const err = (m) => {
  fail++;
  console.error("❌ " + m);
};

/* ---------- WCAG 相对亮度与对比度 ---------- */
const lin = (c) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const l1 = lum(a);
  const l2 = lum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
};
const hex = (h) =>
  [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** fg 以 alpha 叠在 bg 上后的实际颜色（页面就是这么画出来的） */
const over = (fg, alpha, bg) =>
  fg.map((v, i) => Math.round(v * alpha + bg[i] * (1 - alpha)));

/* ---------- 从样式表取值 ---------- */
const css = readFileSync(CSS, "utf8");

function cssVar(name) {
  const m = css.match(new RegExp(`--${name}\\s*:\\s*(#[0-9a-fA-F]{6})`));
  if (!m) throw new Error(`样式表里找不到 --${name}`);
  return hex(m[1]);
}

/** `.d-nanbadge` 那条规则（在 900 断点里）的 color 与 border 的 rgba */
function badgeRule() {
  const at = css.indexOf(".detail:not(.expanded) .d-nanbadge {");
  if (at < 0) throw new Error("样式表里找不到 .detail:not(.expanded) .d-nanbadge");
  const end = css.indexOf("}", at);
  const block = css.slice(at, end);
  const color = block.match(/color:\s*(#[0-9a-fA-F]{6}|var\(--[a-z-]+\))/);
  const border = block.match(/border:\s*1px solid rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (!color) throw new Error("徽标规则里没有 color");
  if (!border) throw new Error("徽标边框必须是 rgba(...)，否则本脚本读不到 alpha");
  const rgb = color[1].startsWith("var(")
    ? cssVar(color[1].slice(6, -1).replace(/^--/, ""))
    : hex(color[1]);
  return {
    text: rgb,
    borderRgb: [+border[1], +border[2], +border[3]],
    borderAlpha: parseFloat(border[4]),
  };
}

/** 徽标可能落到的底色：纸底、卡顶渐变（0.97 叠在纸上）、展开态实色卡头 */
function surfaces() {
  const paper = cssVar("paper");
  const g = css.match(/background:\s*linear-gradient\(\s*180deg,\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)\s*,\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (!g) throw new Error("找不到详情卡的竖向渐变底色");
  const topA = parseFloat(g[4]);
  const botA = parseFloat(g[8]);
  const surf = [
    ["纸底 --paper", paper],
    ["卡顶渐变", over([+g[1], +g[2], +g[3]], topA, paper)],
    ["卡底渐变", over([+g[5], +g[6], +g[7]], botA, paper)],
  ];
  const head = css.match(/\.detail\.expanded \.d-head\s*\{[^}]*background:\s*(#[0-9a-fA-F]{6})/);
  if (head) surf.push(["吸顶卡头", hex(head[1])]);
  return surf;
}

/* ---------- 81 难格子（.nan-cell） ---------- */

/** 取某个选择器规则的声明块；按 `.nan-cell {` 这种带空格形式找，避免命中 .nan-cell.done */
function ruleBlock(selector) {
  const at = css.indexOf(selector + " {");
  if (at < 0) throw new Error(`样式表里找不到 ${selector}`);
  return css.slice(at, css.indexOf("}", at));
}

/** 从声明块里取 color（#hex 或 var(--x)） */
function colorOf(block, where) {
  const m = block.match(/color:\s*(#[0-9a-fA-F]{6}|var\(--[a-z-]+\))/);
  if (!m) throw new Error(`${where} 没有 color`);
  return m[1].startsWith("var(") ? cssVar(m[1].slice(6, -1).replace(/^--/, "")) : hex(m[1]);
}

/** 从声明块里取 background：rgba(...) 或 var(--x) */
function bgOf(block, where) {
  const rgbam = block.match(/background:\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (rgbam) return { rgb: [+rgbam[1], +rgbam[2], +rgbam[3]], alpha: parseFloat(rgbam[4]) };
  const vm = block.match(/background:\s*var\(--([a-z-]+)\)/);
  if (vm) return { rgb: cssVar(vm[1]), alpha: 1 };
  throw new Error(`${where} 的 background 认不出来`);
}

/** 抽屉底色：竖向渐变（很接近不透明）叠在 --paper 上，两端都取 */
function drawerBg() {
  const paper = cssVar("paper");
  const g = css.match(/\.drawer\s*\{[^}]*linear-gradient\(\s*180deg,\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)\s*,\s*rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/);
  if (!g) throw new Error("找不到 .drawer 的渐变底色");
  return {
    top: over([+g[1], +g[2], +g[3]], parseFloat(g[4]), paper),
    bottom: over([+g[5], +g[6], +g[7]], parseFloat(g[8]), paper),
  };
}

/** 三态格子的「文字色 + 半透明底」 */
function nanCellStates() {
  return [
    ["未行", colorOf(ruleBlock(".nan-cell"), ".nan-cell"), bgOf(ruleBlock(".nan-cell"), ".nan-cell")],
    ["已行", colorOf(ruleBlock(".nan-cell.done"), ".nan-cell.done"), bgOf(ruleBlock(".nan-cell.done"), ".nan-cell.done")],
    ["当前", colorOf(ruleBlock(".nan-cell.cur"), ".nan-cell.cur"), bgOf(ruleBlock(".nan-cell.cur"), ".nan-cell.cur")],
  ];
}

/* ---------- 检查 ---------- */
const badge = badgeRule();
const surf = surfaces();

console.log(`徽标文字 #${badge.text.map((v) => v.toString(16).padStart(2, "0")).join("")}` +
  `　边框 rgba(${badge.borderRgb.join(", ")}, ${badge.borderAlpha})`);

let worstText = Infinity;
let worstBorder = Infinity;
for (const [name, bg] of surf) {
  const t = ratio(badge.text, bg);
  const bEdge = over(badge.borderRgb, badge.borderAlpha, bg);
  const b = ratio(bEdge, bg);
  worstText = Math.min(worstText, t);
  worstBorder = Math.min(worstBorder, b);
  console.log(`  ${name.padEnd(10)} 文字 ${t.toFixed(2)}:1　边框 ${b.toFixed(2)}:1`);
}

console.log("");
if (worstText < TEXT_MIN) err(`文字对比度最差 ${worstText.toFixed(2)}:1 < ${TEXT_MIN}:1（11px 常规字重按 AA 需 4.5）`);
if (worstBorder < BORDER_MIN) err(`边框对比度最差 ${worstBorder.toFixed(2)}:1 < ${BORDER_MIN}:1（非文本 UI 元素需 3:1，WCAG 1.4.11）`);

/* ---------- 81 难格子三态 ---------- */
const drawer = drawerBg();
console.log("\n81 难格子（.nan-cell）数字");
let worstCell = Infinity;
for (const [name, fg, bg] of nanCellStates()) {
  // 格子底半透明，叠在抽屉渐变两端各算一次，取更差的一端
  const onTop = over(bg.rgb, bg.alpha, drawer.top);
  const onBot = over(bg.rgb, bg.alpha, drawer.bottom);
  const worst = Math.min(ratio(fg, onTop), ratio(fg, onBot));
  worstCell = Math.min(worstCell, worst);
  console.log(`  ${name} 文字 #${fg.map((v) => v.toString(16).padStart(2, "0")).join("")}　最差 ${worst.toFixed(2)}:1`);
}
if (worstCell < TEXT_MIN) err(`81 难格子数字对比度最差 ${worstCell.toFixed(2)}:1 < ${TEXT_MIN}:1（10px 常规字重按 AA 需 4.5）`);

if (fail) {
  console.error(`\nFAIL：${fail} 项不达标`);
  process.exit(1);
}
console.log(`OK：徽标文字最差 ${worstText.toFixed(2)}:1、徽标边框最差 ${worstBorder.toFixed(2)}:1、` +
  `81 难格子文字最差 ${worstCell.toFixed(2)}:1，均达标`);