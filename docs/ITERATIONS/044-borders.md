# 044 · 国界问题：从数据层绕开（仿 jiangshan-map）

- 时间：2026-11-27 14:45
- 触发：用户 m07482「修复一下国界线问题」+ 一份 jiangshan-map 的国界处理调研。
- 改动单元：U-044-01（删国界数据集）、U-044-02（换省界 + 九段线）、U-044-03（文案与校验）

## 问题在哪

`assets/js/app.js` 原本加载 world-atlas 的 `countries-110m.json`，用
`topojson.mesh(countries, countries.objects.countries, (a, b) => a !== b)` 画国界线。
这套数据是 Natural Earth 的国界版本：台湾与大陆是两个并列 feature，中印等边界也不按国内审核的画法。
只要照它画，就等于在图面上做了一次边界表态——而这张图本来只需要一张「取经路线示意图」。

## 做法（与 jiangshan-map 同一思路：从数据层绕开）

1. 删除 `assets/vendor/countries-110m.json`，`loadGeodata()` 不再请求它；
2. 新增 `assets/vendor/china-provinces.json`（阿里云 DataV 公开行政区划边界，582522 B，35 个 feature：
   34 个省级 + 1 条 `100000_JD` 九段线）；
3. 今图层只画省级轮廓（`.province`）与九段线（`.nine-dash`），古图层只留海岸线与陆地轮廓（`.land`），
   **不画任何疆域界线**；
4. 「关于」补一段「边界」说明与数据出处，并标注「并非测绘成果，请勿作为精确或权威的边界依据引用」；
5. 新增 `scripts/check-china.mjs`（并入 `check-all`），把「不加载国界数据集」变成可执行判据。

## 为什么省界可以画、国界不能画

省界是国内行政区划，画出来不涉及对外边界主张；九段线是中国自己的主张，画与不画都是表态，所以明确画。
国界线一旦来自第三方数据集，就是替别人的画法背书。`app.js` 里这段理由写在绘制处，改动的人会先读到。

## 验证

| 项 | 结果 |
| --- | --- |
| `node scripts/check-all.mjs` | `OK：4 项全通过`（新增 check-china） |
| `node --check assets/js/app.js` | 通过 |
| 页面 `.province` / `.nine-dash` / `.border` / `.land` | `1 / 1 / 0 / 1`（省界与九段线各一条合并 path，d 长 529990） |
| 切今图后 `#stage[data-base]` | `modern`，省界 computed stroke `rgba(96,78,52,0.6)` |
| 古图层 | `.border` 节点数 0，`.land` 仍在 |

**未做的判读**：省界线条在地图上的观感（粗细、是否压住路线、九段线是否盖到城市注记）没有肉眼确认——
图像通道只回元数据，这一项留给用户看。

## 回滚

1. `git checkout 9d988df -- assets/vendor/countries-110m.json`（若还要用旧数据）；
2. `app.js` 里把 `geoProvinces/geoNineDash` 换回 `geoBorders`，`loadGeodata` 恢复两处 fetch；
3. `style.css` 恢复 `.border` 两条规则；
4. 删 `scripts/check-china.mjs` 与 `check-all` 里的那一行。

## 遗留

- 省界文件 582 KB 未简化：如果要压体积，可按 0.01° 抽稀（DataV 原数据已含一定简化）。
- 古图层若要画「唐代疆域」，得另找审定过的数据源，不能顺手拿第三方历史边界。
