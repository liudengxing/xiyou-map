# 055 中文排版：把「可能没装」的字体挪到最后（Q8）

## 为什么做
`scenes/shared/paper-ui.css` 的两处字族把 `"Noto Serif SC"` 排在平台字体**前面**：
`.paper-dialog` 是 `Georgia, "Noto Serif SC", "Songti SC", serif`，`.pd-tag` 是 `"Songti SC", "STKaiti", "Noto Serif SC", serif`。
而 Noto Serif SC 是 web 字，装没装看机器——装了它，Windows 上就跳过 SimSun 直接用 Noto，
跟全站「宣纸 + 宋楷」的设色不是一回事。BACKLOG 第 272 行记的就是这条。

## 做了什么
1. `paper-ui.css` 顶层加两个变量，把**平台自带**的楷/宋排在 web 字之前：
   - `--pd-serif: "Songti SC", "STSong", "SimSun", "Source Han Serif SC", "Noto Serif SC", serif;`
   - `--pd-kai: "Kaiti SC", "STKaiti", "KaiTi", "楷体", "Songti SC", "SimSun", serif;`
   对话正文改 `font: 15px/1.75 var(--pd-kai)`（对白像手写），名牌仍用宋（11px 的楷太细）。
2. `assets/css/style.css` 的 `--serif` 同样把 `SimSun` 提到 `Noto Serif SC` 之前；
   另有 3 处硬写 `"Songti SC", "Noto Serif SC", serif` 的（`.mcity text`、`.tl-era-cap`、`.tl-ke…`）
   统一改 `var(--serif)`，免得下次再只改一处。
3. **顺手修掉一个真 bug**：`.paper-dialog` 没设 `box-sizing`，390 视口下
   `width: calc(100vw - 20px)` = 370 是内容宽，加上左右 padding 18×2 与 1px 边框，实际 408 px、左移 −9 px 出屏。
   加 `box-sizing: border-box` 后实测 370、左右各留 10。
4. 窄屏（≤520）`.pd-head` 允许换行、`.pd-sample` 取消 `nowrap`；名牌加
   `max-width: min(46vw, 220px)` + `overflow: hidden` + `text-overflow: ellipsis`，
   长名不再顶出屏幕（实测塞 9 字「铁扇公主·大力牛魔王之妻」= 161 px 仍在内）。

## 验收
| 检查 | 值 |
| --- | --- |
| 名牌计算栈 | `"Songti SC", STSong, SimSun, "Source Han Serif SC", "Noto Serif SC", serif` |
| 对话计算栈 | `"Kaiti SC", STKaiti, KaiTi, 楷体, "Songti SC", SimSun, serif` |
| 主站 `--serif` | `"Songti SC", "STSong", "SimSun", "Source Han Serif SC", "Source Han Serif CN", "Noto Serif SC", serif` |
| 1256 视口对话框 | `[318, 620, 938]`，`right ≤ 1256` |
| 390 视口对话框 | `[10, 370, 380]`，`bottom` 落在 844 内；`boxSizing: border-box` |
| 1440 视口对话框 | `[410, 620, 1030]` |
| 对话框正文溢出 | `scrollWidth > clientWidth` 为 false（1256 / 390） |
| 头部三件溢出 | `.pd-head` `scrollWidth ≤ clientWidth`（390） |
| 名牌长名 | 161 px ≤ 220 px，`text-overflow: ellipsis` 生效 |
| 主站页面 | 48 枚 `.pin`、`#detail` 可见、`--serif` 已是新栈 |
| 纸模 | `ready true`（`?test`，1256 / 390 / 1440 三次都读） |

**诚实说明**：这套环境读不到「渲染器最终用了哪一款字体」——canvas `measureText` 对
`SimSun`、`Georgia`、乃至根本不存在的 `NoSuchFontZZZQ` 都回同一个宽度（33 px/11px），
`document.fonts.check()` 对所有名字都回 true。所以上面证明的是**声明顺序**（平台字体在前、Noto 在后）
与**不溢出**，不是「肉眼确认字形是宋体」。要确认字形只能有人看，或改用 `queryLocalFonts`（需授权）。

## 改动文件
- `scenes/shared/paper-ui.css`（变量、对话字族、名牌宽度上限、窄屏头部换行、`box-sizing`）
- `assets/css/style.css`（`--serif` 顺序 + 3 处硬写字族改 `var(--serif)`）
- `scenes/huoyan/index.html`（`paper-ui.css?v=3`、`scene.js?v=64`）
- `index.html`（`style.css?v=56`）

## 遗留
1. 字形本身仍无肉眼判读；若用户机器上装了 `Source Han Serif SC`，Windows 会先落它而不是 SimSun——这是有意的（思源宋比宋体好看），但没法从代码里证。
2. 名牌 11px 仍是宋体；若要更「手写感」得给楷体单独做 12px 的一档，现在会挤。
3. `.pd-sample` 在窄屏换行后可能与名字挤一行，观感未判读。

## 前向回滚
1. `scenes/shared/paper-ui.css`：两处 `var(--pd-serif)` / `var(--pd-kai)` 改回原字族串；删 `box-sizing` 与名牌 `max-width` 三条。
2. `assets/css/style.css`：`--serif` 恢复 `…, "Noto Serif SC", …, "SimSun", serif`。
3. `scenes/huoyan/index.html` 的 `paper-ui.css?v=` 与 `index.html` 的 `style.css?v=` **继续往上抬**（版本号只前进）。
