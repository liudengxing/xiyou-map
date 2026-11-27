# 第 4 轮 · P2-1 人物路线（点人走线）

- 轮次：4 / 时间：2026-11-26 19:15 / 改动单元：`U-004-01`
- 前置：`docs/ITERATIONS/` 已有 001–003 ⇒ N = 4；BACKLOG 最高未完成项为 P2-1（协议 P2 三条主线的最后一条）。

## 本轮目标

协议交互第三主线「点人走线」：选中唐僧 / 悟空 / 白龙马 / 八戒 / 沙僧，地图上只显示该角色的行迹与站点，其余淡化；再点一次取消。此前 `data.js` 里只有零散的人名，`app.js` 里 `悟空|八戒|沙僧|人物|角色` 命中 0 次 —— 该功能从未实现。

## 改了什么

### `assets/js/data.js`（615 → 642 行）

在 `realRoute` 之前新增 `characters`。只记**入队站**（终点一律灵山），入队回目可考，不臆造：

```js
characters: [
  { id: "tang",    name: "唐僧",   short: "唐僧",   from: "changan",  prologue: false, note: "第十二回长安出关，至第一百回灵山受经" },
  { id: "wukong",  name: "孙悟空", short: "悟空",   from: "liangjie", prologue: true,  note: "第一至七回前传；第十四回两界山归正入队" },
  { id: "bailong", name: "白龙马", short: "白龙马", from: "yingchou", prologue: false, note: "第十五回鹰愁涧化马，充作脚力" },
  { id: "bajie",   name: "猪八戒", short: "八戒",   from: "gaolao",   prologue: false, note: "第十九回高老庄收为二徒弟" },
  { id: "shaseng", name: "沙悟净", short: "沙僧",   from: "liusha",   prologue: false, note: "第二十二回流沙河收为三徒弟" },
],
```

### `index.html`（138 → 140 行）

- `.legend` 之前插入 `<div class="chars" id="chars"></div>`。
- `.legend` 加第四行「所选人物」（石绿实线样例）。

### `assets/js/app.js`（1116 → 1197 行）

- `S` 增加 `focusChar: null`。
- 新增 `charById(id)`、`charOrders(c)`（`prologue` 为真时先塞全部前传站，再从 `c.from` 对应站接到数组尾）、`charOrderSet(c)`（收成哈希表供 classed 用）。
- `drawRoutes()` 末尾建两层：`routeEls.charPro`（`path.route-char.pro`）与 `routeEls.char`（`path.route-char`）。
- `updateRoute()` 末尾画人物行迹：前传段取 `nodes.filter(n => n.act === "prologue")`，西行段取 `charOrders(c).filter(n => n.act === "journey")`，均走 `northUp(...)`，`.classed("on", ...)` 控制显隐。
- `updatePins()`：`pinSel` 与 `labelSel` 都加 `.classed("off", n => !!set && !set[n.order])`，随后 `declutter()`。
- 新增 `buildChars()`：`#chars` 内渲染 `<span class="chars-hint">随行</span>` + 每个角色一个 `<button class="cbtn" data-char="<id>" title="<note>">`；点击切换 `S.focusChar`（同一个人再点置 null）→ `updateRoute(); updatePins(); refreshFlags(); writeHash();`。
- `refreshFlags()` 末尾同步 `.cbtn.on`；`writeHash()` 加 `c=<id>`；`readHash()` 加 `if (q.c && charById(q.c)) S.focusChar = q.c;`；`init()` 里 `buildChars();`。

### `assets/css/style.css`（1050 → 1117 行）

- `.route-char`：石绿 `#2f6b4a`、`calc(2.2px * var(--u,1))`、`vector-effect:non-scaling-stroke`、`opacity:0` → `.on{opacity:.85}`；`.route-char.pro` 虚线 `6 5`、线宽 1.7。
- `.pin.off{opacity:.22}`、`.pinlabel.off{opacity:.16}`、`.pin.off .halo{opacity:0!important;animation:none}`（队伍外站点仍可点，只是退到后面）。
- `.chars`：`left:34px; bottom:244px;` 一行 flex、纸底 `rgba(248,240,221,.72)`、2px 圆角、细描边；`.chars-hint` 10px 疏排；`.cbtn` 11px 宋楷，`.on` 反白底石绿。
- 响应式：`≤900px` 时 `.chars{left:12px;bottom:auto;top:152px}`；`≤620px` 时 `.chars{top:96px}` + `.chars-hint{display:none}` + `.cbtn{font-size:10px;padding:2px 5px}`。

## 为什么这么改

- **西行段只连 `act === "journey"` 的站**。第一版直接 slice「入队站 → 数组尾」，把悟空前传五站也串进同一条路径，1440 下从花果山/方寸山/东海/幽冥界/天庭一路连到两界山，画出一条横贯半个地图的绿色假线（截图确认）。改成前传单独一段虚线后，才符合「前传是另一时空」的读法。
- **只记入队站、不逐站标"在场人物"**。逐站列人物需要 48 站 × 多人的可考依据，本轮时间盒内做不实；入队站有明确回目（14/15/19/22 回），可核。因此「人物路线」= 自入队起随队行到灵山，语义诚实。
- **入口挂在图例上方的小条，而不是工具栏**。工具栏六个按钮是「图层开关」语义；人物切换是「过滤视角」，与图例里的线样说明同属图例系统。窄屏工具栏已横滚，再加按钮会挤爆。

## 验证证据

`node --check assets/js/app.js` → `SYNTAX_OK`（改动后各一次）。

1440×900（`.tmp/frame1440.html`，`--u` = 1.0746）：

- `#chars .cbtn` 共 5 个，文本「唐僧 / 悟空 / 白龙马 / 八戒 / 沙僧」，位置 y 620–656，`.legend` 从 y 669 起，不重叠。
- 逐人点数（`g.pin` 总数 48）：

  | 人物 | 淡出站 | 保留站 | 前传虚线 |
  | --- | --- | --- | --- |
  | 唐僧 | 5 | 43 | 否 |
  | 悟空 | 5 | 43 | **是** |
  | 白龙马 | 11 | 37 | 否 |
  | 八戒 | 13 | 35 | 否 |
  | 沙僧 | 15 | 33 | 否 |

- 点「悟空」：hash → `#s=5&c=wukong`，`.cbtn.on` = 悟空，`routeOn = true`、`proOn = true`，`route-char` 的 `getBBox()` = `[165,183,527,384]`（贴合陆上路线，不再有横贯线）；淡出的 5 站 `__data__.order` = 5,6,7,8,9（长安 / 法门寺 / 巩州 / 河州卫 / 双叉岭）。
- 再点同一人 → `on=[]`、`off=0`、`routeOn=false`，hash 回 `#s=5`。
- 标签度量（第 2 轮脚本）：基线 48 可见 / `pairs 0` / `bite 0`；选中悟空后仍 48 / 0 / 0 —— 人物态未破坏标签避让。
- 深链 `#s=5&c=wukong` 冷启动：hash 保留、`.cbtn.on` = 悟空、`routeOn=true`、`off=5`。

390×844（`.tmp/frame390.html`）：

- `.search` y 56–87、`.chars` y 96–127、`#detail` y 380.6–752、`.timeline` 从 726 起 —— 三者互不重叠；`document.documentElement.scrollWidth = 390`，无横向溢出。
- 深链 `#s=5&c=wukong` 下 5 个按钮、`.cbtn.on` = 悟空、`off=5`。截图确认窄屏人物条排在搜索框正下方、详情卡之上。

截图：`.tmp` 外 → `Z:\build-tmp\ego-browser-shot-18308-1.png`（1440 悟空态）、`Z:\build-tmp\ego-browser-shot-21636-1.png`（390 悟空态）。

## 回滚方法

本项目非 git 仓库，回滚只能前向。要撤销本轮，在下一轮做一次反向修改，记为 `U-005-01（回退 U-004-01）`：

1. `assets/js/app.js`：删 `buildChars()` 与 `init()` 里对它的调用、删 `charById` / `charOrders` / `charOrderSet`、删 `drawRoutes()` 里两个 `routeEls`、删 `updateRoute()` 的人物分支、删 `updatePins()` 里两处 `off` classed、删 `refreshFlags()` 末行、删 `writeHash()` 的 `c=` 与 `readHash()` 的 `c` 解析、删 `S.focusChar`。
2. `assets/js/data.js`：删 `characters` 数组。
3. `index.html`：删 `<div class="chars" id="chars"></div>` 与图例第四行。
4. `assets/css/style.css`：删 `.route-char` / `.route-char.on` / `.route-char.pro` / `.pin.off` / `.pinlabel.off` / `.pin.off .halo` / `.chars` / `.chars-hint` / `.cbtn` 三块媒体查询里的对应条目。
5. 恢复验证：页面不再有「随行」一行，`document.querySelectorAll("#chars .cbtn").length === 0`，深链 `#c=wukong` 不产生任何淡出站点（`g.pin.off` 为 0）。

## 遗留问题

- 人物只区分「入队先后」，未区分「谁在哪一站离队/单独行动」（如悟空被逐回花果山的三段）。要做到这一层需要逐站在场人物表，属新条目，本轮不做。
- 白龙马 37 站、八戒 35 站、沙僧 33 站，淡出数量差异只来自入队早晚，观感上区分度有限；若后续要做「专属路线」需人物级别的出差段数据。
- `.chars` 在 900px 与 620px 两档用了 `top` 定位，若将来新增顶部工具（如筛选栏）需重新量一遍间距。
