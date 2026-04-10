import React from 'react';
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
import { useQRDesign, type QRContentType, type TemplateId } from '@/context/qr-design-context';
import { DS } from '@/constants/theme';

const QR_TYPES: { key: QRContentType; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'web', label: 'Web', icon: 'language' },
  { key: 'wifi', label: 'Wi-Fi', icon: 'wifi' },
  { key: 'contact', label: 'Contact', icon: 'contact-page' },
  { key: 'text', label: 'Text', icon: 'text-fields' },
];

const TEMPLATES: { id: TemplateId; name: string; desc: string }[] = [
  { id: 'minimal', name: 'Minimalist Pro', desc: 'Clean & Sharp' },
  { id: 'cyber', name: 'Cyber Fluid', desc: 'Neon & Dynamic' },
  { id: 'editorial', name: 'Editorial Bold', desc: 'High Contrast' },
  { id: 'soft', name: 'Soft Focus', desc: 'Subtle & Airy' },
];

export default function CreateScreen() {
  const {
    content, setContent,
    contentType, setContentType,
    wifiData, setWifiData,
    contactData, setContactData,
    templateId, applyTemplate,
  } = useQRDesign();

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) setContent(text);
  };

  const canContinue = () => {
    switch (contentType) {
      case 'wifi': return wifiData.ssid.length > 0;
      case 'contact': return (contactData.name.length > 0 || contactData.phone.length > 0);
      case 'web':
      case 'text':
      default: return content.length > 0;
    }
  };

  const handleContinue = () => {
    if (!canContinue()) {
      Alert.alert('Missing content', 'Please enter some content for your QR code.');
      return;
    }
    router.push('/studio');
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Start Creating</Text>
          <Text style={styles.subtitle}>Define your content and choose a visual base.</Text>
        </View>

        {/* QR Type Selection */}
        <View style={styles.typeGrid}>
          {QR_TYPES.map((type) => (
            <Pressable
              key={type.key}
              style={[styles.typeCard, contentType === type.key && styles.typeCardActive]}
              onPress={() => setContentType(type.key)}>
              <MaterialIcons
                name={type.icon}
                size={26}
                color={contentType === type.key ? DS.secondaryContainer : DS.secondaryFixedDim}
              />
              <Text style={[styles.typeLabel, contentType === type.key && styles.typeLabelActive]}>
                {type.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Dynamic Input Section */}
        <View style={styles.section}>
          {(contentType === 'web' || contentType === 'text') && (
            <>
              <Text style={styles.label}>
                {contentType === 'web' ? 'Enter URL' : 'Enter Text'}
              </Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, contentType === 'text' && { minHeight: 100, textAlignVertical: 'top' }]}
                  placeholder={contentType === 'web' ? 'https://your-creative-work.com' : 'Enter any text...'}
                  placeholderTextColor={DS.outline}
                  value={content}
                  onChangeText={setContent}
                  autoCapitalize="none"
                  keyboardType={contentType === 'web' ? 'url' : 'default'}
                  multiline={contentType === 'text'}
                />
                <Pressable style={styles.pasteBtn} onPress={handlePaste}>
                  <MaterialIcons name="content-paste" size={20} color={DS.primary} />
                </Pressable>
              </View>
            </>
          )}

          {contentType === 'wifi' && (
            <>
              <Text style={styles.label}>Wi-Fi Network Details</Text>
              <TextInput
                style={styles.input}
                placeholder="Network Name (SSID)"
                placeholderTextColor={DS.outline}
                value={wifiData.ssid}
                onChangeText={(t) => setWifiData({ ssid: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={DS.outline}
                value={wifiData.password}
                onChangeText={(t) => setWifiData({ password: t })}
                secureTextEntry
              />
              <View style={styles.encRow}>
                {(['WPA', 'WEP', 'nopass'] as const).map((enc) => (
                  <Pressable
                    key={enc}
                    style={[styles.encChip, wifiData.encryption === enc && styles.encChipActive]}
                    onPress={() => setWifiData({ encryption: enc })}>
                    <Text style={[styles.encText, wifiData.encryption === enc && styles.encTextActive]}>
                      {enc === 'nopass' ? 'None' : enc}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

          {contentType === 'contact' && (
            <>
              <Text style={styles.label}>Contact Information</Text>
              <TextInput
                style={styles.input}
                placeholder="Full Name"
                placeholderTextColor={DS.outline}
                value={contactData.name}
                onChangeText={(t) => setContactData({ name: t })}
              />
              <TextInput
                style={styles.input}
                placeholder="Phone Number"
                placeholderTextColor={DS.outline}
                value={contactData.phone}
                onChangeText={(t) => setContactData({ phone: t })}
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor={DS.outline}
                value={contactData.email}
                onChangeText={(t) => setContactData({ email: t })}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </>
          )}
        </View>

        {/* Template Grid Section */}
        <View style={styles.section}>
          <Text style={styles.label}>Choose Base Template</Text>
          <View style={styles.templateGrid}>
            {TEMPLATES.map((tpl) => (
              <Pressable
                key={tpl.id}
                style={[styles.templateCard, templateId === tpl.id && styles.templateCardSelected]}
                onPress={() => applyTemplate(tpl.id)}>
                <View style={styles.templatePreview}>
                  <MaterialIcons name="qr-code-2" size={48} color={DS.onSurfaceVariant} style={{ opacity: 0.3 }} />
                </View>
                <View style={styles.templateOverlay}>
                  <Text style={styles.templateName}>{tpl.name}</Text>
                  <Text style={styles.templateDesc}>{tpl.desc}</Text>
                </View>
                {templateId === tpl.id && (
                  <View style={styles.checkBadge}>
                    <MaterialIcons name="check" size={14} color={DS.onPrimary} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* Continue Button */}
      <View style={styles.floatingBtnWrapper}>
        <Pressable style={[styles.continueBtn, !canContinue() && { opacity: 0.5 }]} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Continue to Studio</Text>
          <MaterialIcons name="arrow-forward" size={20} color={DS.onPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.surface },
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 24 },
  header: { gap: 6 },
  title: { fontSize: 34, fontWeight: '800', color: DS.onSurface, letterSpacing: -0.5 },
  subtitle: { fontSize: 16, color: DS.onSurfaceVariant, lineHeight: 22 },
  section: { gap: 14 },
  label: { fontSize: 11, fontWeight: '700', color: DS.onSurfaceVariant, letterSpacing: 1.5, textTransform: 'uppercase' },
  inputWrapper: { position: 'relative', flexDirection: 'row', alignItems: 'flex-start' },
  input: {
    flex: 1,
    backgroundColor: DS.surfaceContainerHighest,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingRight: 48,
    color: DS.onSurface,
    fontSize: 15,
  },
  pasteBtn: { position: 'absolute', right: 12, top: 14, padding: 4 },
  typeGrid: { flexDirection: 'row', gap: 10 },
  typeCard: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, borderRadius: 12,
    backgroundColor: DS.surfaceContainerHigh, gap: 6,
  },
  typeCardActive: { backgroundColor: DS.surfaceContainerHighest, borderColor: DS.secondaryFixedDim, borderWidth: 1 },
  typeLabel: { fontSize: 10, fontWeight: '700', color: DS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.5 },
  typeLabelActive: { color: DS.secondaryFixedDim },
  encRow: { flexDirection: 'row', gap: 10 },
  encChip: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 999,
    backgroundColor: DS.surfaceContainerHigh,
  },
  encChipActive: { backgroundColor: DS.secondaryContainer },
  encText: { fontSize: 13, fontWeight: '600', color: DS.onSurfaceVariant },
  encTextActive: { color: DS.onSecondaryContainer },
  templateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  templateCard: {
    width: '47%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden',
    backgroundColor: DS.surfaceBright, position: 'relative',
  },
  templateCardSelected: { borderWidth: 2, borderColor: DS.primary },
  templatePreview: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  templateOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: 'rgba(18, 20, 22, 0.8)',
  },
  templateName: { fontSize: 13, fontWeight: '700', color: DS.onSurface },
  templateDesc: { fontSize: 10, color: DS.onSurfaceVariant, marginTop: 1 },
  checkBadge: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: DS.primary, width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  floatingBtnWrapper: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  continueBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: DS.primary, paddingHorizontal: 36, paddingVertical: 18, borderRadius: 999,
    shadowColor: DS.primaryContainer, shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3, shadowRadius: 20, elevation: 8,
  },
  continueBtnText: { color: DS.onPrimary, fontWeight: '800', fontSize: 16 },
});
