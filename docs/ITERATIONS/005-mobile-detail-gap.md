# 第 5 轮 · P4-4 窄屏详情卡被时间轴吃掉最后 26 px

- 轮次：5 / 时间：2026-11-26 19:20 / 改动单元：`U-005-01`
- 前置：`docs/ITERATIONS/` 已有 001–004 ⇒ N = 5；BACKLOG 最高未完成项里耗时最短、判据最硬的一条是 P4-4。

## 本轮目标

390×844 下详情卡最后一屏（「此站之难」一行 / 前后站翻页按钮）被底部时间轴的渐变层压住 26 px，既看不全也点不到。目标：详情卡底边完全落在时间轴之上，`document.elementFromPoint()` 在该区域必须命中详情卡而不是时间轴。

## 改了什么

`assets/css/style.css`（1117 → 1118 行）：

1. `@media (max-width: 620px)` 里 `.detail { bottom: 92px; max-height: 44vh; }` → `.detail { bottom: 124px; max-height: 44vh; }`，并在上方加一行注释：
   `/* 时间轴高 118px、z-index 20 高于详情卡：底边必须让到它上面，否则最后一行会被渐变吃掉 */`
2. 同一条媒体查询里新增 `.timeline { height: 100px; padding: 8px 12px 10px; }`（把窄屏时间轴从 118px 压到 100px，少占 18px 竖屏空间；`padding` 原本在下面 `@media (max-width: 620px)` 更靠后的位置另有一条同名声明，已合并删除，避免两处真相）。

改动是纯 CSS，无 JS 变更，`assets/js/*.js` 与 HTML 未触碰。

## 为什么这么改

- **两侧同时让**：只把 `.detail` 的 `bottom` 提到 124px（92 + 32），卡内可视高度会少 32px；同时把窄屏时间轴压到 100px，等于把省下的 18px 还给卡片。实测下来 `#detail` 落在 y 349–720，`.timeline` 从 y 744 起，中间留 24px 呼吸，比"刚好贴住"更稳（避免将来改时间轴内边距时又压上）。
- **不用 `z-index` 反转**：把 `.detail` 抬到 20 以上会让详情卡盖住时间轴轨道，窄屏下时间轴就点不到了 —— 那是把 bug 换成另一个 bug。
- **不缩 `max-height`**：44vh 是第 2 轮为"地图仍要露出来"定的，改动它会影响 620 以上宽度的观感（那条规则同时被 900px 断点继承）。

## 验证证据

量测脚本（`bcdp_js` 注入 iframe，`R(e)` = `getBoundingClientRect` 取整）：

```js
const det=d.querySelector("#detail"), tl=d.querySelector(".timeline");
gap = tl.getBoundingClientRect().top - det.getBoundingClientRect().bottom
hit = d.elementFromPoint(195, det.bottom - 4)   // 详情卡内最下一行
```

### 390×844（`.tmp/frame390.html`，#s=5 长安）

| 项 | 改前 | 改后 |
| --- | --- | --- |
| `#detail` rect | `[12, 381, 366, 371]`（底 752） | `[12, 349, 366, 371]`（底 720） |
| `.timeline` rect | `[0, 726, 390, 118]`（z-index 20） | `[0, 744, 390, 100]` |
| 二者交叠 | **26 px 重叠** | **0，间隙 24 px** |
| `elementFromPoint(195,745)` | `SMALL`（被时间轴渐变吃掉） | `svg`（地图，两不相压） |
| 卡片滚到底后 `.d-nav` | 落在卡外/被压 | y 651–700，完全在卡内（卡底 720） |
| 「此站之难」小节 | 落在渐变里 | y 584–631，完整可见 |

- 逐点探针（改后，x=195）：700 `DIV.d-quote` / 710 `SMALL` / 719 `ASIDE.detail.open`（卡底边内侧）/ 721 起 `svg`（地图）—— 详情卡与时间轴之间是干净的地图，没有互相遮挡。
- 滚到底截图：`Z:\build-tmp\r5-scrolled.png`，可见「此站之难」四枚难号、「← 天庭 / 法门寺 →」翻页按钮完整落在卡片内。
- 改前截图：`Z:\build-tmp\r5-before.png`（末行「第十三回 · 法门寺中三藏答众僧」正落在渐变里）；改后：`Z:\build-tmp\r5-after.png`。

### 其它视口（无回归）

- 1440×900（`.tmp/frame1440.html`）：`#detail` `[1058, 108, 356, 644]`（底 752），`.timeline` `[0, 782, 1440, 118]`，交叠 **0**；标签度量基线 **48 可见 / pairs 0 / bite 0**，图钉 48。
- 800×700（`.tmp/frame.html?w=800&h=700&h2=s=5`，命中 900px 断点）：`#detail` `[12, 248, 776, 322]`（底 570），`.timeline` `[0, 582, 800, 118]`，间隙 **12 px**；卡底边探针命中 `SMALL`（正文，说明没被压）。
- 620×844（`.tmp/frame.html?w=620&h=844&h2=s=29`，620 断点边界）：`#detail` `[12, 349, 596, 371]`（底 720），`.timeline` `[0, 744, 620, 100]`，间隙 **24 px**，`scrollWidth = clientWidth = 620`（无横向溢出）。
- 控制台 `errs []`（全程 `w.addEventListener("error", …)` 捕获为空）。

## 回滚方法

本项目非 git 仓库，回滚前向进行。要撤销本轮，在下一轮记为 `U-006-01（回退 U-005-01）`：

1. `assets/css/style.css` 的 `@media (max-width: 620px)` 里：`.detail { bottom: 124px; … }` 改回 `bottom: 92px`，并删掉上方那行注释。
2. 删掉该媒体查询开头的 `.timeline { height: 100px; padding: 8px 12px 10px; }`，并在 `.d-name` 之后恢复一行 `.timeline { padding: 8px 12px 10px; }`（即本轮合并删除的那条）。
3. 恢复验证：390×844 下 `#detail` 底边回到 ≈752、`.timeline` rect 回到 `[0,726,390,118]`，`gap` 变成 **−26**（负值即重叠），`elementFromPoint(195,745)` 重新命中非详情卡元素。

## 遗留问题

- 窄屏时间轴压到 100px 后，`.tl-hint`（「← → 换站 空格 播放…」）在 390 下本来就被 `.tl-read`/`.tl-nan` 的 `display:none` 一并藏掉了，未受本轮影响；但 620×844 这一档若将来要让提示行显示，需要重新算高度。
- 详情卡仍是"底部抽屉 + 内部滚动"两段式，长卡片（如长安）内容长于 44vh 时必须在卡内滚两屏才能看到翻页按钮。属设计取舍（第 2 轮定的 44vh），本轮不动。若后续要做"一键到底"，可考虑把 `.d-nav` 改成 sticky 底栏，另立条目。
- 900px 断点里 `.detail` 的 `bottom: 130px` 与 118px 高的时间轴只差 12px，观感偏紧；本轮未动（不在 P4-4 范围内），若要收紧可另开一条。
