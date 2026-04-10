import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import CustomQRCode, { type BodyShape, type EyeFrameShape, type EyeBallShape } from '@/components/custom-qr';
import { BUILTIN_LOGOS, BrandIcon, LogoOverlay, getLogoById } from '@/components/builtin-logos';
import { useQRDesign } from '@/context/qr-design-context';
import { DS } from '@/constants/theme';

type TabKey = 'colors' | 'body' | 'eyes' | 'logo';

const TABS: { key: TabKey; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'colors', label: 'Colors', icon: 'palette' },
  { key: 'body', label: 'Body', icon: 'category' },
  { key: 'eyes', label: 'Eyes', icon: 'visibility' },
  { key: 'logo', label: 'Logo', icon: 'add-photo-alternate' },
];

const BODY_COLORS = ['#0c0e10', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#00daf3', '#bbc3ff', '#ffffff'];
const BG_COLORS = ['#ffffff', '#f5f5f5', '#fdf6e3', '#121416', '#1a1c1e', '#0c0e10', '#282a2c', '#37393b', '#000000'];
const EYE_COLORS = ['#0c0e10', '#2243ea', '#00daf3', '#642de6', '#e94560', '#ff6b35', '#00c853', '#ffffff', '#bbc3ff'];
const GRADIENT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const BODY_SHAPES: { id: BodyShape; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'dots', label: 'Dots' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'diamond', label: 'Diamond' },
  { id: 'classy', label: 'Classy' },
  { id: 'star', label: 'Star' },
  { id: 'vertical', label: 'Vertical' },
  { id: 'horizontal', label: 'Horizontal' },
  { id: 'cross', label: 'Cross' },
  { id: 'hexagon', label: 'Hexagon' },
  { id: 'triangle', label: 'Triangle' },
];

const EYE_FRAME_SHAPES: { id: EyeFrameShape; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
  { id: 'leaf', label: 'Leaf' },
];

const EYE_BALL_SHAPES: { id: EyeBallShape; label: string }[] = [
  { id: 'square', label: 'Square' },
  { id: 'rounded', label: 'Rounded' },
  { id: 'circle', label: 'Circle' },
  { id: 'leaf', label: 'Leaf' },
];

// --- Mini shape previews for body picker ---
function BodyShapePreview({ shape, active }: { shape: BodyShape; active: boolean }) {
  const color = active ? DS.primary : DS.onSurfaceVariant;
  const s = 36;
  const cs = 8;
  const gap = 2;
  // 3x3 grid of shapes
  const cells: React.ReactNode[] = [];
  const pattern = [1,0,1, 1,1,0, 0,1,1]; // which cells to fill
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (!pattern[r * 3 + c]) continue;
      const x = c * (cs + gap) + 3;
      const y = r * (cs + gap) + 3;
      const cx = x + cs / 2;
      const cy = y + cs / 2;
      switch (shape) {
        case 'dots':
          cells.push(<Circle key={`${r}${c}`} cx={cx} cy={cy} r={cs * 0.42} fill={color} opacity={0.7} />);
          break;
        case 'rounded':
          cells.push(<Rect key={`${r}${c}`} x={x} y={y} width={cs} height={cs} rx={cs * 0.3} fill={color} opacity={0.7} />);
          break;
        case 'diamond':
          cells.push(<Path key={`${r}${c}`} d={`M${cx},${y} L${x + cs},${cy} L${cx},${y + cs} L${x},${cy}Z`} fill={color} opacity={0.7} />);
          break;
        case 'classy':
          cells.push(<Path key={`${r}${c}`} d={`M${x},${y} L${x + cs},${y} L${x + cs},${y + cs} Q${x},${y + cs} ${x},${y + cs * 0.5}Z`} fill={color} opacity={0.7} />);
          break;
        case 'star': {
          const r1 = cs * 0.46, r2 = cs * 0.2;
          let d = '';
          for (let i = 0; i < 8; i++) {
            const rd = i % 2 === 0 ? r1 : r2;
            const a = (i * Math.PI) / 4 - Math.PI / 2;
            d += (i === 0 ? 'M' : 'L') + `${cx + rd * Math.cos(a)},${cy + rd * Math.sin(a)}`;
          }
          cells.push(<Path key={`${r}${c}`} d={d + 'Z'} fill={color} opacity={0.7} />);
          break;
        }
        case 'vertical': {
          const w = cs * 0.55;
          cells.push(<Rect key={`${r}${c}`} x={cx - w / 2} y={y} width={w} height={cs} rx={w / 2} fill={color} opacity={0.7} />);
          break;
        }
        case 'horizontal': {
          const h = cs * 0.55;
          cells.push(<Rect key={`${r}${c}`} x={x} y={cy - h / 2} width={cs} height={h} rx={h / 2} fill={color} opacity={0.7} />);
          break;
        }
        case 'cross': {
          const t = cs * 0.32;
          const d = `M${cx - t / 2},${y} L${cx + t / 2},${y} L${cx + t / 2},${cy - t / 2} L${x + cs},${cy - t / 2} L${x + cs},${cy + t / 2} L${cx + t / 2},${cy + t / 2} L${cx + t / 2},${y + cs} L${cx - t / 2},${y + cs} L${cx - t / 2},${cy + t / 2} L${x},${cy + t / 2} L${x},${cy - t / 2} L${cx - t / 2},${cy - t / 2}Z`;
          cells.push(<Path key={`${r}${c}`} d={d} fill={color} opacity={0.7} />);
          break;
        }
        case 'hexagon': {
          const rd = cs * 0.46;
          let d = '';
          for (let i = 0; i < 6; i++) {
            const a = (i * Math.PI) / 3 - Math.PI / 2;
            d += (i === 0 ? 'M' : 'L') + `${cx + rd * Math.cos(a)},${cy + rd * Math.sin(a)}`;
          }
          cells.push(<Path key={`${r}${c}`} d={d + 'Z'} fill={color} opacity={0.7} />);
          break;
        }
        case 'triangle': {
          const rd = cs * 0.5;
          cells.push(<Path key={`${r}${c}`} d={`M${cx},${cy - rd} L${cx + rd * 0.866},${cy + rd * 0.5} L${cx - rd * 0.866},${cy + rd * 0.5}Z`} fill={color} opacity={0.7} />);
          break;
        }
        default:
          cells.push(<Rect key={`${r}${c}`} x={x} y={y} width={cs} height={cs} fill={color} opacity={0.7} />);
      }
    }
  }
  return <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>{cells}</Svg>;
}

// --- Mini eye frame preview ---
function EyeFramePreview({ shape, active }: { shape: EyeFrameShape; active: boolean }) {
  const color = active ? DS.primary : DS.onSurfaceVariant;
  const s = 32;
  const t = 3;
  switch (shape) {
    case 'rounded':
      return (
        <Svg width={s} height={s}><Rect x={1} y={1} width={s - 2} height={s - 2} rx={8} stroke={color} strokeWidth={t} fill="none" opacity={0.8} /></Svg>
      );
    case 'circle':
      return (
        <Svg width={s} height={s}><Circle cx={s / 2} cy={s / 2} r={s / 2 - 2} stroke={color} strokeWidth={t} fill="none" opacity={0.8} /></Svg>
      );
    case 'leaf':
      return (
        <Svg width={s} height={s}><Path d={`M${s * 0.35},${1} L${s - 1},${1} L${s - 1},${s * 0.65} Q${s - 1},${s - 1} ${s * 0.65},${s - 1} L${1},${s - 1} L${1},${s * 0.35} Q${1},${1} ${s * 0.35},${1}Z`} stroke={color} strokeWidth={t} fill="none" opacity={0.8} /></Svg>
      );
    default:
      return (
        <Svg width={s} height={s}><Rect x={1} y={1} width={s - 2} height={s - 2} stroke={color} strokeWidth={t} fill="none" opacity={0.8} /></Svg>
      );
  }
}

// --- Mini eye ball preview ---
function EyeBallPreview({ shape, active }: { shape: EyeBallShape; active: boolean }) {
  const color = active ? DS.primary : DS.onSurfaceVariant;
  const s = 32;
  const m = 6;
  switch (shape) {
    case 'rounded':
      return <Svg width={s} height={s}><Rect x={m} y={m} width={s - m * 2} height={s - m * 2} rx={5} fill={color} opacity={0.8} /></Svg>;
    case 'circle':
      return <Svg width={s} height={s}><Circle cx={s / 2} cy={s / 2} r={(s - m * 2) / 2} fill={color} opacity={0.8} /></Svg>;
    case 'leaf':
      return (
        <Svg width={s} height={s}><Path d={`M${m + 6},${m} L${s - m},${m} L${s - m},${s - m - 6} Q${s - m},${s - m} ${s - m - 6},${s - m} L${m},${s - m} L${m},${m + 6} Q${m},${m} ${m + 6},${m}Z`} fill={color} opacity={0.8} /></Svg>
      );
    default:
      return <Svg width={s} height={s}><Rect x={m} y={m} width={s - m * 2} height={s - m * 2} fill={color} opacity={0.8} /></Svg>;
  }
}

// === MAIN COMPONENT ===

export default function StudioScreen() {
  const ctx = useQRDesign();
  const [activeTab, setActiveTab] = useState<TabKey>('colors');
  const screenWidth = Dimensions.get('window').width;
  const qrSize = Math.min(screenWidth - 160, 180);
  const qrValue = ctx.getQRValue();

  const pickLogo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      ctx.setLogoUri(result.assets[0].uri);
      // Clear built-in selection when uploading custom
      if (ctx.builtInLogoId) ctx.setBuiltInLogoId(null);
    }
  }, [ctx.setLogoUri, ctx.builtInLogoId, ctx.setBuiltInLogoId]);

  const pickBgImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      ctx.setBgImageUri(result.assets[0].uri);
    }
  }, [ctx.setBgImageUri]);

  const toggleGradient = useCallback((on: boolean) => {
    if (on) {
      ctx.setBodyGradient({ colors: [ctx.bodyColor, DS.secondaryFixedDim], angle: 135 });
    } else {
      ctx.setBodyGradient(null);
    }
  }, [ctx.bodyColor, ctx.setBodyGradient]);

  const setGradColor = useCallback((idx: 0 | 1, color: string) => {
    if (!ctx.bodyGradient) return;
    const colors: [string, string] = [...ctx.bodyGradient.colors];
    colors[idx] = color;
    ctx.setBodyGradient({ ...ctx.bodyGradient, colors });
  }, [ctx.bodyGradient, ctx.setBodyGradient]);

  const setGradAngle = useCallback((angle: number) => {
    if (!ctx.bodyGradient) return;
    ctx.setBodyGradient({ ...ctx.bodyGradient, angle });
  }, [ctx.bodyGradient, ctx.setBodyGradient]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Compact QR Preview */}
      <View style={styles.previewCard}>
        <View style={styles.glassPanel}>
          <View style={[styles.qrCanvas, { backgroundColor: ctx.bgColor }]}>
            <View style={{ width: qrSize, height: qrSize }}>
              <CustomQRCode
                value={qrValue}
                size={qrSize}
                bodyShape={ctx.bodyShape}
                eyeFrameShape={ctx.eyeFrameShape}
                eyeBallShape={ctx.eyeBallShape}
                bodyColor={ctx.bodyColor}
                eyeFrameColor={ctx.eyeFrameColor}
                eyeBallColor={ctx.eyeBallColor}
                bgColor={ctx.bgColor}
                bgImageUri={ctx.bgImageUri}
                bgImageOpacity={ctx.bgImageOpacity}
                bodyGradient={ctx.bodyGradient}
                ecl={ctx.bgImageUri || ctx.logoUri || ctx.builtInLogoId ? 'H' : 'M'}
                logoUri={ctx.logoUri}
                logoSize={qrSize * 0.22}
              />
              <LogoOverlay
                logoId={ctx.builtInLogoId}
                centerText={ctx.centerText}
                textColor={ctx.bodyColor}
                qrSize={qrSize}
                bgColor={ctx.bgColor}
              />
            </View>
            {ctx.captionText.trim().length > 0 && (
              <Text style={[styles.previewCaption, { color: ctx.bodyColor }]} numberOfLines={2}>
                {ctx.captionText}
              </Text>
            )}
          </View>
        </View>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>Live Preview</Text>
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}>
            <MaterialIcons name={tab.icon} size={18} color={activeTab === tab.key ? DS.primary : DS.onSurfaceVariant} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{tab.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* === COLORS TAB === */}
      {activeTab === 'colors' && (
        <View style={styles.tabSection}>
          <ColorPicker icon="grid-view" title="Body Color" colors={BODY_COLORS} selected={ctx.bodyColor} onSelect={ctx.setBodyColor} />
          <ColorPicker icon="center-focus-strong" title="Eye Frame Color" colors={EYE_COLORS} selected={ctx.eyeFrameColor} onSelect={ctx.setEyeFrameColor} />
          <ColorPicker icon="lens" title="Eye Ball Color" colors={EYE_COLORS} selected={ctx.eyeBallColor} onSelect={ctx.setEyeBallColor} />
          <ColorPicker icon="wallpaper" title="Background" colors={BG_COLORS} selected={ctx.bgColor} onSelect={ctx.setBgColor} />

          {/* Quick: match all colors button */}
          <Pressable
            style={styles.matchColorsBtn}
            onPress={() => {
              ctx.setEyeFrameColor(ctx.bodyColor);
              ctx.setEyeBallColor(ctx.bodyColor);
            }}>
            <MaterialIcons name="color-lens" size={16} color={DS.secondary} />
            <Text style={styles.matchColorsText}>Match Eyes to Body Color</Text>
          </Pressable>

          {/* Background Image Picker */}
          <View style={styles.gradientSection}>
            <View style={styles.gradientHeader}>
              <MaterialIcons name="image" size={18} color={DS.onSurface} />
              <Text style={styles.gradientTitle}>Background Image</Text>
              {ctx.bgImageUri && (
                <Pressable onPress={() => ctx.setBgImageUri(null)} hitSlop={8}>
                  <MaterialIcons name="close" size={20} color={DS.error} />
                </Pressable>
              )}
            </View>
            {ctx.bgImageUri ? (
              <>
                <Image source={{ uri: ctx.bgImageUri }} style={styles.bgImagePreview} />
                <View style={styles.bgImageActions}>
                  <Pressable style={styles.bgImageBtn} onPress={pickBgImage}>
                    <MaterialIcons name="swap-horiz" size={18} color={DS.primary} />
                    <Text style={styles.bgImageBtnText}>Change</Text>
                  </Pressable>
                </View>
                <Text style={styles.gradientLabel}>Image Opacity</Text>
                <View style={styles.angleRow}>
                  {[0.2, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0].map((op) => (
                    <Pressable key={op} onPress={() => ctx.setBgImageOpacity(op)}
                      style={[styles.anglePill, Math.abs(ctx.bgImageOpacity - op) < 0.01 && styles.anglePillActive]}>
                      <Text style={[styles.angleText, Math.abs(ctx.bgImageOpacity - op) < 0.01 && styles.angleTextActive]}>
                        {Math.round(op * 100)}%
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <Text style={styles.bgImageHint}>
                  Lower opacity keeps the QR code scannable. Use high contrast body color for best results.
                </Text>
              </>
            ) : (
              <Pressable style={styles.bgImageUploadBtn} onPress={pickBgImage}>
                <MaterialIcons name="add-photo-alternate" size={24} color={DS.secondary} />
                <Text style={styles.bgImageUploadText}>Pick Background Image</Text>
              </Pressable>
            )}
          </View>

          {/* Gradient Toggle */}
          <View style={styles.gradientSection}>
            <View style={styles.gradientHeader}>
              <MaterialIcons name="gradient" size={18} color={DS.onSurface} />
              <Text style={styles.gradientTitle}>Body Gradient</Text>
              <Switch
                value={ctx.bodyGradient !== null}
                onValueChange={toggleGradient}
                trackColor={{ false: DS.surfaceContainerHighest, true: DS.primaryContainer }}
                thumbColor={ctx.bodyGradient ? DS.primary : DS.onSurfaceVariant}
              />
            </View>
            {ctx.bodyGradient && (
              <>
                <View style={styles.gradientColors}>
                  <View style={styles.gradientColorCol}>
                    <Text style={styles.gradientLabel}>Start</Text>
                    <View style={styles.swatchRow}>
                      {BODY_COLORS.map((c) => (
                        <Pressable key={c} onPress={() => setGradColor(0, c)}
                          style={[styles.swatchSm, { backgroundColor: c }, ctx.bodyGradient?.colors[0] === c && styles.swatchActive]} />
                      ))}
                    </View>
                  </View>
                  <View style={styles.gradientColorCol}>
                    <Text style={styles.gradientLabel}>End</Text>
                    <View style={styles.swatchRow}>
                      {BODY_COLORS.map((c) => (
                        <Pressable key={c} onPress={() => setGradColor(1, c)}
                          style={[styles.swatchSm, { backgroundColor: c }, ctx.bodyGradient?.colors[1] === c && styles.swatchActive]} />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.gradientLabel}>Direction</Text>
                <View style={styles.angleRow}>
                  {GRADIENT_ANGLES.map((a) => (
                    <Pressable key={a} onPress={() => setGradAngle(a)}
                      style={[styles.anglePill, ctx.bodyGradient?.angle === a && styles.anglePillActive]}>
                      <Text style={[styles.angleText, ctx.bodyGradient?.angle === a && styles.angleTextActive]}>{a}°</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      )}

      {/* === BODY SHAPES TAB === */}
      {activeTab === 'body' && (
        <View style={styles.tabSection}>
          <Text style={styles.sectionTitle}>Body Shape</Text>
          <View style={styles.shapeGrid}>
            {BODY_SHAPES.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.shapeCard, ctx.bodyShape === s.id && styles.shapeCardActive]}
                onPress={() => ctx.setBodyShape(s.id)}>
                <BodyShapePreview shape={s.id} active={ctx.bodyShape === s.id} />
                <Text style={[styles.shapeName, ctx.bodyShape === s.id && { color: DS.primary }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* === EYES TAB === */}
      {activeTab === 'eyes' && (
        <View style={styles.tabSection}>
          {/* Eye Frame Shape */}
          <Text style={styles.sectionTitle}>Eye Frame Shape</Text>
          <View style={styles.shapeGrid}>
            {EYE_FRAME_SHAPES.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.shapeCard, ctx.eyeFrameShape === s.id && styles.shapeCardActive]}
                onPress={() => ctx.setEyeFrameShape(s.id)}>
                <EyeFramePreview shape={s.id} active={ctx.eyeFrameShape === s.id} />
                <Text style={[styles.shapeName, ctx.eyeFrameShape === s.id && { color: DS.primary }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Eye Ball Shape */}
          <Text style={styles.sectionTitle}>Eye Ball Shape</Text>
          <View style={styles.shapeGrid}>
            {EYE_BALL_SHAPES.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.shapeCard, ctx.eyeBallShape === s.id && styles.shapeCardActive]}
                onPress={() => ctx.setEyeBallShape(s.id)}>
                <EyeBallPreview shape={s.id} active={ctx.eyeBallShape === s.id} />
                <Text style={[styles.shapeName, ctx.eyeBallShape === s.id && { color: DS.primary }]}>{s.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Eye Colors */}
          <ColorPicker icon="center-focus-strong" title="Eye Frame Color" colors={EYE_COLORS} selected={ctx.eyeFrameColor} onSelect={ctx.setEyeFrameColor} />
          <ColorPicker icon="lens" title="Eye Ball Color" colors={EYE_COLORS} selected={ctx.eyeBallColor} onSelect={ctx.setEyeBallColor} />
        </View>
      )}

      {/* === LOGO TAB === */}
      {activeTab === 'logo' && (
        <View style={styles.tabSection}>
          {/* --- Built-in Brand Logos --- */}
          <Text style={styles.sectionTitle}>Built-in Logos</Text>
          <View style={styles.logoGrid}>
            {/* "None" tile */}
            <Pressable
              style={[styles.logoTile, !ctx.builtInLogoId && styles.logoTileActive]}
              onPress={() => ctx.setBuiltInLogoId(null)}>
              <View style={styles.logoTileBox}>
                <MaterialIcons name="block" size={22} color={DS.onSurfaceVariant} />
              </View>
              <Text style={styles.logoTileLabel}>None</Text>
            </Pressable>

            {BUILTIN_LOGOS.map((logo) => {
              const active = ctx.builtInLogoId === logo.id;
              return (
                <Pressable
                  key={logo.id}
                  style={[styles.logoTile, active && styles.logoTileActive]}
                  onPress={() => {
                    ctx.setBuiltInLogoId(logo.id);
                    // Selecting a built-in logo clears any uploaded one
                    if (ctx.logoUri) ctx.setLogoUri(null);
                  }}>
                  <View style={styles.logoTileBox}>
                    <BrandIcon logo={logo} size={26} />
                  </View>
                  <Text style={styles.logoTileLabel} numberOfLines={1}>{logo.name}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* --- Upload Custom Logo --- */}
          <Text style={styles.sectionTitle}>Upload Custom</Text>
          {ctx.logoUri ? (
            <View style={styles.logoSection}>
              <Image source={{ uri: ctx.logoUri }} style={styles.logoPreview} />
              <View style={styles.logoActions}>
                <Pressable style={styles.logoBtn} onPress={pickLogo}>
                  <MaterialIcons name="swap-horiz" size={20} color={DS.primary} />
                  <Text style={[styles.logoBtnText, { color: DS.primary }]}>Change</Text>
                </Pressable>
                <Pressable style={[styles.logoBtn, { backgroundColor: `${DS.errorContainer}44` }]} onPress={() => ctx.setLogoUri(null)}>
                  <MaterialIcons name="delete-outline" size={20} color={DS.error} />
                  <Text style={[styles.logoBtnText, { color: DS.error }]}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.uploadCustomBtn} onPress={pickLogo}>
              <MaterialIcons name="cloud-upload" size={22} color={DS.secondary} />
              <Text style={styles.uploadCustomText}>Pick Image from Gallery</Text>
            </Pressable>
          )}

          <Text style={styles.hintText}>
            Logo is centered on the QR code. Error correction is bumped to High to keep the code scannable.
          </Text>

          {/* --- Center Text --- */}
          <Text style={styles.sectionTitle}>Center Text</Text>
          <Text style={styles.subLabel}>
            Show a short label in the center instead of a logo (max 6 characters).
          </Text>
          <View style={styles.textInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. SALE, 2024"
              placeholderTextColor={DS.outline}
              value={ctx.centerText}
              onChangeText={(t) => {
                ctx.setCenterText(t.slice(0, 6));
                // Picking center text clears logos for clarity
                if (t.length > 0) {
                  if (ctx.builtInLogoId) ctx.setBuiltInLogoId(null);
                  if (ctx.logoUri) ctx.setLogoUri(null);
                }
              }}
              maxLength={6}
              autoCapitalize="characters"
            />
            {ctx.centerText.length > 0 && (
              <Pressable onPress={() => ctx.setCenterText('')} style={styles.textClearBtn}>
                <MaterialIcons name="close" size={18} color={DS.onSurfaceVariant} />
              </Pressable>
            )}
          </View>

          {/* --- Caption (below QR) --- */}
          <Text style={styles.sectionTitle}>Caption Below QR</Text>
          <Text style={styles.subLabel}>
            Add a tagline or description that appears below the QR code in exports.
          </Text>
          <View style={styles.textInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Scan me!"
              placeholderTextColor={DS.outline}
              value={ctx.captionText}
              onChangeText={(t) => ctx.setCaptionText(t.slice(0, 40))}
              maxLength={40}
            />
            {ctx.captionText.length > 0 && (
              <Pressable onPress={() => ctx.setCaptionText('')} style={styles.textClearBtn}>
                <MaterialIcons name="close" size={18} color={DS.onSurfaceVariant} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Export Button */}
      <Pressable style={styles.exportBtn} onPress={() => router.push('/export')}>
        <MaterialIcons name="download" size={20} color={DS.onPrimary} />
        <Text style={styles.exportBtnText}>Export Design</Text>
      </Pressable>
    </ScrollView>
  );
}

// --- Reusable Color Picker ---
function ColorPicker({ icon, title, colors, selected, onSelect }: {
  icon: keyof typeof MaterialIcons.glyphMap; title: string;
  colors: string[]; selected: string; onSelect: (c: string) => void;
}) {
  return (
    <View style={styles.colorGroup}>
      <View style={styles.colorHeader}>
        <View style={styles.colorIcon}>
          <MaterialIcons name={icon} size={14} color={DS.onSurface} />
        </View>
        <Text style={styles.colorTitle}>{title}</Text>
        <View style={[styles.colorDot, { backgroundColor: selected }]} />
      </View>
      <View style={styles.swatchRow}>
        {colors.map((c) => (
          <Pressable key={c} onPress={() => onSelect(c)}
            style={[styles.swatch, { backgroundColor: c }, selected === c && styles.swatchActive]} />
        ))}
      </View>
    </View>
  );
}

// --- Styles ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.surface },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16 },

  previewCard: { alignItems: 'center', gap: 8 },
  glassPanel: { backgroundColor: 'rgba(51,53,55,0.5)', borderRadius: 18, padding: 14 },
  qrCanvas: { padding: 10, borderRadius: 10 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: DS.surfaceContainerHighest, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: DS.secondaryFixedDim },
  liveText: { fontSize: 9, fontWeight: '700', color: DS.onSurface, letterSpacing: 0.5, textTransform: 'uppercase' },

  tabBar: { flexDirection: 'row', backgroundColor: DS.surfaceContainerLow, borderRadius: 12, padding: 3 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10 },
  tabItemActive: { backgroundColor: DS.surfaceContainerHigh },
  tabLabel: { fontSize: 11, fontWeight: '700', color: DS.onSurfaceVariant },
  tabLabelActive: { color: DS.primary },

  tabSection: { gap: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.onSurface },

  // Colors
  colorGroup: { gap: 8, backgroundColor: DS.surfaceContainerLow, borderRadius: 12, padding: 12 },
  colorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorIcon: { width: 26, height: 26, borderRadius: 7, backgroundColor: DS.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center' },
  colorTitle: { fontSize: 13, fontWeight: '700', color: DS.onSurface, flex: 1 },
  colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: `${DS.outlineVariant}55` },
  swatchRow: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: 'transparent' },
  swatchSm: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: DS.secondaryFixedDim },

  matchColorsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 10,
    backgroundColor: DS.surfaceContainerLow,
    borderWidth: 1, borderColor: `${DS.secondary}33`, borderStyle: 'dashed',
  },
  matchColorsText: { fontSize: 13, fontWeight: '700', color: DS.secondary },

  // Gradient
  gradientSection: { gap: 12, backgroundColor: DS.surfaceContainerLow, borderRadius: 12, padding: 12 },
  gradientHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradientTitle: { fontSize: 13, fontWeight: '700', color: DS.onSurface, flex: 1 },
  gradientColors: { gap: 10 },
  gradientColorCol: { gap: 6 },
  gradientLabel: { fontSize: 11, fontWeight: '600', color: DS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  angleRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  anglePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: DS.surfaceContainerHigh },
  anglePillActive: { backgroundColor: DS.primaryContainer },
  angleText: { fontSize: 12, fontWeight: '600', color: DS.onSurfaceVariant },
  angleTextActive: { color: DS.primary },

  // BG Image
  bgImagePreview: {
    width: '100%', height: 120, borderRadius: 10,
    backgroundColor: DS.surfaceContainerHigh,
  },
  bgImageActions: { flexDirection: 'row', gap: 10 },
  bgImageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: DS.surfaceContainerHigh,
  },
  bgImageBtnText: { fontSize: 12, fontWeight: '600', color: DS.primary },
  bgImageUploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 10,
    backgroundColor: DS.surfaceContainerHigh,
    borderWidth: 1.5, borderColor: `${DS.secondary}55`, borderStyle: 'dashed',
  },
  bgImageUploadText: { fontSize: 13, fontWeight: '700', color: DS.secondary },
  bgImageHint: { fontSize: 11, color: DS.onSurfaceVariant, lineHeight: 16, fontStyle: 'italic' },

  // Shapes
  shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shapeCard: {
    width: '30%', aspectRatio: 0.9,
    backgroundColor: DS.surfaceContainerLow, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8,
  },
  shapeCardActive: { borderWidth: 2, borderColor: DS.primary, backgroundColor: `${DS.primaryContainer}18` },
  shapeName: { fontSize: 10, fontWeight: '700', color: DS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.3 },

  hintText: { fontSize: 12, color: DS.onSurfaceVariant, lineHeight: 18, textAlign: 'center' },

  // Logo
  logoSection: { alignItems: 'center', gap: 14 },
  logoPreview: { width: 80, height: 80, borderRadius: 12, backgroundColor: DS.surfaceContainerHigh },
  logoActions: { flexDirection: 'row', gap: 12 },
  logoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: DS.surfaceContainerHigh },
  logoBtnText: { fontSize: 13, fontWeight: '600' },

  // Built-in logo grid
  logoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logoTile: {
    width: '22%', alignItems: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: DS.surfaceContainerLow,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  logoTileActive: { borderColor: DS.primary, backgroundColor: `${DS.primaryContainer}22` },
  logoTileBox: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
  },
  logoTileLabel: { fontSize: 9, fontWeight: '600', color: DS.onSurfaceVariant, textAlign: 'center' },
  uploadCustomBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: DS.surfaceContainerHigh,
    borderWidth: 1.5, borderColor: `${DS.secondary}44`, borderStyle: 'dashed',
  },
  uploadCustomText: { fontSize: 14, fontWeight: '700', color: DS.secondary },

  // Text inputs (center text + caption)
  subLabel: { fontSize: 12, color: DS.onSurfaceVariant, lineHeight: 17 },
  textInputRow: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  textInput: {
    flex: 1, backgroundColor: DS.surfaceContainerHighest, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, paddingRight: 40,
    color: DS.onSurface, fontSize: 15,
  },
  textClearBtn: { position: 'absolute', right: 10, padding: 6 },

  // Caption shown below QR in preview
  previewCaption: {
    fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 8,
    paddingHorizontal: 8,
  },
  uploadBox: { borderRadius: 18, padding: 24, alignItems: 'center', gap: 8 },
  uploadIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: DS.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: DS.onSurface },
  uploadDesc: { fontSize: 12, color: DS.onSurfaceVariant },
  selectFileBtn: { width: '100%', backgroundColor: DS.surfaceContainerHighest, paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  selectFileText: { color: DS.secondary, fontWeight: '700', fontSize: 14 },

  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: DS.primary, paddingVertical: 16, borderRadius: 12 },
  exportBtnText: { color: DS.onPrimary, fontWeight: '800', fontSize: 15 },
});
