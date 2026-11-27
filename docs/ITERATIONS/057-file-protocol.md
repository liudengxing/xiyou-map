# 057 `file://` 双击即开：地理数据内联（Q10 / P4-24）

## 为什么做
`assets/js/app.js` 的 `loadGeodata()` 原本用 `fetch()` 取两份地理数据（`land-110m.json` 55 KB、
`china-provinces.json` 582 KB）。`file://` 协议下这两次 `fetch` 会被浏览器按 CORS 拦掉，
页面只剩空地图——第 35 轮验收发现后，README 干脆改成「必须起本地静态服务器」。
这份交付要给不装环境的人看，双击打不开是个硬伤。

## 做了什么
1. 新增生成脚本 `scripts/build-geo-inline.mjs`：读 `assets/vendor/land-110m.json` 与
   `assets/vendor/china-provinces.json`，写出 `assets/vendor/geo-inline.js`（**638041 B**，
   形如 `window.__XIYOU_GEO = {land: …, china: …};`）。生成物带「勿手改，改 json 就重跑」的头注释。
2. `index.html` 在 `topojson-client.min.js` 之后、`app.js` 之前引入 `<script src="assets/vendor/geo-inline.js?v=1">`。
3. `loadGeodata()` 改为：`var inline = window.__XIYOU_GEO;` → 有则 `Promise.resolve([inline.land, inline.china])`，
   否则退回原来的 `Promise.all([fetch(…), fetch(…)])`。后续拼装省界/九段线的逻辑一行没动。
4. `README.md` 开头改回「双击 `index.html` 即可打开」，并保留「也可以起服务器」的一段，
   注明内联包是生成的、改了 json 要重跑脚本。

## 验收（ego 浏览器，1256×774）
| 打开方式 | `__XIYOU_GEO` | 图钉 | `.land` | `.province` | `.nine-dash` | `.border` | 底图路径长度 | json 请求数 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `file:///…/index.html`（双击） | true | 48 | 1 | 1 | 1 | 0 | land 88672 / prov 529990 | **0** |
| `http://127.0.0.1:8123/index.html` | true | 48 | 1 | 1 | 1 | 0 | land 88672 | 0 |

- `file://` 下再加 `#s=29&base=modern`：`stage[data-base]` 切到 `modern`、`.province` 计算样式 `display:inline`、
  `.border` 0 —— 今图层（省界 + 九段线）在本地文件下同样成立。
- `performance.getEntriesByType('resource')` 里**没有任何 `.json` 请求**，说明走的是内联包、没有触发 CORS。

## 改动文件
- `assets/vendor/geo-inline.js`（新增，生成物）
- `scripts/build-geo-inline.mjs`（新增）
- `assets/js/app.js`（`loadGeodata()` 优先内联、回退 fetch）
- `index.html`（引入内联包、`app.js?v=62`）
- `README.md`、`docs/ITERATIONS/057-file-protocol.md`、`docs/CHANGELOG.md`、`docs/STATE.md`、`docs/BACKLOG.md`、`docs/PLAN.md`

## 遗留
- 内联包 638 KB 让首页首包变大（原先是异步取）；gzip 后约 200 KB，可接受，但 `http://` 下也走内联，
  相当于放弃了「先渲染、后补底图」的时机——如果要省，可以改成按 `location.protocol` 二选一（两套路径）。
- `china-provinces.json` 与内联包里那份是同一份数据的两份拷贝，改数据必须重跑脚本，脚本没有接进 `check-all`。

## 前向回滚
1. `index.html` 删掉 `<script src="assets/vendor/geo-inline.js?v=1">`，`app.js?v=` 前进一号（U-057-01）。
2. `loadGeodata()` 里删掉 `inline` 分支，恢复 `return Promise.all([...])`（U-057-02）。
3. `README.md` 改回「需要一个本地静态服务器」一段（U-057-03）。
4. `assets/vendor/geo-inline.js` 与 `scripts/build-geo-inline.mjs` 可保留（不引用即无害），或一并删除（U-057-04）。
