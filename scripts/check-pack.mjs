#!/usr/bin/env node
/**
 * 交付包是否还是「当前代码」的（只读，不打包）。
 *
 * 小米交付包（`西游记时序图-小米 vibeCoding 大赛/`）在 .gitignore 里，不该进仓库，但也就没有
 * 任何东西会提醒它已经过时——第 52 轮那次就是因为没人比对，包里缺了 `print.js` 与
 * `geo-inline.js` 还没被发现。这里只做一件事：把 dist/ 里每个文件与仓库同名文件比对大小，
 * 再把 zip 里每个条目与 dist 比对大小；不一致就红。
 *
 * 目录不存在时输出 SKIP 并以 0 退出：交付包是本地产物，克隆下来的仓库本来就没有它。
 * 比大小而不比内容，是因为这层校验要能零依赖跑；CRC 也已经一并比，改一个字节同样会被抓到。
 *
 * 用法：node scripts/check-pack.mjs
 */

import { readFileSync, statSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, "西游记时序图-小米 vibeCoding 大赛");
const DIST = join(OUT, "dist");
const ZIP = join(OUT, "西游时序-取经路线交互舆图.zip");

const problems = [];
const note = (msg) => problems.push(msg);

if (!existsSync(DIST) || !existsSync(ZIP)) {
  console.log("SKIP 交付包不存在（本地产物，未随仓库分发）");
  process.exit(0);
}

/** @returns {{name:string,size:number,crc:number}[]} */
function zipEntries(path) {
  const buf = readFileSync(path);
  const eocd = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocd < 0) throw new Error("no end-of-central-directory record");
  const count = buf.readUInt16LE(eocd + 10);
  let off = buf.readUInt32LE(eocd + 16);
  const out = [];
  for (let i = 0; i < count; i += 1) {
    if (buf.readUInt32LE(off) !== 0x02014b50) throw new Error("bad central directory entry");
    const crc = buf.readUInt32LE(off + 16);
    const size = buf.readUInt32LE(off + 24);
    const nameLen = buf.readUInt16LE(off + 28);
    const extraLen = buf.readUInt16LE(off + 30);
    const commentLen = buf.readUInt16LE(off + 32);
    const name = buf.toString("utf8", off + 46, off + 46 + nameLen);
    out.push({ name, size, crc });
    off += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

function walk(dir, base = dir) {
  const files = [];
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, ent.name);
    if (ent.isDirectory()) files.push(...walk(full, base));
    else files.push(relative(base, full).split("\\").join("/"));
  }
  return files;
}

// 1. dist 里每个文件都得与仓库同名文件同大小（README.md 是打包脚本生成的，仓库里没有）
const distFiles = walk(DIST).sort();
for (const rel of distFiles) {
  if (rel === "README.md") continue;
  const src = join(ROOT, rel);
  if (!existsSync(src)) {
    note(`dist 有仓库里没有的文件：${rel}`);
    continue;
  }
  const a = statSync(src).size;
  const b = statSync(join(DIST, rel)).size;
  if (a !== b) note(`dist/${rel} 已过时：仓库 ${a} B，包内 ${b} B（重跑 scripts/pack-delivery.py）`);
}

// 2. zip 条目必须与 dist 一一对应（名称、大小）
const entries = zipEntries(ZIP);
const zipNames = entries.map((e) => e.name).sort();
if (zipNames.join("\n") !== distFiles.join("\n")) {
  const missing = distFiles.filter((n) => !zipNames.includes(n));
  const extra = zipNames.filter((n) => !distFiles.includes(n));
  if (missing.length) note(`zip 缺：${missing.join("、")}`);
  if (extra.length) note(`zip 多出：${extra.join("、")}`);
}
for (const e of entries) {
  const p = join(DIST, e.name);
  if (!existsSync(p)) continue;
  const size = statSync(p).size;
  if (size !== e.size) note(`zip 内 ${e.name} 大小不符：dist ${size} B，zip 记 ${e.size} B`);
}

// 3. 入口与安全
for (const must of ["index.html", "README.md"]) {
  if (!zipNames.includes(must)) note(`zip 根目录缺 ${must}`);
}
const BANNED = [".exe", ".sh", ".bat", ".cmd", ".php", ".jsp", ".py", ".map", ".env"];
for (const n of zipNames) {
  if (/^\/|\.\./.test(n)) note(`zip 有绝对路径或越界路径：${n}`);
  if (BANNED.some((ext) => n.toLowerCase().endsWith(ext))) note(`zip 不该包含：${n}`);
}

if (problems.length) {
  for (const p of problems) console.error(`❌ ${p}`);
  process.exit(1);
}
console.log(`OK 交付包与仓库一致：dist ${distFiles.length} 文件，zip ${entries.length} 条目`);