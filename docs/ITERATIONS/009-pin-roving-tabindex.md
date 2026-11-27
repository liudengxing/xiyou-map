# 009 · 图钉 `aria-current` 与 roving tabindex

## 本轮目标（BACKLOG P4-5）

第 6 轮给图钉补了键盘可达性（`tabindex="0"` / `role="button"` / `aria-label` / Enter 与空格 / 焦点环），
但留下两个问题：

1. **读屏器不知道「当前选中哪一站」**。视觉上有 `.pin.active`（朱砂实心），但该状态只存在于 class 里，
   无障碍树上看 48 个图钉完全一样。
2. **48 个图钉全在 Tab 序列里**。从工具栏（6 个按钮）进地图，要连按 48 次 Tab 才能越过图钉层，
   再按才能到「随行」按钮、时间轴。这是一条典型的键盘陷阱。

判据（写进 BACKLOG，本轮逐条验）：

- `document.querySelectorAll('g.pin[tabindex="0"]').length === 1`
- 当前站有 `aria-current="true"`，其余站没有
- 方向键仍能换站（已有全局 `← →` 语义不能破）

## 改了什么

### `assets/js/app.js` · `drawPins()`

初始 `tabindex` 由常量 `0` 改成按当前站判断：

```js
// roving tabindex：整个图层只留一个 Tab 落点（当前站），否则从工具栏进地图要按 48 次 Tab
.attr("tabindex", function (n) { return n.order === S.idx ? 0 : -1; })
```

### `assets/js/app.js` · `updatePins()`

每次换站时同步两件事 —— `tabindex` 的「0 号位」搬家和 `aria-current` 的归属：

```js
.classed("active", function (n) { return n.order === S.idx; })
.classed("past", function (n) { return n.order < S.idx; })
.classed("off", function (n) { return !!set && !set[n.order]; })
.attr("tabindex", function (n) { return n.order === S.idx ? 0 : -1; })
.attr("aria-current", function (n) { return n.order === S.idx ? "true" : null; })
```

紧接着补一段「焦点跟随」：

```js
// 键盘焦点原本落在某个图钉上时，换站后把焦点一并搬到新站，否则焦点会留在刚被
// 设为 tabindex="-1" 的旧图钉上，Tab 回来时落点飘忽。
if (document.activeElement && document.activeElement.closest
  && document.activeElement.closest("g.pin")) {
  var curPin = pinSel.filter(function (n) { return n.order === S.idx; }).node();
  if (curPin) curPin.focus();
}
```

## 为什么这么改

- **为什么不给每个图钉都保留 `tabindex="0"`、另加一套方向键在图层内游走**：项目已有全局 `← →`/`↑ ↓`
  换站（`assets/js/app.js:1176-1177`），再做一套局部方向键会产生两套语义，`Tab` 进图层后按方向键
  到底走哪一套说不清。**让「当前站」就是唯一 Tab 落点、方向键直接换站，两件事合成一件事**，
  语义最一致，也不用新增键盘约定。
- **为什么 `aria-current` 用 `"true"` 而不是 `"step"` 之类的枚举**：`aria-current` 的取值里 `true` 是
  「当前项」的通用表达；`step`（流程中的一个步骤）也说得通，但站点同时受时间轴进度与选中状态影响，
  用 `true` 更中性、不会随时间轴播放语义漂移。
- **为什么要在 `updatePins()` 里搬焦点**：不搬的话，换站后焦点停留在刚变成 `tabindex="-1"` 的旧图钉上，
  读屏器仍念旧站，而新站只有 `tabindex="0"` 却没有焦点 —— 视觉与无障碍状态不一致。条件里用
  `document.activeElement.closest("g.pin")` 判断「焦点本来就在图钉层里」，所以点鼠标、在搜索框里打字、
  聚焦工具栏按钮时都不会被抢焦点（实测见下）。
- 未改 CSS：`.pin.active` 的视觉已在，`aria-current` 是纯语义补充，不需要新的样式。

## 验证证据

工具：`.tmp/frame1440.html` / `.tmp/frame390.html` 包装页（内容区 1440×900 / 390×844），
`bcdp_js` 注入 `f.contentWindow` 取 DOM 断言，`bcdp_screenshot({selector:"#f"})` 取图。
`node --check assets/js/app.js` → `SYNTAX_OK`（1247 行 / 47223 B）。

### 1440×900，`#s=5`（长安）冷启动

```json
{ "pins": 48, "tab0": 1, "tab0Label": "长安，西行第 1 站，第 12 – 13 回",
  "cur": 1, "curLabel": "长安，西行第 1 站，第 12 – 13 回", "tabMinus1": 47 }
```

### 键盘路径

| 操作 | 结果 |
| --- | --- |
| 聚焦当前站 → `ArrowRight` | `hash` `#s=5` → `#s=6`；`tabindex="0"` 只剩 1 个，落在「法门寺，西行第 2 站，第 13 回」；**焦点自动跟到法门寺**（`document.activeElement` 的 `aria-label` 同为法门寺） |
| 再 `Enter` | `#detail .d-name` = 「法门寺」；`aria-current="true"` 只有 1 个且在新站；`otherCurrent=0`（旧站的 `aria-current` 已移除） |
| 鼠标点「白虎岭」图钉 | `hash` `#s=17`，焦点落在白虎岭（点击本身带焦点），`aria-current` 随之搬家 |
| 焦点在页面上（非图钉）按 `ArrowRight` | `#s=17` → `#s=18` 宝象国；`tabindex="0"` 仍只有 1 个 —— **焦点没有被抢走**（`beforeTag` 与 `afterTag` 都是 `g` 但非图钉层内，说明「只在图钉层里才搬焦点」的守卫有效） |
| 焦点在工具栏 `.tbtn` 上按 `ArrowRight` | `#s=18` → `#s=19` 平顶山；`afterTag` 仍是 `BUTTON.tbtn`、`activeIsPin=false` —— 工具栏焦点不会被打断 |

### 全表检查

`g.pin` 48 个，`tabindex="0"` 只有 1 个（当前站），其余 47 个是 `-1`；
其余 102 个可 Tab 元素（6 个工具栏按钮、搜索框、5 个「随行」按钮、详情卡关闭与难号按钮等）不受影响。

### 火焰山放大态（`#s=29`）

`aria-current` = 「火焰山，西行第 25 站，第 59 – 61 回」，`tab0=1`；标签度量 `visible 48 / pairs 0 / bite 0`（第 2 轮脚本，未回归）。

### 390×844（`#s=17` 白虎岭）

`pins 48 / tab0 1`，`tab0Label` = 「白虎岭，西行第 13 站，第 27 回」，`aria-current` 1 个，
详情卡 `open`，`docW [390,390]` 无横向溢出。

### 控制台

`errs []`（用 `w.addEventListener("error")` 收集全程为空）。截图 `Z:\build-tmp\r9-roving-1440.png`（1440×900）。

## 回滚方法

前向回退，记为 `U-010-01（回退 U-009-01）`：

1. `drawPins()` 里 `.attr("tabindex", function (n) { return n.order === S.idx ? 0 : -1; })` 改回 `.attr("tabindex", 0)`。
2. `updatePins()` 里删掉 `.attr("tabindex", …)` 与 `.attr("aria-current", …)` 两行。
3. 删掉 `updatePins()` 末尾那段「焦点跟随」的 `if (document.activeElement …closest("g.pin"))` 块。
4. 恢复验证：`document.querySelectorAll('g.pin[tabindex="0"]').length === 48`、
   `document.querySelectorAll('g.pin[aria-current]').length === 0`，方向键仍能换站。

## 遗留问题

- **没有做 Home / End 跳到首末站**。BACKLOG 原案里提过，但 `Home`/`End` 在浏览器里是滚动键，
  全局抢它会影响页面其余部分；本轮时间盒内选择不动，如需要应作为独立一轮并只在地图内拦截。
- **`aria-current` 只在图钉上**，时间轴手柄（`.tl-handle`）与「随行」按钮没有对应的 `aria-pressed`。
  后者可以在下一轮补（`buildChars()` 里给 `S.focusChar` 对应按钮加 `aria-pressed="true"`），估 10 min。
- 读屏器实测只做了 DOM 断言 + 焦点断言，没有跑真实的 NVDA / VoiceOver。`aria-label` 与
  `aria-current` 的组合语义在标准里明确，风险低，但严格说属「未经真实读屏器验证」，标为待核。
