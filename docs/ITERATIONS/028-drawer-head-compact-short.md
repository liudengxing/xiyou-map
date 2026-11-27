# 028 · 矮屏抽屉表头压缩：前提纠正 + 把 71px 的表头压到 45px

日期：2026-11-27
改动单元：`U-028-01`（`assets/css/style.css` 的 `@media (max-height: 480px)`）

## 本轮目标

BACKLOG P4-23 写的是「矮屏行程表抽屉的表头不吸顶，滚到中段看不到标题与关闭叉」。本轮先验证这个前提，再决定改什么。

## 前提纠正（假设检验）

**前提不成立，表头本来就是固定的**：`.drawer` 是 flex 列，`.drawer-head` 与 `.drawer-body` 是**兄弟**，只有后者 `overflow:auto`，所以表头根本不参与滚动。

证据（640×360，`#drawer-trip .drawer-body.scrollTop = 900`）：

| 项 | 值 |
| --- | --- |
| `.drawer-head` rect | `[0, 0, 371, 71]` |
| `.drawer-body` rect | `[0, 71, 371, 315]` |
| `.drawer-head` computed `position` | `static` |
| `elementFromPoint(表头中心)` | 命中 `.drawer-head` 内元素 → `closeHit` 对关闭叉为 `true` |

## 真正的问题

表头 71px（`padding: 26px 26px 16px` + 17px 标题）在 **360px 高**的屏上吃掉五分之一，正文只剩 289px —— 49 行的行程表与 81 格的难簿都要在这个窗口里滚。行程表滚 1405px 才到底（1694−289）。

## 改动

`assets/css/style.css`，仅 `@media (max-height: 480px)` 内新增两行：

```css
.drawer-head { padding: 10px 18px 8px; }
.drawer-head .close { padding: 2px 0 2px 10px; }
```

标题字号（17px）与信纸风格（border-bottom、letter-spacing）不动 —— 压的是留白，不是字。

## 验证

| 视口 | 项 | 改前 | 改后 |
| --- | --- | --- | --- |
| 640×360 | `#drawer-trip .drawer-head` 高 | 71px | **45px** |
| 640×360 | `#drawer-trip .drawer-body` 高 | 289px | **315px** |
| 640×360 | 行程表需滚 | 1405px | **1379px** |
| 640×360 | 关闭叉 `elementFromPoint` | 命中 | 命中（`closeHit true`） |
| 640×360 | 难簿末格 / `.nan-foot` | 109–139 / 263–322 | 109–139 / **263–322**（仍同屏，`isLast true`，文本 `81`） |
| 390×844 | `.drawer-head` 高 / padding | 71 / `26px 26px 16px` | **71 / `26px 26px 16px`**（不命中矮屏断点） |
| 1440×900 | 同上 | 71 / `26px 26px 16px` | **不变** |

- 截图 `.tmp/r28-640-trip-head.png`（640×360 界面在 1256 画布内，行程表滚到第 9–18 行，「行程表 / 四十八站 / ×」固定在最上）。
- `node scripts/check-all.mjs` → `OK：3 项全通过`；`node --check assets/js/app.js` → SYNTAX_OK；`curl index.html` → 200。

## 为什么不用 sticky

`position: sticky` 是给「在滚动区内部」的表头用的；这里的表头在滚动区外面，加 sticky 是给不需要的地方打补丁，还会引入 `top:0` 与 `.drawer` 边框的层叠问题。

## 回滚

删掉上述两行，即回到「表头 71px、body 289px」。恢复验证：640×360 下 `#drawer-trip .drawer-head` 高回到 71。

## 遗留

- 45px 的表头下「四十八站」与关闭叉之间的水平距离只剩 ~10px（640 宽）；再窄（≤ 480 宽的横屏）需复核是否会撞。未立条目，先记录。
- 行程表 49 行在 360 高里仍要滚 1379px，行高未压 —— 属 P4-22 的邻居问题（P4-22 是地图带），未合并。
