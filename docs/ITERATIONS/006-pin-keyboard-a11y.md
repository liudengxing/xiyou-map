# 第 6 轮 · P4-1 图钉键盘可访问性

- 轮次：6 / 时间：2026-11-26 19:28 / 改动单元：`U-006-01`
- 前置：`docs/ITERATIONS/` 已有 001–005 ⇒ N = 6；BACKLOG 最高未完成项为 P4-1。

## 本轮目标

48 个图钉此前只能鼠标点，纯键盘用户只能靠 `←` `→` 一站一站挪，且不知道当前聚焦在哪。目标：`Tab` 能依次聚焦图钉、有看得见的焦点环、`Enter` / `空格` 能选中，并给读屏器一个说得清的名字。

## 改了什么

### `assets/js/app.js`（1198 → 1215 行 / 44223 → 45244 B）

`drawPins()` 的 `g.pin` 选择集上新增四段：

```js
.attr("tabindex", 0)
.attr("role", "button")
.attr("aria-label", function (n) {
  return n.short + "，" + (n.act === "prologue" ? "悟空前传第 " + (n.actIndex + 1) + " 站" : "西行第 " + (n.actIndex + 1) + " 站")
    + "，第 " + n.chapter[0] + (n.chapter[0] === n.chapter[1] ? "" : " – " + n.chapter[1]) + " 回";
})
.on("keydown", function (ev, n) {
  // SVG 元素上没有原生按钮语义，Enter / Space 要自己接；Space 还要挡掉页面滚动
  if (ev.key !== "Enter" && ev.key !== " " && ev.key !== "Spacebar") return;
  ev.preventDefault();
  ev.stopPropagation();
  select(n.order, { dive: true });
})
.on("focus", function (ev, n) {
  // 键盘聚焦时也把标签亮出来：避让可能把这一站的标签藏掉了，
  // 只看见一个无名圆点对键盘用户等于没有标签。
  labelSel.filter(function (d) { return d.order === n.order; }).style("display", null);
});
```

- `aria-label` 三种形态实测：花果山「花果山，悟空前传第 1 站，第 1 回」、长安「长安，西行第 1 站，第 12 – 13 回」、灵山「灵山，西行第 43 站，第 98 – 100 回」。单回目站只写一个数字（不写成「第 27 – 27 回」）。
- `keydown` 里之所以 `stopPropagation()`：`document` 上还有一层全局键盘处理（`assets/js/app.js:1146`），`空格` 在那里绑定的是播放。不拦住的话，焦点在图钉上按空格会同时"选中该站"和"开始自动巡礼"。

### `assets/css/style.css`（1118 → 1133 行 / 28956 → 29378 B）

新增 `.pin:focus` 一组（放在 `.pin .tick-no` 之后）：

```css
/* 键盘焦点：SVG 的默认 outline 在各家浏览器里落在包围盒上，很难看，改成描一个双环 */
.pin:focus { outline: none; }
.pin:focus .ring { stroke: var(--cinnabar); stroke-width: 2; }
.pin:focus .halo {
  opacity: 1; animation: none;
  stroke: var(--cinnabar); stroke-width: 1; stroke-dasharray: 2 2; r: 10;
}
.pin:focus .pin-label { fill: var(--cinnabar-deep); font-weight: 700; }
```

## 为什么这么改

- **不用 `<foreignObject>` 包一个真 `<button>`**：那会破坏现有 d3 数据绑定与 `rescale()` 的反缩放（图钉用 `translate + scale(1/k)` 保持屏幕尺寸，多一层 HTML 容器会让焦点框跟着缩放走），收益不抵风险。
- **`outline:none` 必须配可见替代**：只清 outline 是 a11y 大忌。这里用「主环加粗到 2px 变朱砂 + 外圈虚线圆环 r=10 + 标签加粗变朱砂」三件套，看截图在米黄纸底上很清楚。
- **聚焦时强显标签**：`declutter()` 会隐藏放不下的标签，键盘用户如果 tab 到一个"无名圆点"，等于没有标签。`focus` 时临时放开这一站的 `display`，是最小改动。
- **不动 `role` 的 tab 顺序**：d3 按 `nodes` 数组顺序 append，DOM 顺序 = 花果山 → 前传 → 西行 1…43，正是叙事顺序；不额外设 `tabindex` 正值（会打乱整页 Tab 序列）。

## 验证证据

`node --check assets/js/app.js` → `SYNTAX_OK`。

### 1440×900（`.tmp/frame1440.html`）

- 属性齐备：`g.pin` 共 48，首个 `tabindex="0"`、`role="button"`、`aria-label="花果山，悟空前传第 1 站，第 1 回"`；第 6 个「长安，西行第 1 站，第 12 – 13 回」；末个「灵山，西行第 43 站，第 98 – 100 回」。
- 真键盘 Tab：先 `pins[5].focus()`（长安），再按一次 `Tab`，`document.activeElement` 变成 `g.pin.journey.past` = **法门寺** —— 焦点按叙事顺序前进，且落在 SVG 元素上。
- 焦点样式（`getComputedStyle`）：`.ring` `stroke rgb(176,58,46)`、`stroke-width 2px`；`.halo` `opacity 1`、`stroke-dasharray 2px, 2px`、`r 7.52`（补间前的基准值，CSS `r:10` 作用在属性上）。截图 `Z:\build-tmp\r6-focus.png`：两界山位置可见朱砂双环 + 加粗标签。
- `Enter` 选中：焦点在两界山（`pins[10]`），`hash` `#s=5` → `#s=10`，`#detail` 打开且 `.d-name` = 「两界山」。
- `空格` 选中：焦点在黑风山（`pins[12]`），`hash` `#s=10` → `#s=12`，`.d-name` = 「黑风山」，且 `.tl-play` 的 className 仍是 `tl-play`（**没有触发播放** —— 证明 `stopPropagation` 生效）。
- 无回归：复位后 48 标签可见 / `pairs 0`；点火焰山 `#s=29` 放大态 37 标签可见 / `pairs 0` / `bite 0`（第 2 轮与第 5 轮的判据都仍成立）。控制台 `errs []`。

### 390×844（`.tmp/frame390.html`）

- 焦点白虎岭（`pins[17]`）按 `Enter`：`#s=5` → `#s=17`，`.d-name` = 「白虎岭」，详情卡 `open`，`scrollWidth = clientWidth = 390`（无横向溢出）。截图 `Z:\build-tmp\r6-390.png`。

## 回滚方法

本项目非 git 仓库，回滚前向进行。撤销本轮在下一轮记为 `U-007-01（回退 U-006-01）`：

1. `assets/js/app.js` 的 `drawPins()`：删掉 `.attr("tabindex", 0)`、`.attr("role", "button")`、`.attr("aria-label", …)`、`.on("keydown", …)`、`.on("focus", …)` 五段（`click` 与 `mouseenter` 保留）。
2. `assets/css/style.css`：删掉 `.pin:focus` 那 5 条规则与上方注释。
3. 恢复验证：`document.querySelector("g.pin").getAttribute("tabindex") === null`；`pins[5].focus()` 后按 `Tab` 焦点离开地图（不再停在法门寺）；焦点在图钉上按 `空格` 会开始播放（回到旧行为）。

## 遗留问题

- **焦点环与 halo 动画冲突已规避但未统一**：`.pin.active .halo` 走 `pulse` 动画（r 9→22），`.pin:focus .halo` 用 `animation:none` + 固定 r=10 覆盖；若某站既 active 又 focused，焦点样式优先（CSS 后写）。视觉上两者叠在一处时略花，属可接受。
- **未做 `aria-pressed` / `aria-current`**：选中站在视觉上有 `.active` 类，但读屏器不知道「当前选中」。要做需在 `select()` 里同步属性，估 5 min，另立 P4-5。
- **未做 roving tabindex**：48 个图钉全在 Tab 序列里，从工具栏 tab 到地图要按十几次。常规做法是只给当前站 `tabindex="0"`、其余 `-1`，用方向键在图钉间移动 —— 但那会和现有的「`←` `→` 换站」全局快捷键打架，需要一并设计，本轮不做。
- 图钉的 `<circle class="hit">` 仍是 `fill:transparent` 的鼠标热区，键盘用户没有对应"更大靶心"的概念，属可接受。
