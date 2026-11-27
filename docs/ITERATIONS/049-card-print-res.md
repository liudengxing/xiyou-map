# 049 · 卡面纹理分辨率（Q3，提前到 Q2 之前）

## 为什么先做这件

Q2 要给纸件印纹样，验收里有一条「印花线宽 ≥2 px、α ≥0.18」。而卡面的打印像素密度由 `harness.js` 的
`cardOpts(x, z, scale, parent, res)` 决定：

    pxPerUnit = (sharp ? 40 : 28) * res / scale

原状：悟空 `H.cardOpts(x, z)` 用默认 `res = 1`、`scale = 1` → **40 px/单位**，一件 0.84 单位的躯干只有
**28×35 px**；三人 `scale 0.86–0.95`、`res 0.8` → 更小，约 **28 px**。在这种画布上画 2 px 的线，等于在
25 px 宽的图上画 2 px 黑线，随后还要被贴图重采样一次——第 46 轮已经踩过同一件事（母题必须 ≥2 px、α ≥0.18
才不被糊）。所以 Q2 之前先把密度抬起来，否则印花做了也看不见。顺序调整记在这里，PLAN 的 Q2 行也写了依赖。

## 做了什么

- `scenes/huoyan/wukong.js`：新增 `const CARD_RES = 3.4;`，`opts()` 由 `H.cardOpts(x, z)` 改为
  `H.cardOpts(x, z, 1, null, CARD_RES)` → 40 × 3.4 = **136 px/单位**（原 40）。
- `scenes/huoyan/people.js`：立卡的 `res: 0.8` → `res: 2.8`，除 scale 后约 **124 px/单位**（原约 35）。
- 版本联动（只抬一处等于没改）：`scene.js` 的 import 抬 `./wukong.js?v=12`、`./people.js?v=4`；
  `scenes/huoyan/index.html` 抬 `scene.js?v=55`。

## 验收数字（ego 1256×774，`?t=q3c`）

| 项 | 前 | 后 | 门限 |
| --- | --- | --- | --- |
| 悟空卡面（躯干） | 28×35 px 级 | **115×183 px** | ≥96 |
| 悟空卡面（头 / 冠 / 腰带 / 棒） | — | 99×120 / 101×20 / 120×20 / 20×442 | — |
| 悟空卡面（小腿，最窄卡） | — | 47×79 px | 卡片自身只有 0.34×0.58 单位 |
| 三人卡面（罗刹/牛魔/八戒） | 约 28 px | **136×251 / 189×263 / 143×250 px** | ≥96 |
| `buildMs` | 464 ms | **649 ms** | < 2000 |
| `cards` | 217 | **217**（不降） | 不降 |
| `clips()` | 0 | **0** | 0 |

`measure.py`（同机同景，`--compact`）没有变化，3 条 WARN 照旧——这是预期的：密度只影响**同一图案的清晰度**，
画面里的印花内容还没加（那是 Q2 的事）。

    lumaP50 0.655  flatPct 63.5(PASS)  printDetail 0.044  localContrast 0.059  barePct 72.4  toothRms 0.0148

## 改动文件

- `scenes/huoyan/wukong.js`（`CARD_RES` + `opts()`）
- `scenes/huoyan/people.js`（`res: 0.8 → 2.8`）
- `scenes/huoyan/scene.js`（两处 import 版本）
- `scenes/huoyan/index.html`（`scene.js?v=55`）
- `docs/PLAN.md`（Q3 ✅、Q2 记依赖）、`docs/CHANGELOG.md`、`docs/STATE.md`、`docs/BACKLOG.md`、本文件

改动单元：U-049-01（悟空卡面密度）、U-049-02（三人卡面密度）、U-049-03（版本联动）、U-049-04（文档）

## 遗留

1. 小腿卡（0.34×0.58 单位）即便 136 px/单位也只有 47×79 px——**卡片本身窄**，不是分辨率问题；要在上面印花
   只能画大块（一条绑腿、一片补丁），画不了细纹。
2. `buildMs` 距 2000 还有余量，Q2 印纹样时可以再抬一点 `res` 或给图案留更多细节。
3. 视觉判读仍不可用（截图只回元数据），「纹理是否真的更清楚」只由像素尺寸与 `measure.py` 间接支撑。

## 前向回滚

1. `scenes/huoyan/wukong.js`：`H.cardOpts(x, z, 1, null, CARD_RES)` → `H.cardOpts(x, z)`。
2. `scenes/huoyan/people.js`：`res: 2.8` → `res: 0.8`。
3. 版本号**只前进**：`wukong.js?v=13`、`people.js?v=5`、`scene.js?v=56`。
4. 跑 `node scripts/check-all.mjs` 与浏览器 `ready/cards/clips/buildMs` 复测，在 `docs/CHANGELOG.md` 记一行
   「U-054-01（回退 U-049-01/02）」。
