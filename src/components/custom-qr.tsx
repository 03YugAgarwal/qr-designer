import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, {
  Rect,
  Circle,
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  G,
  Image as SvgImage,
  ClipPath,
} from 'react-native-svg';
import * as QRCodeUtil from 'qrcode';

// --- Shape Types ---

export type BodyShape =
  | 'square' | 'dots' | 'rounded' | 'diamond' | 'classy' | 'star'
  | 'vertical' | 'horizontal' | 'cross' | 'hexagon' | 'triangle';
export type EyeFrameShape = 'square' | 'rounded' | 'circle' | 'leaf';
export type EyeBallShape = 'square' | 'rounded' | 'circle' | 'leaf';

export interface GradientConfig {
  colors: [string, string];
  angle: number; // degrees: 0=top-bottom, 90=left-right, etc.
}

// --- Props ---

export interface CustomQRCodeProps {
  value: string;
  size: number;
  bodyShape?: BodyShape;
  eyeFrameShape?: EyeFrameShape;
  eyeBallShape?: EyeBallShape;
  bodyColor?: string;
  eyeFrameColor?: string;
  eyeBallColor?: string;
  bgColor?: string;
  bgImageUri?: string | null;
  bgImageOpacity?: number;
  bodyGradient?: GradientConfig | null;
  ecl?: 'L' | 'M' | 'Q' | 'H';
  logoUri?: string | null;
  logoSize?: number;
  quietZone?: number;
}

// --- Helpers ---

function generateMatrix(value: string, ecl: string): boolean[][] {
  const qr = QRCodeUtil.create(value, { errorCorrectionLevel: ecl });
  const { size, data } = qr.modules;
  const matrix: boolean[][] = [];
  for (let row = 0; row < size; row++) {
    const r: boolean[] = [];
    for (let col = 0; col < size; col++) {
      r.push(data[row * size + col] === 1);
    }
    matrix.push(r);
  }
  return matrix;
}

function isFinderPattern(row: number, col: number, size: number): boolean {
  // Top-left
  if (row < 7 && col < 7) return true;
  // Top-right
  if (row < 7 && col >= size - 7) return true;
  // Bottom-left
  if (row >= size - 7 && col < 7) return true;
  return false;
}

function angleToCoords(angle: number): { x1: string; y1: string; x2: string; y2: string } {
  const rad = ((angle - 90) * Math.PI) / 180;
  const x1 = 50 - 50 * Math.cos(rad);
  const y1 = 50 - 50 * Math.sin(rad);
  const x2 = 50 + 50 * Math.cos(rad);
  const y2 = 50 + 50 * Math.sin(rad);
  return {
    x1: `${x1}%`, y1: `${y1}%`,
    x2: `${x2}%`, y2: `${y2}%`,
  };
}

// --- Body shape renderers ---

function bodyPath(x: number, y: number, cs: number, shape: BodyShape): string {
  const cx = x + cs / 2;
  const cy = y + cs / 2;
  const m = cs * 0.05; // small margin for separation

  switch (shape) {
    case 'dots': {
      const r = cs * 0.42;
      return `M${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy}Z`;
    }
    case 'rounded': {
      const rr = cs * 0.32;
      return `M${x + m + rr},${y + m} L${x + cs - m - rr},${y + m} Q${x + cs - m},${y + m} ${x + cs - m},${y + m + rr} L${x + cs - m},${y + cs - m - rr} Q${x + cs - m},${y + cs - m} ${x + cs - m - rr},${y + cs - m} L${x + m + rr},${y + cs - m} Q${x + m},${y + cs - m} ${x + m},${y + cs - m - rr} L${x + m},${y + m + rr} Q${x + m},${y + m} ${x + m + rr},${y + m}Z`;
    }
    case 'diamond': {
      return `M${cx},${y + m} L${x + cs - m},${cy} L${cx},${y + cs - m} L${x + m},${cy}Z`;
    }
    case 'classy': {
      const rr = cs * 0.45;
      return `M${x + m},${y + m} L${x + cs - m},${y + m} L${x + cs - m},${y + cs - m} Q${x + m},${y + cs - m} ${x + m},${y + cs - m - rr} Z`;
    }
    case 'star': {
      const r1 = cs * 0.46;
      const r2 = cs * 0.2;
      let d = '';
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? r1 : r2;
        const a = (i * Math.PI) / 4 - Math.PI / 2;
        d += (i === 0 ? 'M' : 'L') + `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }
      return d + 'Z';
    }
    case 'vertical': {
      // Tall thin rounded bar
      const w = cs * 0.55;
      const xL = cx - w / 2;
      const r = w / 2;
      return `M${xL + r},${y + m} L${xL + w - r},${y + m} Q${xL + w},${y + m} ${xL + w},${y + m + r} L${xL + w},${y + cs - m - r} Q${xL + w},${y + cs - m} ${xL + w - r},${y + cs - m} L${xL + r},${y + cs - m} Q${xL},${y + cs - m} ${xL},${y + cs - m - r} L${xL},${y + m + r} Q${xL},${y + m} ${xL + r},${y + m}Z`;
    }
    case 'horizontal': {
      // Wide thin rounded bar
      const h = cs * 0.55;
      const yT = cy - h / 2;
      const r = h / 2;
      return `M${x + m + r},${yT} L${x + cs - m - r},${yT} Q${x + cs - m},${yT} ${x + cs - m},${yT + r} L${x + cs - m},${yT + h - r} Q${x + cs - m},${yT + h} ${x + cs - m - r},${yT + h} L${x + m + r},${yT + h} Q${x + m},${yT + h} ${x + m},${yT + h - r} L${x + m},${yT + r} Q${x + m},${yT} ${x + m + r},${yT}Z`;
    }
    case 'cross': {
      // Plus sign
      const t = cs * 0.32; // arm thickness
      const half = cs / 2;
      const armLen = (cs - t) / 2 - m;
      // Build a plus polygon
      return `M${cx - t / 2},${y + m} L${cx + t / 2},${y + m} L${cx + t / 2},${cy - t / 2} L${x + cs - m},${cy - t / 2} L${x + cs - m},${cy + t / 2} L${cx + t / 2},${cy + t / 2} L${cx + t / 2},${y + cs - m} L${cx - t / 2},${y + cs - m} L${cx - t / 2},${cy + t / 2} L${x + m},${cy + t / 2} L${x + m},${cy - t / 2} L${cx - t / 2},${cy - t / 2}Z`;
    }
    case 'hexagon': {
      const r = cs * 0.46;
      let d = '';
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 2;
        d += (i === 0 ? 'M' : 'L') + `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
      }
      return d + 'Z';
    }
    case 'triangle': {
      const r = cs * 0.5 - m;
      // Equilateral, pointing up
      const top = `${cx},${cy - r}`;
      const bl = `${cx - r * 0.866},${cy + r * 0.5}`;
      const br = `${cx + r * 0.866},${cy + r * 0.5}`;
      return `M${top} L${br} L${bl}Z`;
    }
    case 'square':
    default:
      return `M${x + m},${y + m} L${x + cs - m},${y + m} L${x + cs - m},${y + cs - m} L${x + m},${y + cs - m}Z`;
  }
}

// --- Eye shape renderers ---

function eyeFramePath(x: number, y: number, s: number, shape: EyeFrameShape): { outer: string; inner: string } {
  const t = s / 7; // module thickness
  const ix = x + t;
  const iy = y + t;
  const is = s - t * 2;

  switch (shape) {
    case 'rounded': {
      const rOuter = s * 0.25;
      const rInner = is * 0.18;
      return {
        outer: roundedRect(x, y, s, s, rOuter),
        inner: roundedRect(ix, iy, is, is, rInner),
      };
    }
    case 'circle': {
      const cx = x + s / 2;
      const cy = y + s / 2;
      const rO = s / 2;
      const rI = is / 2;
      return {
        outer: circlePath(cx, cy, rO),
        inner: circlePath(cx, cy, rI),
      };
    }
    case 'leaf': {
      const r = s * 0.4;
      return {
        outer: leafRect(x, y, s, s, r),
        inner: leafRect(ix, iy, is, is, is * 0.3),
      };
    }
    case 'square':
    default:
      return {
        outer: `M${x},${y} L${x + s},${y} L${x + s},${y + s} L${x},${y + s}Z`,
        inner: `M${ix},${iy} L${ix + is},${iy} L${ix + is},${iy + is} L${ix},${iy + is}Z`,
      };
  }
}

function eyeBallPath(x: number, y: number, s: number, shape: EyeBallShape): string {
  const cx = x + s / 2;
  const cy = y + s / 2;

  switch (shape) {
    case 'rounded':
      return roundedRect(x, y, s, s, s * 0.25);
    case 'circle':
      return circlePath(cx, cy, s / 2);
    case 'leaf':
      return leafRect(x, y, s, s, s * 0.4);
    case 'square':
    default:
      return `M${x},${y} L${x + s},${y} L${x + s},${y + s} L${x},${y + s}Z`;
  }
}

function roundedRect(x: number, y: number, w: number, h: number, r: number): string {
  return `M${x + r},${y} L${x + w - r},${y} Q${x + w},${y} ${x + w},${y + r} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x + r},${y + h} Q${x},${y + h} ${x},${y + h - r} L${x},${y + r} Q${x},${y} ${x + r},${y}Z`;
}

function circlePath(cx: number, cy: number, r: number): string {
  return `M${cx + r},${cy} A${r},${r} 0 1,0 ${cx - r},${cy} A${r},${r} 0 1,0 ${cx + r},${cy}Z`;
}

function leafRect(x: number, y: number, w: number, h: number, r: number): string {
  // Rounded on top-left and bottom-right, sharp on top-right and bottom-left
  return `M${x + r},${y} L${x + w},${y} L${x + w},${y + h - r} Q${x + w},${y + h} ${x + w - r},${y + h} L${x},${y + h} L${x},${y + r} Q${x},${y} ${x + r},${y}Z`;
}

// --- Main Component ---

export default function CustomQRCode({
  value,
  size,
  bodyShape = 'square',
  eyeFrameShape = 'square',
  eyeBallShape = 'square',
  bodyColor = '#000000',
  eyeFrameColor,
  eyeBallColor,
  bgColor = '#ffffff',
  bgImageUri = null,
  bgImageOpacity = 0.4,
  bodyGradient = null,
  ecl = 'M',
  logoUri = null,
  logoSize,
  quietZone = 2,
}: CustomQRCodeProps) {
  const efColor = eyeFrameColor || bodyColor;
  const ebColor = eyeBallColor || bodyColor;

  const { matrix, paths, eyeFrames, eyeBalls, svgSize, cellSize } = useMemo(() => {
    const mat = generateMatrix(value, ecl);
    const n = mat.length;
    const totalCells = n + quietZone * 2;
    const cs = size / totalCells;
    const qz = quietZone * cs;

    // Build body path (skip finder patterns)
    let bodyD = '';
    for (let row = 0; row < n; row++) {
      for (let col = 0; col < n; col++) {
        if (!mat[row][col]) continue;
        if (isFinderPattern(row, col, n)) continue;
        bodyD += bodyPath(qz + col * cs, qz + row * cs, cs, bodyShape);
      }
    }

    // Eye positions: [row, col] of top-left corner of 7x7 finder
    const eyePositions = [
      [0, 0],           // top-left
      [0, n - 7],       // top-right
      [n - 7, 0],       // bottom-left
    ];

    const frames: { outer: string; inner: string; x: number; y: number }[] = [];
    const balls: { d: string }[] = [];

    for (const [er, ec] of eyePositions) {
      const ex = qz + ec * cs;
      const ey = qz + er * cs;
      const es = 7 * cs;
      const frame = eyeFramePath(ex, ey, es, eyeFrameShape);
      frames.push({ ...frame, x: ex, y: ey });

      // Eye ball is the inner 3x3, offset by 2 modules
      const bx = ex + 2 * cs;
      const by = ey + 2 * cs;
      const bs = 3 * cs;
      balls.push({ d: eyeBallPath(bx, by, bs, eyeBallShape) });
    }

    return { matrix: mat, paths: bodyD, eyeFrames: frames, eyeBalls: balls, svgSize: size, cellSize: cs };
  }, [value, size, bodyShape, eyeFrameShape, eyeBallShape, ecl, quietZone]);

  const gradCoords = bodyGradient ? angleToCoords(bodyGradient.angle) : null;
  const logoS = logoSize || size * 0.2;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {bodyGradient && gradCoords && (
            <SvgGradient id="bodyGrad" x1={gradCoords.x1} y1={gradCoords.y1} x2={gradCoords.x2} y2={gradCoords.y2}>
              <Stop offset="0%" stopColor={bodyGradient.colors[0]} />
              <Stop offset="100%" stopColor={bodyGradient.colors[1]} />
            </SvgGradient>
          )}
          {logoUri && (
            <ClipPath id="logoClip">
              <Rect
                x={(size - logoS) / 2}
                y={(size - logoS) / 2}
                width={logoS}
                height={logoS}
                rx={logoS * 0.15}
              />
            </ClipPath>
          )}
        </Defs>

        {/* Background */}
        <Rect x={0} y={0} width={size} height={size} fill={bgColor} />

        {/* Background image (optional) */}
        {bgImageUri && (
          <SvgImage
            x={0}
            y={0}
            width={size}
            height={size}
            href={bgImageUri}
            opacity={bgImageOpacity}
            preserveAspectRatio="xMidYMid slice"
          />
        )}

        {/* Body modules */}
        <Path
          d={paths}
          fill={bodyGradient ? 'url(#bodyGrad)' : bodyColor}
        />

        {/* Eye frames (outer - inner cutout) */}
        {eyeFrames.map((ef, i) => (
          <G key={`ef${i}`}>
            <Path d={ef.outer} fill={efColor} />
            <Path d={ef.inner} fill={bgColor} />
          </G>
        ))}

        {/* Eye balls */}
        {eyeBalls.map((eb, i) => (
          <Path key={`eb${i}`} d={eb.d} fill={ebColor} />
        ))}

        {/* Logo */}
        {logoUri && (
          <G>
            {/* White bg behind logo for scannability */}
            <Rect
              x={(size - logoS * 1.15) / 2}
              y={(size - logoS * 1.15) / 2}
              width={logoS * 1.15}
              height={logoS * 1.15}
              rx={logoS * 0.18}
              fill={bgColor}
            />
            <SvgImage
              x={(size - logoS) / 2}
              y={(size - logoS) / 2}
              width={logoS}
              height={logoS}
              href={logoUri}
              clipPath="url(#logoClip)"
            />
          </G>
        )}
      </Svg>
    </View>
  );
}
