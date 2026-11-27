# 033 · P5-5 三个人与纸片对话

第 33 轮 / 时间盒 20 min / 本轮只做 P5-5：「罗刹女 / 牛魔王 / 猪八戒 三个纸人 + 一段纸片对话」。

## 1. 本轮可测指标（验收表 §8 的 P5-5 行）

| # | 指标 | 目标 | 实测 |
|---|---|---|---|
| 1 | 三人纸人 | 各 5–6 张卡，落在 walkArea 内 | 罗刹女 6 / 牛魔王 6 / 猪八戒 6，`(x,z) = (−9.2,−12) / (−3.4,−14.6) / (7.4,−6.2)` |
| 2 | 点人弹对话 | 点人物出对话框，不误触发走路 | 点 canvas `(816,383)` 命中「猪八戒」，主角留在 `(0,3)` 未移动 |
| 3 | 对话时截断走动 | 对话开着点地面不动 | 开场对话后点 `(900,600)` 并 `step(0.5)×4`，主角仍 `(0,3)` |
| 4 | 关后恢复走动 | Esc / 末句收掉后能走 | 关后同样点击 → `(9.8,3.17)` |
| 5 | `clips()` 仍空 | 3 人加入不引入互穿 | `[]`；`cards()` 133 → **151**（hero 回中后 146），`pieces` 145，`buildMs` 372 |

## 2. 改了什么

| 文件 | 区块 | 内容 |
|---|---|---|
| `scenes/shared/paper-ui.css`（新建 3338 B） | 全文件 | 纸片对话框：`--pd-*` 色板（墨 `#2a241c` / 纸 `#fbf3df` / 边 `#d2bd98` / 朱砂 `#b03a2e`）、`feTurbulence` 纤维贴图（只压暗 3–6%）、**双细墨框**（外 `1px rgba(74,44,34,.82)` + 内 `outline-offset:-5px`）、厚度 + 接触影 + 远影三条 box-shadow、`pd-sheet-in` 从下方 26px 抽出的 0.34s 动效、`prefers-reduced-motion` 关闭、520px 以下收窄并隐藏身份行 |
| `scenes/shared/dialog.js`（新建 4190 B / 121 行） | `createDialog({onClose})` | 只建一次 DOM（`role=dialog`、`aria-live=polite`、`aria-modal=false`）；逐字 26ms；点击卡面 / Enter / 空格 → 下一句（逐字未完先补完）；Esc 关闭；`.pd-more` 末句变「收起」；`onClose` 里恢复走动 |
| `scenes/huoyan/people.js`（新建 12009 B / 300 行） | `buildPeople(H)` | 三人各 6 张卡（服装正面/侧面、头、发髻或牛角或大耳、道具），`H.popup(...)` 摆到世界坐标、`order: 8`、`sway: 0.012`、`res: 0.8`、每人躯干一张 `solid: 0.5–0.62`；每张卡的 `group.userData.personId` 供拾取；示例台词各 3 句并注明「示例台词，待用户确认」+ 原著回目 |
| `scenes/huoyan/scene.js`（15282 B / 303 行） | P5-5 段 + `walkTo` | `buildPeople` + `createDialog`；`frozen` 时忽略地面点击并 `steer(0,0)`；`pickPerson(ev)` 先打人物（沿 `parent` 找回 `personId`）再走地面；`E` 键说最近的人（3.4 步内）；`window.__huoyan = {people, openPerson, dialog, isFrozen}` 供验收与 P5-6 深链 |
| `scenes/huoyan/index.html`（1764 B） | head / `.hint` | 引 `../shared/paper-ui.css`；提示改成「arrows / WASD 走动 · 点地面走过去 · 点人（或 E）说话 · Esc 收起纸片」 |

## 3. 为什么这么改

- **对话必须是一张纸，不是 HUD。** 依据 `references/paper-ui.md` §1：屏幕不可避免时才给一张纸（卡纸 + neatline 框 + 衬线 + 墨线），墨不用纯黑、纸不用纯白。所以对话框用双细墨框 + 纤维贴图 + 三条影子，没有圆角、没有渐变、没有纯白。
- **拾取优先人物、其次地面**：人物站的 z 比地面近，命中点也更近；先 raycast 人物组、命中就说话，避免「想点人结果走了半步」。
- **对话时截断走动**：`steer` 是方向摇杆、每帧都要重算，光拦住点击不够（WASD 还在），所以 `frozen` 一开就 `steer(0,0)` 并在 `walkTo` 里早退。
- **E 键给最近的人**：小屏上点纸人容易点偏；`E` 是「说起话来」的键，与实现文档 §6 一致。
- **台词一律标示例**：用户可能以为我们编的是原文，所以每句都写「（示例台词，待用户确认；原著情节见第 X 回）」，不冒充。

## 4. 验证证据

```
__papercraft: ready true / cards 151 / pieces 145 / buildMs 372 / clips []
__huoyan.people: luocha(x −9.2,z −12,6 卡) / niujia(−3.4,−14.6,6) / bajie(7.4,−6.2,6)
投影（1256×774）: 罗刹女 (408,285) / 牛魔王 (549,244) / 八戒 (816,383) / 主角 (628,559)
点 canvas(816,383) → 对话框 name「猪八戒」hop「1 / 3」，主角仍在 (0,3)
对话开着点 (900,600)×4 步 → 主角 (0,3)（不动）；关后再点 → (9.8,3.17)（走）
pc.place(-8.6,-11.2) + 按 E → 对话框 name「罗刹女」
Enter 三次：1/3 → 2/3 → 3/3（`.pd-more` 变「收起」）→ 第四次 Enter 关闭，`frozen false`、`body.className ""`
对话开着再按 E → 仍是「猪八戒」（不串台）
对话框 DOM：674×175，底边距 26px，字体 `Georgia, "Noto Serif SC", "Songti SC", serif`，底色 `rgb(251,243,223)`
```

Pillow（`Z:/build-tmp/r33-dialog-*.png`，1256×774）：对话框区域（291,573–965,748）平均 **241,232,212**（≈ 宣纸 `#f3e7cd`）、墨色占比 **2.02–2.26%**、近纯白 **0.00%**；整幅平均 203–207,162–164,105–112（与第 31/32 轮同档）。
截图：`Z:/build-tmp/r33-dialog-luocha.png`、`r33-dialog-niujia.png`、`r33-dialog-bajie.png`、`r33-overview.png`（无对话时的全景）。

## 5. 盲评 A/B 的诚实说明

**本轮没有做成盲评。** 两次 `read_image` 仍只回「1256×774 / 字节数 / sha256」元数据，像素没进上下文，我无法判断「纸人立起来没有」「对话卡是否压住主角」「牛角和大耳是否读得出来」。上一轮（P5-4）也没有主角对比图可作 A，本轮相对上一轮增加的是人物与 DOM 卡，属新增而非改版，严格说也不构成 A/B。以上只给可测数字，不给「看起来更好」的结论。

## 6. 回滚（前进式）

1. 删 `scenes/huoyan/people.js`、`scenes/shared/dialog.js`、`scenes/shared/paper-ui.css`；
2. `scene.js` 去掉 `buildPeople/createDialog` 两行 import、P5-5 整段、`walkTo` 里的 `frozen`/`pickPerson` 两行、`window.__huoyan`；
3. `index.html` 去掉 `<link ... paper-ui.css>`，`.hint` 文案回到第 32 轮那句；
4. 验证恢复：`cards()` 回到 133、页面无对话框 DOM、`E` 无响应。

## 7. 遗留问题

1. **没看见画面**（同上）：纸人是否真的立着、牛魔王披风会不会盖住主角、`order: 8` 是否被火墙压住，都只有数字没有判读。
2. 三人只有 `sway`、没有 `turn`/`look`：主角背对说话人时，说话人不会转身，看起来像对着空气说话。
3. 对话框固定在底部居中（`bottom: 26px`）：1256×774 下不挡主角（主角 y≈559、卡顶 598），但**窄屏**（≤520px）会与 `walkArea` 下半部重叠，未验。
4. `E` 的最近人阈值写死 3.4 单位；三人间距 6–7 单位，站在两人中间时会选中较近的那个，未给出「两个人都在范围内」的策略。
5. `window.__huoyan` 是验收钩子，P5-6 集成时应改成只读或在 `?test` 下才暴露（现在正式页也有）。
