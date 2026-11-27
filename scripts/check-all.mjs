#!/usr/bin/env node
/**
 * 一次跑完全部构建期校验（不改代码，只读文件）。
 *
 * 三个脚本各自独立、各有判据，一条命令汇总：
 *   - scripts/check-stations.mjs  站点 / 回目 / 难号 / 「关于」分类数字
 *   - scripts/check-seamarks.mjs  海纹坐标是否落在水面
 *   - scripts/check-contrast.mjs  徽标文字与边框的 WCAG 对比度
 *   - scripts/check-china.mjs     省界/九段线数据与「不加载国界数据集」
 *   - scripts/check-pack.mjs      交付包（小米 zip）是否还是当前代码；包不存在则跳过
 *
 * 设计取舍：
 *   - 用 `spawnSync(process.execPath, ...)` 而不是 import 那些脚本——它们写好时是
 *     「跑起来就打印 + exit code」的命令行工具，import 进来会失去「失败即退出」的语义，
 *     还得为每个脚本改造成导出函数；包一层进程更省事，也让「单独跑」和「一起跑」走同一条路径。
 *   - 每个脚本的完整输出原样转印（保留 `❌` / `OK` 行），末尾再给一张汇总表：改坏一处时不必
 *     翻三段输出找是哪一条红。
 *   - 任一失败 → 非零退出；汇总表里标出「第几项、退出码」。
 *
 * 用法：node scripts/check-all.mjs
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const CHECKS = [
  ["check-stations.mjs", "站点 / 回目 / 难号 / 「关于」分类数字"],
  ["check-seamarks.mjs", "海纹坐标落在水面"],
  ["check-contrast.mjs", "徽标文字与边框的对比度"],
  ["check-china.mjs", "省界与九段线、国界数据集不再加载"],
  ["check-pack.mjs", "交付包 dist/zip 与仓库文件一致（不存在则 SKIP）"],
];

const results = [];
for (const [file, label] of CHECKS) {
  const path = join(ROOT, "scripts", file);
  console.log(`\n$ node scripts/${file}`);
  const run = spawnSync(process.execPath, [path], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
  });
  if (run.stdout) process.stdout.write(run.stdout);
  if (run.stderr) process.stderr.write(run.stderr);
  // 信号终止（如 Ctrl-C）时 status 为 null，按失败处理
  const code = run.status === null ? (run.signal ? 130 : 1) : run.status;
  results.push({ file, label, code });
}

const width = Math.max(...results.map((r) => r.file.length));
console.log("\n" + "─".repeat(width + 22));
for (const r of results) {
  const mark = r.code === 0 ? "✅" : "❌";
  console.log(`${mark} ${r.file.padEnd(width)}  ${String(r.code === 0 ? "通过" : "退出码 " + r.code).padEnd(8)} ${r.label}`);
}
const failed = results.filter((r) => r.code !== 0);
if (failed.length) {
  console.error(`\nFAIL：${failed.length} / ${results.length} 项未通过（${failed.map((r) => r.file).join("、")}）`);
  process.exit(1);
}
console.log(`\nOK：${results.length} 项全通过`);