# 第 15 轮 · 标签在面板里无位可放时退化显示（P4-10）

## 本轮目标

BACKLOG P4-10：某站的 12 个候选位若全部落进浮层面板，标签会整条消失（第 11 轮做了面板避让，但没做「避不开怎么办」）。
本轮补一条退让阶梯，让**选中站**在最坏的视口形状下仍然看得见，并给它一层能读出来的纸底描边。

判据（本轮自定）：

1. 极端视口 900×420（浮层几乎铺满画面）下，选中站的标签必须显示（`display !== "none"`）；
2. 该标签带 `.paneled` 类，且描边加粗、底色压暗（可与面板底色区分）；
3. 1440 / 1200 / 390 三档的 `pairs`、`obscured`、`offscreen` 全部保持 0（不许为了极端情形把常规情形弄脏）。

## 改了什么

### `assets/js/app.js` — `declutter()` 的放置循环（1304 → 1314 行 / 50780 → 51296 B）

把原来「第一趟严格 / 选中站第二趟允许压标签」的 `tries = must ? 2 : 1` 换成显式的模式表：

```js
var MODES = must
  ? [{ label: true, panel: true }, { label: false, panel: true }, { label: false, panel: false }]
  : [{ label: true, panel: true }];
for (var pass = 0; pass < MODES.length && !placed; pass++) {
  var mode = MODES[pass];
  for (var c = 0; c < CAND.length; c++) {
    ...
    if (pinHit(box)) continue;
    if (mode.label && labelHit(box)) continue;
    var onPanel = panelHit(box);
    if (mode.panel && onPanel) continue;
    placed = { box: box, cd: cd, dx: dx, dy: dy, paneled: onPanel };
    break;
  }
}
```

`label: true` 表示「要躲别的标签」，`panel: true` 表示「要躲面板」——**取反命名是有意的**：
模式表读起来是「允许什么」会绕，改成「还要躲什么」后三档的递进一眼能看出来。

写回时打记号：

```js
.classed("paneled", function (n) {
  var p = visible[n.order];
  return !!(p && p.paneled);
})
```

### `assets/css/style.css`（1133 → 1142 行 / 29377 → 29377+ B）

```css
/* 三档都放不下时，标签会退到浮层面板上（见 app.js 的 MODES）。
   面板是半透纸、又压着地图纹理，普通标签的浅色描边在这里读不出来，
   所以把描边加粗一圈、字再压暗一点，让字从面板上「挖」出来。 */
.pinlabel.paneled .pin-label {
  fill: rgba(43, 31, 16, 0.94);
  stroke-width: calc(4.4px * var(--u, 1));
  stroke: rgba(249, 242, 227, 0.99);
}
```

## 一个被实测否掉的方案（重要）

第一版把第 2 档（允许压面板）**对所有站**开放，想法是「面板底下的地看不见了，不如把字压上去」。
900×420 实测：`visible 35 / pairs 0 / obscured 35 / paneled 35` —— 35 条标签全糊在详情卡的正文上，
截图 `Z:\build-tmp\r15-900x420.png` 里正文被一层层地名盖住，**比藏起来更难读**。
于是收窄成：第 2 档只给选中站，其它站仍只有严格一档（`MODES = must ? [三档] : [一档]`）。
改后同一视口：`visible 1 / obscured 1（正是选中的火焰山）/ paneled [29]`，其余标签照旧隐藏，正文完整可读。

教训：**「宁可显示」不是无条件的**。标签是辅助信息，「必须看见」的资格只属于当前选中站；
把这条判断写进代码（而非只写在注释里），下次有人想放开时会被 `MODES` 的结构挡住。

## 验证证据

| 视口 | 站点 | 可见标签 | pairs | obscured | offscreen | paneled |
| --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | `#s=5` 长安 | 47 | 0 | 0 | 0 | 0 |
| 1440×900 | `#s=29` 火焰山（点图钉进入） | 25 | 0 | 0 | 0 | 0 |
| 1200×740 | `#s=29` | 45 | 0 | 0 | 0 | 0 |
| 390×844 | `#s=5` | 17 | 0 | 0 | 0 | 0 |
| **900×420** | `#s=29` | **1** | 0 | **1（=29 自己）** | 0 | **[29]** |

- 900×420 下选中站标签的计算样式实测：`stroke-width 3.608px`（`4.4 × U`，`U=0.82`）、
  `stroke rgba(249, 242, 227, 0.99)`、`fill rgba(43, 31, 16, 0.94)` —— 与 `.pin-label` 基线的
  `stroke-width 3px × U` / `fill rgba(58,44,26,0.9)` 有可见差别。截图 `Z:\build-tmp\r15-paneled.png`。
- 未回退项（1440 `#s=5` 复测）：`g.pin` 48、`tabindex="0"` 恰 1、`aria-current` 恰 1、`.sea-mark path` 64、`errs []`。
- `node --check assets/js/app.js` → `SYNTAX_OK`；`curl index.html` → `200`（页面可打开）。
- 390×844 下 `docW [390,390]`，无横向溢出。

## 为什么不用别的做法

- **不做「面板出现时把地图整体往下推」**：地图是绝对定位的整屏 svg，推它会让投影与经纬网错位，等于重做布局。
- **不做「标签自动换到面板外侧的最近空位」**：需要算到面板边界的距离并重新求解，超出 15 分钟的时间盒；
  且极端视口下外侧也可能没地方（900×420 就是这样）。
- **不隐藏选中站标签换指标**：那正是本轮要消灭的行为。

## 回滚方法

前向回退，记为 `U-016-01（回退 U-015-01）`：

1. `assets/js/app.js`：把 `MODES` 与 `for (pass…)` 循环恢复成第 11 轮的 `var tries = must ? 2 : 1;` +
   `if (pass === 0 && labelHit(box)) continue;` + `if (pass === 0 && panelHit(box)) continue;`，
   并删掉 `placed` 里的 `paneled: onPanel` 字段与 `.classed("paneled", …)` 那一段；
2. `assets/css/style.css`：删掉 `.pinlabel.paneled .pin-label { … }` 整块；
3. 恢复验证：900×420 `#s=29` 下 `visible` 回到 0、`document.querySelectorAll('.pinlabel.paneled').length === 0`；
   1440/1200/390 三档 `pairs / obscured / offscreen` 仍为 0（第 11 轮状态）。

## 遗留问题

- `.paneled` 只调了描边与字色，**没有做对比度量化**（未算 WCAG 比值，标待核）；面板底色是半透的，
  实际对比随底图明暗变化，严格说应取最坏情形测一次。
- 极端视口下只有 1 条标签（选中站）可见，其余 47 站靠图钉与悬停识别 —— 这是取舍，不是缺陷，但窄屏
  「可用地图面积被浮层切碎」的根因仍在（BACKLOG P4-9 窄屏详情卡默认收起），本轮未触及。
- `MODES` 里第 1 档（允许压别的标签）仍只给选中站，与第 11 轮一致，未复核「选中站压在邻站字上」的实际观感
  （当前数据下未触发）。
