# 059 小米交付包按当前代码重打（Q12）

## 为什么

`西游记时序图-小米 vibeCoding 大赛/` 里的 zip 是 15:47 打的，里面只有 24 个文件——**缺 `scenes/huoyan/print.js`（第 50 轮 Q2 新增）与 `assets/vendor/geo-inline.js`（第 57 轮 Q10 新增）**，等于包里跑的是第 52 轮左右的代码。同时 `校验摘要.md` 还写着「必须用本地 HTTP 服务打开，不能双击 `file://`」，而第 57 轮已经让主站双击可开。没有东西会提醒这份包过时（目录在 `.gitignore` 里），所以这一轮既重打，也补一条能被 `check-all` 抓到的校验。

## 做了什么

1. **`scripts/pack-delivery.py`**（新增，只读仓库、只写交付目录）：显式白名单 26 项，先校验缺件，再 `rmtree(dist)` 重建；zip 用固定 `date_time=(2026,11,27,0,0,0)` + 顺序写入，保证同一次构建两次跑出同一个 sha256；写完再断言「根目录有 `index.html`、无禁用扩展名、无绝对路径、无 `..`」，最后打印文件数、解压总字节、zip 字节、sha256 与逐文件大小。
2. **包内 `README.md`**（由 packer 生成，1,658 B）：写清两种打开方式，以及「为什么火焰山场景必须起服务」（`importmap` + ES Module 在 `file://` 下不加载），并列出目录结构与边界数据说明。
3. **`scripts/check-pack.mjs`**（新增，并入 `check-all`，现为 5 项）：解析 zip 的中央目录（EOCD → 条目名/大小/CRC），断言 ① dist 里每个文件与仓库同名文件同大小（README 除外）② zip 条目与 dist 一一对应 ③ 根目录有 `index.html` 与 `README.md` ④ 无绝对路径/越界/禁用扩展名。交付目录不存在时输出 `SKIP` 并以 0 退出——它是本地产物，克隆下来的仓库本来没有。
4. **`校验摘要.md` 更新**：ZIP 大小 `921,394 → 1,155,864` 字节、解压后 `3,587,414 → 4,241,430`、文件数 `24 → 27`、SHA256 换成新的；「本地启动方式」整段改写为「双击即开（主站）／场景需服务」，并补一条「数据内联」说明；「已知限制 1」同口径改写。

## 验收数字

| 项 | 改前 | 改后 |
| --- | --- | --- |
| 文件数 | 24 | **27**（+`print.js`、+`geo-inline.js`、+`README.md`） |
| 解压总字节 | 3,587,414 | **4,241,430** |
| ZIP 字节 | 921,394 | **1,155,864** |
| SHA256 | `e48ee8ee…b1ee97` | **`ce5488eb…aea0`**（连跑两次一致） |
| `zipfile.testzip()` | — | `zip ok` |

包内引用：`dist/index.html` 命中 `geo-inline` 1 处（script 标签）、`dist/assets/js/app.js` 命中 `china-provinces|geo-inline` 2 处、`province` 2 处、`countries-110m` **0 处**。

运行期（`http://127.0.0.1:8124/dist/index.html`）：`pins 48`、`.land/.province/.nine-dash` 各 1、`geo true`、`jsonReqs 0`；`#scene=huoyan` → iframe `scenes/huoyan/index.html?embed=1`，子页 `__papercraft.ready true`、`cards 203`、`clips 0`、`buildMs 590`。

`file://`（双击路径）：`index.html` 下 `pins 48`、三图层各 1、`geo true`、`jsonReqs 0`；**`file://…/scenes/huoyan/index.html` 下 `__papercraft` 不存在、`ready false`**（模块脚本被浏览器按 CORS 拦下，连 `#fallback` 都来不及显示）——这就是包内 README 与校验摘要都要求「场景走本地服务」的原因。

`node scripts/check-all.mjs` → `OK：5 项全通过`。负向测试：把 `dist/assets/js/app.js` 截短 1 字节 → `check-pack` 退出码 1，报「dist/assets/js/app.js 已过时：仓库 81042 B，包内 81041 B」与「zip 内 assets/js/app.js 大小不符」，复原后回到 OK。

## 改动文件

- `scripts/pack-delivery.py`（新增）
- `scripts/check-pack.mjs`（新增）
- `scripts/check-all.mjs`（注册第 5 项）
- `西游记时序图-小米 vibeCoding 大赛/`（`dist/` 重建、zip 重打、`校验摘要.md` 更新；该目录在 `.gitignore` 里，不入库）
- `docs/ITERATIONS/059-micromi-pack.md`、`docs/CHANGELOG.md`、`docs/STATE.md`、`docs/BACKLOG.md`、`docs/PLAN.md`

## 遗留

1. `file://` 下纸模场景拿不到 `ready`，本轮只记录了现象，没做降级提示的引导（主站进入场景时会白屏）。若要在双击场景里给出「请用服务打开」的提示，得区分 `location.protocol === 'file:'` 并在 `#fallback` 里换文案——留给后续。
2. 打包白名单是手写的 26 项，加文件要记得同步；`check-pack` 能抓到「包过期」，抓不到「新文件忘了进白名单」（新文件本来就不在 dist 里）。若要更强，可让 packer 从 `index.html`/`scene.js` 的引用关系推导闭包。
3. zip 未做独立解压再启服务的复核（本轮直接在 `dist/` 上起服务）；`zipfile.testzip()` 只证明 CRC 对齐。

## 前向回滚

1. `git checkout aed96c5 -- scripts/`（去掉 `pack-delivery.py`、`check-pack.mjs`，`check-all` 回到 4 项）。
2. 交付包本身不删：旧 zip 已被覆盖，若要回到旧包只能重跑旧代码的打包（`git stash` 或另建 worktree）。
3. 文档侧把 `docs/PLAN.md` 的 Q12 改回未勾，并在 `docs/BACKLOG.md` 记「U-060-01（回退 U-059-01/02/03/04）」。