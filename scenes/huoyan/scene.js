// scenes/huoyan/scene.js —— 火焰山纸模场景（三调芭蕉扇）。
// 本轮（P5-1）只搭骨架：印一张焦赭纸地面 + 一盏暖主光 + 一枚占位立牌，用来验证「本地 three + harness 跑得通」。
// 后续按 docs/PAPERCRAFT-IMPLEMENTATION.md 第 9 节排期逐轮加：P5-2 测试卡、P5-3 地面与八百里火墙、芭蕉洞、
// P5-4 T 型悟空与走动寻路、P5-5 三名人物与纸片对话。占位立牌在 P5-4 会被真正的纸模替掉。
import { createHarness } from '../vendor/papercraft/harness.js';
import { buildWukong, HERO_H } from './wukong.js?v=9';
import { buildPeople } from './people.js';
import { createDialog } from '../shared/dialog.js';
import * as THREE from 'three';

// 调色板从主站宣纸色推导（实现文档 §5 PALETTE）：宣纸底、赭石、朱砂，阴影用暖赭，禁灰黑纯白
const C = {
  page: '#f3e7cd',     // 宣纸
  deep: '#ead8b6',     // paper-deep
  ochre: '#d7bd93',    // 赭石淡染
  ochreD: '#bfa072',   // 赭石深染
  burnt: '#8c2b22',    // cinnabar-deep
  ember: '#b03a2e',    // 朱砂（火）
  shadow: '#a0602c',   // 阴影暖赭（spec PALETTE；禁灰黑）
  gold: '#b8934a',     // 金箍 / 纸灯
  jade: '#3f6b4a',     // 芭蕉叶石绿
  ink: '#2a241c',
};

try {
  const H = createHarness({
    ground: C.page,
    heroHeight: 3.6,
    view: { pitch: 46, dist: 66, target: [0, 1.5, -6] },
    lens: { fov: 28 },
    bounds: { x0: -56, x1: 56, z0: -46, z1: 34 },
    walkArea: { x0: -14, x1: 14, z0: -16, z1: 8 },
    camBox: { x0: -2, x1: 2, z0: -6, z1: -2 },
    subject: [0, 3],
    play: true,
  });

  // ---- 纸地面：焦赭戈壁，无水 -------------------------------------------------
  // 三层淡染压底（washes），再印龟裂纹与风卷灰线；火焰山寸草不生，故没有草簇与水纹。
  H.printGround(({ g, ppu, X, Z, rnd, washes }) => {
    // 默认 washes 铺四色会叠成一片深赭（实测平均色 219,179,102，比宣纸深两档）：这里只用两色、
    // 并把三档的 alpha 各压低一档，让它读起来是「一张被日光晒过的纸」而不是一块土。
    // P5-8：压一档曝光（measure 的 lumaP50 0.765 偏亮），并让最粗那档落到赭石深染上，
    // 于是纸面从「一片浅米」变成「浅米里带深浅两层赭」。
    washes([C.deep, C.ochre, C.ochreD], {
      scales: [[60, 180, 460, 0.22], [200, 50, 150, 0.14], [700, 10, 34, 0.07]],
    });

    // 龟裂纹：短促的两折线，越靠远景越密（近景留白给主角走动与道具）
    g.lineCap = 'round';
    for (let i = 0; i < 520; i++) {
      const x = -56 + rnd() * 112, z = -46 + rnd() * 80;
      const far = (34 - z) / 80;                       // z 越小（远处）越大
      if (far < 0.35 && rnd() < 0.55) continue;        // 近景稀疏
      const len = (0.55 + rnd() * 1.5) * (0.7 + far * 0.9);
      const a = (rnd() - 0.5) * 0.9, bx = Math.cos(a) * len, bz = Math.sin(a) * len;
      const mx = -Math.sin(a) * len * 0.24, mz = Math.cos(a) * len * 0.24;
      g.strokeStyle = rnd() < 0.6 ? 'rgba(140,43,34,0.16)' : 'rgba(42,36,28,0.13)';
      g.lineWidth = (0.05 + rnd() * 0.05) * ppu;
      g.beginPath();
      g.moveTo(X(x), Z(z));
      g.quadraticCurveTo(X(x + bx * 0.5 + mx), Z(z + bz * 0.5 + mz), X(x + bx), Z(z + bz));
      g.stroke();
    }

    // 风卷灰线：一条条很长的横向淡痕，暗示常年西风
    for (let i = 0; i < 26; i++) {
      const z = -46 + rnd() * 80, y = Z(z), w = (6 + rnd() * 22) * ppu;
      g.strokeStyle = 'rgba(138,114,86,' + (0.05 + rnd() * 0.07).toFixed(3) + ')';
      g.lineWidth = (0.09 + rnd() * 0.12) * ppu;
      g.beginPath();
      const x0 = X(-56 + rnd() * 100);
      g.moveTo(x0, y);
      g.quadraticCurveTo(x0 + w * 0.5, y - 0.5 * ppu, x0 + w, y);
      g.stroke();
    }

    // 焦痕：火墙脚下被烧过的地皮——十几片边缘发虚的深赭晕，越靠火墙越密。
    // 用径向渐变而不是实心块，纸面上是「洇开的墨」而不是一块贴图。
    for (let i = 0; i < 18; i++) {
      const x = -50 + rnd() * 100;
      const z = -44 + rnd() * 26;                     // 集中在 z ∈ [-44, -18]，即火墙前一带
      const r = (2.4 + rnd() * 6.5) * ppu;
      const gr = g.createRadialGradient(X(x), Z(z), 0, X(x), Z(z), r);
      gr.addColorStop(0, 'rgba(140,43,34,' + (0.10 + rnd() * 0.10).toFixed(3) + ')');
      gr.addColorStop(0.55, 'rgba(160,96,44,0.06)');
      gr.addColorStop(1, 'rgba(160,96,44,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(X(x), Z(z), r, r * (0.55 + rnd() * 0.3), 0, 0, Math.PI * 2);
      g.fill();
    }

    // ---- P5-8 印花：戈壁砂砾、风蚀细痕、纸面颗粒 ---------------------------------
    // measure.py 六项 WARN 都指向同一件事：每片纸上是纯色块，纸上没有「印」的东西
    // （printDetail 0.002、localContrast 0.019、flatPct 98.5、barePct 98.4）。
    // 把地面当成一张印过石版画的纸：中尺度色斑（16px 块里要看得出深浅）→ 砾石簇
    // （强边缘，占住 sharp band）→ 风蚀短划 → 极淡颗粒（纸的「牙口」）。
    // 注意 measure 的圆形标定在 1600px 宽：1px 的点在缩图后会糊成 0.03 的渐变，
    // 所以这里砾石最小 2px、对比 α ≥ 0.28，才留得住边缘。
    const px = ppu / 22;                                  // 以 ppu 22 为基准的线宽/点径缩放
    for (let i = 0; i < 140; i++) {                       // 中尺度色斑：浅赭与深赭互叠
      const x = -54 + rnd() * 108, z = -44 + rnd() * 76;
      const r = (2.4 + rnd() * 7.5) * ppu;
      const gr = g.createRadialGradient(X(x), Z(z), r * 0.15, X(x), Z(z), r);
      const a = 0.10 + rnd() * 0.12;
      gr.addColorStop(0, rnd() < 0.62
        ? 'rgba(191,160,114,' + a.toFixed(3) + ')'         // 赭石深染
        : 'rgba(232,216,182,' + (a * 0.9).toFixed(3) + ')');  // paper-deep 的浅斑（一深一浅才有起伏）
      gr.addColorStop(1, 'rgba(191,160,114,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(X(x), Z(z), r, r * (0.6 + rnd() * 0.5), rnd() * 0.9, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 200; i++) {                       // 砾石簇：一处 4–8 颗，不是均匀噪点
      const cx = -54 + rnd() * 108, cz = -44 + rnd() * 76, k = 4 + Math.floor(rnd() * 5);
      for (let n = 0; n < k; n++) {
        const rr = (1.0 + rnd() * 1.9) * px;
        g.fillStyle = rnd() < 0.5
          ? 'rgba(42,36,28,' + (0.22 + rnd() * 0.26).toFixed(3) + ')'
          : 'rgba(140,43,34,' + (0.18 + rnd() * 0.24).toFixed(3) + ')';
        g.beginPath();
        g.ellipse(X(cx + (rnd() - 0.5) * 3.2), Z(cz + (rnd() - 0.5) * 3.2),
          rr, rr * (0.7 + rnd() * 0.5), rnd() * 3, 0, Math.PI * 2);
        g.fill();
      }
    }
    for (let i = 0; i < 760; i++) {                       // 风蚀短划：顺西风，带一点弧度
      const x = -56 + rnd() * 112, z = -46 + rnd() * 80;
      const far = (34 - z) / 80;
      const len = (0.30 + rnd() * 1.25) * (0.6 + far * 0.8);
      const a = (rnd() - 0.5) * 0.28;
      g.strokeStyle = rnd() < 0.7
        ? 'rgba(110,74,44,' + (0.10 + rnd() * 0.12).toFixed(3) + ')'
        : 'rgba(42,36,28,' + (0.08 + rnd() * 0.10).toFixed(3) + ')';
      g.lineWidth = (0.05 + rnd() * 0.06) * ppu;
      g.beginPath();
      g.moveTo(X(x), Z(z));
      g.quadraticCurveTo(X(x + Math.cos(a) * len * 0.5), Z(z + Math.sin(a) * len * 0.5 - 0.08),
        X(x + Math.cos(a) * len), Z(z + Math.sin(a) * len));
      g.stroke();
    }
    for (let i = 0; i < 1200; i++) {                      // 纸纤维的「牙口」：极淡、极碎
      const x = -56 + rnd() * 112, z = -46 + rnd() * 80;
      g.fillStyle = 'rgba(74,60,42,' + (0.03 + rnd() * 0.05).toFixed(3) + ')';
      g.fillRect(X(x), Z(z), px * (0.6 + rnd() * 1.2), px * (0.5 + rnd()));
    }
  });

  // ---- P5-4 主角：T 型纸偶孙悟空（16 张卡，配色依设定图，见 wukong.js） ----------------
  const wk = buildWukong(H, { x: 0, z: 3 });
  H.scene.add(wk.handle.pivot);
  H.setHero(wk.handle, { stride: wk.stride });

  // ---- P5-5 三位说话的人 + 纸片对话框 --------------------------------------------
  // 三个人都摆在 walkArea 里（z −12..−6.2），离火墙 z −22 还有十来步，不会糊在火里。
  const people = buildPeople(H);
  const personOf = (id) => people.find((p) => p.id === id);

  // 对话打开时把走动掐掉：不响应点地面，并立刻松掉摇杆（否则人会顶着纸片走）。
  let frozen = false;
  const dialog = createDialog({
    onClose: () => { frozen = false; steeringTo = null; },
  });

  const openPerson = (id) => {
    const who = personOf(id);
    if (!who || frozen) return null;
    frozen = true;
    steeringTo = null;
    steer(0, 0);
    dialog.open(who);
    return who;
  };

  // 拾取：先打人物（他们站在地面上方，命中点比地面近），没打到人再当地面点击。
  const pickPerson = (ev) => {
    if (!canvas) return null;
    const r = canvas.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, H.camera);
    const groups = people.map((p) => p.hinges.map((h) => h.group));
    const hits = ray.intersectObjects(groups.flat(), true);
    for (const hit of hits) {
      let o = hit.object;
      while (o && !o.userData.personId) o = o.parent;
      if (o && o.userData.personId) return o.userData.personId;
    }
    return null;
  };

  // E 键：跟最近的那个人说话（1.6 步内），省得在小屏上点不准。
  const nearestPerson = () => {
    const at = wk.handle.group.position;
    let best = null, bestD = 3.4;
    people.forEach((p) => {
      const d = Math.hypot(p.x - at.x, p.z - at.z);
      if (d < bestD) { bestD = d; best = p.id; }
    });
    return best;
  };
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'e' || ev.key === 'E') {
      if (dialog.isOpen()) return;
      const id = nearestPerson();
      if (id) { ev.preventDefault(); openPerson(id); }
    }
  });

  // ---- 头顶名牌 + 走近说话（网游式 id 展示）--------------------------------------
  // 名字不进贴图：人物是纸的，名牌改成一张真 DOM 的小纸签，每帧把世界坐标投到屏幕，
  // 贴在头顶。好处是字永远清晰（贴图上的字会随纸片一起糊），也不占 draw call。
  const tagLayer = document.createElement('div');
  tagLayer.className = 'pd-tags';
  document.body.appendChild(tagLayer);
  const tagOf = new Map();
  const addTag = (id, name, cls) => {
    const el = document.createElement('span');
    el.className = 'pd-tag' + (cls ? ' ' + cls : '');
    el.textContent = name;
    tagLayer.appendChild(el);
    tagOf.set(id, el);
    return el;
  };
  people.forEach((p) => addTag(p.id, p.name, 'npc'));
  const heroTag = addTag('hero', '孙悟空', 'hero');
  if (heroTag) heroTag.classList.add('off');   // 主角自己的名牌常暗：视线中央，不用喊

  const tagV = new THREE.Vector3();
  // 人物头顶高度：纸人总高约 6 个 scale 单位，名牌挂在 5.8 处再留一点缝。
  const placeTag = (x, y, z, el) => {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    tagV.set(x, y, z).project(H.camera);
    if (tagV.z > 1) { el.style.opacity = '0'; return; }          // 在镜头背后
    el.style.opacity = '';
    el.style.left = (r.left + (tagV.x * 0.5 + 0.5) * r.width) + 'px';
    el.style.top = (r.top + (-tagV.y * 0.5 + 0.5) * r.height) + 'px';
  };

  // 走近说话：进 2.4 步自动弹，退到 3.2 步外才重新上膛 —— 否则关掉对话会立刻又弹，
  // 站着不动根本走不开。点击人物与按 E 都还照旧可用。
  const armed = new Set(people.map((p) => p.id));
  H.onStep(() => {
    const at = wk.handle.group.position;
    placeTag(at.x, at.y + 4.15, at.z, heroTag);
    people.forEach((p) => {
      const el = tagOf.get(p.id);
      const d = Math.hypot(p.x - at.x, p.z - at.z);
      if (el) {
        placeTag(p.x, 5.8 * p.scale, p.z + 0.15, el);
        el.classList.toggle('near', d < 3.2);
        el.classList.toggle('off', frozen);
      }
      if (!armed.has(p.id) && d > 3.2) armed.add(p.id);
      if (armed.has(p.id) && d < 2.4 && !frozen && !dialog.isOpen()) {
        armed.delete(p.id);
        openPerson(p.id);
      }
    });
    if (heroTag) heroTag.classList.toggle('off', true);
  });

  // ---- P5-4 点击地面寻路 ---------------------------------------------------------
  // harness 只提供 steer(x, z) 这一个「方向摇杆」。点地面后算出朝落点的方向，
  // 每步由 onStep 检查是否走到（0.35 单位内就松杆），与 WASD 共用同一套加速、转向与阻挡。
  const ray = new THREE.Raycaster();
  const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const pointer = new THREE.Vector2();
  const aim = new THREE.Vector3();
  const canvas = H.scene.userData.canvas || document.querySelector('canvas');
  let steeringTo = null;
  // createHarness 的返回句柄上没有 steer（它是 __papercraft 的公开方法），这里取一次薄封装。
  const steer = (x, z) => window.__papercraft && window.__papercraft.steer(x, z);
  // 当前位置直接读主角那一层（harness 每帧把 heroPos 写进 handle.group.position；
  // createHarness 的返回值上没有 heroPos，只有 window.__papercraft 上有，所以不要从 H 上取）。
  H.onStep(() => {
    if (!steeringTo) return;
    const at = wk.handle.group.position;
    const dx = steeringTo.x - at.x, dz = steeringTo.z - at.z;
    if (Math.hypot(dx, dz) < 0.35) { steer(0, 0); steeringTo = null; return; }   // 走到就松杆
    steer(dx, dz);
  });
  const walkTo = (ev) => {
    if (frozen) return;                       // 对话开着：点击只用来翻页（由 dialog 自己处理）
    const who = pickPerson(ev);
    if (who) { openPerson(who); return; }     // 点到人 → 说话，不走路
    const r = canvas.getBoundingClientRect();
    pointer.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(pointer, H.camera);
    if (!ray.ray.intersectPlane(ground, aim)) return;
    const a = H.walkArea;
    // 落点夹进可走范围（harness 的 walkArea 之外是没布景的裸纸）
    steeringTo = {
      x: Math.max(a.x0 + 0.6, Math.min(a.x1 - 0.6, aim.x)),
      z: Math.max(a.z0 + 0.6, Math.min(a.z1 - 0.6, aim.z)),
    };
  };
  if (canvas) canvas.addEventListener('pointerdown', walkTo);

  // ---- P5-3 八百里火墙 ----------------------------------------------------------
  // 三层纸焰铺满远景（z = -42 / -37 / -33），越远越大越淡：一排同样的焰形被不同 scale 与左右抖动
  // 反复钉上去，读起来是一条横贯的火海而不是几十根蜡烛。res 压到 0.55（远景只见轮廓），
  // 否则 100 多张全分辨率印刷会把 buildMs 顶到 5 s 以上。
  const flamePts = [
    [-0.62, 0], [-0.46, 0.70], [-0.30, 1.10], [-0.16, 1.64], [0, 2.10],
    [0.15, 1.60], [0.30, 1.12], [0.46, 0.68], [0.60, 0],
  ];
  const flamePaint = (P) => {
    const { box } = P;
    P.fill(C.ember);
    // 焰心留一道更亮的暖赭竖带（不是纯白高光，spec BANNED）
    P.g.fillStyle = C.shadow;
    P.g.globalAlpha = 0.45;
    P.g.fillRect(box.x0 + box.w * 0.38, box.y0 + box.h * 0.02, box.w * 0.24, box.h * 0.62);
    P.g.globalAlpha = 1;
    P.innerShade(C.burnt, { alpha: 0.5, blurPx: 7 });
  };
  // 三层的 z 与横向铺开宽度都收在 overview 视野内（实测 dist 66 / pitch 46 / fov 28 时，
  // z=-42 那一排在画面外，cards() 只有 34；收到 -26/-23/-20 后 100+ 片进框）。
  const flameRows = [
    { z: -28, s: 3.9, n: 36, res: 0.5, halfW: 34 },   // 远：大而淡，压成一条火脊
    { z: -25, s: 2.8, n: 40, res: 0.55, halfW: 30 },
    { z: -22, s: 1.9, n: 44, res: 0.6, halfW: 26 },   // 近：小而清，露出焰尖
  ];
  for (const row of flameRows) {
    for (let i = 0; i < row.n; i++) {
      const t = i / (row.n - 1);
      const x = -row.halfW + t * row.halfW * 2 + (((i * 37) % 11) / 11 - 0.5) * 1.6;
      const jitter = ((i * 37) % 11) / 11;            // 确定性抖动，刷新不跳
      const sc = row.s * (0.72 + jitter * 0.62);
      H.popup(flamePts, flamePaint, { x, z: row.z + jitter * 1.4, scale: sc, res: row.res, order: 10 + row.z });
    }
  }

  // ---- P5-3 芭蕉洞（偏右，洞门用 holes 挖穿）--------------------------------------
  const arch = [[-1.45, 0], [-1.45, 2.05], [-0.95, 2.85], [0, 3.25], [0.95, 2.85], [1.45, 2.05], [1.45, 0]];
  const caveFace = [[-2.6, 0], [2.6, 0], [2.6, 4.3], [-2.6, 4.3]];
  // 洞门后的一张暗纸：透过洞口看到的是幽深，不是背景色
  H.popup(arch, (P) => { P.fill(C.ink); P.innerShade('#000000', { alpha: 0.5, blurPx: 6 }); },
    { x: 22, z: -19.0, yaw: 0, scale: 1.0 });
  // 洞口立面（赭石卡纸，门洞位置挖穿）
  H.popup(caveFace, (P) => { P.fill(C.ochre); P.innerShade(C.ochreD, { alpha: 0.4, blurPx: 10 }); },
    { x: 22, z: -18.6, yaw: 0, scale: 1.0, holes: [arch] });
  // 洞顶两道赭深压边：让洞口有厚度，不像一张平贴纸
  H.popup([[-2.6, 4.3], [2.6, 4.3], [2.6, 4.62], [-2.6, 4.62]], (P) => { P.fill(C.ochreD); },
    { x: 22, z: -18.6, yaw: 0, scale: 1.0 });
  // 纸灯：洞门两侧各一盏（小金纸片 + 暖晕）
  for (const dx of [-3.4, 3.4]) {
    H.popup([[-0.22, 0], [0.22, 0], [0.28, 0.9], [-0.28, 0.9]], (P) => {
      P.fill(C.gold);
      P.g.fillStyle = 'rgba(255,220,178,0.55)';
      P.g.beginPath();
      P.g.arc((P.box.x0 + P.box.x1) / 2, (P.box.y0 + P.box.y1) / 2, Math.min(P.box.w, P.box.h) * 0.42, 0, Math.PI * 2);
      P.g.fill();
      P.innerShade(C.shadow, { alpha: 0.35, blurPx: 4 });
    }, { x: 22 + dx, z: -17.8, yaw: 0, scale: 1.6 });
  }
  // 芭蕉叶：洞旁两片石绿纸叶（spec PALETTE 的 azurite）
  const leaf = [[-1.5, 0.15], [-0.9, 1.5], [0, 2.3], [0.95, 1.45], [1.55, 0.2], [0.5, -0.15], [-0.45, -0.1]];
  for (const [dx, sc] of [[-5.2, 2.2], [5.6, 1.8]]) {
    H.popup(leaf, (P) => {
      P.fill(C.jade);
      P.g.strokeStyle = 'rgba(42,36,28,0.35)';
      P.g.lineWidth = 2;
      P.g.beginPath();
      P.g.moveTo((P.box.x0 + P.box.x1) / 2, P.box.y1 - 4);
      P.g.lineTo((P.box.x0 + P.box.x1) / 2, P.box.y0 + 4);
      P.g.stroke();
    }, { x: 22 + dx, z: -17.6, yaw: 0, scale: sc });
  }

  // ---- P5-2 测试卡（只在 ?test 下印）------------------------------------------------
  // 三张并排的小方卡（放在 ?test 取景中心 target [3,1.5,-6] 与主角之间），用来在近景里判四件事：厚度（0.08 的侧面是否有纸边）、裁切边（切口白线）、
  // 死哑光（没有高光斑）、暖光阴影（阴影偏赭而不是偏灰）。它们不是场景内容，正式构图不放。
  if (H.flags.TEST) {
    const square = (w, h) => [[-w, 0], [w, 0], [w, h], [-w, h]];
    // ① 单色卡：看纸纹与哑光
    H.popup(square(1.5, 2), (P) => { P.fill(C.deep); P.innerShade(C.ochreD, { alpha: 0.3, blurPx: 9 }); },
      { x: -5, z: 0, scale: 1.6 });
    // ② 双色分块：看裁切边与两种纸色的接缝
    H.popup(square(1.5, 2), (P) => {
      const { g, box } = P;
      P.fill(C.deep);
      g.fillStyle = C.ochre;
      g.fillRect(box.x0, box.y0 + box.h * 0.5, box.w, box.h * 0.5);
      P.innerShade(C.ochreD, { alpha: 0.3, blurPx: 9 });
    }, { x: 0, z: 0, scale: 1.6 });
    // ③ 挖孔卡：看 holes 的切口是否有纸厚与内缘
    H.popup(square(1.5, 2), (P) => { P.fill(C.ember); P.innerShade(C.burnt, { alpha: 0.35, blurPx: 8 }); },
      { x: 5, z: 0, scale: 1.6, holes: [[[-0.6, 0.5], [0.6, 0.5], [0.6, 1.5], [-0.6, 1.5]]] });
  }


  // 给验收/后续集成用的小钩子：不开控制台也能让人说话、看状态。
  window.__huoyan = {
    people: people.map((p) => ({ id: p.id, name: p.name, x: p.x, z: p.z, cards: p.hinges.length })),
    openPerson,
    dialog,
    isFrozen: () => frozen,
  };

  H.start();
} catch (err) {
  // WebGL 不可用或运行时缺失：给出说明文字，不把控制台错误抛给用户
  const fb = document.getElementById('fallback');
  if (fb) {
    fb.hidden = false;
    // 兜底文案后面补一行原因：用户看不到控制台，开发时也能一眼读到
    const why = document.createElement('p');
    why.style.cssText = 'margin:10px 0 0;font-size:12px;opacity:.7';
    why.textContent = '原因：' + (err && err.message ? err.message : String(err));
    fb.appendChild(why);
  }
  console.error('papercraft scene failed:', err);
}
