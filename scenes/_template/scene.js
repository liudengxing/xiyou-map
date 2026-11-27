// 纸模场景模板（P5-7 从火焰山提炼）
//
// 复制到 scenes/<新场景>/ 后只改四处（都在下面标了「改这里」）：
//   ① PALETTE  —— 场景配色（只能取自 docs/PAPERCRAFT-IMPLEMENTATION.md §5 的 15 行 paper spec）
//   ② GROUND   —— H.printGround 里的地面印花（无水/戈壁/雪地/林间，靠 washes + 裂纹/斑点/风线）
//   ③ HERO     —— T 型纸偶的卡（正面 + 紧跟其后的侧面，四肢挂在轮廓之外，每张 z 唯一）
//   ④ world    —— createHarness 的 bounds / walkArea / view（活动范围与取景）
// 立牌以外的道具（火墙、洞府、人物）请照 scenes/huoyan/ 的做法用 H.popup 一片片立。
//
// 落成之后必须过 docs/PAPERCRAFT-IMPLEMENTATION.md §8 的十条验收：
//   cards() 100–250、clips() 空、buildMs < 5s、focusHeight 0.55–0.75（measure.py）、
//   walkPath() reached == of 且 blockedBy 空、走动 3–5 帧有变化、对话可开关、主站三档无回归、无 CDN。
import * as THREE from 'three';
import { createHarness } from 'papercraft/harness.js';
import { makeCard } from 'papercraft/lib/paperkit-3d.js';

// ── ① 改这里：配色（宣纸设色，禁高饱和） ─────────────────────────────────────────
const PALETTE = {
  page: '#f3e7cd',    // 空地纸色
  deep: '#ead8b6',    // 浅一层
  ochre: '#d7bd93',   // 中间调
  ochreD: '#bfa072',  // 暗调（阴影/边缘）
  burnt: '#8c2b22',   // 深朱（暗部）
  ember: '#b03a2e',   // 朱砂（强调）
  gold: '#b8934a',
  ink: '#2a241c',
};

const HERO_H = 3.6;

try {
  const H = createHarness({
    ground: PALETTE.page,
    heroHeight: HERO_H,
    // ── ④ 改这里：取景与活动范围 ────────────────────────────────────────────────
    view: { pitch: 46, dist: 66, target: [0, 1.5, -6] },
    lens: { fov: 28 },
    bounds: { x0: -56, x1: 56, z0: -46, z1: 34 },
    walkArea: { x0: -14, x1: 14, z0: -16, z1: 8 },
    camBox: { x0: -2, x1: 2, z0: -6, z1: -2 },
    subject: [0, 3],
    play: true,          // false 时 walkStep 不跑，点击地面也不会动
  });

  // ── ② 改这里：地面印花（纸是印出来的，不是平涂） ──────────────────────────────
  H.printGround((d) => {
    const { g, rnd, X, Z, ppu } = d;
    d.washes([PALETTE.deep, PALETTE.ochre], {
      scales: [[60, 180, 460, 0.16], [200, 50, 150, 0.10], [700, 10, 34, 0.05]],
    });
    // 细纹：从远处密、近处疏，别铺成均匀壁纸
    g.strokeStyle = 'rgba(140,96,60,0.30)';
    g.lineWidth = 1.1;
    for (let i = 0; i < 220; i++) {
      const x = X(-46 + rnd() * 92);
      const z = Z(-40 + rnd() * 66);
      const len = 6 + rnd() * 26;
      const lean = (rnd() - 0.5) * 9;
      g.beginPath();
      g.moveTo(x, z);
      g.quadraticCurveTo(x + len * 0.5, z + lean, x + len, z + lean * 0.3);
      g.stroke();
    }
    // 几片斑（不要大块平色）
    for (let i = 0; i < 14; i++) {
      g.fillStyle = 'rgba(160,112,64,0.10)';
      const x = X(-44 + rnd() * 88), z = Z(-38 + rnd() * 62);
      g.beginPath();
      g.ellipse(x, z, (2 + rnd() * 6) * ppu, (1.6 + rnd() * 4) * ppu, rnd() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });

  // ── ③ 改这里：主角（T 型纸偶：正面卡 + 侧面卡，四肢在轮廓之外） ────────────────
  const rig = new THREE.Group();
  rig.name = 'hero';
  rig.position.set(0, 0, 3);

  const body = new THREE.Group();
  rig.add(body);

  const card = (name, pts, paint, dz, parent = body) => {
    const m = makeCard(pts, {
      ...H.cardOpts(0, 3),
      paint,
      thickness: 0.08,
      edgeWidth: 0.08,
      folds: ['bottom'],
    });
    m.name = name;
    m.position.z = dz;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // 躯干：半宽 0.40，两只手臂内缘 0.46 —— 正面上永不压住躯干
  const torso = card('hero-torso', [
    [-0.36, 1.10], [0.36, 1.10], [0.40, 2.10], [0.38, 2.42], [-0.38, 2.42], [-0.40, 2.10],
  ], (P) => {
    P.fill(PALETTE.ochre);
    P.g.strokeStyle = PALETTE.ink;
    P.g.globalAlpha = 0.5;
    P.g.lineWidth = 2;
    P.g.beginPath();
    P.g.moveTo(P.box.x0 + P.box.w * 0.7, P.box.y1 - P.box.h * 0.1);
    P.g.lineTo(P.box.x0 + P.box.w * 0.3, P.box.y0 + P.box.h * 0.06);
    P.g.stroke();
    P.g.globalAlpha = 1;
    P.innerShade(PALETTE.ochreD, { alpha: 0.38, blurPx: 6 });
  }, 0);
  torso.name = 'hero-torso';

  // 头（正面 + 侧面两张，侧面在正面之后）
  card('hero-head', [
    [-0.30, 2.44], [0.30, 2.44], [0.34, 2.92], [0.16, 3.24], [-0.16, 3.24], [-0.34, 2.92],
  ], (P) => {
    P.fill('#efdcc0');
    P.g.fillStyle = PALETTE.ink;
    P.g.globalAlpha = 0.8;
    P.g.fillRect(P.box.x0 + P.box.w * 0.30, P.box.y0 + P.box.h * 0.52, P.box.w * 0.10, P.box.h * 0.07);
    P.g.fillRect(P.box.x0 + P.box.w * 0.60, P.box.y0 + P.box.h * 0.52, P.box.w * 0.10, P.box.h * 0.07);
    P.g.globalAlpha = 1;
    P.innerShade('#dcc39c', { alpha: 0.4, blurPx: 5 });
  }, 0.10);

  card('hero-head-side', [
    [-0.26, 2.46], [0.26, 2.46], [0.30, 2.92], [0.10, 3.10], [-0.24, 3.06],
  ], (P) => {
    P.fill('#e6d0b0');
    P.innerShade('#d2b78f', { alpha: 0.5, blurPx: 6 });
  }, 0.02);

  // 四肢：各自挂在肩/髋枢轴上，卡片画在枢轴下方
  const limb = (name, x, y, dz, len, paint) => {
    const pivot = new THREE.Group();
    pivot.name = name + '-pivot';
    pivot.position.set(x, y, dz);
    // 卡片窄到 ±0.12：手臂中心在 ±0.60 时内缘 0.48，实心躯干外缘 0.40，中间留 0.08 的缝，
    // 摆动时不扫穿躯干那层（clips() 会逐帧检查这件事）
    const m = makeCard([
      [-0.12, -len], [0.12, -len], [0.13, -0.06], [-0.13, -0.06],
    ], { ...H.cardOpts(0, 3), paint, thickness: 0.08, edgeWidth: 0.08, folds: ['top'] });
    m.name = name;
    m.castShadow = true;
    pivot.add(m);
    body.add(pivot);
    return pivot;
  };

  const arms = [
    limb('hero-arm-l', -0.60, 2.38, -0.24, 1.06, (P) => { P.fill(PALETTE.ochre); P.innerShade(PALETTE.ochreD, { alpha: 0.45, blurPx: 5 }); }),
    limb('hero-arm-r', 0.60, 2.38, -0.24, 1.06, (P) => { P.fill(PALETTE.ochre); P.innerShade(PALETTE.ochreD, { alpha: 0.45, blurPx: 5 }); }),
  ];
  const legs = [
    limb('hero-leg-l', -0.20, 1.06, -0.10, 1.06, (P) => { P.fill(PALETTE.ink); P.innerShade('#1b1712', { alpha: 0.5, blurPx: 4 }); }),
    limb('hero-leg-r', 0.20, 1.06, -0.10, 1.06, (P) => { P.fill(PALETTE.ink); P.innerShade('#1b1712', { alpha: 0.5, blurPx: 4 }); }),
  ];

  // 步态：支撑相线性（脚不动）、摆动相 smoothstep；手臂与腿反相
  const STEP = HERO_H * 0.58 / 2;
  const LEG = 1.06;
  const ARM = 0.30;
  const stride = (walked, gait) => {
    const phase = (walked / STEP) * Math.PI;
    const s = Math.sin(phase), c = Math.cos(phase);
    const A = Math.min(0.5, (gait * STEP * 2) / (2 * LEG));
    const angle = (ph) => {
      const u = (ph / Math.PI) % 2;
      if (u >= 1) return A * (3 - 2 * u);
      const e = u * u * (3 - 2 * u);
      return A * (2 * e - 1);
    };
    legs[0].rotation.x = angle(phase);
    legs[1].rotation.x = angle(phase + Math.PI);
    arms[0].rotation.x = -ARM * gait * c;
    arms[1].rotation.x = ARM * gait * c;
    body.position.y = 0.033 * HERO_H * gait * Math.abs(s);
    body.rotation.z = 0.012 * gait * s;
  };

  // setHero 收的是铰链句柄：group 被搬动/转向，pivot 承接前倾侧倾
  const pivot = new THREE.Group();
  pivot.name = 'hero-pivot';
  pivot.add(rig);
  H.scene.add(pivot);
  H.setHero({ group: rig, pivot }, { stride });

  // 点击地面走过去（steer 收方向向量，不是目标点；每帧按剩余距离重算）
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const ndc = new THREE.Vector2();
  const aim = new THREE.Vector3();
  const canvas = H.scene.userData.canvas || document.querySelector('canvas');
  let target = null;

  const steerTo = (x, z) => {
    if (window.__papercraft) window.__papercraft.steer(x, z);
  };

  H.onStep(() => {
    if (!target) return;
    const p = rig.position;
    const dx = target.x - p.x, dz = target.z - p.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.35) {
      target = null;
      steerTo(0, 0);
      return;
    }
    steerTo(dx / d, dz / d);
  });

  if (canvas) {
    canvas.addEventListener('pointerdown', (ev) => {
      const r = canvas.getBoundingClientRect();
      ndc.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
      ndc.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
      ray.setFromCamera(ndc, H.camera);
      if (!ray.ray.intersectPlane(plane, aim)) return;
      const a = H.walkArea;
      target = {
        x: Math.min(a.x1 - 0.6, Math.max(a.x0 + 0.6, aim.x)),
        z: Math.min(a.z1 - 0.6, Math.max(a.z0 + 0.6, aim.z)),
      };
    });
  }

  H.start();
} catch (err) {
  const box = document.querySelector('#fallback');
  if (box) {
    box.hidden = false;
    const why = document.createElement('p');
    why.style.cssText = 'margin:10px 0 0;font-size:12px;opacity:.7';
    why.textContent = '原因：' + (err && err.message ? err.message : err);
    box.appendChild(why);
  }
  console.error('papercraft scene failed:', err);
}