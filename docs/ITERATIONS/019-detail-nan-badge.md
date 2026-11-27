# 019 · 收起态给详情卡补一枚难号徽标

时间：2026-11-26 23:26
改动单元：U-019-01

## 本轮目标

BACKLOG P4-13：收起态只露「回目 + 站名」，想知道「这站有几难」得点两次（先展开、再读「此站之难」）。补一枚紧凑徽标，让收起态就能看到难号。

## 改了什么

1. `assets/js/app.js`
   - 新增 `nanBadgeLabel(n)`（紧跟 `nanOf()` 之后）：把 `n.nan` 压成一条紧凑难号 —— 连续区间合并成 `第 47 – 49 难`，不连续用中点分隔（`第 36 – 38 · 81 难`）。不复用 `nanLabel()` 是因为它给通天河那句「第 36 – 38 难 · 第 81 难（回程）」有 18 个字符，塞不进 22px 高的站名行；而且第 81 难在第 3 轮之后已归到灵山，通天河的 `nan` 只剩 `[36,37,38]`，两种写法现在都等价，但紧凑版对将来的不连续数据仍然成立。
   - `renderDetail()`：算 `badgeText = n.act === "journey" ? nanBadgeLabel(n) : ""`（前传五站没有难号，不出徽标），生成 `<span class="d-nanbadge">`，塞进 `<h3 class="d-name">` 内部（站名 + 徽标同一行）；同时给 `h3` 写 `aria-label="站名，第 47 – 49 难"`。
2. `assets/css/style.css`
   - 基础态 `.d-nanbadge { display: none; }`（宽屏是完整卡，正文本来就有「此站之难」一串按钮，重复显示是噪声）。
   - `@media (max-width: 900px)` 的收起态里显示：`display: inline-block; margin-left: 8px; padding: 1px 6px; font-size: 11px; letter-spacing: .06em; color: var(--cinnabar); border: 1px solid rgba(176,58,46,.42); border-radius: 2px; vertical-align: 2px;`，并给 `.detail:not(.expanded) .d-name` 加 `padding-right: 34px`，免得站名被徽标顶长后跑到右上角关闭叉底下。

## 为什么这么做

- **把徽标塞进 `h3` 而不是另起一行**：收起态总高 78px（390 宽）只剩一条 22px 的站名行，另起一行会把卡片顶过 120px 的验收线，且多一行反而更像「正文」。
- **收起态显示、展开态隐藏**（而不是一直显示）：展开后「此站之难」三个按钮就在下面，徽标是同一信息的第二份，只会让人多读一遍。
- **前传不出徽标**：花果山 / 方寸山 / 东海 / 幽冥界 / 天庭不在八十一难里，硬写「第 0 难」是编造。
- **`aria-label` 写在 `h3` 上而不是容器**：写在 `#detail` 上会让整张卡的可访问名覆盖掉内部所有文字（读屏器只念一句 aria-label，正文全丢）；写在站名标题上是补充标题的读音，正文照旧可读。

## 验证证据

| 视口 | 站点 | 卡片高 | 徽标文本 | 徽标 vs 关闭叉 | 可见标签 | pairs |
| --- | --- | --- | --- | --- | --- | --- |
| 390×844 | `#s=29` 火焰山 收起 | 78（未变） | 第 47 – 49 难 | 不交（徽标 `[172,688,87,18]` 右 259 vs 叉左 343） | 31 | 0 |
| 390×844 | `#s=29` 展开 | 287 | `display:none` | — | 40 | — |
| 390×844 | `#s=24` 通天河 收起 | 78 | 第 36 – 38 难 | 不交（右 259 vs 叉 343） | — | — |
| 390×844 | `#s=0` 花果山（前传）收起 | 78 | 无节点（`badge: (none)`） | — | — | — |
| 640×844 | `#s=47` 灵山 收起 | 73（未变） | 第 80 – 81 难 | 不交（右 257 vs 叉 593） | 46 | 0 |
| 1440×900 | `#s=29` | 644（未变） | `display:none` | — | 47 | 0 |

- `aria-label` 实测：`火焰山，第 47 – 49 难` / `通天河，第 36 – 38 难` / 花果山为 `null`（没有徽标就不加，避免念出空难号）。
- `node --check assets/js/app.js` → `SYNTAX_OK`。
- 截图 `Z:\build-tmp\r19-390-badge.png`（390×844，394050 B，sha256 28738b96…）。

## 回滚方法

前进式回退，记为 `U-020-01（回退 U-019-01）`：

1. `assets/js/app.js` 删掉 `nanBadgeLabel()` 整个函数；`renderDetail()` 里删掉 `badgeText` / `nanBadge` / `nameAria` 三个变量，把 `<h3 class="d-name"...>` 还原成 `'<h3 class="d-name">' + n.name + "</h3>"`。
2. `assets/css/style.css` 删掉 `.d-nanbadge { display: none; }` 与 900 断点里的 `.detail:not(.expanded) .d-nanbadge { … }` 与 `.detail:not(.expanded) .d-name { padding-right: 34px; }` 两块。
3. 恢复验证：390×844 `#s=29` 收起态 `document.querySelector(".d-nanbadge")` 为 `null`、卡片仍 78px、可见标签 31。

## 遗留问题

- 徽标只写难号区间，不写难名（如「路阻火焰山」）；要写就得换行或缩字号，收起态塞不下，判为不做。
- 徽标是视觉补充，读屏器靠 `h3` 的 `aria-label` 才听得到；未跑真实读屏器（NVDA / VoiceOver），与第 6 / 9 / 13 轮一样标「待核」。
- 展开态的摘要在 11px 时对比度未量化（`--cinnabar` 对宣纸底），若要做无障碍审计需单列一条。