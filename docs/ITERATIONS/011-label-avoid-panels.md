# 第 11 轮 · 浮层面板纳入标签避让（P4-8）

## 本轮目标

`declutter()` 此前只让标签彼此避让、并躲开图钉，但不知道浮在地图上的面板：
`.masthead` / `.toolbar` / `.search` / `.chars` / `.legend` / `#detail` / `.timeline`。
落在这些矩形里的标签视觉上「看得见但被面板底色吃掉」，等于白放一个候选位，还把邻站的标签挤掉。

**判据**（BACKLOG P4-8 原文）：

1. 1440 打开详情卡时，落在 `#detail` 矩形内的可见标签数为 0；
2. 390 下落在 y<128（工具栏 + 搜索 + 随行条）与 y>740（时间轴）两带的标签数为 0；
3. 三档 `overlapPairs` 仍为 0，且可见标签数不少于改前 90%。

## 改了什么

文件：`assets/js/app.js`（`declutter()`）。规模 1254 行 / 47786 B → **1300 行 / 50568 B**。

### U-011-01 面板矩形收成障碍数组

在 `declutter()` 开头量面板：

```js
var PANEL_PAD = 3;

// 浮层面板也是障碍：工具栏、搜索框、随行条、图例、详情卡、时间轴都盖在地图上面，
// 标签落进去就只露出半截、或被面板底色吃掉（面板有 0.72 以上的填充）。
// 每次调用都重新量：详情卡会开合、随行条宽度随文字变、时间轴在窄屏会变矮。
function panelRect(el) {
  // 用 offset* 累加而不是 getBoundingClientRect()：面板的开合走 transform 过渡，
  // 刚加上 .open 时 rect 还停在屏外起点，量出来的矩形等于「面板不存在」，
  // 于是刚落位、本该被挤开的标签就压在了面板上。offset* 是布局位置，不受过渡影响。
  if (!el.offsetParent && el.offsetWidth === 0) return null;
  var x = 0, y = 0, node = el;
  while (node) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; }
  return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
}

var panels = (function () {
  var sel = [".masthead", ".toolbar", ".search", ".chars", ".legend", "#detail", ".timeline"];
  var out = [];
  for (var i = 0; i < sel.length; i++) {
    var el = document.querySelector(sel[i]);
    if (!el) continue;
    if (el.id === "detail" && !el.classList.contains("open")) continue;
    var st = window.getComputedStyle(el);
    // 只排除真的「不占位」的元素；不要用 opacity 判断 —— 详情卡刚加上 .open
    // 时 opacity 过渡还在 0 起点，量出来会被当成不存在，正是漏判的来源。
    if (st.display === "none" || st.visibility === "hidden") continue;
    var r = panelRect(el);
    if (!r || r.w < 2 || r.h < 2) continue;
    out.push({ x: r.x - PANEL_PAD, y: r.y - PANEL_PAD,
               w: r.w + PANEL_PAD * 2, h: r.h + PANEL_PAD * 2 });
  }
  return out;
})();

function panelHit(box) {
  return panels.some(function (b) { return overlaps(box, b); });
}
```

### U-011-02 第一趟躲面板

放置循环里，在 `labelHit` 之后加一条：

```js
// 面板同样只在「能让就让」的第一趟躲：面板底下那块地已经看不见了，
// 标签放进去等于白放；但选中站的标签必须显示，第二趟允许它压在面板上。
if (pass === 0 && panelHit(box)) continue;
```

非选中站只有一趟，等于「放哪里都不能进面板，进不去就隐藏」。

### U-011-03 开合与换站后重排

`renderDetail()` 在 `el.classList.add("open")` 之后补 `if (labelSel) declutter();`；
`.close` 回调里 `el.classList.remove("open")` 之后同样补一次；
全局 keydown 的 Esc 分支改为 `{ closeDrawers(); toggleAbout(false); $("#detail").classList.remove("open"); declutter(); }`。

理由：面板一开一合，可行区域就变了，不重排的话关掉卡片后原本被隐藏的标签回不来。

## 为什么这么改（以及三轮失败）

1. **第一版**：`getBoundingClientRect()` + 用 `st.opacity === "0"` 过滤不可见面板 → 1440 `#s=5` 下仍有 2 条标签落在详情卡内（「花果山」`[1029,343,35,16]`、「东海」`[1105,445,24,16]` 落在 `#detail [1058,108,356,644]` 里）。
2. **第二版**：以为是 `declutter()` 早于 `.open` 的时序问题，在 `renderDetail()` 与 `.close` 补调 → 仍 2 条。
3. **第三版**：把 `getBoundingClientRect()` 换成 `offsetLeft/offsetTop` 累加 → 仍 2 条。

**真因是那行 `opacity === "0"`**：`.detail` 的 CSS 是 `opacity: 0` + `transform: translateX(calc(100% + 40px))`，`.detail.open { opacity: 1 }` 带 `transition: transform .42s, opacity .32s`。`declutter()` 在 `.open` 刚加上、过渡还没推进时被调用，`getComputedStyle(el).opacity` 仍读到 `"0"`，面板就被判成「不存在」。删掉 opacity 判断后 `panelHits` 直接归 0。

结论：**动画过渡期间的 `opacity` 不能用来判断元素是否可见**；要判断「占不占位」只看 `display` / `visibility` / 尺寸。
offset 累加虽然在本例与 rect 等价（`#detail` 的 `offsetParent` 宽度 356、位置 1058,108 与 rect 一致），但避开过渡期的 transform，仍值得保留。

**没有改的**：没动 `CAND` 候选位、没动盒模型、没动 `EDGE = 4` 在屏守卫（第 10 轮）、没动两趟放置语义（第 7 轮）。
面板矩形用 `PANEL_PAD = 3` 外扩而不是内缩：标签紧贴面板边缘时看起来像压线，宁可多让 3px。

## 验证证据

口径沿用第 2 / 10 轮：可见 `g.pinlabel` 的 `text.getBoundingClientRect()`；
`obscured` = 矩形与任一面板矩形相交；`pairs` = 标签两两相交；`offscreen` = 四边内缩 4px 仍越界。
刷新方式：`f.src = "/index.html?t=" + Date.now() + "#s=N"`，`bcdp_wait` 3300–3400ms。

| 视口 | 站点 | 可见 | pairs | obscured | offscreen | 备注 |
| --- | --- | --- | --- | --- | --- | --- |
| 1440×900 | `#s=5` 长安 | 47 | 0 | 0 | 0 | 改前 48（隐藏的「东海」被详情卡压住、无处可放）|
| 1440×900 | `#s=29` 火焰山 | 47 | 0 | 0 | 0 | |
| 1440×900 | `#s=17` 白虎岭 | 22 | 0 | 0 | 0 | 放大态 |
| 1200×740 | `#s=5` 长安 | 47 | 0 | 0 | 0 | 面板 7 处全部量到 |
| 1200×740 | `#s=29` 火焰山 | 45 | 0 | 0 | 0 | |
| 390×844 | `#s=5` 长安 | 17 | 0 | 0 | 0 | `topBand 0 / botBand 0` |
| 390×844 | `#s=29` 火焰山 | 25 | 0 | 0 | 0 | `topBand 0 / botBand 0` |
| 390×844 | `#s=0` 花果山 | 11 | 0 | 0 | 0 | `minLeft 6.9`，与第 10 轮持平 |

- **面板遮蔽独立校验（最硬的一条）**：临时在放置循环里把 `panelHit` 短路（`window.__noPanel`），同一页面重排后 1440 `#s=29` 的 `obscured` 立刻从 0 变成 2（「花果山」「东海」），恢复后回到 0 —— 证明面板障碍确实在起作用，不是碰巧没撞上。校验用的开关已随验证删除（`grep '__noPanel'` 无命中）。
- 可见数回退检查：1440/1200 `#s=5` 48 → 47（97.9%）、390 `#s=5` 18 → 17（94.4%），都远高于 90% 门槛；少掉的都是原本就被面板压住、看不见的那条。
- 关卡片对称性：点 `#detail .close` 后 `open=false`、`#detail` rect 移到 `[1454,108]`（屏外）、可见标签 48、`pairs 0`、`obscured 0`（用剩余 6 个面板算），说明关掉之后原本被挤走的标签回到原位。
- 未回退的既有能力：`g.pin` 48、`tabindex="0"` 恰 1 个、`aria-current` 恰 1 个（第 9 轮）、`g.sea-mark path` 64（第 8 轮）、控制台 `errs []`。
- `node --check assets/js/app.js` → `SYNTAX_OK`；`grep -n '__noPanel\|__dbg\|console\.log\|debugger\|TEMP'` → 无命中（无调试残留）。
- 截图：`Z:\build-tmp\r11-1440.png`（1440×900，详情卡内无标签）、`Z:\build-tmp\r11-1440-s29.png`（1440×900，火焰山放大态）、`Z:\build-tmp\r11-390-s5.png`（390×844，工具栏/搜索/随行条/时间轴四带内无标签、详情卡内无标签）。

## 回滚方法

记为 `U-012-01（回退 U-011-01 / U-011-02 / U-011-03）`，四步：

1. 删 `declutter()` 里 `var PANEL_PAD = 3;` 起、到 `function panelHit(box) { ... }` 结束的整段（含注释）。
2. 删放置循环里的 `if (pass === 0 && panelHit(box)) continue;` 与其上方三行注释。
3. 删 `renderDetail()` 里 `el.classList.add("open")` 之后的 `if (labelSel) declutter();`、`.close` 回调里对应的那一句；Esc 分支恢复成 `{ closeDrawers(); toggleAbout(false); }`。
4. 恢复验证：1440 `#s=29` 下 `obscured` 回到 2（「花果山」「东海」）；`grep 'panelHit' assets/js/app.js` 无命中。

## 遗留问题

- **390 下可用地图面积被四块浮层切得很碎**：工具栏 10–39、搜索 56–87、随行条 96–127、详情卡 349–720、时间轴 744–844，中间只剩 128–348 与 721–743 两段，全图态只剩 11–17 条标签能放下。这是「窄屏 + 常驻浮层」的结构性代价，不是本轮 bug；真要改善得让详情卡在窄屏默认收起（现在是点图钉即展开），属交互决策，另立条目。
- **没做「标签绕开面板后再选次优位」**：现在是「12 个候选位里第一个既不越界、不压图钉、不进面板的就用」，找不到就隐藏。若某站 12 个候选位全在面板里，它会整条消失，而不是退化到「压住面板但至少可见」。数据上看没有站点落到这个极端（各档均无面板遮蔽），但换视口形状可能出现。
- 面板矩形每次都重算（每次 `declutter()` 遍历 7 个元素各读 `offsetWidth/offsetHeight`），48×12 次判定的量级下无性能问题；如果以后面板变多，可以改成在 `build()` 与 resize 时缓存。
