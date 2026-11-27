# 第 22 轮 · 621–900 展开态压到 40vh，吸顶跟着抽屉走到 900

## 本轮目标（BACKLOG P4-16）

620–900 段的详情卡从第 18 轮起也是「横铺的底部条 + 默认收起」，但展开态仍取 `46vh`：844 高下 388px、700 高下 322px —— 800×700 实测可用地图带只剩 369px，比手机档（34vh / 305px 带）还差。本轮把这一段压到 `40vh`，并顺手把第 21 轮只作用于 ≤620 的卡头吸顶一并放宽到 900。

假设（写在这里以免以后当成结论）：**抽屉的边界是 900**（卡片从这一档开始 `left/right:12px` 横铺盖图），所以「卡片占多少屏」与「卡头要不要吸顶」都该跟着 900 走，620 只负责再收紧一档尺寸。第 18 轮已按这个假设把收起骨架放到 900，本轮把高度与吸顶也补上。

## 改了什么

`assets/css/style.css`（1218 行 / 34654 B → 1230 行 / 35400 B），全部在 `@media (max-width: 900px)` 内：

- 新增 `.detail.expanded { max-height: 40vh; padding-top: 0; }`（44vh→40vh 的效果：700 高 322 → 280、844 高 388 → 338）。
- 第 21 轮写在 620 断点里的吸顶三件套整段上移到这里（`.detail.expanded .d-head{position:sticky;top:0;z-index:1;margin:0 -24px;padding:20px 24px 10px;background:#f9f2e2;border-bottom:1px solid var(--rule-soft)}`、`.detail.expanded .close,.detail.expanded .expand{z-index:3}`、以及 `padding-top:0`），并在注释里写明「抽屉的边界是 900，这套吸顶也就跟着到 900（621–900 展开态同样会滚过卡口）」。
- 620 断点里只留 `.detail.expanded { max-height: 34vh; }`（手机档更矮，地图要留更多）。

JS 未改。

## 为什么这么改

- **为什么 40vh 而不是按高度分档**：46vh 的问题在「高视口占比过大」，40vh 是同一比例下的简单收敛，700 高得 280、844 高得 338，两个常见档都够读三四行正文；再细分成 `(min-height:800px)` 之类会让断点表越长越难验证，而这一段的收益差不到 30px。
- **为什么吸顶跟着上移**：第 21 轮只给 ≤620 做吸顶，理由是「手机屏最缺位置」；但 621–900 的卡同样是可滚的横条，滚到「此站之难」时同样不知道在读哪一站 —— 问题同型，解法应当同款。上移后 620 断点不再重复这套规则（原先第 17/18/21 轮各留过副本，这次一并收成一处）。
- **为什么不改 `46vh` 本身**：46vh 同时是**收起态以外的**通用上限（收起态由 `:not(.expanded)` 的 padding 骨架另行压到 73px），改它会影响 900 段的非展开布局；只覆盖 `.expanded` 更窄、更安全。

## 验证证据

口径同前：`f.src="/index.html?t="+Date.now()+"#s=N"` 强制重载 + `bcdp_wait 3000ms`；可见 `g.pinlabel` 的 `text.getBoundingClientRect()` 两两求交 = pairs；卡内滚动后取 `.d-head/.close/.d-nav` 的 rect 与 `elementFromPoint`。

| 视口 | 站点 | 收起态高 | 展开态高 | 卡内可滚 | 卡头顶端偏移 | 关闭叉/展开键 | `.d-nav` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 800×700 | `#s=29` | 73 | **280**（=`40vh`） | 395 > 278 | **+1px**（sticky） | closeTop 303 命中 | 底 551 ≤ 卡底 570 |
| 640×844 | `#s=29` | 73 | **338** | 可滚 | +1px | closeTop 389 命中 | 底 695 在卡内 |
| 390×844 | `#s=29` | 78 | 287（34vh，未变） | 可滚 | +1px | closeTop 446 命中 | 在卡内 |
| 1440×900 | `#s=29` | — | 644（未变） | `.expand` = `none` | head `position:static` | 不适用 | 全可见 |
| 1256×774（直接打开） | `#s=29` | — | 518 | `.expand` = `none` | static | 不适用 | — |

- 1440 的卡仍是 `[1058,108,356,644]`、可见标签 47、pairs 0、`g.pin` 48、`tabindex="0"` 1 个；console `errs 0`。
- 宽屏分隔线未回退：`.d-head` border 0px、`.d-meta` border 1px（第 21 轮的搬家仍在）。
- 截图 `F:\VibeCoding Project\西游记时序图\.tmp\r22-800-expanded.png`（800×700，展开态滚 150px：卡头挂着「第 59 – 61 回 · 火云洞 · 牛魔王 / 火焰山」）。
- `node --check assets/js/app.js` → SYNTAX_OK（1385 行 / 56949 B）；`node scripts/check-stations.mjs` 与 `node scripts/check-seamarks.mjs` 均 `exit=0`；`curl index.html` → 200。

## 回滚方法（前向）

用户在后续轮次说「撤销 U-022」时，做一次新改动：

1. `assets/css/style.css` 的 900 断点内，把 `.detail.expanded { max-height: 40vh; padding-top: 0; }` 改回 `.detail.expanded { max-height: 46vh; }`；
2. 把同处 `.detail.expanded .d-head`（sticky 三件套）与 `.close/.expand` 的 `z-index:3` 移回 620 断点（第 21 轮原样：`padding-top:0` 一并带回去）；
3. 620 断点保留 `.detail.expanded { max-height: 34vh; }`。
4. 记为 `U-023-01（回退 U-022-01、U-022-02）`，恢复验证：800×700 展开态高回到 322、`.d-head` 的 `position` 回到 `static`。

## 遗留问题

- 640–900 收起态已 73px，但**展开态 338px 仍占近半屏**（电话横屏 640×360 会更挤，未测）。
- 621–900 展开态的卡头在窄高视口（如 700 高）实占 106px，比 620 档相对更贵，若后续嫌挤可考虑这一档再收内边距。
- 仍未跑真实读屏器；`sticky` 卡头对读屏器的朗读顺序未验证，标「待核」。
