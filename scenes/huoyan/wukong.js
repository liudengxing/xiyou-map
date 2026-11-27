// 火焰山纸模 · 主角孙悟空（铰链纸偶，18 张卡）
//
// 这一版照「铰链纸模」的思路重做：四肢不是一根整卡，而是上臂/前臂、大腿/小腿各自成卡，
// 在肩、肘、髋、膝四处各有一根转轴（8 个 Group）。纸的厚度是可见的，弯折处才读得出是纸偶。
// 层序（由后往前）与深度都列在 Z 里：相邻两层至少隔一张卡厚（0.08），clips() 就是查这个。
// 其余照 docs/papercraft-skill/references/mechanisms.md §12「Characters from cards」与
// docs/PAPERCRAFT-CHARACTER-SPEC.md：每部件一正一侧、四肢枢轴在躯干轮廓之外、两腿不互叠。
import * as THREE from 'three';
import { makeCard } from 'papercraft/lib/paperkit-3d.js';

// 配色取自 角色详设/孙悟空铰链纸模设计图.png 的量化主色（暖红褐 + 纸黄，不含蓝绿）
const C = {
  ink: '#2a241c',
  deep: '#56260c',
  ember: '#ae3712',
  emberLit: '#c8401a',
  ochre: '#d18634',
  ochreL: '#f4b96d',
  paperL: '#fbd49b',
  face: '#f3c58c',
  faceD: '#dfa868',
  gold: '#b8934a',
};

export const HERO_H = 3.6;

const T = 0.08;              // 一张卡的厚度
const MZ = 0.004;            // 左右同名卡之间微小的 z 差，保证每张卡 z 唯一

// 深度表：世界 z。数值接近的两张卡，一定是 x 或 y 上不重叠的。
const Z = {
  staff: -0.52,
  forearm: -0.30,
  shin: -0.23,
  arm: -0.20,
  torsoSide: -0.10,
  torso: 0,
  headSide: 0.02,
  head: 0.10,
  pauldron: 0.13,
  skirt: 0.14,
  crown: 0.20,
  belt: 0.24,
};

/**
 * 拼一只铰链版孙悟空，返回 { handle, stride, parts }。
 * 局部坐标：y 向上，脚底 y=0、头顶 3.6，面朝 +z；rig 交给 H.setHero(handle, { stride })。
 */
export function buildWukong(H, { x = 0, z = 3 } = {}) {
  const rig = new THREE.Group();
  rig.name = 'wukong';
  rig.position.set(x, 0, z);

  // 上身挂在 body 上：走起来整体起伏，腿不跟着升
  const body = new THREE.Group();
  body.name = 'wukong-body';
  rig.add(body);

  // Q3：卡面纹理密度。cardOpts(x, z, scale, parent, res) 的 res 是打印倍率
  // （pxPerUnit = 40 × res ÷ scale），1 的卡宽只有 30 px 上下，
  // 一件 0.9 单位的躯干印不满 96 px，印花线画到 2 px 就会被重采样糊掉。
  const CARD_RES = 3.4;   // 40 × 3.4 = 136 px/单位 → 0.84 单位躯干 ≈ 114 px、0.72 单位头 ≈ 98 px
  const opts = () => ({ ...H.cardOpts(x, z, 1, null, CARD_RES), thickness: T, edgeWidth: 0.08 });

  /** 造一张卡；pts 用父级局部坐标，dz 是本层相对父级的深度。 */
  const card = (name, pts, paint, dz, parent = body, folds = ['top']) => {
    const m = makeCard(pts, { ...opts(), paint, folds });
    m.name = name;
    m.position.z = dz;
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ── 躯干：赭黄短打 + 朱砂腰带 ───────────────────────────────────────────
  // 半宽收到 0.42，手臂内缘留在 0.50：正面上手臂永远不压住躯干。
  card('wukong-torso', [[-0.38, 1.12], [0.38, 1.12], [0.42, 2.10], [0.40, 2.46], [-0.40, 2.46], [-0.42, 2.10]],
    (P) => {
      const { g, box } = P;
      P.fill(C.ochre);
      // 斜襟：从右肩压到左腰，一道墨线 + 一道朱线
      g.strokeStyle = C.deep; g.globalAlpha = 0.7; g.lineWidth = 3;
      g.beginPath();
      g.moveTo(box.x0 + box.w * 0.76, box.y0 + box.h * 0.9);
      g.lineTo(box.x0 + box.w * 0.32, box.y0 + box.h * 0.08);
      g.stroke();
      g.strokeStyle = C.ember;
      g.globalAlpha = 0.5; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(box.x0 + box.w * 0.70, box.y0 + box.h * 0.86);
      g.lineTo(box.x0 + box.w * 0.30, box.y0 + box.h * 0.06);
      g.stroke();
      g.globalAlpha = 1;
      // 胸前纸印的云纹：四个短弧，线宽按卡面尺寸给足
      g.strokeStyle = C.ochreL; g.globalAlpha = 0.45; g.lineWidth = 2.4;
      for (let i = 0; i < 3; i++) {
        const yy = box.y0 + box.h * (0.60 - i * 0.13);
        g.beginPath();
        g.arc(box.x0 + box.w * 0.34, yy, box.w * 0.10, Math.PI * 0.15, Math.PI * 0.85);
        g.stroke();
      }
      g.globalAlpha = 1;
      P.innerShade(C.ember, { alpha: 0.30, blurPx: 9 });
    }, Z.torso);

  card('wukong-torso-side', [[-0.26, 1.18], [0.26, 1.18], [0.26, 2.40], [-0.26, 2.40]], (P) => {
    P.fill(C.ochre);
    P.innerShade(C.deep, { alpha: 0.34, blurPx: 8 });
  }, Z.torsoSide);

  // ── 头：脸 + 身后的侧卡 + 金箍 ─────────────────────────────────────────
  card('wukong-head', [[-0.34, 2.46], [0.34, 2.46], [0.36, 3.18], [0.20, 3.34], [-0.20, 3.34], [-0.36, 3.18]],
    (P) => {
      const { g, box } = P;
      P.fill(C.face);
      // 鬓角与下巴：桃心脸的下缘压一道赭
      g.fillStyle = C.faceD; g.globalAlpha = 0.55;
      g.beginPath();
      g.ellipse(box.x0 + box.w * 0.5, box.y1 - box.h * 0.14, box.w * 0.36, box.h * 0.15, 0, 0, Math.PI * 2);
      g.fill(); g.globalAlpha = 1;
      // 雷公嘴：一道朱砂短弧
      g.strokeStyle = C.ember; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath();
      g.moveTo(box.x0 + box.w * 0.41, box.y1 - box.h * 0.19);
      g.quadraticCurveTo(box.x0 + box.w * 0.5, box.y1 - box.h * 0.12, box.x0 + box.w * 0.59, box.y1 - box.h * 0.19);
      g.stroke();
      // 眼：墨点 + 朱砂眼圈
      g.fillStyle = C.deep;
      for (const fx of [0.35, 0.65]) {
        g.beginPath();
        g.ellipse(box.x0 + box.w * fx, box.y0 + box.h * 0.54, box.w * 0.08, box.h * 0.11, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.strokeStyle = C.ember; g.lineWidth = 2;
      for (const fx of [0.35, 0.65]) {
        g.beginPath();
        g.ellipse(box.x0 + box.w * fx, box.y0 + box.h * 0.54, box.w * 0.14, box.h * 0.16, 0, 0, Math.PI * 2);
        g.stroke();
      }
      // 额上的毛尖：三道深褐短笔
      g.strokeStyle = C.deep; g.lineWidth = 2.6;
      for (const fx of [0.38, 0.5, 0.62]) {
        g.beginPath();
        g.moveTo(box.x0 + box.w * fx, box.y0 + box.h * 0.80);
        g.lineTo(box.x0 + box.w * fx, box.y0 + box.h * 0.92);
        g.stroke();
      }
      P.innerShade(C.faceD, { alpha: 0.32, blurPx: 7 });
    }, Z.head);

  card('wukong-head-side', [[-0.26, 2.52], [0.26, 2.52], [0.26, 3.12], [-0.26, 3.12]], (P) => {
    P.fill(C.faceD);
    P.innerShade(C.deep, { alpha: 0.3, blurPx: 7 });
  }, Z.headSide);

  card('wukong-crown', [[-0.37, 3.14], [0.37, 3.14], [0.33, 3.28], [-0.33, 3.28]], (P) => {
    const { g, box } = P;
    P.fill(C.gold);
    g.fillStyle = C.ember;
    g.beginPath();
    g.arc(box.x0 + box.w * 0.5, box.y0 + box.h * 0.5, box.h * 0.36, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = C.deep; g.globalAlpha = 0.55; g.lineWidth = 2;
    g.beginPath();
    g.moveTo(box.x0 + box.w * 0.10, box.y0 + box.h * 0.5);
    g.lineTo(box.x0 + box.w * 0.90, box.y0 + box.h * 0.5);
    g.stroke(); g.globalAlpha = 1;
    P.innerShade(C.deep, { alpha: 0.32, blurPx: 4 });
  }, Z.crown);

  // ── 披膊：肩上的两片纸甲（静态，挂在 body 上）────────────────────────────
  for (const side of [-1, 1]) {
    const s = side < 0 ? 'l' : 'r';
    const pts = side < 0
      ? [[-0.40, 2.10], [-0.74, 2.16], [-0.70, 2.44], [-0.42, 2.46]]
      : [[0.40, 2.10], [0.74, 2.16], [0.70, 2.44], [0.42, 2.46]];
    card('wukong-pauldron-' + s, pts, (P) => {
      const { g, box } = P;
      P.fill(C.ember);
      g.fillStyle = C.emberLit;
      g.fillRect(box.x0, box.y0 + box.h * 0.58, box.w, box.h * 0.42);
      g.strokeStyle = C.gold; g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(box.x0, box.y0 + box.h * 0.56);
      g.lineTo(box.x1, box.y0 + box.h * 0.56);
      g.stroke();
      P.innerShade(C.deep, { alpha: 0.34, blurPx: 5 });
    }, Z.pauldron + side * MZ);
  }

  // ── 腰带与虎皮裙 ──────────────────────────────────────────────────────
  card('wukong-belt', [[-0.44, 1.30], [0.44, 1.30], [0.44, 1.44], [-0.44, 1.44]], (P) => {
    const { g, box } = P;
    P.fill(C.ember);
    g.fillStyle = C.gold;
    for (let i = 0; i < 3; i++) {
      g.beginPath();
      g.arc(box.x0 + box.w * (0.25 + i * 0.25), box.y0 + box.h * 0.5, box.h * 0.22, 0, Math.PI * 2);
      g.fill();
    }
    P.innerShade(C.deep, { alpha: 0.3, blurPx: 4 });
  }, Z.belt);

  card('wukong-skirt', [[-0.36, 1.02], [0.36, 1.02], [0.40, 1.42], [-0.40, 1.42]], (P) => {
    const { g, box } = P;
    P.fill(C.ochreL);
    // 虎纹：五道粗笔，从下缘往上收
    g.strokeStyle = C.deep; g.lineWidth = 3.2; g.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const fx = box.x0 + box.w * (0.14 + i * 0.18);
      g.beginPath();
      g.moveTo(fx, box.y0 + box.h * 0.12);
      g.quadraticCurveTo(fx + box.w * 0.05, box.y0 + box.h * 0.5, fx, box.y0 + box.h * 0.9);
      g.stroke();
    }
    P.innerShade(C.ember, { alpha: 0.26, blurPx: 6 });
  }, Z.skirt, body, ['bottom']);

  // ── 四肢：肩→肘、髋→膝 两级铰链 ────────────────────────────────────────
  const ARM_W = 0.12, UPPER = 0.60, FORE = 0.58;
  const arms = [], elbows = [];
  for (const side of [-1, 1]) {
    const s = side < 0 ? 'l' : 'r';
    const shoulder = new THREE.Group();
    shoulder.name = 'wukong-shoulder-' + s;
    shoulder.position.set(side * 0.62, 2.40, Z.arm + side * MZ);
    body.add(shoulder);

    card('wukong-arm-' + s, [[-ARM_W, 0.04], [ARM_W, 0.04], [ARM_W, -UPPER], [-ARM_W, -UPPER]], (P) => {
      const { g, box } = P;
      P.fill(C.ochre);
      g.fillStyle = C.emberLit;                       // 上臂的袖甲
      g.fillRect(box.x0, box.y0 + box.h * 0.52, box.w, box.h * 0.48);
      g.strokeStyle = C.gold; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(box.x0, box.y0 + box.h * 0.5);
      g.lineTo(box.x1, box.y0 + box.h * 0.5);
      g.stroke();
      P.innerShade(C.deep, { alpha: 0.32, blurPx: 5 });
    }, 0, shoulder, ['top']);

    const elbow = new THREE.Group();
    elbow.name = 'wukong-elbow-' + s;
    elbow.position.set(0, -UPPER, -(T + 0.02));      // 前臂退后一层，弯折时不与前臂(上臂)互穿
    shoulder.add(elbow);

    card('wukong-forearm-' + s, [[-0.11, 0.02], [0.11, 0.02], [0.11, -FORE], [-0.11, -FORE]], (P) => {
      const { g, box } = P;
      P.fill(C.ochre);
      g.fillStyle = C.ember;                          // 护腕
      g.fillRect(box.x0, box.y0 + box.h * 0.62, box.w, box.h * 0.38);
      g.fillStyle = C.paperL;                         // 手
      g.beginPath();
      g.ellipse(box.x0 + box.w * 0.5, box.y1 - box.h * 0.07, box.w * 0.46, box.h * 0.08, 0, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = C.deep; g.lineWidth = 2;
      g.beginPath();
      g.moveTo(box.x0 + box.w * 0.3, box.y1 - box.h * 0.05);
      g.lineTo(box.x0 + box.w * 0.5, box.y1 - box.h * 0.02);
      g.lineTo(box.x0 + box.w * 0.7, box.y1 - box.h * 0.05);
      g.stroke();
      P.innerShade(C.deep, { alpha: 0.28, blurPx: 5 });
    }, 0, elbow, ['top']);

    arms.push(shoulder); elbows.push(elbow);
  }

  const THIGH = 0.54, SHIN = 0.56;
  const legs = [], knees = [];
  for (const side of [-1, 1]) {
    const s = side < 0 ? 'l' : 'r';
    const hip = new THREE.Group();
    hip.name = 'wukong-hip-' + s;
    hip.position.set(side * 0.20, 1.08, -0.13 + side * MZ);   // 1.08 = 脚底正落在 y=0，不悬空也不入地
    rig.add(hip);

    card('wukong-thigh-' + s, [[-0.17, -0.02], [0.17, -0.02], [0.17, -THIGH], [-0.17, -THIGH]], (P) => {
      const { g, box } = P;
      P.fill(C.deep);
      g.fillStyle = C.ochreL;                          // 裤上的赭黄条纹
      g.fillRect(box.x0, box.y0 + box.h * 0.66, box.w, box.h * 0.12);
      P.innerShade(C.ink, { alpha: 0.3, blurPx: 5 });
    }, 0, hip, ['top']);

    const knee = new THREE.Group();
    knee.name = 'wukong-knee-' + s;
    knee.position.set(0, -THIGH, -(T + 0.02));
    hip.add(knee);

    card('wukong-shin-' + s, [[-0.17, 0.02], [0.17, 0.02], [0.17, -SHIN], [-0.17, -SHIN]], (P) => {
      const { g, box } = P;
      P.fill(C.ink);
      g.fillStyle = C.deep;                            // 靴筒
      g.fillRect(box.x0, box.y0, box.w, box.h * 0.42);
      g.fillStyle = C.ember;                           // 靴口的朱边
      g.fillRect(box.x0, box.y0 + box.h * 0.38, box.w, box.h * 0.06);
      g.strokeStyle = C.gold; g.lineWidth = 2;         // 云头
      g.beginPath();
      g.arc(box.x0 + box.w * 0.5, box.y1 - box.h * 0.02, box.w * 0.34, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
      P.innerShade(C.ink, { alpha: 0.2, blurPx: 4 });
    }, 0, knee, ['top']);

    legs.push(hip); knees.push(knee);
  }

  // ── 金箍棒：斜背身后，整张在最后 ──────────────────────────────────────
  const staff = new THREE.Group();
  staff.name = 'wukong-staff-holder';
  staff.position.set(0, 1.95, Z.staff);
  staff.rotation.z = 0.34;
  const staffCard = makeCard([[-0.07, -1.62], [0.07, -1.62], [0.07, 1.62], [-0.07, 1.62]], {
    ...opts(),
    folds: ['top', 'bottom'],
    paint: (P) => {
      const { g, box } = P;
      P.fill(C.deep);
      g.fillStyle = C.gold;
      g.fillRect(box.x0 - box.w * 0.1, box.y1 - box.h * 0.07, box.w * 1.2, box.h * 0.055);
      g.fillRect(box.x0 - box.w * 0.1, box.y0 + box.h * 0.015, box.w * 1.2, box.h * 0.055);
      g.strokeStyle = C.ember; g.lineWidth = 2.2;
      g.beginPath();
      g.moveTo(box.x0 + box.w * 0.5, box.y0 + box.h * 0.12);
      g.lineTo(box.x0 + box.w * 0.5, box.y1 - box.h * 0.12);
      g.stroke();
    },
  });
  staffCard.name = 'wukong-staff';
  staff.add(staffCard);
  body.add(staff);

  // ── 步态 ──────────────────────────────────────────────────────────────
  // 步幅按走过的距离算（脚不打滑）：一个周期 = 两步，支撑相线性、摆动相 smoothstep。
  const STEP = HERO_H * 0.58 / 2;
  const LEG = 1.10, ARM = 0.32;
  const stride = (walked, gait) => {
    const phase = (walked / STEP) * Math.PI;
    const s = Math.sin(phase), c = Math.cos(phase);
    const A = Math.min(0.48, (gait * STEP * 2) / (2 * LEG));
    const swing = (ph) => {
      const u = (ph / Math.PI) % 2;
      if (u >= 1) return A * (3 - 2 * u);              // 支撑相：脚钉在地上
      const e = u * u * (3 - 2 * u);
      return A * (2 * e - 1);
    };
    for (let i = 0; i < 2; i++) {
      const ph = phase + i * Math.PI;
      legs[i].rotation.x = swing(ph);
      // 膝只在腿往回收的那半程屈（正角 = 小腿向后折）
      knees[i].rotation.x = 0.55 * gait * Math.max(0, -Math.sin(ph));
      const armRot = -ARM * gait * (i === 0 ? c : -c);
      arms[i].rotation.x = armRot;
      // 肘只向前屈：手臂朝前摆时带一点折
      elbows[i].rotation.x = -0.10 + Math.min(0, armRot) * 1.5;   // 常留一点屈，纸偶才不像木棍
    }
    body.position.y = 0.033 * HERO_H * gait * Math.abs(s);
    body.rotation.x = 0.02 * gait * Math.sin(2 * phase - 1.2);
    body.rotation.z = 0.012 * gait * s;
  };

  // harness 的 setHero 收「铰链句柄」：pivot 承接前倾/侧倾，group 是被搬动的那一层
  const pivot = new THREE.Group();
  pivot.name = 'wukong-pivot';
  pivot.add(rig);
  return {
    handle: { group: rig, pivot },
    stride,
    parts: { body, arms, elbows, legs, knees, staff },
  };
}
