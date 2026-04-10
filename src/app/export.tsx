import React, { useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Dimensions,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import ViewShot from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import CustomQRCode from '@/components/custom-qr';
import { LogoOverlay } from '@/components/builtin-logos';
import { useQRDesign } from '@/context/qr-design-context';
import { DS } from '@/constants/theme';

export default function ExportScreen() {
  const ctx = useQRDesign();
  const viewShotRef = useRef<ViewShot>(null);
  const [saving, setSaving] = useState(false);
  const screenWidth = Dimensions.get('window').width;
  const qrSize = Math.min(screenWidth - 120, 240);
  const qrValue = ctx.getQRValue();

  const captureQR = useCallback(async (): Promise<string | null> => {
    try {
      const uri = await viewShotRef.current?.capture?.();
      return uri ?? null;
    } catch {
      Alert.alert('Error', 'Failed to capture QR code image.');
      return null;
    }
  }, []);

  const handleDownloadPNG = useCallback(async () => {
    setSaving(true);
    try {
      const uri = await captureQR();
      if (!uri) { setSaving(false); return; }
      const fileName = `${ctx.designName || 'QRCode'}_${Date.now()}.png`;
      const destPath = `${FileSystem.documentDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: uri, to: destPath });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(destPath, { mimeType: 'image/png', dialogTitle: 'Save QR Code' });
      } else {
        Alert.alert('Saved', `QR code saved to ${destPath}`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save.');
    }
    setSaving(false);
  }, [captureQR, ctx.designName]);

  const handleShare = useCallback(async () => {
    setSaving(true);
    try {
      const uri = await captureQR();
      if (!uri) { setSaving(false); return; }
      const fileName = `QR_${Date.now()}.png`;
      const destPath = `${FileSystem.cacheDirectory}${fileName}`;
      await FileSystem.copyAsync({ from: uri, to: destPath });
      await Sharing.shareAsync(destPath, { mimeType: 'image/png' });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to share.');
    }
    setSaving(false);
  }, [captureQR]);

  const handleSaveToCollection = useCallback(async () => {
    setSaving(true);
    try {
      await ctx.saveCurrentDesign();
      Alert.alert('Saved!', 'Design saved to your collection.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save.');
    }
    setSaving(false);
  }, [ctx.saveCurrentDesign]);

  const handleCreateNew = useCallback(() => {
    ctx.resetDesign();
    router.push('/create');
  }, [ctx.resetDesign]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.readyLabel}>Export Ready</Text>
        <Text style={styles.title}>Design{'\n'}Finalized.</Text>
      </View>

      <View style={styles.nameRow}>
        <TextInput
          style={styles.nameInput}
          placeholder="Untitled Design"
          placeholderTextColor={DS.outline}
          value={ctx.designName}
          onChangeText={ctx.setDesignName}
        />
        <MaterialIcons name="edit" size={18} color={DS.onSurfaceVariant} />
      </View>

      {/* Capturable QR Preview */}
      <View style={styles.previewWrapper}>
        <LinearGradient
          colors={[`${DS.primaryContainer}33`, `${DS.secondaryContainer}33`]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={styles.previewGlow}
        />
        <View style={styles.glassCard}>
          <ViewShot ref={viewShotRef} options={{ format: 'png', quality: 1.0, result: 'tmpfile' }}
            style={[styles.qrCanvas, { backgroundColor: ctx.bgColor }]}>
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
                ecl={ctx.bgImageUri || ctx.logoUri || ctx.builtInLogoId || ctx.centerText ? 'H' : 'M'}
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
              <Text style={[styles.exportCaption, { color: ctx.bodyColor }]} numberOfLines={2}>
                {ctx.captionText}
              </Text>
            )}
          </ViewShot>
          <View style={styles.previewMeta}>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewName}>{ctx.designName || 'Untitled Design'}</Text>
              <Text style={styles.previewDesc}>Static {qrValue.length > 30 ? 'URL' : 'Content'}</Text>
            </View>
            <Pressable style={styles.refineBtn} onPress={() => router.push('/studio')}>
              <MaterialIcons name="edit" size={18} color={DS.primary} />
              <Text style={styles.refineText}>Refine</Text>
            </Pressable>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Download & Share</Text>
        <View style={styles.downloadList}>
          <Pressable style={styles.downloadRow} onPress={handleDownloadPNG} disabled={saving}>
            <View style={styles.downloadLeft}>
              <View style={[styles.downloadIcon, { backgroundColor: `${DS.primary}1A` }]}>
                <MaterialIcons name="image" size={22} color={DS.primary} />
              </View>
              <View>
                <Text style={styles.downloadLabel}>Save as PNG</Text>
                <Text style={styles.downloadDesc}>High-res image file</Text>
              </View>
            </View>
            {saving ? <ActivityIndicator size="small" color={DS.primary} /> : <MaterialIcons name="download" size={22} color={DS.onSurfaceVariant} />}
          </Pressable>
          <Pressable style={styles.downloadRow} onPress={handleShare} disabled={saving}>
            <View style={styles.downloadLeft}>
              <View style={[styles.downloadIcon, { backgroundColor: `${DS.secondary}1A` }]}>
                <MaterialIcons name="share" size={22} color={DS.secondary} />
              </View>
              <View>
                <Text style={styles.downloadLabel}>Share</Text>
                <Text style={styles.downloadDesc}>Send via any app</Text>
              </View>
            </View>
            <MaterialIcons name="ios-share" size={22} color={DS.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>

      <View style={styles.ctaSection}>
        <Pressable style={styles.saveBtn} onPress={handleSaveToCollection} disabled={saving}>
          {saving ? <ActivityIndicator size="small" color={DS.onPrimary} /> : (
            <><MaterialIcons name="bookmark" size={20} color={DS.onPrimary} /><Text style={styles.saveBtnText}>Save to Collection</Text></>
          )}
        </Pressable>
        <Pressable style={styles.newDesignBtn} onPress={handleCreateNew}>
          <MaterialIcons name="add-box" size={20} color={DS.onSurfaceVariant} />
          <Text style={styles.newDesignBtnText}>Create New Design</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.surface },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 40, gap: 24 },
  header: { gap: 6 },
  readyLabel: { fontSize: 10, fontWeight: '700', color: DS.secondary, letterSpacing: 2, textTransform: 'uppercase' },
  title: { fontSize: 38, fontWeight: '800', color: DS.onSurface, letterSpacing: -0.5, lineHeight: 42 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: DS.surfaceContainerHigh, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 4 },
  nameInput: { flex: 1, color: DS.onSurface, fontSize: 16, fontWeight: '700', paddingVertical: 12 },
  previewWrapper: { position: 'relative' },
  previewGlow: { position: 'absolute', top: -12, left: -12, right: -12, bottom: -12, borderRadius: 28, opacity: 0.5 },
  glassCard: { backgroundColor: 'rgba(51,53,55,0.6)', borderRadius: 16, padding: 20, gap: 20 },
  qrCanvas: { borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'stretch' },
  exportCaption: {
    fontSize: 16, fontWeight: '700', textAlign: 'center', marginTop: 14,
    paddingHorizontal: 12,
  },
  previewMeta: { flexDirection: 'row', alignItems: 'center' },
  previewName: { fontSize: 16, fontWeight: '700', color: DS.onSurface },
  previewDesc: { fontSize: 13, color: DS.onSurfaceVariant, marginTop: 2 },
  refineBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  refineText: { fontSize: 13, fontWeight: '600', color: DS.primary },
  section: { gap: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: DS.onSurfaceVariant, letterSpacing: 1.5, textTransform: 'uppercase' },
  downloadList: { gap: 10 },
  downloadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: DS.surfaceContainerHigh, borderRadius: 12, padding: 16 },
  downloadLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  downloadIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  downloadLabel: { fontSize: 15, fontWeight: '700', color: DS.onSurface },
  downloadDesc: { fontSize: 12, color: DS.onSurfaceVariant, marginTop: 1 },
  ctaSection: { gap: 10, marginTop: 4 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: DS.primary, paddingVertical: 18, borderRadius: 12, elevation: 4 },
  saveBtnText: { color: DS.onPrimary, fontWeight: '800', fontSize: 16 },
  newDesignBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderWidth: 1, borderColor: `${DS.outlineVariant}4D`, paddingVertical: 18, borderRadius: 12 },
  newDesignBtnText: { color: DS.onSurfaceVariant, fontWeight: '700', fontSize: 16 },
});
