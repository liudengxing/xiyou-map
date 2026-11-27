# 056 手机横屏（640×360）地图带与标签（Q9 / P4-22）

## 为什么做
`docs/PLAN.md` 第 17 行（Q9）给的验收是「640×360 地图带 ≥96px、可见标签 ≥20、五浮层不重叠、1440/390 无回归」。
640×360 是「矮屏 + 窄屏」同时成立的唯一档位：工具栏横条 27px、时间轴 84px、搜索框 28px、详情卡、
随行条、图例同时挤进 360px 高，地图带只剩两百来像素。

## 做了什么
1. `assets/js/app.js` 的 `buildProjection()` 加短屏档：
   `var short = H <= 480;` `bottom = short ? 100 : (H > 700 ? 150 : 116)`、`top = short ? 74 : (W > 900 ? PAD : 128)`。
   原来短屏沿用 128/116 的留白，可用高度只剩 116px，Mercator `fitExtent` 把地图压成一条。
2. `assets/css/style.css` 的 `@media (max-height:480px)` 里详情卡由「横铺 616×108」改为「左侧竖卡 292×108」：
   `.detail { left:12px; right:auto; width:292px; bottom:96px; max-height:108px; }`。
   横铺那条把地图带拦腰截断，图钉只能落在带的下缘。
3. 标签字号改由变量驱动：`.pin-label { font-size: calc(var(--label-fs, 10.5px) * var(--u, 1)); }`，
   `:root { --label-fs: 10.5px }`，矮屏档 9.6px；`declutter()` 的盒模型改为读实测字号
   （`var fs = labelSel.node() ? parseFloat(getComputedStyle(labelSel.node()).fontSize) || 10.5 * U : 10.5 * U;`），
   否则「CSS 缩了字、避让仍按 10.5px 算」，候选位会被自己判成越界。
4. 短屏候选位扩充：`CAND_BASE` 原样保留，新增 `CAND_EXTRA` 十二位（`±11/∓22`、`±11/13`、`±22/-13`、`±33/4`、
   `0/-70`、`0/70`、`±44/-6`），`var CAND = H <= 480 ? CAND_BASE.concat(CAND_EXTRA) : CAND_BASE;`。
   走廊在 640×360 下是一条斜线，原来的十二位几乎每一位都撞邻站的钉子。
5. 图钉障碍半径分档：`var pinR = (H <= 480 ? 4.6 : 7.2) * U;`（矮屏 8×8 的障碍框，桌面不变）。

## 验收数字（ego 浏览器，同一份代码）
| 视口 | 地图带 | 可见标签 | 浮层重叠 | 标签出屏 | 详情卡 |
| --- | --- | --- | --- | --- | --- |
| 640×360（s=29） | 215px（不放宽前 215，但图钉只占 75px 高） | 9 → **12** | 0 | 0 | 292×108 |
| 1440×900（s=29） | — | 44 | 0 | 0 | 原样 |
| 390×844（s=29） | — | 13 | 0 | 0 | 原样 |

- 图钉包围盒：放宽前 `y 144–219 / x 320–400`（75px 高的一条），放宽后 **`x 185–479 / y 99–121`**（294×121），
  最近邻距离 `nnMin 5 / nnMedian 8 / nnMax 39` px。
- 标签字号：矮屏 `9.6 × 0.82 = 7.872px`（上一版 8.6 → 7.052px，字更小反而只多一条）。

## 为什么「可见标签 ≥20」这一档做不到（实测证据）
1. 48 个站被压进 294×121 px 的走廊，中位站距 8px，而一条三字标签宽 24px —— 邻站标签本身就会互撞。
2. 就算把图钉障碍缩到 0（`pinR 0`），在页面内用同一套规则复算，上限也只有 **26 条**；
   `pinR 3.8 → 24`、`6 → 21`、`7.6 → 19`。也就是说 ≥20 只有在「图钉完全不挡 + 标签互相允许贴边」时才勉强成立。
3. 真实候选统计（`pin 369 / lab 82 / pan 88 / ok 9`，共约 546 次尝试）：**三分之二的候选是被邻站图钉挡掉的**，
   把 `pinR` 从 3.8 收到 2.1 也只从 11 涨到 12 —— 剩下的墙是「标签与标签」和「四个浮层压在带内」。
4. 继续缩字号只换来 ±1 条（8.6px → 9.6px 都是 12 条），却把字压到 7px 以下，得不偿失。

## 改动文件
- `assets/js/app.js`（`buildProjection` 短屏档、`declutter()` 盒模型读实测字号、`CAND_BASE`/`CAND_EXTRA`、`pinR` 分档）
- `assets/css/style.css`（`--label-fs`、矮屏 `.detail` 292 宽、矮屏字号 9.6px）
- `docs/ITERATIONS/056-short-band.md`（本文件）、`docs/DECISIONS-PENDING.md`（D-07）、`docs/CHANGELOG.md`、`docs/STATE.md`、`docs/BACKLOG.md`、`docs/PLAN.md`

## 遗留
- 「可见标签 ≥20」需要用户拍板：见 `docs/DECISIONS-PENDING.md` 的 D-07（放宽为 ≥12 / 只标当前站与每五站一标 / 允许标签压邻站钉子）。
- 观感仍未肉眼判读（截图只回元数据）；本轮所有结论来自 DOM 计数、`getBoundingClientRect`、计算样式。
- 640×360 下 `#detail` 292 宽会盖住地图左半，选中站若落在左侧，详情卡与图钉重叠（纸底描边已有，但未在本轮验证）。

## 前向回滚
1. `buildProjection()` 里删掉 `short` 三行，恢复 `bottom = H > 700 ? 150 : 116; top = W > 900 ? PAD : 128;`（U-056-01）。
2. `.detail` 矮屏档恢复 `left/right:12px; width:auto`（U-056-02）。
3. `declutter()` 的 `var fs` 恢复 `10.5 * U`；`.pin-label` 恢复 `font-size: 10.5px * --u`（U-056-03）。
4. `CAND_EXTRA` 与 `pinR` 分档删除，回到单一 `CAND` 与 `7.2 * U`（U-056-04）。
