# 第 24 轮 · 三条构建期校验合成 `check-all.mjs`

## 本轮目标

第 12 / 20 / 23 轮各写了一条校验脚本（海纹落水、站点与「关于」数字对账、徽标对比度），跑一次要敲三条命令、还得自己记住有哪三条。本轮把它们合成 `scripts/check-all.mjs`：一条命令跑完、原样转印每条的输出、末尾一张汇总表、任一失败非零退出。

判据（先写死再动手）：
- `node scripts/check-all.mjs` 正常时 `exit=0`，并打印三行 `✅`；
- 弄坏任意一项时 `exit=1`，汇总表里该项是 `❌ 退出码 1`，**其余两条仍要跑完**（不能一失败就短路，否则一次只能发现一个问题）；
- 三脚本「单独跑」的行为不变（它们没被改造）。

## 改了什么

新增 `scripts/check-all.mjs`（58 行 / 2650 B，无 npm 依赖）：

- `CHECKS` 表：`[文件名, 中文说明]` 三项 —— `check-stations.mjs` / `check-seamarks.mjs` / `check-contrast.mjs`。
- 每条用 `spawnSync(process.execPath, [脚本路径], { cwd: ROOT, encoding: "utf8", maxBuffer: 8MB })` 跑，`stdout` / `stderr` 原样转印（保留 `❌` 与 `OK` 行，失败时人还能看到具体哪一点不合规）。
- 退出码归一：`run.status === null`（被信号打断）时按失败记（有 signal 记 130，否则 1），不让「被 Ctrl-C」看起来像通过。
- 汇总表用 `─` 分隔，每行 `✅/❌ 文件名 通过/退出码 N  中文说明`，列宽按最长文件名对齐。
- 末尾 `FAIL：N / 3 项未通过（…）` + `exit 1`，或 `OK：3 项全通过`。

## 为什么这么写

- **不 import 三个脚本**：它们生来是「打印 + exit code」的命令行工具，import 进来就没有「失败即退出」的语义，还得把每个脚本改造成导出函数 —— 包一层子进程更省事，也让「单跑」与「合跑」走同一条路径（单一真相）。
- **不短路**：一次改动常会牵动多处（比如改 `data.js` 可能同时影响站点分类与海纹无关，但改坐标模板会一起碰），跑完三条才能一次看全。代价是多花 1 秒，可以接受。
- **汇总表而不是只给退出码**：CI 里看退出码，人这里看表 —— 表里直接写「哪一条、什么说明」，不必回翻三段输出。
- 没有引入 `npm run` 包装：项目本身没有 `package.json`（纯静态站），加一个只为跑脚本的 `package.json` 会让人误以为需要 install。

## 验证证据

1. **正向**：`node scripts/check-all.mjs` → 三段完整输出（`站点 48（西行 43 + 前传 5）…`、`seaMarks 共 32 点（期望 32）…`、`徽标文字 #b03a2e　边框 rgba(176, 58, 46, 0.8)…`）+ 汇总
   ```
   ✅ check-stations.mjs  通过       站点 / 回目 / 难号 / 「关于」分类数字
   ✅ check-seamarks.mjs  通过       海纹坐标落在水面
   ✅ check-contrast.mjs  通过       徽标文字与边框的对比度
   OK：3 项全通过
   ```
   `exit=0`。
2. **反例（破坏一处）**：把 `assets/js/app.js` 的 `seaMarks` 首点 `[125.0, 35.5]` 改成台湾岛 `[120.6, 22.4]` →
   ```
   ✅ check-stations.mjs  通过       站点 / 回目 / 难号 / 「关于」分类数字
   ❌ check-seamarks.mjs  退出码 1    海纹坐标落在水面
   ✅ check-contrast.mjs  通过       徽标文字与边框的对比度
   FAIL：1 / 3 项未通过（check-seamarks.mjs）
   ```
   `exit=1` —— 且**另两条照常跑完并给出各自的 OK**（验证「不短路」）。
3. **还原往返**：`cp /tmp/app.bak.js assets/js/app.js` 后 `grep -c '120.6, 22.4'` = `0`，再跑 → `OK：3 项全通过`、`exit=0`。
4. 页面未受影响：`node --check assets/js/app.js` SYNTAX_OK；`curl -s -o /dev/null -w 'index=%{http_code}' http://127.0.0.1:8123/index.html` → `index=200`。

## 回滚方法（前向）

用户说「撤销 U-024」时：删掉 `scripts/check-all.mjs`，把 `README.md` 里那条文件结构说明与运行提示删掉，把 `docs/STATE.md` 交付物表里那一行删掉。判据：`ls scripts` 只剩 `fetch.sh`、`check-seamarks.mjs`、`check-stations.mjs`、`check-contrast.mjs` 四个文件，且三条脚本单独跑仍各自 `exit=0`。记为 `U-025-01（回退 U-024-01）`。

## 遗留问题

- 没接 CI / pre-commit hook（项目没有 `package.json`、也不是 git 仓库），靠人记得跑。
- 汇总表不区分「警告」与「错误」：目前三条脚本都只有错误级（`check-seamarks` 的重复坐标只是 `⚠` 且不影响退出码，汇总里看不到这条警告）。
- 新增脚本时要在 `CHECKS` 里手动加一行（没有自动发现 `scripts/check-*.mjs`）——故意如此：自动发现会把临时调试脚本也跑进去。若是以后脚本变多，再改成显式白名单 + 自动校验白名单与实际文件一致。
