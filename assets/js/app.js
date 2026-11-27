/* 西游时序 · 交互
 * 依赖：d3 v7、topojson-client v3（均为本地 vendor）
 */
(function () {
  "use strict";

  var D = window.XIYOU_DATA;
  var PAD = 46;

  /* 节点序列：前传 5 + 西行 43 */
  var nodes = D.prologue.map(function (s) { return Object.assign({}, s, { act: "prologue" }); })
    .concat(D.journey.map(function (s) { return Object.assign({}, s, { act: "journey" }); }));

  nodes.forEach(function (n, i) {
    n.order = i;
    n.actIndex = n.act === "journey" ? i - D.prologue.length : i;
    n.prologueLen = D.prologue.length;
  });

  var JOURNEY_START = D.prologue.length;

  var S = {
    idx: JOURNEY_START,          // 当前节点
    t: null,                     // d3 zoom transform
    k: 1,
    playing: false,
    showReal: false,
    showEra: true,             // 纪年层（A+C）：两处硬锚点 + 双轨对照；年月可考者只有这两处
    base: "ancient",   // ancient 古舆图 / modern 今图（同一条示意路线，只换底图信息层）
    showPrologue: true,
    focusChar: null,             // 当前选定人物的 id
    detailExpanded: false,       // 窄屏详情卡是否已展开（窄屏默认只露站名 + 回目）
    timer: null,
    hoverNan: null,
    scene: null,                 // 当前打开的纸模场景 id（null = 未开）
    sceneWant: null,             // 深链 #scene=… 读到的场景，等 build 完再开
  };

  var U = 1;                     // 随视口缩放的尺度系数（图钉、字号、线宽）
  var svg, gRoot, gBase, gRoute, gRealLayer, gModern, gPinLayer, proj, W, H;
  var pinSel, routeEls = {}, realLabelSel;
  var geoLand = null, geoProvinces = null, geoNineDash = null;

  var $ = function (sel) { return document.querySelector(sel); };

  /* ────────────────────────────────────────────── 数据辅助 */

  function chapterTitle(from) {
    from = Math.max(1, Math.min(100, from || 1));
    return D.chapters[from] || "";
  }

  function chapterLabel(n) {
    var a = n.chapter[0], b = n.chapter[1];
    return a === b ? "第 " + a + " 回" : "第 " + a + " – " + b + " 回";
  }

  function nanLabel(n) {
    if (!n.nan || !n.nan.length) return "";
    var a = n.nan[0], b = n.nan[n.nan.length - 1];
    if (n.id === "tongtian") return "第 36 – 38 难 · 第 81 难（回程）";
    return a === b ? "第 " + a + " 难" : "第 " + a + " – " + b + " 难";
  }

  function nanOf(n) {
    return n.nan || [];
  }

  // 徽标用的紧凑难号：区间合并（47,48,49 → 「第 47 – 49 难」），不连续的用中点分隔
  // （通天河 36,37,38,81 → 「第 36 – 38 · 81 难」）。收起态只有一条 22px 高的位置，
  // 用不了 nanLabel 里那句「第 36 – 38 难 · 第 81 难（回程）」。
  function nanBadgeLabel(n) {
    var v = nanOf(n);
    if (!v.length) return "";
    var parts = [], start = v[0], prev = v[0];
    for (var i = 1; i <= v.length; i++) {
      var cur = v[i];
      if (cur !== undefined && cur === prev + 1) { prev = cur; continue; }
      parts.push(start === prev ? String(start) : start + " – " + prev);
      start = prev = cur;
    }
    return "第 " + parts.join(" · ") + " 难";
  }

  function passedNanCount() {
    // 已过之难 = 当前节点之前的站点所含之难
    var max = 0;
    nodes.forEach(function (n, i) {
      if (i > S.idx) return;
      (n.nan || []).forEach(function (v) { if (v > max) max = v; });
    });
    return max;
  }

  function stationByNan(n) {
    var hit = D.nan.filter(function (x) { return x.n === n; })[0];
    if (!hit) return null;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === hit.station) return i;
    }
    return null;
  }

  /* 回目直达：把「27」「第27回」「第二十七回」都解析成回目号 */
  var CN_DIGIT = { "零": 0, "〇": 0, "一": 1, "二": 2, "两": 2, "三": 3, "四": 4, "五": 5, "六": 6, "七": 7, "八": 8, "九": 9 };

  function cnToNum(s) {
    var total = 0, num = 0;
    for (var i = 0; i < s.length; i++) {
      var c = s.charAt(i);
      if (CN_DIGIT[c] != null) {
        num = CN_DIGIT[c];
      } else if (c === "十") {
        total += (num || 1) * 10; num = 0;
      } else if (c === "百") {
        total += (num || 1) * 100; num = 0;
      } else {
        return NaN;
      }
    }
    return total + num;
  }

  function parseChapterQuery(q) {
    var s = q.replace(/\s+/g, "");
    var m = s.match(/^第?(\d{1,3})回?$/);
    if (m) {
      var a = parseInt(m[1], 10);
      return a >= 1 && a <= 100 ? a : NaN; // NaN = 看着像回目号但越界
    }
    m = s.match(/^第?([零〇一二两三四五六七八九十百]{1,6})回?$/);
    if (m) {
      var b = cnToNum(m[1]);
      return b >= 1 && b <= 100 ? b : NaN;
    }
    return null;
  }

  /* 回目号 → 站点：优先取回目区间覆盖它的站，否则取区间最近的一站 */
  function stationByChapter(ch) {
    for (var i = 0; i < nodes.length; i++) {
      if (ch >= nodes[i].chapter[0] && ch <= nodes[i].chapter[1]) {
        return { idx: i, exact: true };
      }
    }
    var best = -1, bestD = Infinity;
    nodes.forEach(function (n, i) {
      var d = ch < n.chapter[0] ? n.chapter[0] - ch : ch - n.chapter[1];
      // 距离相同取靠后的一站：章节在推进，往后靠更符合「即将到达」的直觉
      if (d <= bestD) { bestD = d; best = i; }
    });
    return best < 0 ? null : { idx: best, exact: false, gap: bestD };
  }

  /* ── 人物行程 ─────────────────────────────────────── */

  function charById(id) {
    for (var i = 0; i < D.characters.length; i++) {
      if (D.characters[i].id === id) return D.characters[i];
    }
    return null;
  }

  /* 某人自入队那站起，一路到灵山；悟空另含前传五站 */
  function charOrders(c) {
    var list = [];
    if (c.prologue) {
      nodes.forEach(function (n) { if (n.act === "prologue") list.push(n); });
    }
    var start = -1;
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].id === c.from) { start = i; break; }
    }
    if (start < 0) return list;
    for (var j = start; j < nodes.length; j++) list.push(nodes[j]);
    return list;
  }

  function charOrderSet(c) {
    var set = {};
    charOrders(c).forEach(function (n) { set[n.order] = true; });
    return set;
  }

  /* ────────────────────────────────────────────── 地图 */

  function northUp(points) {
    return d3.line()
      .x(function (p) { return p[0]; })
      .y(function (p) { return p[1]; })
      .curve(d3.curveCatmullRom.alpha(0.5))(points);
  }

  function buildProjection() {
    proj = d3.geoMercator();
    var box = { type: "MultiPoint", coordinates: [[64, 18.5], [125, 46]] };
    // 窄屏把右栏与底部让位收窄，免得地图被挤成一条
    var reserve = W > 900 ? 290 : 14;
    // 手机横屏（≤480 高）另开一档：顶部工具栏只到 61、底部时间轴顶在 276，
    // 原先的 top 128 / bottom 116 会把 360 高的屏只剩 116px 给地图，
    // 48 枚图钉全被压进一条 75px 的窄带、标签没处可放（第 56 轮 Q9）。
    var short = H <= 480;
    var bottom = short ? 100 : H > 700 ? 150 : 116;
    var top = short ? 74 : W > 900 ? PAD : 128;
    proj.fitExtent([[W > 900 ? PAD : 10, top], [W - reserve, H - bottom]], box);
  }

  function project(n) {
    var p = proj([n.lon, n.lat]);
    n._x = p ? p[0] : 0;
    n._y = p ? p[1] : 0;
  }

  function drawBase() {
    gBase.selectAll("*").remove();

    // 海面波纹（中式舆图的水纹符号）
    var defs = gBase.append("defs");
    var pat = defs.append("pattern")
      .attr("id", "sea-wave")
      .attr("patternUnits", "userSpaceOnUse")
      .attr("width", 92 * U)
      .attr("height", 52 * U);
    function wave(y, dx) {
      pat.append("path")
        .attr("d", "M" + (-10 * U + dx) + "," + (y * U) +
          " q" + (6 * U) + ",-" + (4.5 * U) + " " + (12 * U) + ",0" +
          " t" + (12 * U) + ",0 t" + (12 * U) + ",0 t" + (12 * U) + ",0" +
          " t" + (12 * U) + ",0 t" + (12 * U) + ",0 t" + (12 * U) + ",0" +
          " t" + (12 * U) + ",0 t" + (12 * U) + ",0")
        .attr("fill", "none")
        .attr("stroke", "rgba(108,96,72,0.14)")
        .attr("stroke-width", 0.9);
    }
    wave(17, 0);

    gBase.append("rect")
      .attr("class", "sea-wave-rect")
      .attr("x", -2000).attr("y", -2000)
      .attr("width", W + 4000).attr("height", H + 4000)
      .attr("fill", "url(#sea-wave)")
      .attr("pointer-events", "none");

    // 海面水纹点簇：古舆图习惯，也让空海面不至于太空。
    // 只取开阔水域（黄海 / 东海 / 南海 / 孟加拉湾 / 阿拉伯海），避开海岸线与陆地注记。
    var seaMarks = [
      // 黄海 · 东海
      [125.0, 35.5], [126.2, 27.5], [123.0, 33.0], [124.4, 30.6], [122.0, 25.4],
      // 南海（坐标已用 d3.geoContains 对 Natural Earth 陆地轮廓校验，全部落在水面上）
      [123.6, 18.6], [119.6, 13.2], [113.0, 9.4], [104.0, 6.2], [121.6, 20.4],
      [115.4, 17.4], [110.4, 14.6], [117.0, 21.5], [112.4, 16.6], [110.4, 10.2],
      // 孟加拉湾
      [96.0, 9.4], [88.4, 12.4], [82.0, 8.6], [92.6, 20.2], [97.4, 15.6],
      [89.0, 17.0], [86.0, 14.0], [91.0, 13.0],
      // 阿拉伯海
      [74.4, 14.2], [67.6, 19.2], [63.2, 24.4], [70.6, 8.4], [65.0, 17.0],
      // 补充（原 20 簇之外的空白区）
      [85.2, 16.8], [99.6, 6.8], [106.2, 8.2], [93.8, 7.4]
    ];
    var gSea = gBase.append("g").attr("class", "sea-mark").attr("pointer-events", "none");
    seaMarks.forEach(function (sp, si) {
      var q = proj(sp);
      if (!q) return;
      // 行距与弧宽按序号轻微错开，避免 32 簇排成整齐网格
      for (var r = 0; r <= 1; r++) {
        var w = (11.2 - r * 2.0 + (si % 2) * 0.8) * U;
        var yy = q[1] + r * (6.4 + (si % 3) * 0.5) * U;
        gSea.append("path").attr(
          "d",
          "M" + (q[0] - w) + "," + yy +
          "q" + (w / 2) + "," + (-3.6 * U) + " " + w + ",0" +
          "q" + (w / 2) + "," + (3.6 * U) + " " + w + ",0"
        );
      }
    });

    // 经纬网
    var graticule = d3.geoGraticule().step([10, 10]);
    gBase.append("path")
      .datum(graticule())
      .attr("class", "graticule")
      .attr("d", d3.geoPath(proj));
    gBase.append("path")
      .datum(graticule.outline())
      .attr("class", "graticule-major")
      .attr("d", d3.geoPath(proj));

    if (geoLand) {
      gBase.append("path")
        .datum(geoLand)
        .attr("class", "land")
        .attr("d", d3.geoPath(proj));

    }

    // 山形符号：沿山带加密、两排错落，才像山脉而非散点
    D.ranges.forEach(function (r) {
      var N = Math.max(8, r.count * 2);
      for (var i = 0; i <= N; i++) {
        var f = i / N;
        var q = proj([
          r.from[0] + (r.to[0] - r.from[0]) * f,
          r.from[1] + (r.to[1] - r.from[1]) * f
        ]);
        if (!q) continue;
        var row = i % 2;
        var w = 4.4 * U, h = 5.6 * U;
        var xx = q[0] + (row ? 3.2 * U : 0);
        var yy = q[1] + (row ? 4.4 * U : 0);
        gBase.append("path")
          .attr("class", "mountain")
          .attr("d", "M" + (xx - w) + "," + (yy + h) + "L" + xx + "," + yy + "L" + (xx + w) + "," + (yy + h));
      }
    });

    // 注记
    var labels = gBase.append("g").attr("class", "regions");
    D.regions.forEach(function (r) {
      var q = proj([r.lon, r.lat]);
      if (!q) return;
      var t = labels.append("text")
        .attr("class", "region-label" + (r.vertical ? " vert" : ""))
        .attr("x", q[0]).attr("y", q[1])
        .attr("font-size", (r.size || 12) * U)
        .attr("text-anchor", "middle");
      if (r.vertical) {
        t.attr("writing-mode", "vertical-rl")
          .attr("style", "writing-mode:vertical-rl;text-orientation:upright;");
      }
      t.text(r.text);
    });

    // 今图层：与古舆图同时存在，靠 #stage[data-base] 切换显隐
    // （不重投影、不重画路线，切底图不该让图钉跳位）
    gModern = gBase.append("g").attr("class", "modern-layer").attr("pointer-events", "none");
    // 今图的界线只画国内行政区划（34 个省级轮廓，含台湾、香港、澳门）与九段线。
    // 刻意不加载 Natural Earth 的国界数据集：那套数据把台湾与大陆并列成两个 feature，
    // 中印等边界也不按国内审核的画法。省界是行政区划，不构成对外边界表态。
    if (geoProvinces) {
      gModern.append("path").datum(geoProvinces).attr("class", "province")
        .attr("d", d3.geoPath(proj));
    }
    if (geoNineDash) {
      gModern.append("path").datum(geoNineDash).attr("class", "nine-dash")
        .attr("d", d3.geoPath(proj));
    }
    D.modernCities.forEach(function (c) {
      var q = proj([c.lon, c.lat]);
      if (!q) return;
      var g = gModern.append("g").attr("class", "mcity" + (c.big ? " big" : ""));
      g.append("circle").attr("cx", q[0]).attr("cy", q[1]).attr("r", (c.big ? 2.2 : 1.5) * U);
      var t = g.append("text")
        .attr("x", q[0] + 4.5 * U).attr("y", q[1] + 3.2 * U)
        .attr("font-size", (c.big ? 10.5 : 9) * U)
        .text(c.name);
      if (c.big) t.attr("class", "mbig");
    });
  }

  function drawRoutes() {
    gRoute.selectAll("*").remove();
    routeEls = {};

    // 前传
    var proPts = nodes.filter(function (n) { return n.act === "prologue"; })
      .map(function (n) { return [n._x, n._y]; });
    routeEls.prologue = gRoute.append("path")
      .attr("class", "route-prologue")
      .attr("d", northUp(proPts))
      .style("opacity", S.showPrologue ? 0.9 : 0);

    // 西行：底
    var jPts = nodes.filter(function (n) { return n.act === "journey"; })
      .map(function (n) { return [n._x, n._y]; });
    routeEls.base = gRoute.append("path").attr("class", "route-base").attr("d", northUp(jPts));

    routeEls.doneOuter = gRoute.append("path").attr("class", "route-done-outer");
    routeEls.done = gRoute.append("path").attr("class", "route-done");
    routeEls.future = gRoute.append("path").attr("class", "route-future");

    // 归途：灵山 → 长安 拱形虚线
    var ling = nodes[nodes.length - 1];
    var chang = nodes[JOURNEY_START];
    var mx = (ling._x + chang._x) / 2;
    var my = Math.min(ling._y, chang._y) - 74;
    routeEls.ret = gRoute.append("path")
      .attr("class", "route-return")
      .attr("d", "M" + ling._x + "," + ling._y + "Q" + mx + "," + my + " " + chang._x + "," + chang._y);

    // 玄奘实路
    gRealLayer.selectAll("*").remove();
    var realPts = D.realRoute.map(function (p) { return proj([p.lon, p.lat]); });
    routeEls.real = gRealLayer.append("path")
      .attr("class", "route-real")
      .attr("d", northUp(realPts));
    realLabelSel = gRealLayer.append("g");
    D.realRoute.forEach(function (p) {
      var q = proj([p.lon, p.lat]);
      if (!q) return;
      if (p.note) {
        realLabelSel.append("text")
          .attr("class", "real-label")
          .attr("x", q[0] + 7).attr("y", q[1] - 5)
          .text(p.name);
      }
    });
    if (S.showReal) routeEls.real.classed("on", true);

    // 人物行迹：选定人物后自入队站起画到灵山。前传另作一段虚线与西行段分开，
    // 免得天庭→两界山之间拉出一条横贯画面的假路线。
    routeEls.charPro = gRoute.append("path").attr("class", "route-char pro");
    routeEls.char = gRoute.append("path").attr("class", "route-char");
  }

  function drawPins() {
    gPinLayer.selectAll("*").remove();
    pinSel = gPinLayer.selectAll("g.pin")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", function (n) { return "pin " + n.act; })
      .attr("transform", function (n) { return "translate(" + n._x + "," + n._y + ") scale(1)"; })
      // roving tabindex：整个图层只留一个 Tab 落点（当前站），否则从工具栏进地图要按 48 次 Tab
      .attr("tabindex", function (n) { return n.order === S.idx ? 0 : -1; })
      .attr("role", "button")
      .attr("aria-label", function (n) {
        return n.short + "，" + (n.act === "prologue" ? "悟空前传第 " + (n.actIndex + 1) + " 站" : "西行第 " + (n.actIndex + 1) + " 站")
          + "，第 " + n.chapter[0] + (n.chapter[0] === n.chapter[1] ? "" : " – " + n.chapter[1]) + " 回";
      })
      .on("click", function (ev, n) {
        ev.stopPropagation();
        select(n.order, { dive: true, enter: true });
      })
      .on("keydown", function (ev, n) {
        // SVG 元素上没有原生按钮语义，Enter / Space 要自己接；Space 还要挡掉页面滚动
        if (ev.key !== "Enter" && ev.key !== " " && ev.key !== "Spacebar") return;
        ev.preventDefault();
        ev.stopPropagation();
        select(n.order, { dive: true, enter: true });
      })
      .on("mouseenter", function (ev, n) {
        labelSel.filter(function (d) { return d.order === n.order; }).style("display", null);
      })
      .on("focus", function (ev, n) {
        // 键盘聚焦时也把标签亮出来：避让可能把这一站的标签藏掉了，
        // 只看见一个无名圆点对键盘用户等于没有标签。
        labelSel.filter(function (d) { return d.order === n.order; }).style("display", null);
      });

    pinSel.append("circle").attr("class", "hit").attr("r", 15 * U);
    pinSel.append("circle").attr("class", "halo").attr("r", 7 * U);
    pinSel.append("circle").attr("class", "ring").attr("r", 6.2 * U);
    pinSel.append("circle").attr("class", "dot").attr("r", 2.4 * U);

    pinSel.filter(function (n) { return n.act === "journey"; })
      .append("text")
      .attr("class", "tick-no")
      .attr("dy", "0.3em")
      .style("font-size", (7.6 * U) + "px")
      .text(function (n) { return n.actIndex + 1; });

    // 站上的小人：此刻队伍里有几个人就站几个（纸模剪影，排成一队，网游里那种「身边跟着」的感觉）
    var partyG = pinSel.append("g").attr("class", "party").attr("aria-hidden", "true");
    partyG.each(function (n) {
      var mates = partyOf(n);
      if (!mates.length) return;
      var g = d3.select(this);
      var figW = 3.5, gap = 1.6;
      var totalW = mates.length * figW + (mates.length - 1) * gap;
      mates.forEach(function (c, i) {
        var x = -totalW / 2 + i * (figW + gap) + figW / 2;
        var f = g.append("g").attr("class", "fig fig-" + c.id + (c.away ? " fig-away" : "") + (c.part ? " fig-part" : ""))
          .attr("title", c.part ? c.name + "（第 " + c.back + " 回归队）" : null)
          .attr("transform", "translate(" + (x * U) + "," + (9.4 * U) + ") scale(" + U + ")");
        f.append("path").attr("d", "M-1.75,0 L1.75,0 L1.3,-4.7 L-1.3,-4.7 Z")
          .attr("fill", c.color).attr("stroke", "rgba(42,36,28,.55)").attr("stroke-width", 0.32);
        f.append("circle").attr("cx", 0).attr("cy", -5.95).attr("r", 1.4)
          .attr("fill", c.color).attr("stroke", "rgba(42,36,28,.55)").attr("stroke-width", 0.32);
        if (c.id === "wukong") {
          // 金箍：一根朱砂短线，远看也能从队伍里认出猴王
          f.append("path").attr("d", "M-1.5,-6.55 L1.5,-6.55")
            .attr("stroke", "#b03a2e").attr("stroke-width", 0.5).attr("fill", "none");
        }
        if (c.id === "bailong") {
          // 白龙马画成侧身小兽：多一个头颈与尾巴，别混进人形
          f.append("path").attr("d", "M-2.2,-4.4 L-2.9,-6.2 L-2.05,-6.3 L-1.5,-4.9")
            .attr("fill", c.color).attr("stroke", "rgba(42,36,28,.5)").attr("stroke-width", 0.3);
        }
      });
    });

    // 标签单独一层，便于反缩放与避让
  }

  /* 队伍：按 characters.from 的站序判断此刻谁已在队里 */
  var charColors = {
    tang: "#efe2c0", wukong: "#cf9a52", bailong: "#d9e2e6",
    bajie: "#b3a394", shaseng: "#a98b5f"
  };
  /* 一站往往跨几回（如长安 12–13、灵山 98–100），所以「在不在队伍」不能拿单个回目去比，
     要看角色在场区间与这一站回目区间有没有交集：有交集就算在场。 */
  function stationSpan(n) {
    var c = n.chapter || [];
    var a = c[0] || 0;
    var b = c[1] === undefined ? a : c[1];
    return { a: a, b: b };
  }

  /* 逐回在场：每个角色在 D.characters 里写着 present 回目区间（含端点）。
     比「入队之后一直在」准：悟空被逐的那几回、八戒尚未入队的那几回，队伍里都没他们。 */
  function presentAt(n) {
    var s = stationSpan(n);
    return (D.characters || []).filter(function (c) {
      if (!c.present) return false;
      for (var i = 0; i < c.present.length; i++) {
        var r = c.present[i];
        if (r[0] <= s.b && r[1] >= s.a) return true;
      }
      return false;
    });
  }

  /* 这一站覆盖的回目里，有没有谁离开队伍去办别的事（D.away 里那几条） */
  // 一条「分期」可能只落在一回（chapter），也可能连着几回（chapters: [56, 57]）。
  function awayChapters(a) { return a.chapters || [a.chapter]; }

  function awayAt(n) {
    if (n.act !== "journey" || !D.away) return [];
    var s = stationSpan(n);
    return D.away.filter(function (a) {
      return awayChapters(a).some(function (c) { return c >= s.a && c <= s.b; });
    });
  }

  /* 回内粒度：这一站跨了几回，某人只在其中一部分回目里不在队里时，既不能整站算「离队」，
     也不能整站算「同行」。返回 null（全站在队）/ {kind:"away"} / {kind:"part", back}；
     back = 这站区间里他第一回重新在队的回号（渲染成「第 58 回归队」）。 */
  function charStatus(n, cid) {
    if (n.act !== "journey" || !D.away) return null;
    var s = stationSpan(n);
    var hit = {};
    var any = false;
    D.away.forEach(function (a) {
      if (a.who !== cid) return;
      awayChapters(a).forEach(function (c) {
        if (c >= s.a && c <= s.b) { hit[c] = 1; any = true; }
      });
    });
    if (!any) return null;
    var caps = Object.keys(hit).map(Number);
    if (caps.length >= (s.b - s.a + 1)) return { kind: "away" };
    // 「回归」要落在离队之后：取最后一个离队回之后的第一个在队回（第 57 回单独外出的沙僧 → 第 58 回归队）。
    // 他若在站内最后一次离队之后就没再回来，退回「站内第一个在队回」，不硬造一个回归回号。
    var last = Math.max.apply(null, caps);
    var back = 0;
    for (var c = last + 1; c <= s.b; c++) { if (!hit[c]) { back = c; break; } }
    if (!back) { for (var d = s.a; d <= s.b; d++) { if (!hit[d]) { back = d; break; } } }
    return { kind: "part", back: back };
  }

  /* 已经入过队、但这一站覆盖的回目里他不在（被逐 / 暂离），详情卡上单独标一笔 */
  function steppedOutAt(n) {
    var s = stationSpan(n);
    var here = presentAt(n).map(function (c) { return c.id; });
    return (D.characters || []).filter(function (c) {
      if (!c.present || here.indexOf(c.id) >= 0) return false;
      return c.present[0][0] <= s.b;
    });
  }

  function partyOf(n) {
    if (n.act !== "journey") return [];
    // 这一回单独行动的人照样画出来，但是画淡——人还在，只是不在队伍边上。
    // 整站不在 = away（淡 + 虚线）；只在站内部分回目不在 = part（淡 + 点线），并带上回归回号。
    return presentAt(n).map(function (c) {
      var st = charStatus(n, c.id);
      return {
        id: c.id, name: c.short, color: charColors[c.id] || "#d7bd93",
        away: !!st && st.kind === "away",
        part: !!st && st.kind === "part",
        back: st && st.kind === "part" ? st.back : 0
      };
    });
  }

  var labelSel;
  function drawLabels() {
    gPinLayer.selectAll("g.pinlabel").remove();
    labelSel = gPinLayer.selectAll("g.pinlabel")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "pinlabel")
      .attr("data-order", function (n) { return n.order; })
      .style("pointer-events", "none");

    labelSel.append("text")
      .attr("class", "pin-label")
      .attr("text-anchor", "middle")
      .attr("dy", (-13 * U) + "px")
      .text(function (n) { return n.short; });
  }

  /* 反缩放：图钉与标签保持屏幕尺寸 */
  function rescale() {
    var inv = 1 / S.k;
    if (pinSel) pinSel.attr("transform", function (n) {
      return "translate(" + n._x + "," + n._y + ") scale(" + inv + ")";
    });
    if (labelSel) labelSel.attr("transform", function (n) {
      return "translate(" + n._x + "," + n._y + ") scale(" + inv + ")";
    });
  }

  /* 标签避让：屏幕坐标下贪心去重叠 */
  function declutter() {
    if (!labelSel) return;
    var t = S.t || d3.zoomIdentity;
    // 图钉障碍与标签障碍分开存：选中站的强制放置会剔除标签框，
    // 若两者共用一个数组，图钉障碍会被一并冲掉，标签就会压到钉子上。
    var pinBoxes = [];
    var labelBoxes = [];
    var order = nodes.map(function (n) { return n; }).sort(function (a, b) {
      var da = Math.abs(a.order - S.idx), db = Math.abs(b.order - S.idx);
      if (da !== db) return da - db;
      return a.order - b.order;
    });

    var visible = {};

    // 先占位：所有图钉本身都算障碍，标签不许压在别的站点上
    // 横屏小屏上行程走廊被压成斜向的一串（间距只有 8px），钉子障碍再按 7.2U 占位
    // 就一点空隙都不剩：钉子框收到 4.6U，接近图形本身的半径（第 56 轮 Q9）。
    var pinR = (H <= 480 ? 4.6 : 7.2) * U;
    nodes.forEach(function (n) {
      if (n.act === "prologue" && !S.showPrologue) return;
      var psx = n._x * t.k + t.x;
      var psy = n._y * t.k + t.y;
      if (psx < -60 || psx > W + 60 || psy < -40 || psy > H + 40) return;
      // 队伍小人站在钉子下方约 9–15px 处，障碍框要一并盖住，否则标签会压到小人脸上
      // 小人只站在「当前这一站」脚下：队伍人数随行进变化，全都摆出来反而看不出「此刻有谁」。
      var partyH = (n.act === "journey" && n.order === S.idx) ? 15 * U : 0;
      pinBoxes.push({ x: psx - pinR, y: psy - pinR, w: pinR * 2, h: pinR * 2 + partyH });
    });


    function overlaps(a, b) {
      return !(a.x + a.w < b.x || a.x > b.x + b.w || a.y + a.h < b.y || a.y > b.y + b.h);
    }

    // 浮层面板也是障碍：工具栏、搜索框、随行条、图例、详情卡、时间轴都盖在地图上面，
    // 标签落进去就只露出半截、或被面板底色吃掉（面板有 .72 以上的填充）。
    // 每次调用都重新量：详情卡会开合、随行条左右位置随文字长度变、时间轴在窄屏会变矮。
    var PANEL_PAD = 3;
    // 用 offset* 累加而不是 getBoundingClientRect()：面板的开合走 transform 过渡，
    // 刚加上 .open 时 rect 还停在屏外起点，量出来的矩形等于「面板不存在」，
    // 于是刚落位、本该被挤开的标签就压在了面板上。offset* 是布局位置，不受过渡影响。
    function panelRect(el) {
      if (!el.offsetParent && el.offsetWidth === 0) return null;
      var x = 0, y = 0, node = el;
      while (node) { x += node.offsetLeft; y += node.offsetTop; node = node.offsetParent; }
      return { x: x, y: y, w: el.offsetWidth, h: el.offsetHeight };
    }
    var panels = (function () {
      var sel = [".masthead", ".toolbar", ".search", ".chars", ".legend", "#detail", ".timeline"];
      var out = [];
      for (var i = 0; i < sel.length; i++) {
        var el = document.querySelector(sel[i]);
        if (!el) continue;
        if (el.id === "detail" && !el.classList.contains("open")) continue;
        var st = window.getComputedStyle(el);
        // 只排除真的「不占位」的元素；不要用 opacity 判断 —— 详情卡刚加上 .open
        // 时 opacity 过渡还在 0 起点，量出来会被当成不存在，正是漏判的来源。
        if (st.display === "none" || st.visibility === "hidden") continue;
        var r = panelRect(el);
        if (!r || r.w < 2 || r.h < 2) continue;
        out.push({
          x: r.x - PANEL_PAD, y: r.y - PANEL_PAD,
          w: r.w + PANEL_PAD * 2, h: r.h + PANEL_PAD * 2
        });
      }
      return out;
    })();

    function pinHit(box) {
      return pinBoxes.some(function (b) { return overlaps(box, b); });
    }

    function labelHit(box) {
      return labelBoxes.some(function (b) { return overlaps(box, b); });
    }

    function panelHit(box) {
      return panels.some(function (b) { return overlaps(box, b); });
    }

    var CAND_BASE = [
      { dy: -13, anchor: "middle" },
      { dy: 21, anchor: "middle" },
      { dy: -28, anchor: "middle" },
      { dy: 36, anchor: "middle" },
      { dy: -43, anchor: "middle" },
      { dy: 51, anchor: "middle" },
      { dx: 11, dy: 4, anchor: "start" },
      { dx: -11, dy: 4, anchor: "end" },
      { dx: 11, dy: -13, anchor: "start" },
      { dx: -11, dy: -13, anchor: "end" },
      { dx: 22, dy: -4, anchor: "start" },
      { dx: -22, dy: -4, anchor: "end" }
    ];
    // 手机横屏（≤480 高）另加八位：行程走廊在这个尺寸下被压成一条斜向的串，
    // 站距只有 8px，原来的十二位几乎每一位都会撞上邻站的钉子；只给「上/下 ±13～51」
    // 与「左右 ±22」是不够的，得沿垂直走廊的方向再往外退一格（第 56 轮 Q9）。
    var CAND_EXTRA = [
      { dx: 11, dy: -22, anchor: "start" },
      { dx: -11, dy: -22, anchor: "end" },
      { dx: 11, dy: 13, anchor: "start" },
      { dx: -11, dy: 13, anchor: "end" },
      { dx: 22, dy: -13, anchor: "start" },
      { dx: -22, dy: -13, anchor: "end" },
      { dx: 33, dy: 4, anchor: "start" },
      { dx: -33, dy: 4, anchor: "end" },
      { dx: 0, dy: -70, anchor: "middle" },
      { dx: 0, dy: 70, anchor: "middle" },
      { dx: 44, dy: -6, anchor: "start" },
      { dx: -44, dy: -6, anchor: "end" }    ];
    var CAND = H <= 480 ? CAND_BASE.concat(CAND_EXTRA) : CAND_BASE;

    order.forEach(function (n) {
      var sx = n._x * t.k + t.x;
      var sy = n._y * t.k + t.y;
      if (sx < -50 || sx > W + 50 || sy < -30 || sy > H + 30) return;
      var label = n.short;
      var fs = labelSel.node() ? parseFloat(getComputedStyle(labelSel.node()).fontSize) || 10.5 * U : 10.5 * U;
      // 盒模型按实测校准：字形盒宽 = len*1.05em（含 letter-spacing .04em），
      // 高 = 1.42em，上缘在基线上方 1.15em（基线下缘另有 0.27em 下伸）。
      // 另加 0.08em 高、2px 宽的余量：密集段两站间距可能只比字高多零点几像素，
      // 不留间隙的话贪心会判成「刚好不相交」而把一对标签并排放成叠字。
      var w = label.length * fs * 1.05 + 2;
      var h = 1.5 * fs;
      var TOP_EM = 1.15;
      var must = n.order === S.idx;
      var placed = null;

      // 选不到位置时的退让顺序（每一档都是「上一档的放宽」）：
      //   0 = 严格：不压图钉、不压别的标签、不落进面板
      //   1 = 允许压别的标签（只给选中站：它的标签必须看得见，宁可盖住邻站的字）
      //   2 = 连面板也让（只给选中站）
      // 为什么不给所有站都开第 2 档：实测 900×420 这个极端视口下，浮层几乎铺满画面，
      // 放开后 35 条标签会全部糊在详情卡的正文上，比藏起来更难读。标签是辅助信息，
      // 选中站才有「必须看见」的资格，其它站宁缺勿滥。
      // 三档都绕不开「不压图钉」：图钉是唯一可点的靶心，压住就点不到了。
      var MODES = must
        ? [{ label: true, panel: true }, { label: false, panel: true }, { label: false, panel: false }]
        : [{ label: true, panel: true }];
      for (var pass = 0; pass < MODES.length && !placed; pass++) {
        var mode = MODES[pass];
        for (var c = 0; c < CAND.length; c++) {
          var cd = CAND[c];
          var dx = (cd.dx || 0) * U;
          var dy = (cd.dy || 0) * U;
          var lx = cd.anchor === "start" ? sx + dx
            : cd.anchor === "end" ? sx + dx - w
            : sx + dx - w / 2;
          // 基线在文字上缘下方 1.15em
          var box = { x: lx, y: sy + dy - TOP_EM * fs, w: w, h: h };
          // 屏外候选位直接作废：整块落到视口外时，既看不见、又白占一个位置，
          // 还可能把本来放得下的邻站标签挤掉（旧版只在起点做 sx/sy 粗筛，
          // 左右两侧的 dx 候选可以把标签推出画面，实测 390 宽出现过 left=-60）。
          // 只露出一半的标签同样要拒：贴边的半截字看起来像渲染坏了。
          var EDGE = 4;
          if (box.x < EDGE || box.x + box.w > W - EDGE
            || box.y < EDGE || box.y + box.h > H - EDGE) continue;
          if (pinHit(box)) continue;
          if (mode.label && labelHit(box)) continue;
          var onPanel = panelHit(box);
          if (mode.panel && onPanel) continue;

          placed = { box: box, cd: cd, dx: dx, dy: dy, paneled: onPanel };
          break;
        }
      }
      if (!placed) return;
      if (must) {
        // 选中站优先级最高：压掉与它冲突的其它标签框，但图钉障碍绝不动
        labelBoxes = labelBoxes.filter(function (b) { return !overlaps(placed.box, b); });
      }
      labelBoxes.push(placed.box);
      visible[n.order] = placed;
    });

    labelSel
      .style("display", function (n) {
        if (n.act === "prologue" && !S.showPrologue) return "none";
        return visible[n.order] ? null : "none";
      })
      // 压到面板上的标签打一个记号：底色是纸，面板是半透纸，字会糊在面板纹样里，
      // 给它一圈纸底描边把字从面板上「挖」出来（只改观感，不动位置）。
      .classed("paneled", function (n) {
        var p = visible[n.order];
        return !!(p && p.paneled);
      })
      .each(function (n) {
        var p = visible[n.order];
        if (!p) return;
        // 必须用行内样式：CSS 里的 .pin-label { text-anchor: middle }
        // 优先级高于 SVG 的 presentation attribute，用 attr 写会被压掉。
        d3.select(this).select("text")
          .style("text-anchor", p.cd.anchor)
          .attr("dx", p.dx + "px")
          .attr("dy", p.dy + "px");
      });
  }

  /* ────────────────────────────────────────────── 状态更新 */

  function journeyDoneCount() {    // 当前已完成的西行站数（含当前站）
    return Math.max(-1, S.idx - JOURNEY_START);
  }

  function updateRoute() {
    if (!routeEls.base) return;
    var done = journeyDoneCount();
    var jPts = nodes.filter(function (n) { return n.act === "journey"; }).map(function (n) { return [n._x, n._y]; });

    if (done < 0) {
      routeEls.done.attr("d", null);
      routeEls.doneOuter.attr("d", null);
      routeEls.future.attr("d", northUp(jPts));
    } else {
      var head = jPts.slice(0, done + 1);
      var tail = jPts.slice(done);
      routeEls.doneOuter.attr("d", head.length > 1 ? northUp(head) : null);
      routeEls.done.attr("d", head.length > 1 ? northUp(head) : null);
      routeEls.future.attr("d", tail.length > 1 ? northUp(tail) : null);
    }
    routeEls.ret.classed("on", done >= jPts.length - 1);
    if (routeEls.prologue) routeEls.prologue.style("opacity", S.showPrologue ? 0.9 : 0);

    // 人物行迹层：前传五站自成一段虚线，西行段自入队站起画到灵山
    if (routeEls.char) {
      var c = S.focusChar ? charById(S.focusChar) : null;
      var pro = c && c.prologue ? nodes.filter(function (n) { return n.act === "prologue"; })
        .map(function (n) { return [n._x, n._y]; }) : [];
      var pts = c ? charOrders(c)
        .filter(function (n) { return n.act === "journey"; })
        .map(function (n) { return [n._x, n._y]; }) : [];
      routeEls.char
        .attr("d", pts.length > 1 ? northUp(pts) : null)
        .classed("on", !!c);
      if (routeEls.charPro) {
        routeEls.charPro
          .attr("d", pro.length > 1 ? northUp(pro) : null)
          .classed("on", pro.length > 1);
      }
    }
  }

  function updatePins() {
    if (!pinSel) return;
    var c = S.focusChar ? charById(S.focusChar) : null;
    var set = c ? charOrderSet(c) : null;
    pinSel
      .classed("active", function (n) { return n.order === S.idx; })
      .classed("past", function (n) { return n.order < S.idx; })
      .classed("off", function (n) { return !!set && !set[n.order]; })
      .attr("tabindex", function (n) { return n.order === S.idx ? 0 : -1; })
      .attr("aria-current", function (n) { return n.order === S.idx ? "true" : null; })
      .style("display", function (n) {
        if (n.act === "prologue" && !S.showPrologue) return "none";
        return null;
      });
    // 键盘焦点原本落在某个图钉上时，换站后把焦点一并搬到新站，否则焦点会留在刚被
    // 设为 tabindex="-1" 的旧图钉上，Tab 回来时落点飘忽。
    if (document.activeElement && document.activeElement.closest
      && document.activeElement.closest("g.pin")) {
      var curPin = pinSel.filter(function (n) { return n.order === S.idx; }).node();
      if (curPin) curPin.focus();
    }
    if (labelSel) labelSel.classed("off", function (n) { return !!set && !set[n.order]; });
    declutter();
  }

  /* ────────────────────────────────────────────── 详情卡 */

  function renderDetail() {
    var n = nodes[S.idx];
    var prev = S.idx > 0 ? nodes[S.idx - 1] : null;
    var next = S.idx < nodes.length - 1 ? nodes[S.idx + 1] : null;
    var el = $("#detail");

    var tags = [];
    tags.push('<span class="tag">' + chapterLabel(n) + "</span>");
    if (n.act === "journey") {
      tags.push('<span class="tag hot">西行第 ' + (n.actIndex + 1) + " 站</span>");
      var nl = nanLabel(n);
      if (nl) tags.push('<span class="tag hot">' + nl + "</span>");
    } else {
      tags.push('<span class="tag cool">前传 · 第 ' + (n.actIndex + 1) + " 站</span>");
    }
    if (n.demon && n.demon !== "—") tags.push('<span class="tag">妖 · ' + n.demon + "</span>");
    if (n.badge) tags.push('<span class="tag">' + n.badge + "</span>");

    var nanChips = "";
    if (nanOf(n).length) {
      nanChips = '<div class="d-sec-title">此站之难</div><div class="d-nan">' +
        nanOf(n).map(function (v) {
          var hit = D.nan.filter(function (x) { return x.n === v; })[0];
          return '<button class="n" data-nan="' + v + '">第 ' + v + " 难" + (hit ? " · " + hit.name : "") + "</button>";
        }).join("") + "</div>";
    }

    // 分期：这一站跨的回目里有谁单独行动去了（只录能对着回目说清的那几条）
    var away = "";
    var apart = awayAt(n);
    var apartIds = apart.map(function (a) { return a.who; });
    if (apart.length) {
      var shortOf = {};
      (D.characters || []).forEach(function (c) { shortOf[c.id] = c.short; });
      away = apart.map(function (a) {
        var cs = awayChapters(a);
        // 回号：单回写「第 57 回」，连回写「第 56 – 57 回」
        var tag = cs.length > 1 ? ("第 " + cs[0] + " – " + cs[cs.length - 1] + " 回") : ("第 " + cs[0] + " 回");
        // 只在这一站一部分回目里离队的，补一句他哪一回回来
        var st = charStatus(n, a.who);
        var part = !!st && st.kind === "part";
        var tail = (part && st.back) ? "（第 " + st.back + " 回归队）" : "";
        return '<div class="d-away' + (part ? " d-away-part" : "") + '" title="' +
          String(a.why || "").replace(/"/g, "") + '">' +
          "<b>" + tag + "</b><span>" + (shortOf[a.who] || a.who) + " · " + a.what + tail + "</span></div>";
      }).join("");
    }
    // 同行：逐回名单里此刻在队伍里的人；被逐/暂离的单独标一笔，免得读者以为漏了谁。
    // 这一回单独行动的人不计入「同行」——他人在这一回里不在队伍边上。
    var folk = "";
    if (n.act === "journey") {
      var here = presentAt(n).filter(function (c) { return apartIds.indexOf(c.id) < 0; })
        .map(function (c) { return c.short; });
      var out = steppedOutAt(n).map(function (c) { return c.short + "（离队）"; });
      var all = here.concat(out);
      if (all.length) folk = '<div class="d-folk">同行：' + all.join(" · ") + "</div>";
    }
    // 纪年只在能落脚的两处出现，其余站留白——不替古人补日期
    var era = "";
    if (n.era && S.showEra) {
      era = '<div class="d-era"><b>' + n.era.when + "</b><span>" + n.era.what + "</span></div>";
      var cmp0 = D.era && D.era.compare;
      if (cmp0 && (n.id === "changan" || n.id === "lingshan")) {
        era += '<div class="d-era-note">' + cmp0.note + "</div>";
      }
    }

    var quote = n.quote ? '<div class="d-quote">' + n.quote + "<small>" + (n.quoteFrom || "") + "</small></div>" : "";
    var note = n.note ? '<div class="d-note">' + n.note + "</div>" : "";
    // P5-6：纸模只做了火焰山这一场，就只在这一站挂入口；别的站不露按钮，
    // 免得点开是空页。iframe 平时没有 src，进场景之前不会请求 three。
    var sceneBtn = n.id === "huoyan"
      ? '<div class="d-scene"><button class="d-scene-btn" data-scene="huoyan">进入纸模场景<span>3D · 需 WebGL</span></button></div>'
      : "";

    var badgeText = n.act === "journey" ? nanBadgeLabel(n) : "";
    var nanBadge = badgeText ? '<span class="d-nanbadge">' + badgeText + "</span>" : "";
    var nameAria = badgeText
      ? ' aria-label="' + (n.name + "，" + badgeText).replace(/"/g, "") + '"'
      : "";

    el.innerHTML =
      '<button class="close" aria-label="关闭">✕</button>' +
      // 窄屏默认只露「回目 + 站名」，把地图让出来；其余内容点「展开」再看。
      // 宽屏这一枚按钮由 CSS 隐藏（详情卡不需要收起）。
      '<button class="expand" aria-expanded="false" aria-controls="detail">展开</button>' +
      '<div class="d-head">' +
        '<div class="d-chapter">' + chapterLabel(n) + " · " + (chapterTitle(n.chapter[0]).replace(/[　\s]+/g, " · ")) + "</div>" +
        // 收起态只露「回目 + 站名」：想知道这站有几难就得再点一次「展开」。
        // 把难号压成一枚小徽标塞进站名行（收起态显示、展开态由 CSS 隐去），
        // 同时把难号写进站名的 aria-label —— 徽标是视觉补充，读屏器不该漏掉它。
        '<h3 class="d-name"' + nameAria + ">" + n.name + nanBadge + "</h3>" +
      "</div>" +
      // 今地与「站 / 妖」两个标签放进独立的 .d-meta：窄屏展开态只有 .d-head 吸顶，
      // 若把这几行也塞进卡头，287px 的卡里光卡头就占掉 194px。
      '<div class="d-meta">' +
        '<div class="d-modern">' + n.modern + "</div>" + era + folk + away +
        '<div class="d-tags">' + tags.join("") + "</div>" +
      "</div>" +
      '<div class="d-sec-title">情节</div>' +
      '<div class="d-body">' + n.summary + "</div>" +
      quote + note + sceneBtn + nanChips +
      '<div class="d-nav">' +
        '<button data-go="-1"' + (prev ? "" : " disabled") + ">← " + (prev ? prev.short : "起点") + "</button>" +
        '<button data-go="1"' + (next ? "" : " disabled") + ">" + (next ? next.short : "终点") + " →</button>" +
      "</div>";

    // 卡头在窄屏展开态是 sticky 的，但关闭叉与「展开 / 收起」原本是 #detail 的直接子元素：
    // 绝对定位让它们跟着内容一起滚走，吸顶之后滚到中途就找不到键了。
    // 移进 .d-head（sticky 也是 positioned），两个按钮就自然跟着卡头一起挂住。
    // 宽屏 .d-head 不是 positioned，它们的包含块仍是 #detail，位置一分不变。
    var headEl = el.querySelector(".d-head");
    if (headEl) {
      [el.querySelector(".close"), el.querySelector(".expand")].forEach(function (b) {
        if (b) headEl.appendChild(b);
      });
    }

    el.classList.add("open");
    // ≤900 时卡片是整幅横铺的底部抽屉（`@media (max-width: 900px)` 里 left/right:12px），
    // 和手机上一样会盖掉半张图，所以同一档先收起，只露「回目 + 站名」。
    // 更窄（≤620）只是把字号与内边距再收紧，收起这件事的边界是 900，不是 620。
    var sheet = W <= 900;
    var expBtn = el.querySelector(".expand");
    function syncExpanded() {
      el.classList.toggle("expanded", sheet && S.detailExpanded);
      if (expBtn) {
        expBtn.textContent = S.detailExpanded ? "收起" : "展开";
        expBtn.setAttribute("aria-expanded", S.detailExpanded ? "true" : "false");
      }
    }
    if (!sheet) S.detailExpanded = false;
    syncExpanded();
    if (expBtn) {
      expBtn.addEventListener("click", function () {
        S.detailExpanded = !S.detailExpanded;
        syncExpanded();
        if (labelSel) declutter(); // 卡片长高/缩短都改变面板矩形，标签要重排
      });
    }
    // 详情卡本身是标签的障碍，但它是 transform/opacity 过渡出来的：加 open 之前
    // getBoundingClientRect() 量到的是被推到右侧屏外的位置，面板快照里等于没有它。
    // 所以 open 之后必须再避让一次，否则落在卡里的标签会一直压着卡。
    if (labelSel) declutter();

    el.querySelector(".close").addEventListener("click", function () {
      el.classList.remove("open");
      el.classList.remove("expanded");
      // 关掉即忘掉展开状态：下次再打开先看站名，别把上一轮的「展开」带回来
      S.detailExpanded = false;
      if (labelSel) declutter(); // 卡收起后让原先被挤开的标签回到更合适的位置
    });
    el.querySelectorAll("[data-go]").forEach(function (b) {
      b.addEventListener("click", function () {
        select(S.idx + parseInt(b.getAttribute("data-go"), 10));
      });
    });
    var sceneBtnEl = el.querySelector("[data-scene]");
    if (sceneBtnEl) {
      sceneBtnEl.addEventListener("click", function () { openScene(sceneBtnEl.getAttribute("data-scene"), sceneBtnEl); });
    }
    el.querySelectorAll("[data-nan]").forEach(function (b) {
      b.addEventListener("click", function () {
        var nn = parseInt(b.getAttribute("data-nan"), 10);
        var i = stationByNan(nn);
        if (i != null) select(i);
        openNanDrawer(nn);
      });
    });
  }

  /* ────────────────────────────────────────────── 纸模场景（P5-6） */

  var sceneModal = null, sceneFrame = null, sceneIframe = null, sceneReturn = null, sceneVeil = null;
  // 哪些站「有纸模世界」：点进这几站就把纸模摊开（用户第 5 条后半）。
  var SCENE_STATIONS = { huoyan: "huoyan" };

  // 进站自动开纸模：只对图钉/键盘激活的站生效，时间轴扫过与前后站翻页不抢地盘。
  function enterSceneFor(n) {
    if (!n || S.scene) return;
    var id = SCENE_STATIONS[n.id];
    if (id) openScene(id, null);
  }

  // 「进入纸模世界」的转场：一张宣纸从上往下铺开盖住屏幕，纸面铺满时场景已在其后，
  // 纸再化开，露出立体书。0.56s；系统要减少动效时整段跳过。
  function playSceneEnter() {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce || sceneVeil) return;
    sceneVeil = document.createElement("div");
    sceneVeil.className = "scene-veil";
    document.body.appendChild(sceneVeil);
    if (sceneModal) sceneModal.classList.add("opening");
    window.setTimeout(function () {
      if (sceneVeil) sceneVeil.classList.add("gone");
    }, 300);
    window.setTimeout(function () {
      if (sceneVeil && sceneVeil.parentNode) sceneVeil.parentNode.removeChild(sceneVeil);
      sceneVeil = null;
      if (sceneModal) sceneModal.classList.remove("opening");
    }, 580);
  }

  // 场景 id 白名单：只有登记在 SCENE_STATIONS 里的站才可能落到真实文件。
  // 深链手写 `#scene=nosuch` 或详情卡按钮被改错时，这里直接挡掉，不去加载一个 404 的 iframe（第 53 轮 Q6）。
  function isSceneId(id) {
    for (var k in SCENE_STATIONS) if (SCENE_STATIONS[k] === id) return true;
    return false;
  }

  function openScene(id, fromEl) {
    if (!id || !isSceneId(id)) return;
    if (!sceneModal) {
      sceneModal = $("#scene-modal");
      sceneFrame = $("#scene-frame");
    }
    if (!sceneModal || !sceneFrame) return;
    // 从详情卡点进来的，收场景时焦点要回到那枚按钮；深链打开就没有「来处」
    sceneReturn = fromEl || document.activeElement;
    if (!sceneIframe) {
      sceneIframe = document.createElement("iframe");
      sceneIframe.setAttribute("title", "火焰山纸模场景");
      // iframe 里的按键不会冒泡到主站：Esc 靠 load 后再往子文档挂一个。
      // 场景自己开着纸片对话时让它先收（那是它的一层），否则才关整个场景。
      sceneIframe.addEventListener("load", function () {
        try {
          sceneIframe.contentDocument.addEventListener("keydown", function (ev) {
            if (ev.key !== "Escape") return;
            // 与场景的最小契约：只问「纸片对话开着吗」。场景那边生产入口只暴露这两个函数，
            // 调试用的 people / props 等只在 ?test 下存在（第 53 轮 Q6）。
            var api = sceneIframe.contentWindow.__huoyan;
            if (api && typeof api.dialogOpen === "function" && api.dialogOpen()) return;
            closeScene();
          });
        } catch (e) { /* 子文档还没就绪：下次 load 再说 */ }
        // 焦点交给场景，主站的 ←/→ 才不会在背后偷偷换站
        try { sceneIframe.contentWindow.focus(); } catch (e) { /* 忽略 */ }
      });
      sceneFrame.appendChild(sceneIframe);
    }
    S.scene = id;
    sceneModal.hidden = false;
    document.body.classList.add("scene-open");
    playSceneEnter();
    var want = "scenes/" + id + "/index.html?embed=1";
    if (sceneIframe.getAttribute("src") !== want) sceneIframe.setAttribute("src", want);
    writeHash();
  }

  function closeScene() {
    if (!S.scene) return;
    S.scene = null;
    if (sceneModal) sceneModal.hidden = true;
    document.body.classList.remove("scene-open");
    // 卸掉 src：WebGL 上下文和渲染循环一起停，回舆图不留一个后台在跑的页面
    if (sceneIframe) sceneIframe.setAttribute("src", "about:blank");
    if (sceneReturn && sceneReturn.focus) sceneReturn.focus();
    sceneReturn = null;
    writeHash();
  }

  /* ────────────────────────────────────────────── 行程表 / 八十一难 */

  function buildTripDrawer() {
    var body = $("#trip-body");
    var html = "";
    html += '<div class="trip-group">前传 · 第 1 – 7 回 <span>石猴出世至大闹天宫</span></div>';
    D.prologue.forEach(function (n, i) {
      html += '<div class="trip-item" data-order="' + i + '"><span class="no">' + (i + 1) + '</span><span class="nm">' + n.short +
        '</span><span class="ch">' + chapterLabel(n) + "</span></div>";
    });
    html += '<div class="trip-group">西行 · 第 12 – 99 回 <span>长安至灵山，十万八千里</span></div>';
    D.journey.forEach(function (n, i) {
      var order = JOURNEY_START + i;
      html += '<div class="trip-item" data-order="' + order + '"><span class="no">' + (i + 1) + '</span><span class="nm">' + n.short +
        '</span><span class="ch">' + chapterLabel(n) + "</span></div>";
    });
    body.innerHTML = html;
    body.querySelectorAll(".trip-item").forEach(function (el) {
      el.addEventListener("click", function () {
        var order = parseInt(el.getAttribute("data-order"), 10);
        // 从行程表点进火焰山也直接把纸模摊开（与图钉一致）
        select(order, { enter: true });
        closeDrawers();
      });
    });
    syncTripDrawer();
  }

  function syncTripDrawer() {
    document.querySelectorAll(".trip-item").forEach(function (el) {
      var on = parseInt(el.getAttribute("data-order"), 10) === S.idx;
      el.classList.toggle("sel", on);
      if (on && el.parentNode) {
        var body = $("#trip-body");
        var top = el.offsetTop - body.clientHeight / 2 + 20;
        if (Math.abs(body.scrollTop - top) > body.clientHeight * 0.9) body.scrollTop = Math.max(0, top);
      }
    });
  }

  function buildNanDrawer() {
    var grid = $("#nan-grid");
    var html = "";
    D.nan.forEach(function (x) {
      html += '<button class="nan-cell' + (x.n === 81 ? " last" : "") + '" data-nan="' + x.n + '">' + x.n + "</button>";
    });
    grid.innerHTML = html;
    grid.querySelectorAll(".nan-cell").forEach(function (el) {
      var n = parseInt(el.getAttribute("data-nan"), 10);
      el.addEventListener("click", function () {
        var i = stationByNan(n);
        if (i != null) select(i);
        showNanInfo(n);
      });
      el.addEventListener("mouseenter", function () { showNanInfo(n); });
    });
  }

  function showNanInfo(n) {
    var hit = D.nan.filter(function (x) { return x.n === n; })[0];
    var box = $("#nan-detail");
    if (!hit) return;
    var station = nodes.filter(function (s) { return s.id === hit.station; })[0];
    box.innerHTML = '<div class="t">第 ' + hit.n + " 难 · " + hit.name + "</div>" +
      '<div class="m">' + "第 " + hit.ch + " 回" + (station ? " · " + station.name : "") + "</div>" +
      '<div class="b">' + (station ? station.summary.slice(0, 70) + "…" : "") + "</div>";
  }

  function openNanDrawer(active) {
    openDrawer("nan");
    var max = passedNanCount();
    if (!active) active = max > 0 ? max : 1;
    document.querySelectorAll(".nan-cell").forEach(function (el) {
      el.classList.toggle("cur", parseInt(el.getAttribute("data-nan"), 10) === active);
    });
    showNanInfo(active);
  }

  function syncNanDrawer() {
    var max = passedNanCount();
    document.querySelectorAll(".nan-cell").forEach(function (el) {
      var n = parseInt(el.getAttribute("data-nan"), 10);
      el.classList.toggle("done", n <= max);
      if (n > max) el.classList.remove("cur");
    });
    var pn = $("#nan-prog-n"), pb = $("#nan-prog-bar");
    if (pn) pn.textContent = "已渡 " + max + " / 81　余 " + (81 - max) + " 难";
    if (pb) pb.style.width = (max / 81) * 100 + "%";
  }

  /* ────────────────────────────────────────────── 时间轴 */

  function buildTimeline() {
    var track = $("#tl-ticks");
    var n = nodes.length;
    var html = "";
    nodes.forEach(function (node, i) {
      var pct = n === 1 ? 0 : (i / (n - 1)) * 100;
      var cls = "tl-tick" + (node.act === "prologue" ? " pro" : "") + (node.act === "journey" ? " act" : "");
      html += '<div class="' + cls + '" style="left:' + pct + '%"></div>';
    });
    // 回目标签：每 9 个节点一个，末端补最后一站（太挤就省掉）
    var lastLab = -99;
    nodes.forEach(function (node, i) {
      var isEnd = i === n - 1;
      if (!isEnd && i % 9 !== 0) return;
      if (isEnd && i - lastLab < 4) return;
      lastLab = i;
      var pct = (i / (n - 1)) * 100;
      var txt = node.act === "prologue" ? "序" : "第" + node.chapter[0] + "回";
      html += '<div class="tl-lbl" style="left:' + pct + '%">' + txt + "</div>";
    });
    track.innerHTML = html;

    // 纪年层：把可考的两个年月标到轴上方。位置按「这一回落在哪一站」算，
    // 不另编一条比例尺——否则就是把回序伪装成历法。
    var eraEl = $("#tl-era");
    if (eraEl) {
      var anchors = (D.era && D.era.anchors) || [];
      eraEl.innerHTML = anchors.map(function (a) {
        var idx = -1;
        for (var i = 0; i < nodes.length; i++) {
          var c = nodes[i].chapter || [];
          if (c[0] <= a.chapter && a.chapter <= (c[1] || c[0])) { idx = i; break; }
        }
        if (idx < 0) return "";
        var pct = n === 1 ? 0 : (idx / (n - 1)) * 100;
        // 轴末端的锚点（抵灵山）不能居中放：右边紧挨着双轨对照那一行，
        // 居中会压上去，所以最末 3% 的锚点改成右对齐收在轴尾。
        var atEnd = pct >= 97 ? " end" : "";
        return '<div class="tl-era-mark' + atEnd + '" style="left:' + pct + '%" title="' +
          a.when + " · " + a.what + '"><b>' + a.when + "</b><em>" + a.what + "</em></div>";
      }).join("");

      // 双轨说明：小说十四年 vs 史实约十七年，只跟着纪年层一起出现。
      var cmp = D.era && D.era.compare;
      if (cmp) {
        eraEl.innerHTML += '<div class="tl-era-cap" title="' + cmp.note + '">' +
          "小说 " + cmp.novel + "　|　史实 " + cmp.real + "</div>";
      }
    }

    // 重点场景：几处单独成段的故事，标成朱砂小签直接可点。
    // 位置同样按站点在轴上的百分比算，和回目标签对齐。
    var keyEl = $("#tl-keys");
    if (keyEl) {
      var keys = (D.keyScenes) || [];
      keyEl.innerHTML = keys.map(function (k) {
        var idx = -1;
        for (var i = 0; i < nodes.length; i++) {
          if (nodes[i].id === k.id) { idx = i; break; }
        }
        if (idx < 0) return "";
        var pct = n === 1 ? 0 : (idx / (n - 1)) * 100;
        return '<button class="tl-key" style="left:' + pct + '%" data-order="' + idx +
          '" title="' + k.name + '">' + k.name + "</button>";
      }).join("");

      // 真假美猴王（第 56–58 回）和大闹火焰山（第 59–61 回）挨得很近，字会压住。
      // 排两行道：装不下的往第二行错开，不靠改字号硬挤。
      var btns = keyEl.children;
      var lanes = [-1e9, -1e9];
      for (var bi = 0; bi < btns.length; bi++) {
        var btn = btns[bi];
        var cx = (parseFloat(btn.style.left) / 100) * keyEl.clientWidth;
        var half = btn.offsetWidth / 2;
        var left = cx - half;
        var lane = -1;
        for (var li = 0; li < 2; li++) {
          if (lanes[li] + 4 <= left) { lane = li; break; }
        }
        if (lane < 0) lane = lanes[0] <= lanes[1] ? 0 : 1;
        lanes[lane] = left + btn.offsetWidth;
        btn.style.top = lane * 15 + "px";
      }
    }
  }

  function syncTimeline() {
    var n = nodes.length;
    var pct = (S.idx / (n - 1)) * 100;
    var h = $("#tl-handle");
    h.style.left = pct + "%";
    $("#tl-rail-done").style.width = pct + "%";

    var keyBtns = document.querySelectorAll("#tl-keys .tl-key");
    for (var ki = 0; ki < keyBtns.length; ki++) {
      keyBtns[ki].classList.toggle("active", +keyBtns[ki].getAttribute("data-order") === S.idx);
    }

    var node = nodes[S.idx];
    $("#r1").textContent = node.act === "prologue" ? "前传 · 第 " + node.chapter[0] + " 回" : chapterLabel(node);
    $("#r2").textContent = chapterTitle(node.chapter[0]).replace(/[　\s]+/g, " · ");

    var max = passedNanCount();
    $("#n1").textContent = "第 " + max + " 难 / 81";
    $("#n2").textContent = node.nan && node.nan.length ? nanLabel(node) : "本站无难";
  }

  /* ────────────────────────────────────────────── 选择 */

  function select(i, opts) {
    opts = opts || {};
    i = Math.max(0, Math.min(nodes.length - 1, i));
    if (i === S.idx && !opts.force) {
      renderDetail();
      // 已经站在这一站上再点一次（图钉/行程表）：详情不必重画，但纸模世界该摊开。
      if (opts.enter) enterSceneFor(nodes[i]);
      return;
    }
    S.idx = i;
    S.detailExpanded = false; // 换站回到「只露站名」，别把上一站的展开状态带过去
    updateRoute();
    updatePins();
    renderDetail();
    syncTimeline();
    syncTripDrawer();
    syncNanDrawer();
    if (opts.pan !== false) panToStation(nodes[i]);
    if (opts.dive) { S.wantDive = i; diveTo(nodes[i]); }
    if (opts.enter) enterSceneFor(nodes[i]);
    writeHash();
  }

  /* 点击图钉 → 就近放大细看（时间轴拖动只平移不放大，保留全局视野） */
  function diveTo(n) {
    if (S.k > 1.35) { panToStation(n); return; }
    var narrow = W <= 620;
    var k = narrow ? 1.55 : (W > 1900 ? 1.5 : 1.85);
    centerStation(n, k, 820);
  }

  /* 把某一站放到"看的舒服"的位置（窄屏在上半，宽屏在详情卡左边） */
  function centerStation(n, k, dur) {
    var narrow = W <= 620;
    var cx = narrow ? W / 2 : (W - 330) / 2 + 40;
    var cy = narrow ? 236 : H / 2 - 60;
    var target = d3.zoomIdentity.translate(cx - n._x * k, cy - n._y * k).scale(k);
    if (dur) {
      svg.transition().duration(dur).ease(d3.easeCubicInOut).call(zoom.transform, target);
    } else {
      svg.call(zoom.transform, target);
    }
  }

  function resetView() {
    svg.transition().duration(700).ease(d3.easeCubicOut).call(zoom.transform, d3.zoomIdentity);
  }

  function panToStation(n) {
    if (!S.t || S.k < 1.001) return;
    var narrow = W <= 620;
    var sx = n._x * S.t.k + S.t.x;
    var sy = n._y * S.t.k + S.t.y;
    var safe = narrow
      ? { left: 16, right: W - 16, top: 148, bottom: 300 }
      : { left: 120, right: W - 430, top: 130, bottom: H - 170 };
    if (sx > safe.left && sx < safe.right && sy > safe.top && sy < safe.bottom) return;
    var tx, ty;
    if (narrow) {
      tx = W / 2 - n._x * S.t.k;
      ty = 236 - n._y * S.t.k;
    } else {
      tx = W / 2 - n._x * S.t.k - 60;
      ty = (H - 120) / 2 - n._y * S.t.k;
    }
    var target = d3.zoomIdentity.translate(tx, ty).scale(S.t.k);
    svg.transition().duration(760).ease(d3.easeCubicOut).call(zoom.transform, target);
  }

  /* ────────────────────────────────────────────── 播放 */

  function play() {
    if (S.playing) { stop(); return; }
    S.playing = true;
    $(".tl-play").textContent = "❚❚";
    $(".tl-play").classList.add("playing");
    S.timer = setInterval(function () {
      if (S.idx >= nodes.length - 1) { stop(); return; }
      select(S.idx + 1);
    }, 2500);
  }

  function stop() {
    S.playing = false;
    clearInterval(S.timer);
    $(".tl-play").textContent = "▶";
    $(".tl-play").classList.remove("playing");
  }

  /* ────────────────────────────────────────────── 抽屉 / 弹窗 */

  function openDrawer(which) {
    closeDrawers();
    $(which === "nan" ? "#drawer-nan" : "#drawer-trip").classList.add("open");
    $('[data-act="' + (which === "nan" ? "nan" : "trip") + '"]').classList.add("on");
  }

  function closeDrawers() {
    $("#drawer-trip").classList.remove("open");
    $("#drawer-nan").classList.remove("open");
    $('[data-act="trip"]').classList.remove("on");
    $('[data-act="nan"]').classList.remove("on");
  }

  function toggleDrawer(which) {
    var el = $(which === "nan" ? "#drawer-nan" : "#drawer-trip");
    if (el.classList.contains("open")) { closeDrawers(); return; }
    openDrawer(which);
  }

  function toggleAbout(force) {
    var m = $("#about");
    var on = force === undefined ? !m.classList.contains("open") : force;
    m.classList.toggle("open", on);
  }

  /* ────────────────────────────────────────────── 搜索 */

  function doSearch(q) {
    var box = $("#qres");
    q = q.trim();
    if (!q) { box.classList.remove("open"); box.innerHTML = ""; return; }

    /* 回目直达：数字或汉字回目号优先于关键字匹配 */
    var chq = parseChapterQuery(q);
    if (chq != null) {
      if (isNaN(chq)) {
        box.innerHTML = '<div class="empty">回目号应在 1 – 100 之间</div>';
        box.classList.add("open");
        return;
      }
      var hit = stationByChapter(chq);
      var title = chapterTitle(chq);
      var rows = [];
      if (hit) {
        var st = nodes[hit.idx];
        var note = hit.exact
          ? "第 " + chq + " 回 · " + st.short
          : "第 " + chq + " 回无独立站点，最近为「" + st.short + "」";
        rows.push({ order: st.order, label: title || "第 " + chq + " 回", note: note });
      }
      box.innerHTML = rows.length
        ? rows.map(function (r) {
            return '<button data-order="' + r.order + '" data-ch="' + chq + '"><b>' + r.label + "</b><span>" + r.note + "</span></button>";
          }).join("")
        : '<div class="empty">第 ' + chq + " 回无对应站点</div>";
      box.classList.add("open");
      bindSearchResult(box);
      return;
    }

    var hits = [];
    nodes.forEach(function (n) {
      var hay = [n.name, n.short, n.modern, n.demon || "", chapterLabel(n), chapterTitle(n.chapter[0])].join(" ");
      var nanNames = (n.nan || []).map(function (v) {
        var h = D.nan.filter(function (x) { return x.n === v; })[0];
        return h ? h.name : "";
      }).join(" ");
      if ((hay + " " + nanNames).indexOf(q) >= 0) hits.push(n);
    });
    // 八十一难名目直搜
    D.nan.forEach(function (x) {
      if (x.name.indexOf(q) >= 0) {
        var i = stationByNan(x.n);
        if (i != null && hits.indexOf(nodes[i]) < 0) hits.push(nodes[i]);
      }
    });
    hits = hits.slice(0, 8);
    box.innerHTML = hits.length
      ? hits.map(function (n) {
          return '<button data-order="' + n.order + '"><b>' + n.name + "</b><span>" + chapterLabel(n) + (n.demon && n.demon !== "—" ? " · " + n.demon : "") + "</span></button>";
        }).join("")
      : '<div class="empty">无此名目</div>';
    box.classList.add("open");
    bindSearchResult(box);
  }

  function bindSearchResult(box) {
    box.querySelectorAll("button").forEach(function (b) {
      b.addEventListener("click", function () {
        select(parseInt(b.getAttribute("data-order"), 10));
        box.classList.remove("open");
        $("#q").value = "";
      });
    });
  }

  /* ────────────────────────────────────────────── 深链 */

  function writeHash() {
    var parts = ["s=" + S.idx];
    if (S.showReal) parts.push("real=1");
    if (!S.showEra) parts.push("era=0");
    if (S.base === "modern") parts.push("base=modern");
    if (!S.showPrologue) parts.push("pro=0");
    if (S.focusChar) parts.push("c=" + S.focusChar);
    if (S.scene) parts.push("scene=" + S.scene);
    var h = "#" + parts.join("&");
    if (location.hash !== h) history.replaceState(null, "", h);
  }

  function readHash() {
    var h = location.hash.replace(/^#/, "");
    if (!h) return;
    var q = {};
    h.split("&").forEach(function (kv) {
      var p = kv.split("=");
      q[p[0]] = p[1];
    });
    if (q.s !== undefined) S.idx = Math.max(0, Math.min(nodes.length - 1, parseInt(q.s, 10) || 0));
    if (q.real === "1") S.showReal = true;
    if (q.era === "0") S.showEra = false;
    if (q.base === "modern") S.base = "modern";
    if (q.pro === "0") S.showPrologue = false;
    if (q.c && charById(q.c)) S.focusChar = q.c;
    if (q.scene && isSceneId(q.scene)) S.sceneWant = q.scene;
  }

  /* ────────────────────────────────────────────── 构建 / 缩放 */

  var zoom;

  function build() {
    W = window.innerWidth;
    H = window.innerHeight;

    U = Math.max(0.82, Math.min(1.9, Math.min(W / 1340, H / 800)));
    document.documentElement.style.setProperty("--u", U);

    d3.select("#map").selectAll("*").remove();
    svg = d3.select("#map").attr("viewBox", null).attr("width", W).attr("height", H);

    gRoot = svg.append("g").attr("class", "root");
    gBase = gRoot.append("g").attr("class", "base");
    gRealLayer = gRoot.append("g").attr("class", "real-layer");
    gRoute = gRoot.append("g").attr("class", "routes");
    gPinLayer = gRoot.append("g").attr("class", "pins");

    buildProjection();
    nodes.forEach(project);

    drawBase();
    drawRoutes();
    drawPins();
    drawLabels();

    zoom = d3.zoom()
      .scaleExtent([1, 7])
      .translateExtent([[-W, -H], [W * 2, H * 2]])
      .on("zoom", function (ev) {
        S.t = ev.transform;
        S.k = ev.transform.k;
        if (ev.sourceEvent) S.wantDive = null;
        gRoot.attr("transform", ev.transform);
        rescale();
      })
      .on("end", declutter);

    svg.call(zoom).on("dblclick.zoom", null);
    S.t = d3.zoomIdentity;
    S.k = 1;
    rescale();
    declutter();
  }

  function refreshFlags() {
    var stageEl = document.getElementById("stage");
    if (stageEl) stageEl.setAttribute("data-base", S.base);
    if (gRealLayer) gRealLayer.style("display", S.showReal ? null : "none");
    var baseBtn = $('[data-act="base"]');
    if (baseBtn) {
      baseBtn.textContent = S.base === "modern" ? "古图" : "今图";
      baseBtn.classList.toggle("on", S.base === "modern");
    }
    // 实路线本身靠 .on 把 opacity 0 拉到 0.78；只在 drawRoutes() 里挂过一次，
    // 点按钮时不重画就一直是 0（第 36 轮之后发现的「实路不显示」就是这个）。
    var tlBox = $(".timeline");
    if (tlBox) tlBox.classList.toggle("era-on", S.showEra);
    var eraBtn = $('[data-act="era"]');
    if (eraBtn) { eraBtn.classList.toggle("on", S.showEra); eraBtn.classList.toggle("ink", S.showEra); }
    if (routeEls.real) routeEls.real.classed("on", S.showReal);
    if (realLabelSel) realLabelSel.style("opacity", S.showReal ? 1 : 0);
    if (routeEls.prologue) routeEls.prologue.style("opacity", S.showPrologue ? 0.9 : 0);
    updatePins();
    $('[data-act="real"]').classList.toggle("on", S.showReal);
    $('[data-act="real"]').classList.toggle("ink", S.showReal);
    $('[data-act="prologue"]').classList.toggle("on", S.showPrologue);
    $('[data-act="prologue"]').classList.toggle("ink", S.showPrologue);
    document.querySelectorAll("#chars .cbtn").forEach(function (b) {
      var on = b.getAttribute("data-char") === S.focusChar;
      b.classList.toggle("on", on);
      // 反白底只有视觉意义；读屏器要靠 aria-pressed 才知道这一枚是不是「已按下」
      b.setAttribute("aria-pressed", on ? "true" : "false");
    });
  }

  /* 人物一行：点选后只留该人的行迹，再点一次取消 */
  function buildChars() {
    var box = $("#chars");
    box.innerHTML = '<span class="chars-hint">随行</span>' +
      D.characters.map(function (c) {
        return '<button class="cbtn" data-char="' + c.id + '" aria-pressed="false" title="' + c.note + '">' + c.short + "</button>";
      }).join("");
    box.querySelectorAll(".cbtn").forEach(function (b) {
      b.addEventListener("click", function () {
        var id = b.getAttribute("data-char");
        S.focusChar = S.focusChar === id ? null : id;
        updateRoute();
        updatePins();
        refreshFlags();
        writeHash();
      });
    });
  }

  /* ────────────────────────────────────────────── 事件绑定 */

  function bind() {
    $(".tl-play").addEventListener("click", play);

    // 时间轴上的重点场景签：点一下直接落到那一站（并摊开纸模，如果那站有）。
    // 指针事件要拦住，否则会被下面的轨道当成拖动起手。
    var keyBox = $("#tl-keys");
    if (keyBox) {
      keyBox.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); });
      keyBox.addEventListener("click", function (ev) {
        var b = ev.target.closest ? ev.target.closest(".tl-key") : null;
        if (!b) return;
        ev.stopPropagation();
        select(parseInt(b.getAttribute("data-order"), 10), { dive: true, enter: true });
      });
    }

    var track = $("#tl-track");
    var dragging = false;

    function pick(ev) {
      var r = track.getBoundingClientRect();
      var x = (ev.touches ? ev.touches[0].clientX : ev.clientX) - r.left;
      var f = Math.max(0, Math.min(1, x / r.width));
      return Math.round(f * (nodes.length - 1));
    }

    track.addEventListener("pointerdown", function (ev) {
      dragging = true;
      track.setPointerCapture(ev.pointerId);
      stop();
      select(pick(ev));
    });
    track.addEventListener("pointermove", function (ev) {
      if (!dragging) return;
      select(pick(ev), { pan: false });
    });
    track.addEventListener("pointerup", function () { dragging = false; });
    track.addEventListener("pointercancel", function () { dragging = false; });

    document.querySelectorAll(".tbtn").forEach(function (b) {
      b.addEventListener("click", function () {
        var act = b.getAttribute("data-act");
        if (act === "trip") toggleDrawer("trip");
        if (act === "nan") toggleDrawer("nan");
        if (act === "about") toggleAbout();
        if (act === "reset") resetView();
        if (act === "real") { S.showReal = !S.showReal; refreshFlags(); writeHash(); }
        if (act === "era") { S.showEra = !S.showEra; refreshFlags(); writeHash(); }
        if (act === "base") {
          S.base = S.base === "modern" ? "ancient" : "modern";
          refreshFlags(); writeHash();
        }
        if (act === "prologue") { S.showPrologue = !S.showPrologue; refreshFlags(); writeHash(); }
      });
    });

    document.querySelectorAll("[data-close]").forEach(function (b) {
      b.addEventListener("click", function () {
        closeDrawers();
        toggleAbout(false);
      });
    });

    $("#about").addEventListener("click", function (ev) {
      if (ev.target === $("#about")) toggleAbout(false);
    });

    // 纸模场景：关闭叉 + 点纸边外侧收起（和「关于」同一套习惯）
    var sceneClose = $("#scene-close");
    if (sceneClose) sceneClose.addEventListener("click", closeScene);
    var sceneModalEl = $("#scene-modal");
    if (sceneModalEl) {
      sceneModalEl.addEventListener("click", function (ev) {
        if (ev.target === sceneModalEl) closeScene();
      });
    }

    $("#map").addEventListener("click", function () {
      // 点空白处收起搜索结果
      $("#qres").classList.remove("open");
    });

    var q = $("#q");
    q.addEventListener("input", function () { doSearch(q.value); });
    q.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") { q.blur(); q.value = ""; doSearch(""); }
      if (ev.key === "Enter") {
        var first = $("#qres button");
        if (first) first.click();
      }
    });

    document.addEventListener("keydown", function (ev) {
      var tag = (ev.target.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea") return;
      // 纸模场景开着：键盘归它，主站只留 Esc 出路（其余键别在背后换站/播放）
      if (S.scene) { if (ev.key === "Escape") closeScene(); return; }
      if (ev.key === "ArrowRight" || ev.key === "ArrowDown") { ev.preventDefault(); stop(); select(S.idx + 1); }
      if (ev.key === "ArrowLeft" || ev.key === "ArrowUp") { ev.preventDefault(); stop(); select(S.idx - 1); }
      if (ev.key === " ") { ev.preventDefault(); play(); }
      if (ev.key === "Escape") { closeDrawers(); toggleAbout(false); $("#detail").classList.remove("open"); $("#detail").classList.remove("expanded"); S.detailExpanded = false; declutter(); }
      if (ev.key === "/" && !ev.metaKey && !ev.ctrlKey) { ev.preventDefault(); q.focus(); }
    });

    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var keep = S.idx;
        var zk = S.k;
        var want = S.wantDive;
        build();
        select(keep, { force: true, pan: false });
        if (want != null && want === keep) {
          S.wantDive = keep;
          diveTo(nodes[keep]);
        } else if (zk > 1.001) {
          centerStation(nodes[S.idx], zk, 0);
        }
        refreshFlags();
      }, 180);
    });
  }

  /* ────────────────────────────────────────────── 启动 */

  function loadGeodata() {
    return Promise.all([
      fetch("assets/vendor/land-110m.json").then(function (r) { return r.json(); }),
      fetch("assets/vendor/china-provinces.json").then(function (r) { return r.json(); }),
    ]).then(function (arr) {
      var land = arr[0], china = arr[1];
      geoLand = topojson.feature(land, land.objects.land);

      // 只取国内省级轮廓；九段线单独一层，画法与省界分开
      var prov = { type: "FeatureCollection", features: [] };
      var jd = [];
      (china.features || []).forEach(function (f) {
        if (f.properties && f.properties.adcode === "100000_JD") jd.push(f);
        else prov.features.push(f);
      });
      geoProvinces = prov.features.length ? prov : null;
      geoNineDash = jd.length ? { type: "FeatureCollection", features: jd } : null;
    }).catch(function (e) {
      console.warn("地理数据加载失败，仅绘制示意图层", e);
    });
  }

  function init() {
    readHash();
    buildTimeline();
    buildTripDrawer();
    buildNanDrawer();
    buildChars();
    bind();

    loadGeodata().then(function () {
      build();
      select(S.idx, { force: true, pan: false, dive: W <= 620 });
      refreshFlags();
      if (S.sceneWant) {
        var wantScene = S.sceneWant;
        S.sceneWant = null;
        openScene(wantScene);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();