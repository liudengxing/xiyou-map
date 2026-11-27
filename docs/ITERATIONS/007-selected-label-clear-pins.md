# 第 7 轮 · 选中站标签不再压邻站图钉（P4-3）

时间：2026-11-26 19:30 – 19:45
改动单元：U-007-01
前序：第 2 轮把标签重叠归零（U-002-02），当时留了一个已知取舍 —— 选中站（`must`）的标签会强行放在第一个候选位，不管是否压住邻站的图钉，于是 `#s=29` 火焰山态下 `pinBite=1`（压住「真假美猴王」2.55 px）。本轮收掉它。

## 目标

火焰山态 `pinBite=0`，同时其余 47 站 `overlapPairs` 仍为 0、48 个标签仍全部可见（不许靠隐藏标签换指标）。

## 根因

`assets/js/app.js` 的 `declutter()` 里，放置循环是：

```js
if (!hits(box) || must) { placed = { box: box, cd: cd, dx: dx, dy: dy }; break; }
```

`must` 让选中站**在第一个候选位直接就位**，完全跳过碰撞检测。而「选中站一定显示」是硬需求（详情卡对着的那一站不能没有名字），所以不能简单去掉 `must`；真正的毛病是把「必须显示」实现成了「第一步就放」。

此外图钉与标签**混在一个 `hits()`** 里判断，一旦要让选定站「退一步」，就无法表达「可以让标签、但不能让图钉」这层优先级 —— 图钉是唯一可点的靶心，标签压住它就点不到了。

## 改了什么

`assets/js/app.js` 的 `declutter()`（约 :467–:526）：

1. 把合并的 `hits(box)` 拆成两个谓词：
   ```js
   function pinHit(box)   { return pinBoxes.some(function (b) { return overlaps(box, b); }); }
   function labelHit(box) { return labelBoxes.some(function (b) { return overlaps(box, b); }); }
   ```
2. 放置改成**两趟**，趟数按是否选中站决定：
   ```js
   var tries = must ? 2 : 1;
   for (var pass = 0; pass < tries && !placed; pass++) {
     for (var c = 0; c < CAND.length; c++) {
       ...
       var box = { x: lx, y: sy + dy - TOP_EM * fs, w: w, h: h };
       if (pinHit(box)) continue;                    // 图钉：任何一趟都不许压
       if (pass === 0 && labelHit(box)) continue;    // 第一趟：标签也不许压
       placed = { box: box, cd: cd, dx: dx, dy: dy };
       break;
     }
   }
   ```
   - 非选中站：只有一趟，图钉与标签都不能压（与第 2 轮行为一致）。
   - 选中站：第一趟要求「图钉和标签都干净」；找不到才进第二趟 —— **允许压标签（标签可以让位，反正后面会把它剔除），但绝不允许压图钉**。
3. 原有 `must` 分支的「剔除与之冲突的标签框」保留不动（`labelBoxes = labelBoxes.filter(...)`），`pinBoxes` 仍永不清 —— 第 2 轮 bug1 的结论不能被推翻。

代码里补了注释说明这层优先级，避免下一个人又把 `tries` 改回 1。

## 为什么不是别的做法

- **给选中站标签加纸底描边**：视觉上「压住」变「衬底」，但图钉仍然被盖住一半、点击热区缩小，只是把问题藏起来。
- **临时缩小 `pinR`**：会让选中站附近所有标签都挤进来，`overlapPairs` 反而上升（第 2 轮已踩过「盒变小 → 贪心误判放得下 → 更挤」）。
- **两趟**是最小改动：只在「选中站实在找不到干净位置」时降一级，平时行为完全不变。

## 验证证据

判据脚本（与第 2 轮同一套，可复用）：逐站 `dispatchEvent(click)`，等 1000 ms 后量
- `g.pinlabel` 中 `style.display !== "none"` 且有 `text` 的取 `getBoundingClientRect()`，两两求交 = `overlapPairs`；
- `g.pin circle.ring` 圆心 + 半径（可见圆环 r≈6.66 px，**不是** `circle.hit` 的 16.1 px 热区）与**选中站自己的**标签矩形求交 = `pinBite`。

| 视口 | `--u` | 遍历站数 | 选中站标签缺失 | `overlapPairs` | `pinBite` |
| --- | --- | --- | --- | --- | --- |
| 1440×900 | 1.0746 | 48（0–47 全部） | 0 | 0 | 0 |
| 1200×740 | 0.8955 | 48 | 0 | 0 | 0 |
| 390×844 | 0.82 | 48 | 0 | 0 | 0 |

- 火焰山单点复核：`#s=29` 深链 → `#detail .d-name` = 火焰山、`visible 48 / pairs 0 / bite []`。
- 视觉：`Z:\build-tmp\r7-huoyan-1440.png`（1440×900 全图，火焰山选中态；标签「火焰山」在钉子上方，右侧「真假美猴王」标签与图钉都不再被压）。
- `node --check assets/js/app.js` → `SYNTAX_OK`；`grep -n "__dbg\|console\.log\|debugger" assets/js/*.js` 无命中。
- 控制台无报错（`errs []`），`g.pin` 48、`g.pinlabel` 48。

## 回滚方法（前进式）

在下一轮做一次新修改把状态改回去，记为 `U-008-xx（回退 U-007-01）`：

1. `declutter()` 里把 `pinHit` / `labelHit` 两个函数删掉，恢复成合并的 `hits(box)`；
2. 删掉 `var tries = must ? 2 : 1;` 与 `for (var pass ...)` 外层循环，恢复单层 `for`；
3. 第 519–521 行三句（`if (pinHit(box)) continue;` / `if (pass === 0 && labelHit(box)) continue;`）改回一句 `if (!hits(box) || must) { ... }`；
4. **恢复验证**：1440 下点火焰山（`#s=29`），判据脚本应重新报 `pinBite=1`（「真假美猴王」被压 2.55 px），说明已回到第 6 轮状态。

## 遗留

- 390 宽下若站点贴近视口边缘，标签可能落到屏幕外（实测 `#s=0` 时「黄风岭」标签矩形 `left = -60`）。它不在可见区，不影响判读，但 `declutter()` 目前只按 `-50/+50` 的边距判断「要不要给这一站放标签」，没有把「放在屏外」当作无效位置。改进要点：候选位若整盒落在视口外应判为失败，交给下一个候选位。属新条目，记 BACKLOG。
- 全站 48 站遍历验证耗时约 50 秒（每站 1000 ms 等动画），后续若要再次扫，可把 `diveTo` 的过渡在验证时关掉提速。
