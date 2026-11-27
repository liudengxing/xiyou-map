# 第 12 轮 · 海纹坐标的构建期校验（P3-3）

## 本轮目标

第 8 轮把海面水纹从 20 簇加密到 32 簇时，「坐标必须落在水面上」这条判据只在浏览器里手工注入过一段脚本（`d3.geoContains` + `land-110m.json`）验证，结果没有沉淀成任何可重复的东西。下次再动 `seaMarks`，还得重新开浏览器、重新拼脚本。本轮把这条校验做成一条命令。

**判据**（BACKLOG P3-3 原文）：

1. 新增 `scripts/check-seamarks.mjs`，node 直跑，读项目自带 `assets/vendor/land-110m.json`、复用 `d3.geoContains`；
2. 有坐标落在陆地上时退出码非 0，并打印出是哪一点；
3. 故意把一点改成 `[120.6, 22.4]`（台湾岛）时退出码非 0；改回后退出码 0；
4. README 记一行用法。

## 改了什么

### 新增 `scripts/check-seamarks.mjs`（115 行，无第三方依赖）

- 依赖加载方式：项目自带的 `d3.min.js` 与 `topojson-client.min.js` 都是 UMD 包，在 node 里 `createRequire(import.meta.url)` 之后直接 `require()` 即可拿到 `d3.geoContains` / `topojson.feature`。**不需要装 npm 包**。
  - 试过用 `vm.createContext` 包一层沙箱再 `runInContext`，两个包都挂在 `this` 上，结果拿不到 `ctx.d3`（`typeof` 为 `undefined`）；`require` 才是这两份 UMD 在 node 下的正常入口。
- 数据来源不复制一份：脚本从 `assets/js/app.js` 里**抠出 `seaMarks` 的字面量**再求值（`src.indexOf("var seaMarks = [")` → 取到配对的 `];` → 删掉 `//` 行注释 → `new Function("return " + body)()`）。这样只有一处真相，改 `app.js` 就是改校验对象，不会出现「脚本里的坐标和页面里的坐标不是同一份」。
- 四类检查，前两类决定退出码：
  1. **落在陆地**（`d3.geoContains(land, p)` 为真）→ 错误；
  2. **点数 ≠ 32**（`EXPECT_COUNT`）→ 错误（第 8 轮定的密度，数量变了要么是有意加密、要么是误删，都该显式确认一次）；
  3. 坐标超出预期范围 `lon [50,140] / lat [-5,50]` → 错误（防止把一簇丢到美洲或南半球，那在图上根本看不见）；
  4. 坐标重复 → **只警告不报错**（两簇叠在同一点只是密度冗余，不影响正确性）。
- 输出形如：
  ```
  seaMarks 共 32 点（期望 32）
  陆地轮廓：assets/vendor/land-110m.json
  OK：全部落在水面上
  ```
  出错时逐条打印 `#<序号> [lon,lat] —— 落在陆地上`，末行 `FAIL`，退出码 1。

### `README.md`

- 「数据从哪来」补一条：海面水纹 32 簇，改点后跑 `node scripts/check-seamarks.mjs`，脚本用同一份 `land-110m.json` 与 `d3.geoContains` 逐点判陆地。
- 「文件结构」补两行：`scripts/fetch.sh`（取底图用的原始下载脚本）与 `scripts/check-seamarks.mjs`（海纹坐标的水面校验）。

## 为什么这么改

- **为什么要脚本而不是再验一次**：这类错误靠眼睛发现不了。第 8 轮第一版 32 点里就有两个点在陆地上（`[120.6,22.4]` 台湾岛、`[108.6,12.6]` 越南沿海），而它们在地图上只是两小撇波浪线压在海岸线内侧，1440 截图里几乎看不出来 —— 当时是靠脚本才逮到的。既然逮得到，就该每次都能逮到。
- **为什么抠 `app.js` 的字面量而不是把坐标抽成 JSON**：抽成 JSON 要动渲染代码、要加一次 fetch（静态页多一个请求），而这条数据只有 32 对数字、只被 `drawBase()` 用一次。现阶段的性价比是「脚本适应源码」，不是「源码迁就脚本」。若以后海纹要可配置（比如按主题换密度），再抽不迟。
- **为什么点数也算硬错误**：32 是第 8 轮定下的密度判据，也是 `docs/ITERATIONS/008-sea-marks-denser.md` 里验证过的数。加密或减少是设计决定，得有人明确点头；让它直接红一下，比悄悄变成 31 或 40 更安全。

## 验证证据

正向往返（`cp assets/js/app.js /tmp/app.js.bak` 备份 → `sed` 改第一点 → 跑 → 还原 → 再跑）：

```
$ node scripts/check-seamarks.mjs
seaMarks 共 32 点（期望 32）
陆地轮廓：assets/vendor/land-110m.json
OK：全部落在水面上
exit=0

$ sed -i 's/\[125.0, 35.5\]/[120.6, 22.4]/' assets/js/app.js     # 黄海第一点 → 台湾岛
$ node scripts/check-seamarks.mjs
seaMarks 共 32 点（期望 32）
陆地轮廓：assets/vendor/land-110m.json
❌ 1 个点有问题：
   #0 [120.6,22.4] —— 落在陆地上
FAIL
exit=1

$ cp /tmp/app.js.bak assets/js/app.js                             # 还原
$ grep -c "120.6, 22.4" assets/js/app.js
0
$ node scripts/check-seamarks.mjs
OK：全部落在水面上
exit=0
```

- 还原后 `node --check assets/js/app.js` → `SYNTAX_OK`，`grep -c "120.6, 22.4"` = 0（源码确实回到原状，不是只把脚本哄过去）。
- 页面未受影响：1440×900 强制重载后 `g.sea-mark path` = 64（32 簇 × 2 行）、`g.pin` = 48、可见标签 47、控制台 `errs []`。
- 脚本自身 115 行、无 npm 依赖（只 `node:fs` / `node:module` / `node:url` / `node:path`）。

## 回滚方法

记为 `U-013-01（回退 U-012-01）`，三步：

1. 删 `scripts/check-seamarks.mjs`；
2. 删 `README.md` 里「海面水纹」那一条与文件结构里 `scripts/check-seamarks.mjs` 那一行（`scripts/fetch.sh` 那行是本轮补的说明，可留）；
3. 恢复验证：`ls scripts/` 只剩 `fetch.sh`；`grep -c 'check-seamarks' README.md` = 0。

`assets/js/app.js` 未被本轮修改，无需回退。

## 遗留问题

- **只校验水面，不校验「视觉上是否与海岸线太近」**：`d3.geoContains` 判的是点在心不在陆地多边形内。110m 精度的海岸线本身是简化的，某点可能在水面但离岸不到 1px，画出来仍像压着海岸。这条只能靠看截图，脚本管不了（也不该假装管得了）。
- **32 这个数写死在脚本里**：以后要按视口或主题改密度，得同步改 `EXPECT_COUNT`，否则会误报。这是故意的摩擦。
- 没接进 CI（项目没有 CI，也没有 `package.json`），所以它是一条「改海纹时记得跑」的手工命令，不是自动门禁。README 已写明。
