# 038 · 纪年层走 A+C（两处硬锚点 + 双轨对照）

用户 2026-11-27：「走 A + C」。A = 只标可考的两处年月；C = 小说与史实两轨并列。

## 可测指标（实测值）

| 指标 | 值 |
| --- | --- |
| 轴上的纪年锚点 | **2 枚**：`left:10.6383%`「贞观十三年 · 长安出关」、`left:100%`「历十四年 · 抵灵山 · 五千零四十八日」 |
| 双轨对照行 | `.tl-era-cap` 容器 358×8px，位于 `[714,655]–[1072,663]`（1440 壳下 409×9px，`[847,781]–[1256,790]`），与两枚锚点、五枚重点场景签**零重叠**（1256 与 1440 各量一次） |
| 默认状态 | `S.showEra = true`（经用户确认后默认开）；`.timeline.era-on` = true、按钮 `tbtn on ink` |
| 深链关掉 | `#s=5&era=0` → `era-on` false、`.tl-era` opacity 0、详情卡 `.d-era` 消失、按钮回 `tbtn` |
| 详情卡 | 长安「贞观十三年九月望前三日，自长安出关」；灵山「历十四年 五千零四十八日，抵灵山」；两站均带 `.d-era-note`「「贞观二十七年」史无此年：太宗崩于贞观二十三年。两轨不可互算。」 |
| 窄屏 390 | `.tl-era-cap` 计算样式 `display:none`（≤900px 收起），锚点 2 枚仍在，图钉 48、重点签 5 |
| 关于弹窗 | 新增「轴是回序轴，不是历法轴」一段；并把原句「往返十九年」更正为「往返约十七年（贞观三年出、十九年归）」 |

## 改动

1. `assets/js/data.js`：`era.compare = { novel: "贞观十三年 → 二十七年 · 十四年", real: "贞观三年 → 十九年 · 约十七年（629—645）", note: "「贞观二十七年」史无此年：太宗崩于贞观二十三年。两轨不可互算。" }`。
2. `assets/js/app.js`：`S.showEra` 默认 true；`writeHash()` 改为「关着才写 `era=0`」，`readHash()` 只认 `era=0`；`buildTimeline()` 追加 `.tl-era-cap`；末端锚点（`pct >= 97`）加 `end` 类右对齐（居中会压到对照行）；`renderDetail()` 的纪年行改为仅在 `S.showEra` 时输出，并对长安/灵山追加 `.d-era-note`。
3. `assets/css/style.css`（+4895 B）：`.tl-era-mark.end { transform: translateX(-100%) }`、`.tl-era-cap{position:absolute;right:0;top:-19px;line-height:1;font-size:calc(8.5px*var(--u,1));color:rgba(42,36,28,.62)}`（前置 10px 朱砂短线）、`.d-era-note{font-size:calc(9.5px*var(--u,1));color:rgba(140,43,34,.82);line-height:1.6}`、`@media (max-width:900px){.tl-era-cap{display:none}}`。
4. `index.html`：关于弹窗补「回序轴 / 两条线不可互算」一段并订正十七年；资源版本抬到 `?v=46`（`style.css` / `data.js` / `app.js` 三处）。

## 为什么

- 只标两处：中间年份没有原文支撑，画出刻度就是替作者编历法。
- 并列史实：小说写「贞观二十七年」而太宗崩于二十三年，这个断口不解释会显得图有错；把史实那程摆上去，读者自己就能看出差三年是「出发年挪了十年」造成的。
- 对照行放锚点上方而不放图例里：它只解释轴本身，跟着纪年层开关一起出现/消失，比常驻图例少占版面。

## 盲评的诚实说明

视觉通道仍不可用（`read_image` / `bcdp_screenshot` 只回元数据），本轮所有结论来自 DOM 矩形、计算样式与哈希断言；**没有**「看起来更好」这类判断。

## 回滚

1. `S.showEra` 改回 `false`。
2. 删 `buildTimeline()` 里的 `.tl-era-cap` 段与 `renderDetail()` 的 `.d-era-note` 段。
3. 删 `style.css` 里 `.tl-era-mark.end`、`.tl-era-cap`、`.d-era-note` 三块（含 media query）。
4. `index.html` 版本号可不动（回滚不影响缓存正确性）。

## 遗留

- 对照行与锚点曾在 1440 壳下重叠 1px（`cap.bottom 801` 对 `mark.top 800`），把 `top` 从 `-13px` 收到 `-19px` 并 `line-height:1` 后两档都无重叠；900–1100 区间未逐档量。
- 双轨对照行在 900px 以下收掉了；窄屏只能靠详情卡里的 `.d-era-note` 得知「史无此年」。
- 逐回在场名单仍只到「五人 + 悟空两次离队」，八戒单独行动、沙僧留守未逐段录（BACKLOG）。
