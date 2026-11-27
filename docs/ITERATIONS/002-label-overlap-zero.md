# 002 · 标签重叠归零（P3-1）

- 时间：2026-11-26 18:15–18:35（约 20 min，含两次失败返工）
- 改动单元：U-002-01（盒模型校准，失败并回退）、U-002-02（图钉/标签障碍分离 + 行内 text-anchor + 余量）

## 为什么做这一轮

第 1 轮 `STATE.md` 记着 1200×740 下 `overlapPairs=4`、`pinOverlap=9`。地图上一对标签叠成「毛毛虫」是最扎眼的观感缺陷，且这一项有可量化的验收判据（重叠对数归零且标签不许减少），符合「一件可验证的小事」。

## 做了什么

### 1. 先建度量口径（这轮最大的收获）

用 `bcdp_js` 注入 iframe，两条指标：

- `overlapPairs`：取所有 `g.pinlabel`（`style.display !== 'none'` 且有 `text`），`text.getBoundingClientRect()` 两两求交。
- `pinBite` / `pinOverlap`：把 `g.pin circle.ring` 的圆心与半径当圆，判断标签矩形是否与它相交。

口径踩过的坑：`g.pin circle.hit` 是半径 `15 * U ≈ 16px` 的**隐形点击热区**，用它量压钉会得到比实际大 2.4 倍的数字（22 处，而视觉上并无重叠）。正确的口径是 `circle.ring`（半径 `6.66 * U`，即屏幕上的可见圆环）。

### 2. U-002-01：盒模型三次校准（前两次失败）

`declutter()` 的候选位判定靠一个文字包围盒。原实现 `h = 13 * U`、`box.y = sy + dy - h / 2`，把基线当成了盒中心。实测（1440×900，相对图钉中心）：

- 三字标签 `w 35.2, h 16, left -17.6, top -26.97`（`dy = -13.97`）
- 二字标签 `w 23.73`
- ⇒ 字形盒高 **16 px = 1.42 em**、上缘在基线上方 **1.15 em**、宽 `len * fs * 1.05`（CSS 有 `letter-spacing: .04em`）

第一次改按 em 猜（`h = 1.06 * fs`、`top = 0.84 * fs`）并把候选位从 8 扩到 12，结果**恶化**：`overlapPairs` 4 → 13。教训：盒变小后贪心更容易「以为放得下」，反而塞得更挤；**盒模型必须量出来，不能猜**。

### 3. U-002-02：真正的根因

`boxes` 数组里同时装着图钉障碍和标签障碍，而选中站（`must`）分支执行 `boxes = boxes.filter(...)` 剔除与之相撞的既有框时，把 48 个图钉框全部冲掉了。此后所有标签都不再避让图钉 —— 这才是 `pinBite` 居高不下的原因。

`window.__dbgDeclutter` 探针导出的 `pinBoxes` 统计：`{"12.9x12.9": 48}` 在修复后出现，修复前是 0。

修法（`assets/js/app.js` `declutter()`）：

```js
var pinBoxes = [];     // 图钉障碍：永远不清
var labelBoxes = [];   // 标签障碍：选中站可清
function overlaps(a, b) { return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h); }
function hits(box) { return pinBoxes.some(b => overlaps(box, b)) || labelBoxes.some(b => overlaps(box, b)); }
// must 分支只清标签框
labelBoxes = labelBoxes.filter(b => !overlaps(placed.box, b));
```

同时 `pinR` 由 `6.4 * U` 提到 `7.2 * U`（可见圆环半径 + 描边余量）。

### 4. 第二个真 bug：CSS 压掉 presentation attribute

修完障碍分离后 1440 归零，1200×740 仍剩 6 对。查单个标签发现：DOM 上 `text-anchor="start"`、`dx="11.82px"`，但渲染出的 `x` 恰等于 `translate + dx - w/2` —— 它仍在按 `middle` 对齐。

原因：`assets/css/style.css:248` 的 `.pin-label { text-anchor: middle }` 是 CSS 声明，**优先级高于 SVG 的 presentation attribute**，所以 `declutter()` 里 `.attr("text-anchor", ...)` 写了不生效。改为 `.style("text-anchor", p.cd.anchor)`。

### 5. 第三个修正：留余量

1200 宽下有一批站间距只比字高多零点几像素，贪心判成「刚好不相交」，画出来仍是叠字。盒高 `1.42 em → 1.50 em`、宽 `+2 px`。

## 验证

同一度量脚本，三档视口：

| 视口 | `--u` | 可见标签 | overlapPairs | pinBite |
| --- | --- | --- | --- | --- |
| 1440×900 | 1.0746 | 48 / 48 | **0** | **0** |
| 1200×740 | 0.8955 | 48 / 48 | **0** | **0** |
| 390×844（已下钻 k=1.55） | 0.82 | 26 在屏 / 48 | **0** | **0** |

放大态（点火焰山，`scale(1.85)`，37 个在屏标签）同样 0 / 0。

截图：1440 全图、火焰山放大态各一张，肉眼确认无一叠字、无标签压钉。

另：探针 `window.__dbgDeclutter` 与 `pinCnt` 计数变量已删除，未留死代码。

## 风险与回退

- 项目非 git 仓库，回退靠 U-ID + 本文件说明：把 `declutter()` 的 `pinBoxes` / `labelBoxes` 合回单个 `boxes`、`w`/`h` 恢复 `len*1.05` / `1.42*fs`、`.style("text-anchor", …)` 改回 `.attr(...)` 即可复原到第 1 轮末状态。
- 窄屏 390 下 k=1（全图）时仍有 22 个标签被隐藏（合理：视口只放得下 26 个），这一点未变。

## 下一步

`BACKLOG.md` 取下一条：P2-2 回目直达（15 min），或 P2-1 人物路线（25 min）。
