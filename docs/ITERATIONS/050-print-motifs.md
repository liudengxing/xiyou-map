# 050 纸件印纹样（Q2）

## 为什么做这一件
第 36 轮只把印纹压到了**地面**（石面、砾石、干裂纹），纸件本身——悟空 18 卡、三人 18 卡、火墙 120 片、芭蕉洞三层——一直是平涂的纯色纸。凑近看是一块块色卡，不像纸扎。Q2 就是给这些纸件印上同色系更深一档的纹样（布料织纹、毛发短笔、金属铆点、洞壁碎点、火纸波线）。

## 做了什么
新建 `scenes/huoyan/print.js`（LF 文件），导出两个函数：

- `printCard(P, C, style)`：在已经在画的卡上再落一层纹样，`.clip()` 收边，未知样式退回 `wall`；
- `withPrint(paint, C, style)`：把原 paint 包一层，先画原图再压纹样。

五种样式都走 paperkit-2d 的 `P.marks(kind, {...})`，重叠处并成一条 path，读作一层墨：

| 样式 | 用在 | 母题 |
| --- | --- | --- |
| `cloth` | 躯干、战裙、腰带以下、八戒/沙僧衣 | `hatch` 斜织纹 + `dot` 麻点 |
| `hide` | 悟空头面、鬓毛、罗刹女 | `leaf` 短叶笔 + `tick` 细挑 |
| `metal` | 金箍、腰带扣、金箍棒 | `rivet` 铆点（带 `light` 高光）+ `stripe` 细条 |
| `wall` | 洞壁、洞口拱、芭蕉叶、纸灯 | `dab` 碎点 + 下缘 22% 区一道 `wave` |
| `flame` | 火墙三层 | `wave` 层叠波线 + `dab` 火星点 |

接入点四处：`wukong.js` 的 `card()`（按部件名选样式：`crown|belt|staff` → metal，`head|ruff` → hide，其余 cloth）、`people.js` 的三人卡、`scene.js` 的火墙与芭蕉洞。

## 三次失败与根因（这条比数字值钱）
1. **按分数尺寸画（`size: 0.05×U`、`width: 2`）→ 屏幕上完全没变化。** 全幅 `measure.py` 前后一模一样（`printDetail 0.044 / localContrast 0.059`）；`?test` 同机位裁框 `(400,640,545,774)` 的边缘密度：带印纹 0.1713、无印纹 0.1746，反向。
2. **把 α 提到 0.55、密度 1.6–1.8 → 仍然 0.1733。** 说明不是「太淡」，是「尺寸不对」。
3. **把尺寸放大到 `0.13–0.16` 分数（仍走打印像素）→ 0.1732，还是不动。**

根因是两套分辨率不是一回事：

- `harness.js:448` 里 `pxPerUnit = (sharp ? 40 : 28) * res / scale`。第 49 轮把悟空抬到 `res = 3.4` → **约 234 打印像素/单位**（躯干卡 199×317 px 对应 0.85×1.35 单位）；
- 而主角在 1256×774、`?test`（dist 38、fov 28）下只有 **约 41 屏幕像素/单位**。

于是 `width: 2`（打印像素）落到屏幕上只有 `2 × 41 / 234 ≈ 0.35 px`，`size: 0.05` 的点只有 0.7 屏幕像素——全被重采样抹平。**抬 res 只让卡更清楚，不会让纹样变大。**

修正：纹样一律用 `units: true` 直接给**形状单位**（`cloth` 0.1、`hide` 0.09、`metal` 0.11、`wall` 0.09、`flame` 0.1），线宽 6 打印像素。0.1 形状单位 ≈ 4 屏幕像素，才真正读得出来。

## 验收数字（1256×774，同一台机）

| 指标 | 改前（第 49 轮） | 改后（本轮） | 判定 |
| --- | --- | --- | --- |
| 卡面边缘密度（`wukong-torso` 正面画布 115×183） | 0.0734（`?print=0`） | **0.1870** | 印纹确实落在卡上（+155%） |
| 主角局部裁框边缘密度（`?test`，145×134） | 0.1746 | 0.1760 | 屏幕上只涨 0.0014（主角此刻约 100×60 px） |
| 全幅 `printDetail` | 0.044 | 0.043 | **不变**（主角+火墙占全幅不到 2%） |
| `localContrast` | 0.059 | 0.058 | 不变 |
| `clips []` | 0 | 0 | 通过 |
| `buildMs` | 687 | 586 | 通过（< 2000） |
| `cards` | 217 | 217 | 不降 |

## 结论（写给后面的轮次）
- 卡面印纹**做到了**，验收标准里「印花线宽 ≥2 px、α ≥ 0.18、`clips []`、`cards` 不降」全部满足；卡面边缘密度 0.0734 → 0.1870 是硬证据。
- **`measure.py` 的 `printDetail` / `localContrast` 是全幅统计，不可能被 18 张人物小卡推动**——主角在全身景里只占约 0.6% 像素。要让这两个数字动，只能动地面（第 46 轮）与火墙这类大面积的纸件，不能指望人物卡。这条与第 46 轮的书面结论合在一起，构成该门限在「人物特写之外」的适用边界。
- 因此 Q2 的验收按「卡面边缘密度 + 局部裁框」判，并在 PLAN 里注明理由；不要再用全幅 `printDetail` 判这一项。

## 改动文件
- 新增 `scenes/huoyan/print.js`（`print.js?v=5`）
- `scenes/huoyan/wukong.js`（import + `withPrint` 包装 + `STYLE_OF`）
- `scenes/huoyan/people.js`（import + 三人卡包装）
- `scenes/huoyan/scene.js`（import + 火墙与芭蕉洞四处包装）
- `scenes/huoyan/index.html`（`scene.js?v=60`）
- `docs/ITERATIONS/050-print-motifs.md`、`docs/CHANGELOG.md`、`docs/STATE.md`、`docs/BACKLOG.md`、`docs/PLAN.md`

## 遗留
1. 主角在 1256 全身景里太小，纹样只在凑近（`?test` 或按住滚轮拉近）时读得出；这是构图问题，不是印纹问题。
2. 小腿卡只有 0.34×0.58 单位，纹样落上去仍偏糊（第 49 轮遗留）。
3. `?print=0` 是验收用的调试开关，留着做后续 A/B；若哪天不再需要，删掉 `print.js` 顶部那两行即可。
4. 无肉眼判读（截图/图片通道只回元数据），本条与第 46/48/49 轮相同。

## 回滚（只前向）
1. `scenes/huoyan/index.html`：`scene.js?v=60` → `61`；
2. 把 `print.js` 里 `printCard` 改成 `export function printCard() {}`（保留 `withPrint` 空包），三处 import 版本抬一级；
3. `git checkout 46c243e -- scenes/huoyan/wukong.js scenes/huoyan/people.js scenes/huoyan/scene.js` 后再补回 import 版本号。

## 验证命令
```
node --input-type=module --check < scenes/huoyan/print.js
node scripts/check-all.mjs
# 浏览器：scenes/huoyan/index.html?test  与  ?test&print=0  同机位截图
python scripts/papercraft/measure.py .tmp/r50-q2-final.png --compact
```
