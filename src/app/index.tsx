import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useQRDesign, type QRDesign, type QRContentType, CONTENT_TYPES, getContentTypeConfig } from '@/context/qr-design-context';
import CustomQRCode from '@/components/custom-qr';
import { LogoOverlay } from '@/components/builtin-logos';
import { FontAwesome5 } from '@expo/vector-icons';
import { useDS, type DSPalette } from '@/theme/theme-provider';
import { useT } from '@/i18n';

// Reconstruct the QR string from a saved design
function getDesignQRValue(design: QRDesign): string {
  if (design.contentType === 'wifi') {
    try {
      const w = JSON.parse(design.content);
      if (!w.ssid) return 'WIFI:S:Network;T:WPA;P:;;';
      return `WIFI:S:${w.ssid};T:${w.encryption || 'WPA'};P:${w.password || ''};;`;
    } catch { return design.content || 'https://example.com'; }
  }
  if (design.contentType === 'contact') {
    try {
      const c = JSON.parse(design.content);
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      if (c.name) lines.push(`FN:${c.name}`);
      if (c.phone) lines.push(`TEL:${c.phone}`);
      if (c.email) lines.push(`EMAIL:${c.email}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    } catch { return design.content || 'https://example.com'; }
  }
  return design.content || 'https://example.com';
}

function TypeIcon({ cfg, color, size }: { cfg: typeof CONTENT_TYPES[0]; color: string; size: number }) {
  if (cfg.iconSet === 'fa5b') {
    return <FontAwesome5 name={cfg.iconName as any} size={size} color={color} brand />;
  }
  return <MaterialIcons name={cfg.iconName as any} size={size} color={color} />;
}

function timeAgo(timestamp: number, t: (k: string, fb?: string) => string): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('common.justNow');
  if (mins < 60) return t('common.minuteAgo').replace('{n}', String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('common.hourAgo').replace('{n}', String(hours));
  const days = Math.floor(hours / 24);
  return t('common.dayAgo').replace('{n}', String(days));
}

function DesignCard({ design, onPress, onDelete, styles, ds, t }: { design: QRDesign; onPress: () => void; onDelete: () => void; styles: ReturnType<typeof createStyles>; ds: DSPalette; t: (k: string, fb?: string) => string }) {
  const typeLabel =
    design.contentType === 'wifi' ? t('home.typeWifi') :
    design.contentType === 'contact' ? t('home.typeContact') :
    design.contentType === 'text' ? t('home.typeText') : t('home.typeUrl');

  const qrValue = getDesignQRValue(design);

  return (
    <Pressable style={styles.recentCard} onPress={onPress}>
      <View style={[styles.recentPreview, { backgroundColor: design.bgColor }]}>
        <View style={{ width: 120, height: 120 }}>
          <CustomQRCode
            value={qrValue}
            size={120}
            bodyShape={design.bodyShape}
            eyeFrameShape={design.eyeFrameShape}
            eyeBallShape={design.eyeBallShape}
            bodyColor={design.bodyColor}
            eyeFrameColor={design.eyeFrameColor}
            eyeBallColor={design.eyeBallColor}
            bgColor={design.bgColor}
            bgImageUri={design.bgImageUri}
            bgImageOpacity={design.bgImageOpacity}
            bodyGradient={design.bodyGradient}
            ecl={design.bgImageUri || design.logoUri || design.builtInLogoId ? 'H' : 'M'}
            logoUri={design.logoUri}
            logoSize={120 * 0.22}
          />
          <LogoOverlay
            logoId={design.builtInLogoId}
            centerText={design.centerText}
            textColor={design.bodyColor}
            qrSize={120}
            bgColor={design.bgColor}
          />
        </View>
      </View>
      <View style={styles.recentInfo}>
        <View style={{ flex: 1 }}>
          <Text style={styles.recentName} numberOfLines={1}>{design.name}</Text>
          <Text style={styles.recentMeta}>{typeLabel} {'\u2022'} {timeAgo(design.updatedAt, t)}</Text>
        </View>
        <Pressable
          hitSlop={12}
          onPress={(e) => {
            e.stopPropagation();
            Alert.alert(t('home.deleteDesign'), t('home.deleteDesignConfirm').replace('{name}', design.name), [
              { text: t('common.cancel'), style: 'cancel' },
              { text: t('common.delete'), style: 'destructive', onPress: onDelete },
            ]);
          }}>
          <MaterialIcons name="delete-outline" size={20} color={ds.onSurfaceVariant} />
        </Pressable>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const t = useT();
  const ds = useDS();
  const styles = useMemo(() => createStyles(ds), [ds]);
  const {
    savedDesigns, loadDesign, deleteDesign,
    content, setContent,
    contentType, setContentType,
    wifiData, setWifiData,
    contactData, setContactData,
  } = useQRDesign();

  const currentTypeCfg = getContentTypeConfig(contentType);

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setContent(text);
  };

  const canContinue = () => {
    switch (contentType) {
      case 'wifi': return wifiData.ssid.length > 0;
      case 'contact': return (contactData.name.length > 0 || contactData.phone.length > 0);
      default: return content.length > 0;
    }
  };

  const handleContinue = () => {
    if (!canContinue()) {
      Alert.alert(t('home.missingContent'), t('home.missingContentDesc'));
      return;
    }
    router.push('/studio');
  };

  const handleOpenDesign = useCallback((id: string) => {
    loadDesign(id);
    router.push('/studio');
  }, [loadDesign]);

  const handleDeleteDesign = useCallback((id: string) => {
    deleteDesign(id);
  }, [deleteDesign]);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Start Creating Section */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('home.title')}</Text>
          <Text style={styles.subtitle}>{t('home.subtitle')}</Text>
        </View>

        {/* QR Type Selection - horizontal scroll */}
        <View>
          <Text style={[styles.label, { marginBottom: 10 }]}>{t('home.contentType')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.typeRow}>
            {CONTENT_TYPES.map((type) => {
              const active = contentType === type.key;
              return (
                <Pressable
                  key={type.key}
                  style={[styles.typeChip, active && { backgroundColor: `${type.color}26`, borderColor: type.color }]}
                  onPress={() => setContentType(type.key)}>
                  <TypeIcon cfg={type} size={22} color={active ? type.color : ds.onSurfaceVariant} />
                  <Text style={[styles.typeChipLabel, active && { color: type.color }]} numberOfLines={1}>
                    {type.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Dynamic Input */}
        <View style={styles.section}>
          {contentType === 'wifi' && (
            <>
              <Text style={styles.label}>{t('home.wifiTitle')}</Text>
              <TextInput style={styles.input} placeholder={t('home.wifiSsid')} placeholderTextColor={ds.outline} value={wifiData.ssid} onChangeText={(v) => setWifiData({ ssid: v })} />
              <TextInput style={styles.input} placeholder={t('home.wifiPassword')} placeholderTextColor={ds.outline} value={wifiData.password} onChangeText={(v) => setWifiData({ password: v })} secureTextEntry />
              <View style={styles.encRow}>
                {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                  <Pressable key={enc} style={[styles.encChip, wifiData.encryption === enc && styles.encChipActive]} onPress={() => setWifiData({ encryption: enc })}>
                    <Text style={[styles.encText, wifiData.encryption === enc && styles.encTextActive]}>{enc === 'nopass' ? t('home.wifiNone') : enc}</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {contentType === 'contact' && (
            <>
              <Text style={styles.label}>{t('home.contactTitle')}</Text>
              <TextInput style={styles.input} placeholder={t('home.contactName')} placeholderTextColor={ds.outline} value={contactData.name} onChangeText={(v) => setContactData({ name: v })} />
              <TextInput style={styles.input} placeholder={t('home.contactPhone')} placeholderTextColor={ds.outline} value={contactData.phone} onChangeText={(v) => setContactData({ phone: v })} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder={t('home.contactEmail')} placeholderTextColor={ds.outline} value={contactData.email} onChangeText={(v) => setContactData({ email: v })} keyboardType="email-address" autoCapitalize="none" />
            </>
          )}

          {contentType !== 'wifi' && contentType !== 'contact' && (
            <>
              <Text style={styles.label}>{currentTypeCfg.label}</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, contentType === 'text' && { minHeight: 100, textAlignVertical: 'top' }]}
                  placeholder={currentTypeCfg.placeholder}
                  placeholderTextColor={ds.outline}
                  value={content}
                  onChangeText={setContent}
                  autoCapitalize="none"
                  keyboardType={
                    contentType === 'web' || contentType === 'spotify' || contentType === 'youtube' || contentType === 'discord' ? 'url' :
                    contentType === 'email' ? 'email-address' :
                    contentType === 'phone' || contentType === 'sms' || contentType === 'whatsapp' ? 'phone-pad' :
                    'default'
                  }
                  multiline={contentType === 'text'}
                />
                <Pressable style={styles.pasteBtn} onPress={handlePaste}>
                  <MaterialIcons name="content-paste" size={20} color={ds.primary} />
                </Pressable>
              </View>
            </>
          )}
        </View>

        {/* Saved Designs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {savedDesigns.length > 0 ? t('home.yourDesigns') : t('home.noDesigns')}
          </Text>
          {savedDesigns.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="qr-code-2" size={48} color={ds.outlineVariant} />
              <Text style={styles.emptyText}>{t('home.noDesignsHint')}</Text>
            </View>
          ) : (
            <View style={styles.recentGrid}>
              {savedDesigns.map((design) => (
                <DesignCard
                  key={design.id}
                  design={design}
                  onPress={() => handleOpenDesign(design.id)}
                  onDelete={() => handleDeleteDesign(design.id)}
                  styles={styles}
                  ds={ds}
                  t={t}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Floating Continue Button - only shown when content is filled */}
      {canContinue() && (
        <View style={styles.floatingBtnWrapper}>
          <Pressable style={styles.continueBtn} onPress={handleContinue}>
            <Text style={styles.continueBtnText}>{t('home.continueToStudio')}</Text>
            <MaterialIcons name="arrow-forward" size={20} color={ds.onPrimary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

function createStyles(ds: DSPalette) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: ds.surface },
    content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 24 },
    header: { gap: 6 },
    title: { fontSize: 34, fontWeight: '800', color: ds.onSurface, letterSpacing: -0.5 },
    subtitle: { fontSize: 16, color: ds.onSurfaceVariant, lineHeight: 22 },
    section: { gap: 14 },
    label: { fontSize: 11, fontWeight: '700', color: ds.onSurfaceVariant, letterSpacing: 1.5, textTransform: 'uppercase' },
    sectionTitle: { fontSize: 22, fontWeight: '700', color: ds.onSurface },
    inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start' },
    input: {
      flex: 1, backgroundColor: ds.surfaceContainerHighest, borderRadius: 12,
      paddingHorizontal: 20, paddingVertical: 16, paddingRight: 48,
      color: ds.onSurface, fontSize: 15,
    },
    pasteBtn: { position: 'absolute', right: 12, top: 14, padding: 4 },

    typeRow: { flexDirection: 'row', gap: 10, paddingRight: 20 },
    typeChip: {
      minWidth: 78, alignItems: 'center', justifyContent: 'center',
      paddingVertical: 12, paddingHorizontal: 14, borderRadius: 12,
      backgroundColor: ds.surfaceContainerHigh,
      borderWidth: 1.5, borderColor: 'transparent',
      gap: 6,
    },
    typeChipLabel: { fontSize: 11, fontWeight: '700', color: ds.onSurfaceVariant },

    encRow: { flexDirection: 'row', gap: 10 },
    encChip: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999, backgroundColor: ds.surfaceContainerHigh },
    encChipActive: { backgroundColor: ds.secondaryContainer },
    encText: { fontSize: 13, fontWeight: '600', color: ds.onSurfaceVariant },
    encTextActive: { color: ds.onSecondaryContainer },
    recentGrid: { gap: 16 },
    recentCard: { backgroundColor: ds.surfaceContainerLow, borderRadius: 16, overflow: 'hidden' },
    recentPreview: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
    recentInfo: { flexDirection: 'row', alignItems: 'center', padding: 16 },
    recentName: { fontSize: 15, fontWeight: '700', color: ds.onSurface },
    recentMeta: { fontSize: 13, color: ds.onSurfaceVariant, marginTop: 2 },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 12, backgroundColor: ds.surfaceContainerLow, borderRadius: 16 },
    emptyText: { fontSize: 14, color: ds.onSurfaceVariant },
    floatingBtnWrapper: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
    continueBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: ds.primary, paddingHorizontal: 36, paddingVertical: 18, borderRadius: 999,
      shadowColor: ds.primaryContainer, shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
    },
    continueBtnText: { color: ds.onPrimary, fontWeight: '800', fontSize: 16 },
  });
}
