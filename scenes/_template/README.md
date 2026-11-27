# 纸模场景模板（从火焰山提炼）

把 `scenes/_template/` 整个复制成 `scenes/<新场景>/`，改四处就能立起一个新场景。运行时
（three r187 + papercraft）在 `scenes/vendor/`，importmap 已经指过去，不用改路径、不要引 CDN。

```bash
python -m http.server 8123
# 打开 http://127.0.0.1:8123/scenes/_template/index.html
```

## 改这四处

| 位置 | 改什么 |
| --- | --- |
| ① `scene.js` 的 `PALETTE` | 场景配色。只能取 `docs/PAPERCRAFT-IMPLEMENTATION.md` §5 那 15 行 paper spec 里的颜色，不要加高饱和色 |
| ② `H.printGround` 回调 | 地面印花：`washes` 打底 + 细纹 + 斑块。薄薄几层就好，多色 `washes` 会叠加压暗 |
| ③ `HERO` 段 | T 型纸偶的卡：正面 + 紧跟其后的侧面；四肢挂在肩/髋枢轴、卡片画在枢轴下方；每张卡 z 唯一 |
| ④ `createHarness` 的 `bounds / walkArea / camBox / view` | 活动范围与取景。`walkArea` 是主角能走的地方，`camBox` 决定相机怎么跟 |

道具（火墙、洞府、人物）照 `scenes/huoyan/` 的做法，用 `H.popup(pts, paint, {...})` 一片片立起来；
`popup` 的 `solid` 会给 `walk.solid` 登记占位，人物可用 `solid: 0.4` 免得被穿过。

## 站起来之后必须过十条验收

见 `docs/PAPERCRAFT-IMPLEMENTATION.md` §8。要点：`cards()` 100–250、`clips()` 空、
`buildMs < 5s`、`focusHeight` 0.55–0.75（`scripts/papercraft/measure.py`）、`walkPath()`
`reached == of` 且 `blockedBy` 空、走动 3–5 帧有变化、主站三档（1440/1200/390）无回归、无 CDN。

量图：

```bash
python scripts/papercraft/measure.py .tmp/<截图>.png            # 全表
python scripts/papercraft/measure.py .tmp/<截图>.png --compact  # 一行
```

（`scripts/papercraft/capture.py` 需要本机装 Playwright + Chrome；没装时就用浏览器截图代替。）

## 本模板自己的基线（第 35 轮，ego 1256×774）

- `__papercraft`：`ready true`、`cards 7`、`buildMs 166`、`clips []`
- `walkPath([[0,3],[5,0],[-5,-8]])`：`reached 3 / of 3 / blockedBy null`
- `measure.py --compact`：`lumaP50 0.786`、`toothRms 0.0096`、`flatPct 99.4`、`printDetail 0.001`、
  `localContrast 0.018`、`barePct 99.4`（7 WARN）—— 这就是「只有一张纸 + 一个小纸偶」的底子。
  加道具、加印花之后这些数字应当往上走；如果反而更低，说明东西变平了。
- 踩过的坑：手臂卡宽 ±0.12、肩枢轴 ±0.60 才不会被躯干扫穿（首版 ±0.14/±0.52 让
  `clips()` 报 `hero-torso/hero-arm-l through`、`hero-torso/hero-arm-r overlap`）。

## 不要动

`scenes/vendor/papercraft/harness.js`（原样运行时）、主站 `index.html` / `assets/`。