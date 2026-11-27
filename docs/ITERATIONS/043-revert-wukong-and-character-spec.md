# 043 · 回退 042（悟空回到 11 卡）并交付《纸模人物造型规范》

- 时间：2026-11-27 14:35
- 触发：用户 m07429「换回上一版本吧，然后你把纸膜里人物造型的要求和限制发我一份」。
- 改动单元：U-043-01（回退悟空）、U-043-02（抬版本号）、U-043-03（规范文档）

## 回退做法（前向回退，不删历史）

042 的提交 `9d988df` 保留在历史里，不 revert、不 force push：

1. `git checkout e831a5f -- scenes/huoyan/wukong.js`（取回 11 卡版本）；
2. `scenes/huoyan/scene.js` 的 import 改成 `./wukong.js?v=6`（版本号**前进**而不是退回 v=4，否则浏览器还吃旧模块）；
3. `scenes/huoyan/index.html` 的 `scene.js?v=42`。

## 实测（1256×774，`?v=42`）

| 指标 | 042（16 卡） | 043（回退后 11 卡） |
| --- | --- | --- |
| `ready` | true | true |
| `cards()` | 156 | **151** |
| `clips()` | `[]` | `[]` |
| `buildMs` | 438–473 | **367** |
| 悟空卡数 | 16 | **11**（`torso / torso-side / head / head-side / crown / arm×2 / leg×2 / skirt / staff`） |
| 脚底世界最低 | 0.000 | **0.04** |

注：回退版脚底浮空 0.04（身高 3.6 的 1.1%），042 里修到 0.000 的那一处改动（髋枢轴 1.06→1.04）一并回退了。下次重做时记得带上。

## 规范文档

新增 `docs/PAPERCRAFT-CHARACTER-SPEC.md`：13 条硬约束（每条给判据）、尺寸比例表、步态公式、表面用色规则、验收清单 7 步、以及「做不到的部分」与原文出处。依据是 `docs/papercraft-skill/references/mechanisms.md` §12 原文加本项目第 32/42 轮实测。

## 回滚

1. `git checkout 9d988df -- scenes/huoyan/wukong.js`（回到 16 卡版本）；
2. `scene.js` 的 import 抬到 `?v=7`；
3. `index.html` 的 `scene.js?v=` 抬一档。

## 遗留

- 设定图仍未被「照着用」：形体没描、颜色只取到调色板；重做要么等有视觉通道，要么由人逐条文字描述。
