# 029 · P5-1 纸模骨架：本地 three + harness 跑通

日期：2026-11-27 01:30 · 轮次：29 · 改动单元：U-029-01 / U-029-02 / U-029-03

## 本轮目标

goal_round 从这一轮起把主线改成 **P5 纸模场景**。P5-1 的验收原文是：

> 装 `npx skills add xikhar/papercraft`；运行时本地化（harness.js / paperkit-3d.js / paperkit-2d.js /
> paper-motion.js / paper-life.js / paper-sound.js / lights.json / three@0.187.0 → `scenes/vendor/`）；
> 建 `scenes/huoyan/`、`scenes/shared/`、`scenes/_template/`、`scripts/papercraft/`；改写 importmap 为本地路径。
> 验收：`scenes/huoyan/index.html` 打开为空白纸地面，`window.__papercraft.ready === true`，网络面板无 CDN 请求。

本轮定的可测指标（5 条）：

1. `__papercraft.ready === true`；
2. `__papercraft.cards() === 1`（一枚占位立牌，P5-4 替换）；
3. `buildMs < 5000`（首次装配耗时）；
4. 资源 host 集合 = `{127.0.0.1:8123}`（无 CDN）；
5. 地面平均色落在暖纸区间（亮度 190–215 / 通道 R>G>B），不是黑屏也不是纯土色。

## 改了什么

### U-029-01 运行时本地化（`scenes/vendor/`）

| 文件 | 大小 | 来源 |
| --- | --- | --- |
| `three.module.js` | 658900 B | `three@0.187.0/build/three.module.js` |
| `three.core.js` | 1474799 B | `three@0.187.0/build/three.core.js` |
| `papercraft/harness.js` | 原样，未改 | skill `assets/templates/popup-3d/harness.js` |
| `papercraft/lib/paperkit-2d.js` 等五个 | 原样 | skill `assets/lib/` |
| `papercraft/lights.json` | 原样 | skill `assets/lights.json` |

**踩到的坑（值得记下来）**：three r187 的 `three.module.js` 里有一行 `import './three.core.js'`，只放
`three.module.js` 时整页白屏 —— 而且白屏不会触发 `scene.js` 的 `try/catch`（模块解析失败时模块体根本没执行，
`#fallback` 也不会显示，`__papercraft` 是 `undefined`）。补上 `three.core.js` 后同一份代码立刻跑通。
判断方法：`performance.getEntriesByType('resource')` 里能看到 `three.core.js` 被请求、但页面上没有 canvas。

其余资料：`scripts/papercraft/{capture,measure,ab_sheet,paper_textures}.py`、`docs/papercraft-skill/`（SKILL.md +
15 篇 references，508K，后续轮查「材料定律」用）。

### U-029-02 火焰山骨架页（`scenes/huoyan/index.html` + `scene.js`）

`index.html` 只有三件事：本地 importmap、纸色底、失败兜底文字。

```html
<script type="importmap">{ "imports": {
  "three": "../vendor/three.module.js",
  "papercraft/": "../vendor/papercraft/"
} }</script>
```

`scene.js` 里 `createHarness({...})` 的参数：`ground:'#f3e7cd'`、`heroHeight:3.6`、
`view:{pitch:46, dist:66, target:[0,1.5,-6]}`、`lens:{fov:28}`、
`bounds:{x0:-56,x1:56,z0:-46,z1:34}`、`walkArea:{x0:-14,x1:14,z0:-16,z1:8}`、
`camBox:{x0:-2,x1:2,z0:-6,z1:-2}`、`subject:[0,3]`、`play:false`。

地面用 `H.printGround` 印：三层淡染 + 520 条两折龟裂纹（远密近疏）+ 26 条风卷灰线。火焰山寸草不生，
所以没有草簇、没有水纹（主站舆图那边的海纹与此无关，互不影响）。

主角是一枚**占位立牌**（人形轮廓 8 点 + 朱砂金箍 / 赭红腰带两道带），经
`H.popup(...standee(), {x:0, z:3, scale:3.6/3.24})` 立起来，再 `H.setHero(hero, {stride: () => {}})`。
**为什么必须有主角**：`H.start()` 在没有 hero 时直接 throw
（`'papercraft harness: call H.setHero(popup(...)) before H.start()'`），骨架页想跑起来就得先有个可挂载的对象；
真正的 T 型悟空纸模在 P5-4。这一点写进记录，免得下一轮误以为立牌是美术资产。

### U-029-03 地面调浅

第一次的 `washes([C.ochre, C.ochre, C.ochreD, C.deep])` 让整张地面平均色落到 **219,179,102**，比主站宣纸
`#f3e7cd`（243,231,205）深两档，读起来像一块土而不是纸。改成两色 + 三档 alpha 各压一档：

```js
washes([C.deep, C.ochre], { scales: [[60, 180, 460, 0.16], [200, 50, 150, 0.10], [700, 10, 34, 0.05]] });
```

调后平均色 **226,196,131**（中心 225,189,117、底部 232,208,149）。仍偏暖一档 —— 这是**暖主光**在赭纸上应有的
样子（`lights.json` 的 `day` 主光 `#ffdcb2`），不是 washes 压暗；P5-3 印真正的戈壁时再一起定色。

## 验证证据

命令：

```bash
node --check scenes/huoyan/scene.js          # SYNTAX_OK
node scripts/check-all.mjs | tail -1         # OK：3 项全通过（主站未被本轮影响）
curl -s -o /dev/null -w 'index=%{http_code}' http://127.0.0.1:8123/index.html   # index=200
```

浏览器（ego，1256×774，`http://127.0.0.1:8123/scenes/huoyan/index.html`）：

```json
{ "ready": true, "cards": 1, "buildMs": 168, "pieces": 1, "clips": [],
  "canvas": true, "webgl2": true, "fallback.hidden": true,
  "hosts": ["127.0.0.1:8123"] }
```

截图：`Z:/build-tmp/r29-p5-1-paper.png`（canvas 选择器，1256×774）、`Z:/build-tmp/r29-p5-1-blank.png`
（调浅前，用于对比）。Pillow 量化见上「U-029-03」。

**A/B 盲评**：本轮只有一处视觉改动（地面 washes），调前 / 调后两张截图并排看：调后那张的纸纹仍清楚、
但要「更接近一张纸」而非「一块土」，故选调后；没有其它候选可比，故不构成完整 A/B，记录里如实写「单侧对比」。

## 为什么这么改

- **不改 harness.js**：goal 明确禁止；所有参数都从 `createHarness` / `printGround` / `popup` 的公开入口给。
- **不动主站**：`index.html` / `assets/` / `assets/vendor/` 一个字节没改（P5-6 才会加详情卡入口）。
- **占位立牌用 `popup` 而不是 `node`**：`popup` 走的是「卡片上色 + 立起 + 铰链」的正常路径，P5-4 直接换
  `pts` 与 `paint` 即可；`setHero` 接的 handle 也就是 `popup` 的返回值。

## 回滚方法

- `U-029-03`：把 `washes(...)` 一行改回 `washes([C.ochre, C.ochre, C.ochreD, C.deep]);`（无可选 scales）。
- `U-029-02`：删 `scenes/huoyan/*`，保留空目录。
- `U-029-01`：删 `scenes/vendor/`（three 两件 + papercraft 六件 + lights.json）。恢复验证：目录不存在、
  主站 `check-all` 仍全通过（主站不依赖 scenes/）。

## 遗留

1. 地面平均色比宣纸深一档（226,196,131 vs 243,231,205），是暖主光所致；P5-3 印戈壁时统一色温。
2. 占位立牌只有轮廓与两道带，没有四肢 —— P5-4 换成 T 型十到二十片纸模。
3. `?test` 分支（测试卡）与 `capture.py` 正式截图流程都没接，P5-2 做。
4. `docs/papercraft-skill/references/` 有 15 篇（材料定律 / 光 / 结构 / 动效等），本轮只读了 SKILL.md 与
   popup-3d 的 harness 注释；P5-2/P5-3 需要按需读 palettes / look / structures。
