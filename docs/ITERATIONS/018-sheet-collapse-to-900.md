# 018 · 详情卡的收起边界从 620 放宽到 900

时间：2026-11-26 23:10
改动单元：U-018-01

## 本轮目标

BACKLOG P4-12：620–900 段（平板竖屏、小笔记本窗口）的详情卡要不要也收起。

第 16 轮只对 `W <= 620` 做了收起。可是在 `@media (max-width: 900px)` 里，卡片早就不是右侧抽屉了 —— 它 `left: 12px; right: 12px` 横铺成一张底部大卡片。640×844 实测：卡 616×388，从 y 326 压到 y 714，地图只剩 128–326 一条带，可见标签仅 **12 条**，比 390 宽收起态（31 条）还差。

## 假设（走岔路时的取舍）

> 收起这件事的边界应该跟着「卡片是否横铺盖图」走，而不是跟着手机宽度走。既然 `@media (max-width: 900px)` 就是横铺的起点，收起也该到 900 为止。

## 改了什么

1. `assets/js/app.js` · `renderDetail()`（约 :746）
   - `var narrow = W <= 620;` → `var sheet = W <= 900;`，并加注释说明 900 是横铺边界、620 只是尺寸再收紧一档。
   - `el.classList.toggle("expanded", sheet && S.detailExpanded)`、`if (!sheet) S.detailExpanded = false;`。
   - 该函数里的 `narrow` 只服务于这件事，改名不影响 `diveTo`/`panToStation` 里各自的 `narrow`（那些是 620 的手机取景逻辑，本轮不动）。
2. `assets/css/style.css` · `@media (max-width: 900px)`
   - 新增收起骨架：`.detail .expand{display:block}`、`.detail:not(.expanded){padding:12px 22px;overflow:hidden}`、`.detail:not(.expanded) .d-head{border-bottom:none;padding:0 0 0 78px;margin:0}`、`.d-name{font-size:22px}`、`.d-chapter{margin-bottom:3px}`、`.detail .d-chapter{padding-right:24px}`，以及 8 个段落类（`.d-modern/.d-tags/.d-sec-title/.d-body/.d-quote/.d-note/.d-nan/.d-nav`）的 `display:none`。
   - 620 断点里**删掉重复的同一批规则**（收缩为 `padding:8px 24px 10px`、`.d-head padding-left:62px`、`.d-name 19px`、`.detail.expanded{max-height:34vh}`），避免两处真相：上一轮 `.detail.expanded` 与 `.d-chapter padding-right` 被同时写在两个断点里。

## 验证证据

都用 `bcdp_js` 强制重载（`f.src="/index.html?t="+Date.now()+"#s=N"`）后 `bcdp_wait` 3200ms，再量 `getBoundingClientRect()`。指标口径沿用第 2 / 10 / 11 轮：可见 `g.pinlabel` 的文字矩形两两求交 = `pairs`；矩形中心落入卡片矩形 = `obscured`。

| 视口 | 站点 | 卡片 | 收起高度 | 可见标签 | pairs | obscured | 备注 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 640×844 | `#s=29` | `[12,641,616,73]` | **73**（< 200 ✅） | **47**（≥ 20 ✅） | 0 | 0 | 改前 388 / 12 |
| 640×844 展开 | `#s=29` | `[12,326,616,388]` | 388（46vh） | — | — | — | `scrollHeight 437 > clientHeight 386`，卡内可滚 |
| 800×700 | `#s=29` | `[12,497,776,73]` | 73 | 47 | 0 | 0 | 可用带 369px |
| 390×844 | `#s=29` | `[12,642,366,78]` | 78 | 31 | 0 | — | 与第 16 轮一致，未回退 |
| 1200×740 | `#s=29` | `[818,108,356,484]` | 484（完整） | 45 | 0 | — | `.expand` = `none`，未受影响 |
| 1440×900 | `#s=29` | `[1058,108,356,644]` | 644（完整） | 47 | 0 | 0 | `.expand` = `none`，48 图钉 |

- 640 收起态几何细节：`.expand` `[31,652,42,21]`、关闭叉 `[593,654]`、站名 `[113,672,605]`；回目文字实墨右界 **428** vs 叉左 **593**，不压字（`.d-chapter` 的 rect 右界 605 含 24px 右内边距，不能用 rect 判压字）。
- 640 收起↔展开往返：73 → 388（文案「收起」/`aria-expanded="true"`）→ 73（文案「展开」/`false`）。
- `node --check assets/js/app.js` → `SYNTAX_OK`；截图 `Z:\build-tmp\r18-640-collapsed.png`（640×844）。

## 为什么不是别的做法

- **不把 620 断点整体上移到 900**：620 里还有工具栏横滚、搜索框通栏、人物行贴搜索框等手机专属排版，直接上移会让 640 宽出现「手机上才合理」的版式。
- **不新增 621–900 的专用断点**：收起态本来就是「900 横铺卡片」的一个子状态，写成独立断点会让 `display:none` 的一串选择器出现第二份副本（正是上一轮已经踩过的两处真相）。
- **展开态在 620–900 仍取 46vh（388px）**：这一档高度充裕（700–900 高），展开是用户明确要求的动作，不需要再压；只有 ≤620 才压到 34vh。

## 回滚方法

前进式回退，记为 `U-019-01（回退 U-018-01）`：

1. `assets/js/app.js` 里把 `var sheet = W <= 900;` 改回 `var narrow = W <= 620;`，并把 `syncExpanded()` 与 `if (!sheet)` 里的 `sheet` 改回 `narrow`。
2. `assets/css/style.css` 的 `@media (max-width: 900px)` 内删掉 U-018-01 新增的 15 行（`.detail .expand` 到 `.d-nav { display: none }` 一组），把 620 断点里那批规则补回去（见 017 记录末尾的样式片段）。
3. 恢复验证：640×844 `#s=29` 卡片回到 `[12,326,616,388]`、可见标签回到 12、`.expand` 在 640 下 `display:none`；390 / 1440 不受影响。

## 遗留问题

- 620–900 段展开态仍是 46vh（388px @844），在 700 高的窗口里会占 322px；若将来觉得挤，可另立一条把它压到 40vh —— 本轮不动，因为 700 高下地图带仍有 369px。
- 收起态仍然只露「回目 + 站名」，看不到难号（P4-13 未做）。
- `.expand` 与关闭叉都在卡片右上/左上，卡片高度 73px 时两者垂直位置只差 2px（652 vs 654），视觉上略挤；如要调，需连 `.d-head` 的 padding 宽度一并给 640–900 单独一档。