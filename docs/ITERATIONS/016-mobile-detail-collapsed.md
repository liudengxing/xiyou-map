# 016 · 窄屏详情卡改为默认收起（P4-9）

## 为什么做这一轮

390×844 下每次点图钉都立刻弹出 366×371 的详情卡（y 349–720）。同屏还有工具栏（10–39）、搜索框（56–87）、随行条（96–127）、时间轴（744–844），地图被切成 y 128–348 与 721–743 两段，全图态只有 11–17 条标签放得下 —— 点谁都得先把卡缩回去才能看下一站，交互上等于「每看一站就要关一次」。

这一条是 BACKLOG 里最后一条未完成项，也是窄屏「可用地图被浮层切碎」的根因。

## 做了什么（U-016-01）

### `assets/js/app.js`

1. `S` 新增 `detailExpanded: false`（`assets/js/app.js:30`，注释写明「窄屏详情卡是否已展开」）。
2. `renderDetail()` 在关闭叉之后插一枚卡内小键：
   ```html
   <button class="expand" aria-expanded="false" aria-controls="detail">展开</button>
   ```
3. 新增 `syncExpanded()`（`assets/js/app.js:750` 附近）：
   ```js
   el.classList.toggle("expanded", narrow && S.detailExpanded);
   expBtn.textContent = S.detailExpanded ? "收起" : "展开";
   expBtn.setAttribute("aria-expanded", S.detailExpanded ? "true" : "false");
   ```
   `if (!narrow) S.detailExpanded = false;` —— 宽屏根本没有收起概念，别把窄屏的展开状态带过去。
4. 点击：翻转 `S.detailExpanded` → `syncExpanded()` → `declutter()`（卡片长高/缩短都改变面板矩形，标签要重排）。
5. `select()` 换站时 `S.detailExpanded = false`（`assets/js/app.js:930`，注释「别把上一站的展开状态带过去」）。
6. `.close` 与全局 `Escape` 都 `classList.remove("expanded")` + `S.detailExpanded = false`（`assets/js/app.js:1285`）。

### `assets/css/style.css`

- 基础态 `.detail .expand` 隐藏，仅窄屏 `display:block`。
- `@media (max-width:620px)` 收起态：
  ```css
  .detail:not(.expanded) { padding: 8px 24px 10px; overflow: hidden; }
  .detail:not(.expanded) .d-head { border-bottom: none; padding: 0 0 0 62px; margin: 0; }
  .detail:not(.expanded) .d-name { font-size: 19px; margin: 0; line-height: 1.3; }
  .detail:not(.expanded) .d-chapter { margin-bottom: 3px; }
  .detail .d-chapter { padding-right: 24px; }   /* 关闭叉是绝对定位的，回目会从它底下穿过去 */
  .detail:not(.expanded) .d-modern,
  .detail:not(.expanded) .d-tags,
  .detail:not(.expanded) .d-sec-title,
  .detail:not(.expanded) .d-body,
  .detail:not(.expanded) .d-quote,
  .detail:not(.expanded) .d-note,
  .detail:not(.expanded) .d-nan,
  .detail:not(.expanded) .d-nav { display: none; }
  ```
- `left: 62px` 是给「展开」小键留的位（小键绝对定位在卡内左上，压着回目第一行的左侧空档）。

## 为什么是这个方案

- **不做「点图钉不弹卡、双击才弹」**：单次点击是这个站点唯一的「看这一站」动作，取消它等于让手机端读不到任何信息。
- **不做可拖拽的底部抽屉**：拖拽要接管 touch 手势，与地图缩放/拖拽抢事件；而且 `d3.zoom` 已在 `#map` 上绑了 pan，抽屉手势区与地图区重叠时会互相打断。
- **收起态只留「回目 + 站名」**：这两行是「点对了吗」的判据；情节、引句、难号属于「读」的功能，要读就主动展开。
- **状态放在 `S` 而不是 DOM**：`renderDetail()` 每次换站都重建 `innerHTML`，状态若只在 DOM 上，换站回来就会丢。

## 验证

`node --check assets/js/app.js` → SYNTAX_OK。

| 视口 | 站点 | 详情卡 rect | `.expand` display | 可见标签 | pairs | obscured | offscreen |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | `#s=29` | `[1058,108,356,644]` | none | 47 | 0 | 0 | 0 |
| 1200×740 | `#s=29` | `[818,108,356,484]` | none | 45 | 0 | 0 | — |
| 800×700 | `#s=29` | `[12,248,776,322]` | none | 13 | — | — | — |
| 640×844 | `#s=22` | `[12,325,616,388]` | none | 11 | — | — | — |
| 390×844 | `#s=22` | `[12,642,366,77]` | block | — | — | — | — |
| 390×844 | `#s=29` | `[12,642,366,77]` | block | 31 | 0 | 0 | 0 |

- 390×844 `#s=29` 收起态：高 **77 < 120**、最大连续可用地图带 **516 ≥ 400**、可见标签 **31 ≥ 20**，三条验收判据全过；`k = 1.55`（下钻态正常）。
- 390×844 展开态：`[12,348,366,371]`，与时间轴间隙 24px，可见标签 25（第 5 轮的 P4-4 结论未回退）。
- 620–900 段（640 / 800）`.expand` 为 `none`、卡片仍是整卡 —— 该段行为与本轮之前一致（收起断点只到 620）。
- 真键盘：焦点在「展开」上按 Enter → `expanded:true`、`aria-expanded="true"`、高 371、焦点仍留在按钮上（没有丢焦点）。Esc → `open:false`、`expanded:false`；再选站 → 高 77。
- 关闭叉 → `open:false`、`expanded:false`；再选同一站 → 高 77、按钮文案「展开」、`aria-expanded="false"`。
- 换站（点图钉 17 白虎岭）→ 高 77、文案「展开」、`aria-expanded="false"`、hash `#s=17`、`k 1.55`。
- 未回退：`g.pin` 48、`.sea-mark path` 64、`errs []`、390 无横向溢出。
- 截图：`Z:\build-tmp\r16-final-390-collapsed.png`、`r16-final-390-expanded.png`、`r16-390-s29-collapsed.png`。

### 本轮顺手修掉的一个小压字

回目文字原本从右上角的关闭叉底下穿过去：390 展开态实测回目 ink 右边界 340 vs 关闭叉左 333（**7px 压字**）。给窄屏 `.d-chapter` 加 `padding-right: 24px` 后同一站 ink 右边界 318 vs 333，压字消失；1440 无此问题（ink 1340 vs 叉 1379），所以只加在 620 断点内。

## 回滚方法（只前向）

若第 17 轮判定收起态不可接受，把回退记作 `U-017-01（回退 U-016-01）`：

1. `assets/js/app.js` 删 `detailsExpanded` → 实为 `S.detailExpanded` 那一行、`syncExpanded()` 整段、`.expand` 的插桩与点击绑定、`select()` 里的 `S.detailExpanded = false`、`.close` 与 Esc 里的 `classList.remove("expanded")` 与复位。
2. `assets/css/style.css` 删 620 断点内 `.detail .expand{display:block}`、`.detail:not(.expanded) *` 那组规则、`.detail .d-chapter{padding-right:24px}`。
3. 恢复验证：390×844 下 `#detail` 高应回到 371、`#detail .expand` 为 `null`。

## 遗留

- 展开态 371px 仍会盖住半张图（可用带 273px），「想边看图边读情节」在手机上依然做不到 —— 可另立「半屏展开 / 按内容自适应高度」。
- 620–900 段（平板竖屏、折叠机展开态）没有收起，640×844 实测卡片 388px、可见标签只有 11 条；断点是否该上移，需要另行实测。
- 收起态看不到「此站之难」的难号 —— 可选把难号压成收起态的一枚小徽标。