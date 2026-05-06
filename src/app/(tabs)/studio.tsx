import React, { useState, useCallback, useMemo } from 'react';
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
import { MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import CustomQRCode, { type BodyShape, type EyeFrameShape, type EyeBallShape } from '@/components/custom-qr';
import { BUILTIN_LOGOS, BrandIcon, LogoOverlay, getLogoById } from '@/components/builtin-logos';
import { useQRDesign, getContentTypeConfig } from '@/context/qr-design-context';
import { useDS, type DSPalette } from '@/theme/theme-provider';
import { useT } from '@/i18n';

type TabKey = 'colors' | 'body' | 'eyes' | 'logo';

const TABS: { key: TabKey; labelKey: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'colors', labelKey: 'studio.tabColors', icon: 'palette' },
  { key: 'body', labelKey: 'studio.tabBody', icon: 'category' },
  { key: 'eyes', labelKey: 'studio.tabEyes', icon: 'visibility' },
  { key: 'logo', labelKey: 'studio.tabLogo', icon: 'add-photo-alternate' },
];

const BODY_COLORS = ['#0c0e10', '#1a1a2e', '#16213e', '#0f3460', '#533483', '#e94560', '#00daf3', '#bbc3ff', '#ffffff'];
const BG_COLORS = ['#ffffff', '#f5f5f5', '#fdf6e3', '#121416', '#1a1c1e', '#0c0e10', '#282a2c', '#37393b', '#000000'];
const EYE_COLORS = ['#0c0e10', '#2243ea', '#00daf3', '#642de6', '#e94560', '#ff6b35', '#00c853', '#ffffff', '#bbc3ff'];
const GRADIENT_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

const BODY_SHAPES: { id: BodyShape }[] = [
  { id: 'square' }, { id: 'dots' }, { id: 'rounded' }, { id: 'diamond' },
  { id: 'classy' }, { id: 'star' }, { id: 'vertical' }, { id: 'horizontal' },
  { id: 'cross' }, { id: 'hexagon' }, { id: 'triangle' },
];

const EYE_FRAME_SHAPES: { id: EyeFrameShape }[] = [
  { id: 'square' }, { id: 'rounded' }, { id: 'circle' }, { id: 'leaf' },
];

const EYE_BALL_SHAPES: { id: EyeBallShape }[] = [
  { id: 'square' }, { id: 'rounded' }, { id: 'circle' }, { id: 'leaf' },
];

// --- Mini shape previews for body picker ---
function BodyShapePreview({ shape, active }: { shape: BodyShape; active: boolean }) {
  const ds = useDS();
  const color = active ? ds.primary : ds.onSurfaceVariant;
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
  const ds = useDS();
  const color = active ? ds.primary : ds.onSurfaceVariant;
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
  const ds = useDS();
  const color = active ? ds.primary : ds.onSurfaceVariant;
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
  const t = useT();
  const ds = useDS();
  const styles = useMemo(() => createStyles(ds), [ds]);
  const ctx = useQRDesign();
  const [activeTab, setActiveTab] = useState<TabKey>('colors');
  const screenWidth = Dimensions.get('window').width;
  const qrSize = Math.min(screenWidth - 160, 180);
  const qrValue = ctx.getQRValue();

  const contentSummary = useMemo(() => {
    const cfg = getContentTypeConfig(ctx.contentType);
    let summary = '';
    if (ctx.contentType === 'wifi') {
      const { ssid, encryption } = ctx.wifiData;
      summary = ssid ? `${ssid} · ${encryption}` : '';
    } else if (ctx.contentType === 'contact') {
      const { name, phone, email } = ctx.contactData;
      summary = name || phone || email || '';
    } else {
      summary = ctx.content;
    }
    return { cfg, summary };
  }, [ctx.contentType, ctx.content, ctx.wifiData, ctx.contactData]);

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
      ctx.setBodyGradient({ colors: [ctx.bodyColor, ds.secondaryFixedDim], angle: 135 });
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
          <Text style={styles.liveText}>{t('studio.livePreview')}</Text>
        </View>
      </View>

      {/* Content summary — what's being encoded */}
      <Pressable style={styles.contentSummary} onPress={() => router.push('/')}>
        <View style={[styles.contentSummaryIcon, { backgroundColor: `${contentSummary.cfg.color}22` }]}>
          {contentSummary.cfg.iconSet === 'fa5b' ? (
            <FontAwesome5 name={contentSummary.cfg.iconName as any} size={16} color={contentSummary.cfg.color} brand />
          ) : (
            <MaterialIcons name={contentSummary.cfg.iconName as any} size={18} color={contentSummary.cfg.color} />
          )}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.contentSummaryLabel}>
            {t('studio.editing')} · {contentSummary.cfg.label}
          </Text>
          <Text
            style={[styles.contentSummaryValue, !contentSummary.summary && styles.contentSummaryEmpty]}
            numberOfLines={1}>
            {contentSummary.summary || t('studio.noContent')}
          </Text>
        </View>
        <MaterialIcons name="edit" size={18} color={ds.onSurfaceVariant} />
      </Pressable>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            style={[styles.tabItem, activeTab === tab.key && styles.tabItemActive]}
            onPress={() => setActiveTab(tab.key)}>
            <MaterialIcons name={tab.icon} size={18} color={activeTab === tab.key ? ds.primary : ds.onSurfaceVariant} />
            <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>{t(tab.labelKey)}</Text>
          </Pressable>
        ))}
      </View>

      {/* === COLORS TAB === */}
      {activeTab === 'colors' && (
        <View style={styles.tabSection}>
          <ColorPicker icon="grid-view" title={t('studio.bodyColor')} colors={BODY_COLORS} selected={ctx.bodyColor} onSelect={ctx.setBodyColor} />
          <ColorPicker icon="center-focus-strong" title={t('studio.eyeFrameColor')} colors={EYE_COLORS} selected={ctx.eyeFrameColor} onSelect={ctx.setEyeFrameColor} />
          <ColorPicker icon="lens" title={t('studio.eyeBallColor')} colors={EYE_COLORS} selected={ctx.eyeBallColor} onSelect={ctx.setEyeBallColor} />
          <ColorPicker icon="wallpaper" title={t('studio.background')} colors={BG_COLORS} selected={ctx.bgColor} onSelect={ctx.setBgColor} />

          {/* Quick: match all colors button */}
          <Pressable
            style={styles.matchColorsBtn}
            onPress={() => {
              ctx.setEyeFrameColor(ctx.bodyColor);
              ctx.setEyeBallColor(ctx.bodyColor);
            }}>
            <MaterialIcons name="color-lens" size={16} color={ds.secondary} />
            <Text style={styles.matchColorsText}>{t('studio.matchEyes')}</Text>
          </Pressable>

          {/* Background Image Picker */}
          <View style={styles.gradientSection}>
            <View style={styles.gradientHeader}>
              <MaterialIcons name="image" size={18} color={ds.onSurface} />
              <Text style={styles.gradientTitle}>{t('studio.backgroundImage')}</Text>
              {ctx.bgImageUri && (
                <Pressable onPress={() => ctx.setBgImageUri(null)} hitSlop={8}>
                  <MaterialIcons name="close" size={20} color={ds.error} />
                </Pressable>
              )}
            </View>
            {ctx.bgImageUri ? (
              <>
                <Image source={{ uri: ctx.bgImageUri }} style={styles.bgImagePreview} />
                <View style={styles.bgImageActions}>
                  <Pressable style={styles.bgImageBtn} onPress={pickBgImage}>
                    <MaterialIcons name="swap-horiz" size={18} color={ds.primary} />
                    <Text style={styles.bgImageBtnText}>{t('common.change')}</Text>
                  </Pressable>
                </View>
                <Text style={styles.gradientLabel}>{t('studio.imageOpacity')}</Text>
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
                <Text style={styles.bgImageHint}>{t('studio.opacityHint')}</Text>
              </>
            ) : (
              <Pressable style={styles.bgImageUploadBtn} onPress={pickBgImage}>
                <MaterialIcons name="add-photo-alternate" size={24} color={ds.secondary} />
                <Text style={styles.bgImageUploadText}>{t('studio.pickBackground')}</Text>
              </Pressable>
            )}
          </View>

          {/* Gradient Toggle */}
          <View style={styles.gradientSection}>
            <View style={styles.gradientHeader}>
              <MaterialIcons name="gradient" size={18} color={ds.onSurface} />
              <Text style={styles.gradientTitle}>{t('studio.bodyGradient')}</Text>
              <Switch
                value={ctx.bodyGradient !== null}
                onValueChange={toggleGradient}
                trackColor={{ false: ds.surfaceContainerHighest, true: ds.primaryContainer }}
                thumbColor={ctx.bodyGradient ? ds.primary : ds.onSurfaceVariant}
              />
            </View>
            {ctx.bodyGradient && (
              <>
                <View style={styles.gradientColors}>
                  <View style={styles.gradientColorCol}>
                    <Text style={styles.gradientLabel}>{t('studio.gradStart')}</Text>
                    <View style={styles.swatchRow}>
                      {BODY_COLORS.map((c) => (
                        <Pressable key={c} onPress={() => setGradColor(0, c)}
                          style={[styles.swatchSm, { backgroundColor: c }, ctx.bodyGradient?.colors[0] === c && styles.swatchActive]} />
                      ))}
                    </View>
                  </View>
                  <View style={styles.gradientColorCol}>
                    <Text style={styles.gradientLabel}>{t('studio.gradEnd')}</Text>
                    <View style={styles.swatchRow}>
                      {BODY_COLORS.map((c) => (
                        <Pressable key={c} onPress={() => setGradColor(1, c)}
                          style={[styles.swatchSm, { backgroundColor: c }, ctx.bodyGradient?.colors[1] === c && styles.swatchActive]} />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.gradientLabel}>{t('studio.gradDirection')}</Text>
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
          <Text style={styles.sectionTitle}>{t('studio.bodyShape')}</Text>
          <View style={styles.shapeGrid}>
            {BODY_SHAPES.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.shapeCard, ctx.bodyShape === s.id && styles.shapeCardActive]}
                onPress={() => ctx.setBodyShape(s.id)}>
                <BodyShapePreview shape={s.id} active={ctx.bodyShape === s.id} />
                <Text style={[styles.shapeName, ctx.bodyShape === s.id && { color: ds.primary }]}>{t(`studio.shapes.${s.id}`)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* === EYES TAB === */}
      {activeTab === 'eyes' && (
        <View style={styles.tabSection}>
          {/* Eye Frame Shape */}
          <Text style={styles.sectionTitle}>{t('studio.eyeFrameShape')}</Text>
          <View style={styles.shapeGrid}>
            {EYE_FRAME_SHAPES.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.shapeCard, ctx.eyeFrameShape === s.id && styles.shapeCardActive]}
                onPress={() => ctx.setEyeFrameShape(s.id)}>
                <EyeFramePreview shape={s.id} active={ctx.eyeFrameShape === s.id} />
                <Text style={[styles.shapeName, ctx.eyeFrameShape === s.id && { color: ds.primary }]}>{t(`studio.shapes.${s.id}`)}</Text>
              </Pressable>
            ))}
          </View>

          {/* Eye Ball Shape */}
          <Text style={styles.sectionTitle}>{t('studio.eyeBallShape')}</Text>
          <View style={styles.shapeGrid}>
            {EYE_BALL_SHAPES.map((s) => (
              <Pressable
                key={s.id}
                style={[styles.shapeCard, ctx.eyeBallShape === s.id && styles.shapeCardActive]}
                onPress={() => ctx.setEyeBallShape(s.id)}>
                <EyeBallPreview shape={s.id} active={ctx.eyeBallShape === s.id} />
                <Text style={[styles.shapeName, ctx.eyeBallShape === s.id && { color: ds.primary }]}>{t(`studio.shapes.${s.id}`)}</Text>
              </Pressable>
            ))}
          </View>

          {/* Eye Colors */}
          <ColorPicker icon="center-focus-strong" title={t('studio.eyeFrameColor')} colors={EYE_COLORS} selected={ctx.eyeFrameColor} onSelect={ctx.setEyeFrameColor} />
          <ColorPicker icon="lens" title={t('studio.eyeBallColor')} colors={EYE_COLORS} selected={ctx.eyeBallColor} onSelect={ctx.setEyeBallColor} />
        </View>
      )}

      {/* === LOGO TAB === */}
      {activeTab === 'logo' && (
        <View style={styles.tabSection}>
          {/* --- Built-in Brand Logos --- */}
          <Text style={styles.sectionTitle}>{t('studio.builtInLogos')}</Text>
          <View style={styles.logoGrid}>
            {/* "None" tile */}
            <Pressable
              style={[styles.logoTile, !ctx.builtInLogoId && styles.logoTileActive]}
              onPress={() => ctx.setBuiltInLogoId(null)}>
              <View style={styles.logoTileBox}>
                <MaterialIcons name="block" size={22} color={ds.onSurfaceVariant} />
              </View>
              <Text style={styles.logoTileLabel}>{t('common.none')}</Text>
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
          <Text style={styles.sectionTitle}>{t('studio.uploadCustom')}</Text>
          {ctx.logoUri ? (
            <View style={styles.logoSection}>
              <Image source={{ uri: ctx.logoUri }} style={styles.logoPreview} />
              <View style={styles.logoActions}>
                <Pressable style={styles.logoBtn} onPress={pickLogo}>
                  <MaterialIcons name="swap-horiz" size={20} color={ds.primary} />
                  <Text style={[styles.logoBtnText, { color: ds.primary }]}>{t('common.change')}</Text>
                </Pressable>
                <Pressable style={[styles.logoBtn, { backgroundColor: `${ds.errorContainer}44` }]} onPress={() => ctx.setLogoUri(null)}>
                  <MaterialIcons name="delete-outline" size={20} color={ds.error} />
                  <Text style={[styles.logoBtnText, { color: ds.error }]}>{t('common.remove')}</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.uploadCustomBtn} onPress={pickLogo}>
              <MaterialIcons name="cloud-upload" size={22} color={ds.secondary} />
              <Text style={styles.uploadCustomText}>{t('studio.pickGallery')}</Text>
            </Pressable>
          )}

          <Text style={styles.hintText}>{t('studio.logoHint')}</Text>

          {/* --- Center Text --- */}
          <Text style={styles.sectionTitle}>{t('studio.centerText')}</Text>
          <Text style={styles.subLabel}>{t('studio.centerTextHint')}</Text>
          <View style={styles.textInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={t('studio.centerTextPlaceholder')}
              placeholderTextColor={ds.outline}
              value={ctx.centerText}
              onChangeText={(v) => {
                ctx.setCenterText(v.slice(0, 6));
                if (v.length > 0) {
                  if (ctx.builtInLogoId) ctx.setBuiltInLogoId(null);
                  if (ctx.logoUri) ctx.setLogoUri(null);
                }
              }}
              maxLength={6}
              autoCapitalize="characters"
            />
            {ctx.centerText.length > 0 && (
              <Pressable onPress={() => ctx.setCenterText('')} style={styles.textClearBtn}>
                <MaterialIcons name="close" size={18} color={ds.onSurfaceVariant} />
              </Pressable>
            )}
          </View>

          {/* --- Caption (below QR) --- */}
          <Text style={styles.sectionTitle}>{t('studio.captionBelowQR')}</Text>
          <Text style={styles.subLabel}>{t('studio.captionHint')}</Text>
          <View style={styles.textInputRow}>
            <TextInput
              style={styles.textInput}
              placeholder={t('studio.captionPlaceholder')}
              placeholderTextColor={ds.outline}
              value={ctx.captionText}
              onChangeText={(v) => ctx.setCaptionText(v.slice(0, 40))}
              maxLength={40}
            />
            {ctx.captionText.length > 0 && (
              <Pressable onPress={() => ctx.setCaptionText('')} style={styles.textClearBtn}>
                <MaterialIcons name="close" size={18} color={ds.onSurfaceVariant} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Export Button */}
      <Pressable style={styles.exportBtn} onPress={() => router.push('/export')}>
        <MaterialIcons name="download" size={20} color={ds.onPrimary} />
        <Text style={styles.exportBtnText}>{t('studio.export')}</Text>
      </Pressable>
    </ScrollView>
  );
}

// --- Reusable Color Picker ---
function ColorPicker({ icon, title, colors, selected, onSelect }: {
  icon: keyof typeof MaterialIcons.glyphMap; title: string;
  colors: string[]; selected: string; onSelect: (c: string) => void;
}) {
  const ds = useDS();
  const styles = useMemo(() => createStyles(ds), [ds]);
  return (
    <View style={styles.colorGroup}>
      <View style={styles.colorHeader}>
        <View style={styles.colorIcon}>
          <MaterialIcons name={icon} size={14} color={ds.onSurface} />
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
function createStyles(ds: DSPalette) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: ds.surface },
  content: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 32, gap: 16 },

  previewCard: { alignItems: 'center', gap: 8 },
  glassPanel: { backgroundColor: 'rgba(51,53,55,0.5)', borderRadius: 18, padding: 14 },
  qrCanvas: { padding: 10, borderRadius: 10 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: ds.surfaceContainerHighest, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: ds.secondaryFixedDim },
  liveText: { fontSize: 9, fontWeight: '700', color: ds.onSurface, letterSpacing: 0.5, textTransform: 'uppercase' },

  contentSummary: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: ds.surfaceContainerLow, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: `${ds.outlineVariant}33`,
  },
  contentSummaryIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  contentSummaryLabel: {
    fontSize: 10, fontWeight: '700', color: ds.onSurfaceVariant,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  contentSummaryValue: { fontSize: 13, fontWeight: '600', color: ds.onSurface },
  contentSummaryEmpty: { color: ds.outline, fontStyle: 'italic', fontWeight: '500' },

  tabBar: { flexDirection: 'row', backgroundColor: ds.surfaceContainerLow, borderRadius: 12, padding: 3 },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 10 },
  tabItemActive: { backgroundColor: ds.surfaceContainerHigh },
  tabLabel: { fontSize: 11, fontWeight: '700', color: ds.onSurfaceVariant },
  tabLabelActive: { color: ds.primary },

  tabSection: { gap: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: ds.onSurface },

  // Colors
  colorGroup: { gap: 8, backgroundColor: ds.surfaceContainerLow, borderRadius: 12, padding: 12 },
  colorHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  colorIcon: { width: 26, height: 26, borderRadius: 7, backgroundColor: ds.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center' },
  colorTitle: { fontSize: 13, fontWeight: '700', color: ds.onSurface, flex: 1 },
  colorDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: `${ds.outlineVariant}55` },
  swatchRow: { flexDirection: 'row', gap: 7, flexWrap: 'wrap' },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 2.5, borderColor: 'transparent' },
  swatchSm: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: ds.secondaryFixedDim },

  matchColorsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 12, borderRadius: 10,
    backgroundColor: ds.surfaceContainerLow,
    borderWidth: 1, borderColor: `${ds.secondary}33`, borderStyle: 'dashed',
  },
  matchColorsText: { fontSize: 13, fontWeight: '700', color: ds.secondary },

  // Gradient
  gradientSection: { gap: 12, backgroundColor: ds.surfaceContainerLow, borderRadius: 12, padding: 12 },
  gradientHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gradientTitle: { fontSize: 13, fontWeight: '700', color: ds.onSurface, flex: 1 },
  gradientColors: { gap: 10 },
  gradientColorCol: { gap: 6 },
  gradientLabel: { fontSize: 11, fontWeight: '600', color: ds.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  angleRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  anglePill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: ds.surfaceContainerHigh },
  anglePillActive: { backgroundColor: ds.primaryContainer },
  angleText: { fontSize: 12, fontWeight: '600', color: ds.onSurfaceVariant },
  angleTextActive: { color: ds.primary },

  // BG Image
  bgImagePreview: {
    width: '100%', height: 120, borderRadius: 10,
    backgroundColor: ds.surfaceContainerHigh,
  },
  bgImageActions: { flexDirection: 'row', gap: 10 },
  bgImageBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    backgroundColor: ds.surfaceContainerHigh,
  },
  bgImageBtnText: { fontSize: 12, fontWeight: '600', color: ds.primary },
  bgImageUploadBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 16, borderRadius: 10,
    backgroundColor: ds.surfaceContainerHigh,
    borderWidth: 1.5, borderColor: `${ds.secondary}55`, borderStyle: 'dashed',
  },
  bgImageUploadText: { fontSize: 13, fontWeight: '700', color: ds.secondary },
  bgImageHint: { fontSize: 11, color: ds.onSurfaceVariant, lineHeight: 16, fontStyle: 'italic' },

  // Shapes
  shapeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  shapeCard: {
    width: '30%', aspectRatio: 0.9,
    backgroundColor: ds.surfaceContainerLow, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center', gap: 6, padding: 8,
  },
  shapeCardActive: { borderWidth: 2, borderColor: ds.primary, backgroundColor: `${ds.primaryContainer}18` },
  shapeName: { fontSize: 10, fontWeight: '700', color: ds.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.3 },

  hintText: { fontSize: 12, color: ds.onSurfaceVariant, lineHeight: 18, textAlign: 'center' },

  // Logo
  logoSection: { alignItems: 'center', gap: 14 },
  logoPreview: { width: 80, height: 80, borderRadius: 12, backgroundColor: ds.surfaceContainerHigh },
  logoActions: { flexDirection: 'row', gap: 12 },
  logoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, backgroundColor: ds.surfaceContainerHigh },
  logoBtnText: { fontSize: 13, fontWeight: '600' },

  // Built-in logo grid
  logoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  logoTile: {
    width: '22%', alignItems: 'center', gap: 5,
    paddingVertical: 10, borderRadius: 10,
    backgroundColor: ds.surfaceContainerLow,
    borderWidth: 1.5, borderColor: 'transparent',
  },
  logoTileActive: { borderColor: ds.primary, backgroundColor: `${ds.primaryContainer}22` },
  logoTileBox: {
    width: 40, height: 40, borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center',
  },
  logoTileLabel: { fontSize: 9, fontWeight: '600', color: ds.onSurfaceVariant, textAlign: 'center' },
  uploadCustomBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: ds.surfaceContainerHigh,
    borderWidth: 1.5, borderColor: `${ds.secondary}44`, borderStyle: 'dashed',
  },
  uploadCustomText: { fontSize: 14, fontWeight: '700', color: ds.secondary },

  // Text inputs (center text + caption)
  subLabel: { fontSize: 12, color: ds.onSurfaceVariant, lineHeight: 17 },
  textInputRow: { position: 'relative', flexDirection: 'row', alignItems: 'center' },
  textInput: {
    flex: 1, backgroundColor: ds.surfaceContainerHighest, borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14, paddingRight: 40,
    color: ds.onSurface, fontSize: 15,
  },
  textClearBtn: { position: 'absolute', right: 10, padding: 6 },

  // Caption shown below QR in preview
  previewCaption: {
    fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 8,
    paddingHorizontal: 8,
  },
  uploadBox: { borderRadius: 18, padding: 24, alignItems: 'center', gap: 8 },
  uploadIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: ds.surfaceContainerHighest, alignItems: 'center', justifyContent: 'center' },
  uploadTitle: { fontSize: 15, fontWeight: '700', color: ds.onSurface },
  uploadDesc: { fontSize: 12, color: ds.onSurfaceVariant },
  selectFileBtn: { width: '100%', backgroundColor: ds.surfaceContainerHighest, paddingVertical: 13, borderRadius: 12, alignItems: 'center', marginTop: 4 },
  selectFileText: { color: ds.secondary, fontWeight: '700', fontSize: 14 },

  exportBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: ds.primary, paddingVertical: 16, borderRadius: 12 },
  exportBtnText: { color: ds.onPrimary, fontWeight: '800', fontSize: 15 },
}); }
