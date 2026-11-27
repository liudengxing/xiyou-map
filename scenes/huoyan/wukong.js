// 火焰山纸模 · 主角孙悟空（T 型纸偶，16 张卡 · 依《孙悟空纸艺角色设定图》改配色与分层）
//
// 设定图给的是「暖纸 + 朱红 + 深褐」这一族：底 #F9D9B4、战袍 #B93D20、深褐 #6D2C15、
// 赭 #C17036 / #DC9A6E、金 #B8934A。原版用的石绿与靛青在设定图里没有，已从主角身上撤掉。
// 版式上把原版挤在 11 张卡的部件拆开：金箍、披膊、鬓毛、腰带、战裙各自成卡 —— 纸的厚度要分层才看得见。
//
// 硬约束（clips() 会逐对检查，站立 + 两个步态周期）：
//   ① 四肢轮廓在正面上不压躯干（手臂内缘 0.49 > 躯干外缘 0.44）；
//   ② 侧面卡整张在正面卡之后（z 更小），绝不穿过；
//   ③ 每张卡 z 唯一；
//   ④ 摆动时的 z 位移不能撞上前一层：腿 −0.16 与战裙 +0.24 隔 0.40，手臂 −0.20 与披膊 +0.14 隔 0.34。
import * as THREE from 'three';
import { makeCard } from 'papercraft/lib/paperkit-3d.js';

// 取自设定图的纸色（同名色在不同部件上深浅不同，是纸本身的不均匀，不是渐变）
const C = {
  paper: '#f3e7cd',
  deep: '#6d2c15',        // 深褐：裤、墨、靴
  ember: '#b93d20',       // 朱红：战袍、袖口
  emberLit: '#cf4423',    // 战袍的正面：纸与阴影会吃掉两成亮度，正面填色要比目标色亮一档
  burnt: '#8c2b22',       // 焦赭：阴影、袖口
  ochre: '#c17036',       // 赭：披膊、护心
  ochreL: '#dc9a6e',      // 浅赭：战裙、靴口
  gold: '#b8934a',        // 金：箍、扣、棒端
  face: '#f0d3ae',        // 脸：比纸底略暖一档，压在同色纸底上仍能看出轮廓
  faceD: '#d9b98c',
  ink: '#2a241c',
};

// 主角总高（与 createHarness 的 heroHeight 一致）
export const HERO_H = 3.6;

/**
 * 拼一只孙悟空，返回 { handle, stride, parts }。
 * handle 是 harness 要的铰链形状：{ group, pivot }。
 * 局部坐标：y 向上（脚底 0、头顶 3.6），面朝 +z。
 */
export function buildWukong(H, { x = 0, z = 3 } = {}) {
  const rig = new THREE.Group();
  rig.name = 'wukong';
  rig.position.set(x, 0, z);

  // 上身挂在 body 上：走起来整体轻微起伏，腿不跟着升（腿挂在 rig 上）
  const body = new THREE.Group();
  body.name = 'wukong-body';
  rig.add(body);

  const card = (name, pts, paint, dz, parent = body, folds = ['bottom']) => {
    const m = makeCard(pts, {
      ...H.cardOpts(x, z), paint, thickness: 0.08, edgeWidth: 0.08, folds,
    });
    m.name = name;
    m.position.z = dz;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ── 躯干（朱红战袍）─────────────────────────────────────────────────────────
  const torsoPts = [[-0.36, 1.06], [0.36, 1.06], [0.44, 2.06], [0.42, 2.44], [-0.42, 2.44], [-0.44, 2.06]];
  card('wukong-torso', torsoPts, (P) => {
    const { g, box } = P;
    P.fill(C.emberLit);
    // 交领：两道墨线从上胸收向腰，留出纸底那一条缝
    g.strokeStyle = C.deep; g.globalAlpha = 0.62; g.lineWidth = 2.6; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.70, box.y0 + box.h * 0.94);
    g.lineTo(box.x0 + box.w * 0.50, box.y0 + box.h * 0.62);
    g.lineTo(box.x0 + box.w * 0.30, box.y0 + box.h * 0.40);
    g.stroke();
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.30, box.y0 + box.h * 0.94);
    g.lineTo(box.x0 + box.w * 0.42, box.y0 + box.h * 0.80);
    g.stroke();
    g.globalAlpha = 1;
    // 护心镜：一枚金缘小圆，落在右胸
    g.fillStyle = C.gold; g.globalAlpha = 0.9;
    g.beginPath();
    g.arc(box.x0 + box.w * 0.66, box.y0 + box.h * 0.48, box.w * 0.09, 0, Math.PI * 2);
    g.fill(); g.globalAlpha = 1;
    g.strokeStyle = C.deep; g.lineWidth = 1.6;
    g.beginPath();
    g.arc(box.x0 + box.w * 0.66, box.y0 + box.h * 0.48, box.w * 0.09, 0, Math.PI * 2);
    g.stroke();
    // 纸面上一层极淡的斜折（设定图的纸是折过的）
    g.strokeStyle = C.deep; g.globalAlpha = 0.14; g.lineWidth = 6;
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.10, box.y1);
    g.lineTo(box.x0 + box.w * 0.55, box.y0);
    g.stroke(); g.globalAlpha = 1;
    P.innerShade(C.burnt, { alpha: 0.3, blurPx: 9 });
  }, 0);

  card('wukong-torso-side', [[-0.24, 1.12], [0.24, 1.12], [0.24, 2.38], [-0.24, 2.38]], (P) => {
    P.fill(C.burnt);
    P.innerShade(C.deep, { alpha: 0.35, blurPx: 9 });
  }, -0.10);

  // ── 头（脸 + 鬓毛 + 金箍）─────────────────────────────────────────────────
  // 头比自然比例大一号：2.44 → 3.32，宽 0.34 半宽，走的是纸偶的卡通比例。
  const headPts = [[-0.32, 2.44], [0.32, 2.44], [0.34, 3.14], [0.18, 3.30], [-0.18, 3.30], [-0.34, 3.14]];
  card('wukong-head', headPts, (P) => {
    const { g, box } = P;
    P.fill(C.face);
    // 腮与下颌的一层暗：脸不是一个平面
    g.fillStyle = C.faceD; g.globalAlpha = 0.42;
    g.beginPath();
    g.ellipse(box.x0 + box.w * 0.5, box.y1 - box.h * 0.14, box.w * 0.36, box.h * 0.15, 0, 0, Math.PI * 2);
    g.fill(); g.globalAlpha = 1;
    // 雷公嘴：朱红的小尖弧 + 一道短中线
    g.strokeStyle = C.burnt; g.lineWidth = 2.6; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.40, box.y1 - box.h * 0.20);
    g.quadraticCurveTo(box.x0 + box.w * 0.50, box.y1 - box.h * 0.12, box.x0 + box.w * 0.60, box.y1 - box.h * 0.20);
    g.stroke();
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.50, box.y1 - box.h * 0.16);
    g.lineTo(box.x0 + box.w * 0.50, box.y1 - box.h * 0.06);
    g.stroke();
    // 眼：墨点 + 朱红眼圈（不画纯白高光）
    g.fillStyle = C.ink;
    for (const fx of [0.34, 0.66]) {
      g.beginPath();
      g.ellipse(box.x0 + box.w * fx, box.y0 + box.h * 0.55, box.w * 0.078, box.h * 0.105, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = C.ember; g.lineWidth = 1.8;
    for (const fx of [0.34, 0.66]) {
      g.beginPath();
      g.ellipse(box.x0 + box.w * fx, box.y0 + box.h * 0.55, box.w * 0.14, box.h * 0.16, 0, 0, Math.PI * 2);
      g.stroke();
    }
    // 眉心一道朱砂竖纹（设定图上是额心那一笔）
    g.strokeStyle = C.ember; g.lineWidth = 2.0;
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.5, box.y0 + box.h * 0.74);
    g.lineTo(box.x0 + box.w * 0.5, box.y0 + box.h * 0.90);
    g.stroke();
    P.innerShade(C.faceD, { alpha: 0.38, blurPx: 8 });
  }, 0.16);

  card('wukong-head-side', [[-0.25, 2.50], [0.25, 2.50], [0.25, 3.10], [-0.25, 3.10]], (P) => {
    P.fill(C.faceD);
    P.innerShade(C.ochreL, { alpha: 0.3, blurPx: 8 });
  }, 0.02);

  // 鬓毛：两片深褐在脸的两侧（设定图的猴脸是「一圈毛 + 一张脸」）
  for (const side of [-1, 1]) {
    card('wukong-ruff-' + (side < 0 ? 'l' : 'r'),
      [[side * 0.30, 2.58], [side * 0.44, 2.66], [side * 0.46, 2.96], [side * 0.32, 3.06]],
      (P) => {
        P.fill(C.deep);
        P.g.fillStyle = C.ochre; P.g.globalAlpha = 0.35;
        P.g.fillRect(P.box.x0, P.box.y1 - P.box.h * 0.14, P.box.w, P.box.h * 0.14);
        P.innerShade(C.burnt, { alpha: 0.4, blurPx: 5 });
      }, 0.06);
  }

  // 金箍：一道金环压在发际；中间一枚朱砂圆章
  card('wukong-crown', [[-0.35, 3.14], [0.35, 3.14], [0.31, 3.30], [-0.31, 3.30]], (P) => {
    const { g, box } = P;
    P.fill(C.gold);
    g.fillStyle = C.ember;
    g.beginPath();
    g.arc(box.x0 + box.w * 0.5, box.y0 + box.h * 0.5, box.h * 0.34, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = C.deep; g.lineWidth = 1.4;
    g.beginPath();
    g.arc(box.x0 + box.w * 0.5, box.y0 + box.h * 0.5, box.h * 0.34, 0, Math.PI * 2);
    g.stroke();
    P.innerShade(C.burnt, { alpha: 0.35, blurPx: 4 });
  }, 0.26, body, ['top', 'bottom']);

  // ── 披膊（两片赭石护肩，压在战袍肩线之上）──────────────────────────────────
  for (const side of [-1, 1]) {
    card('wukong-pauldron-' + (side < 0 ? 'l' : 'r'),
      [[side * 0.24, 2.14], [side * 0.56, 2.22], [side * 0.60, 2.38], [side * 0.26, 2.40]],
      (P) => {
        const { g, box } = P;
        P.fill(C.ochre);
        g.strokeStyle = C.deep; g.lineWidth = 2; g.globalAlpha = 0.55;
        for (let i = 1; i <= 3; i++) {
          g.beginPath();
          g.moveTo(box.x0 + box.w * 0.1, box.y0 + box.h * (0.24 * i));
          g.lineTo(box.x0 + box.w * 0.9, box.y0 + box.h * (0.24 * i));
          g.stroke();
        }
        g.globalAlpha = 1;
        g.fillStyle = C.gold;
        g.beginPath();
        g.arc(box.x0 + box.w * 0.5, box.y1 - box.h * 0.12, box.w * 0.07, 0, Math.PI * 2);
        g.fill();
        P.innerShade(C.deep, { alpha: 0.42, blurPx: 6 });
      }, 0.14);
  }

  // ── 腰带（金线压朱红，前于战裙）────────────────────────────────────────────
  card('wukong-belt', [[-0.40, 1.34], [0.40, 1.34], [0.38, 1.52], [-0.38, 1.52]], (P) => {
    const { g, box } = P;
    P.fill(C.deep);
    g.fillStyle = C.gold;
    g.fillRect(box.x0 + box.w * 0.02, box.y0 + box.h * 0.42, box.w * 0.96, box.h * 0.14);
    g.fillStyle = C.gold;
    g.beginPath();
    g.arc(box.x0 + box.w * 0.5, box.y0 + box.h * 0.49, box.h * 0.20, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = C.ember; g.lineWidth = 1.6;
    g.beginPath();
    g.arc(box.x0 + box.w * 0.5, box.y0 + box.h * 0.49, box.h * 0.20, 0, Math.PI * 2);
    g.stroke();
    P.innerShade(C.ink, { alpha: 0.3, blurPx: 4 });
  }, 0.18);

  // ── 战裙（浅赭，下摆外扩；压在腿上、后于腰带）──────────────────────────────
  card('wukong-skirt', [[-0.34, 0.84], [0.34, 0.84], [0.42, 1.32], [-0.42, 1.32]], (P) => {
    const { g, box } = P;
    P.fill(C.ochreL);
    // 裙褶：五道深褐竖线，越往下越开
    g.strokeStyle = C.deep; g.lineWidth = 1.8; g.globalAlpha = 0.5;
    for (let i = 0; i < 5; i++) {
      const t = 0.14 + i * 0.18;
      g.beginPath();
      g.moveTo(box.x0 + box.w * (0.5 + (t - 0.5) * 0.62), box.y1);
      g.lineTo(box.x0 + box.w * t, box.y0);
      g.stroke();
    }
    g.globalAlpha = 1;
    // 摆边一道朱红细条，把裙和裤分开
    g.fillStyle = C.ember;
    g.fillRect(box.x0, box.y0, box.w, box.h * 0.06);
    P.innerShade(C.burnt, { alpha: 0.34, blurPx: 8 });
  }, 0.24);

  // ── 手臂（肩枢轴；内缘 0.49 > 躯干 0.44，正面永不压住躯干）───────────────────
  const armPts = [[-0.12, -1.16], [0.12, -1.16], [0.13, 0.04], [-0.13, 0.04]];
  const armPaint = (P) => {
    const { g, box } = P;
    P.fill(C.emberLit);
    g.fillStyle = C.deep;                       // 袖口
    g.fillRect(box.x0, box.y0, box.w, box.h * 0.18);
    g.fillStyle = C.gold;                       // 袖口的金线
    g.fillRect(box.x0, box.y0 + box.h * 0.18, box.w, box.h * 0.03);
    g.fillStyle = C.face;                       // 手
    g.beginPath();
    g.ellipse(box.x0 + box.w * 0.5, box.y1 - box.h * 0.05, box.w * 0.44, box.h * 0.07, 0, 0, Math.PI * 2);
    g.fill();
    P.innerShade(C.burnt, { alpha: 0.42, blurPx: 6 });
  };
  const arms = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = 'wukong-shoulder-' + (side < 0 ? 'l' : 'r');
    pivot.position.set(side * 0.62, 2.38, -0.20);
    const m = makeCard(armPts, {
      ...H.cardOpts(x, z), paint: armPaint, thickness: 0.08, edgeWidth: 0.08, folds: ['top'],
    });
    m.name = 'wukong-arm-' + (side < 0 ? 'l' : 'r');
    pivot.add(m);
    body.add(pivot);
    arms.push(pivot);
  }

  // ── 腿（髋枢轴；两腿内缘 0.05 不相碰，z 与战裙隔 0.40）────────────────────────
  const legPts = [[-0.16, -1.04], [0.16, -1.04], [0.18, -0.02], [-0.18, -0.02]];
  const legPaint = (P) => {
    const { g, box } = P;
    P.fill(C.deep);
    g.fillStyle = C.ink;                        // 靴
    g.fillRect(box.x0 - box.w * 0.05, box.y1 - box.h * 0.16, box.w * 1.10, box.h * 0.16);
    g.fillStyle = C.ochreL;                     // 靴口的赭边
    g.fillRect(box.x0 - box.w * 0.05, box.y1 - box.h * 0.18, box.w * 1.10, box.h * 0.025);
    g.strokeStyle = C.burnt; g.lineWidth = 1.6; g.globalAlpha = 0.5;
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.5, box.y0 + box.h * 0.28);
    g.lineTo(box.x0 + box.w * 0.5, box.y1 - box.h * 0.22);
    g.stroke(); g.globalAlpha = 1;
    P.innerShade(C.burnt, { alpha: 0.24, blurPx: 5 });
  };
  const legs = [];
  for (const side of [-1, 1]) {
    const pivot = new THREE.Group();
    pivot.name = 'wukong-hip-' + (side < 0 ? 'l' : 'r');
    pivot.position.set(side * 0.21, 1.04, -0.16);
    const m = makeCard(legPts, {
      ...H.cardOpts(x, z), paint: legPaint, thickness: 0.08, edgeWidth: 0.08, folds: ['top'],
    });
    m.name = 'wukong-leg-' + (side < 0 ? 'l' : 'r');
    pivot.add(m);
    rig.add(pivot);
    legs.push(pivot);
  }

  // ── 金箍棒（斜背在身后，整张在最后）─────────────────────────────────────────
  const staff = new THREE.Group();
  staff.name = 'wukong-staff-holder';
  staff.position.set(0, 1.95, -0.54);
  staff.rotation.z = 0.34;
  const staffCard = makeCard([[-0.06, -1.60], [0.06, -1.60], [0.06, 1.60], [-0.06, 1.60]], {
    ...H.cardOpts(x, z),
    paint: (P) => {
      P.fill(C.deep);
      P.g.fillStyle = C.gold;
      P.g.fillRect(P.box.x0 - P.box.w * 0.10, P.box.y1 - P.box.h * 0.06, P.box.w * 1.20, P.box.h * 0.045);
      P.g.fillRect(P.box.x0 - P.box.w * 0.10, P.box.y0 + P.box.h * 0.015, P.box.w * 1.20, P.box.h * 0.045);
      P.g.strokeStyle = C.burnt; P.g.lineWidth = 2; P.g.globalAlpha = 0.4;
      P.g.beginPath();
      P.g.moveTo(P.box.x0 + P.box.w * 0.5, P.box.y0 + P.box.h * 0.1);
      P.g.lineTo(P.box.x0 + P.box.w * 0.5, P.box.y1 - P.box.h * 0.1);
      P.g.stroke(); P.g.globalAlpha = 1;
    },
    thickness: 0.08, edgeWidth: 0.08, folds: ['top', 'bottom'],
  });
  staffCard.name = 'wukong-staff';
  staff.add(staffCard);
  body.add(staff);

  // ── 步态：步幅按走过的距离算，脚不打滑 ───────────────────────────────────────
  const STEP = HERO_H * 0.58 / 2;
  const LEG = 1.04, ARM = 0.32, MAX_A = 0.42;
  const stride = (walked, gait) => {
    const phase = (walked / STEP) * Math.PI;
    const s = Math.sin(phase), c = Math.cos(phase);
    const A = Math.min(MAX_A, (gait * STEP * 2) / (2 * LEG));
    const legAngle = (ph) => {
      const u = (ph / Math.PI) % 2;
      if (u >= 1) return A * (3 - 2 * u);
      const e = u * u * (3 - 2 * u);
      return A * (2 * e - 1);
    };
    legs[0].rotation.x = legAngle(phase);
    legs[1].rotation.x = legAngle(phase + Math.PI);
    arms[0].rotation.x = -ARM * gait * c;
    arms[1].rotation.x = ARM * gait * c;
    body.position.y = 0.032 * HERO_H * gait * Math.abs(s);
    body.rotation.x = 0.02 * gait * Math.sin(2 * phase - 1.2);
    body.rotation.z = 0.011 * gait * s;
  };

  // harness 的 setHero 收 popup 那样的铰链：{ group, pivot }。
  // pivot 只承接前倾/侧倾，group 才是被搬动的那一层。
  const pivot = new THREE.Group();
  pivot.name = 'wukong-pivot';
  pivot.add(rig);
  return { handle: { group: rig, pivot }, stride, parts: { body, arms, legs, staff } };
}