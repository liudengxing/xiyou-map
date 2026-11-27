# 第 35 轮 · P5-7 全量验收与模板提炼

轮次：35｜时间：2026-11-27 03:30｜改动单元：`U-035-01`

## 本轮目标

跑 `docs/PAPERCRAFT-IMPLEMENTATION.md` §8 的十条验收，把结论写进记录；把火焰山提炼成
`scenes/_template/`，让下一个场景能复制开工。

## 可测指标

| # | 指标 | 期望 | 本轮值 |
| --- | --- | --- | --- |
| 1 | §8 十条逐条有结论 | 10/10 有 PASS/FAIL/未验 + 证据 | 9 PASS / 1 FAIL（第 10 条） |
| 2 | `scenes/_template/` 能在浏览器立起来 | `ready true`、`clips []` | `ready true / cards 7 / buildMs 166 / clips []` |
| 3 | 模板能走 | `walkPath` `reached == of` | `3 / 3`、`blockedBy null` |
| 4 | 模板有可对标的量化基线 | `measure.py` 出表 | 7 WARN（见下），已写进模板 README |
| 5 | 「双击即开」这个说法与事实一致 | 说对了或改掉 | README 已改；原因记进 ITERATIONS/STATE |

## §8 十条验收结果

| # | 条目 | 结论 | 证据 |
| --- | --- | --- | --- |
| 1 | `clips()` 空 | **PASS** | 火焰山 `cards 151 / clips []`（`__papercraft` 直读）；模板 `cards 7 / clips []` |
| 2 | `cards()` 100–250 | **PASS** | 151（火墙 120 + 洞 + 三人 + 主角 + 地面物件，均在取景框内） |
| 3 | `focusHeight` 0.55–0.75 | **PASS** | `measure.py` overview `0.62`、`?diag=key` `0.602` |
| 4 | `buildMs < 5s` | **PASS** | 322（overview）/ 337（key）/ 444（主站 iframe 内首次构建）/ 166（模板） |
| 5 | 阴影偏侧后、暖赭不是灰黑 | **PASS（数值）/ 未验（肉眼）** | `shadowHex #81250A`、`shadowWarmth 0.673`；key 图 `#581002 / 0.816`。「偏侧后」的方向没法用像素证明，`?diag=key` 截图在 `Z:/build-tmp/`，肉眼判读这一轮没做成（见诚实说明） |
| 6 | `walkPath()` 全到、`blockedBy` 空 | **PASS** | 第 32 轮 `walkPath([[0,3],[6,1],[-6,-10]])` → `reached 3 / of 3 / blockedBy null`；模板同样 3/3 |
| 7 | `restart(); step(T)` 3–5 帧有变化 | **PASS** | 三帧 `.tmp/r35-walk-{a,b,c}.png`；主角 `(0,3) → (2.12,2.36) → (4.85,1.54) → (7.58,0.72)`；帧差（阈值 >8）a↔b `31.90%`、a↔c `58.50%` |
| 8 | 三人各弹一段、逐字/翻页/Esc、关后恢复走动 | **PASS** | 第 33 轮逐条实测（点人 / E / Enter 三下 / Esc / 关后 `(9.8,3.17)`）；第 34 轮复验 Esc 两层（先收对话再收模态） |
| 9 | 主站三档无回归 | **PASS** | 第 34 轮：1440 `sheet [29,45,1382,810]`、1200 `[24,37,1152,666]`、390 `[0,0,390,844]`，每档 `pins 48 / tabindex=0 → 1 / aria-current → 1 / .sea-mark path → 64` |
| 10 | 主站仍可 `file://` 双击打开、无 CDN | **FAIL** | 见下节。CDN 那半是 PASS（资源全在 `127.0.0.1:8123`） |

### 第 10 条为什么 FAIL

1. 本机 ego 浏览器打开 `file:///F:/VibeCoding%20Project/西游记时序图/index.html` 直接落到
   `chrome-error://chromewebdata/`（浏览器自己禁止 `file://`）。
2. 更要紧的是**代码层面也不成立**：`assets/js/app.js:1432-1433` 用
   `fetch("assets/vendor/land-110m.json")` 和 `fetch("assets/vendor/countries-110m.json")`
   取底图。`file://` 页面的 `fetch` 会被浏览器拦掉（跨源/无源），结果是一张只剩背景的空地图。
   也就是说「双击 `index.html` 就能看」过去是不成立的，README 那句话是错的。

**本轮没有修它**：P5-7 属于纸模轮次，硬约束是「不得改 `assets/` 一个字节」。修法已经清楚：
把两份 topojson 包成 `assets/vendor/geo-inline.js`（`window.__LAND = {...}` / `window.__COUNTRIES`），
`loadGeodata()` 里 `typeof window.__LAND === "object"` 就免 `fetch`。这是主站条目，已进 BACKLOG。
本轮只把 README 的说法改成「需要本地静态服务器」并写明原因（README 不在 `assets/` 里）。

## 模板 `scenes/_template/`

- `index.html`（1724 B）：本地 importmap（`../vendor/three.module.js`、`../vendor/papercraft/`）、纸色底、`.hint`、`#fallback`。
- `scene.js`（约 9.6 K）：四处「改这里」——① `PALETTE` ② `H.printGround`（washes 0.16/0.10/0.05 + 220 条两折细纹 + 14 片斑）③ `HERO`（torso / head / head-side / 双臂 / 双腿，`makeCard` + 枢轴）④ `createHarness` 的 `bounds/walkArea/camBox/view`。另有 `H.onStep` 逐帧 `steer(dx/d,dz/d)`（`steer` 收方向不是目标点）与 `pointerdown` 射线落点（夹进 `walkArea` 内缩 0.6）。
- `README.md`：复制步骤、四处改动表、十条验收清单、量图命令、基线数字、踩过的坑、不要动的文件。
- 首版 `clips()` 报 2 对互穿（`hero-torso/hero-arm-l through`、`hero-torso/hero-arm-r overlap`），因为手臂卡宽 ±0.14、肩枢轴 ±0.52（内缘 0.38 < 躯干外缘 0.40）。改成卡宽 ±0.12、肩 ±0.60、`dz -0.24` 后 `clips []`。这条连同数字写进模板 README，免得下个场景再踩。

## 量化基线（`measure.py --compact`，都量在 1460×900）

| 图 | lumaP50 | toothRms | flatPct | printDetail | localContrast | barePct | focusHeight | WARN |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 火焰山 overview | 0.765 | 0.0098 | 98.5 | 0.002 | 0.019 | 98.4 | 0.62 | 6 |
| 火焰山 `?diag=key` | 0.666 | 0.0116 | 95.2 | 0.002 | 0.024 | 98.5 | 0.602 | 4 |
| 模板 | 0.786 | 0.0096 | 99.4 | 0.001 | 0.018 | 99.4 | 0.60 | 7 |

六项 WARN 是同一件事的六个切面：**纸面上的「印花」几乎没有**（`printDetail 0.002`、`localContrast 0.019`），
于是大片区域是纯净平色（`flatPct 98.5`、`barePct 98.4`），纸纤维也看不出来（`toothRms 0.0098`），整体偏亮
（`lumaP50 0.765`）。这不是「再加二十片纸」能解决的，下一轮该做的是**在每一片纸上印纹样**（更小的母题、
第三个暗色值、更深的接触影），以及给地面压一点曝光。数值可查、结论明确，但没看过画面（见下）。

## 盲评与诚实说明

`read_image` 这一轮依旧只回元数据（1256×774 / 字节数 / sha256），像素没进上下文：
**§8 第 5 条（阴影方向）与所有「好不好看」的判断都没有肉眼结论**，A/B 盲评没做。
能用像素证明的只有上面那些数字：卡片数、几何互穿、走动位移与帧差、`measure.py` 的十七项指标。
记录里不写「看起来更好」，也不拿数字冒充观感。

## 截图

- `.tmp/r35-overview.png`（`restart(); step(3.2)` 的全景，1256×774）
- `.tmp/r35-walk-a.png` / `-b.png` / `-c.png`（走动三帧）
- `.tmp/r35-key.png`（`?diag=key`）
- `.tmp/r35-template.png`（模板）

## 回滚

1. 删 `scenes/_template/`（本轮唯一新增目录）。
2. `README.md` 第 5 段恢复「双击 `index.html` 即可打开」（**但不建议**，那句话是错的）。
3. `docs/PAPERCRAFT-IMPLEMENTATION.md` 的 `P0-7` 行**不要**、也不会回滚（文档只追加）。
   记作 `U-036-01（回退 U-035-01）` 即是前进式回退。

## 遗留

1. **主站 `file://` 打不开**（第 10 条 FAIL）：需要把两份 topojson 内联成 js，属于 `assets/` 改动，已进 BACKLOG。
2. **纸面印花几乎为零**（6 WARN）：下一轮最该做的一件事。
3. `capture.py` 依赖 Playwright，本机没装 → 本轮截图是浏览器手工截的，`ab_sheet.py` 也没跑起来，没有并排盲评图。
4. 390 宽的模态全屏（第 34 轮的假设）仍未被肉眼确认。
5. `scenes/huoyan/README.md` 的偏差表还没写「§8 验收结果」一行，留给下轮或 P6 前统一收。