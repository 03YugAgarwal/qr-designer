import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQRDesign, type ScanHistoryEntry } from '@/context/qr-design-context';
import { DS } from '@/constants/theme';

// --- Content type detection ---

type DetectedKind =
  | 'url'
  | 'wifi'
  | 'vcard'
  | 'mecard'
  | 'email'
  | 'phone'
  | 'sms'
  | 'geo'
  | 'upi'
  | 'bitcoin'
  | 'ethereum'
  | 'paypal'
  | 'youtube'
  | 'spotify'
  | 'whatsapp'
  | 'instagram'
  | 'twitter'
  | 'facebook'
  | 'linkedin'
  | 'telegram'
  | 'maps'
  | 'playstore'
  | 'appstore'
  | 'calendar'
  | 'magnet'
  | 'otpauth'
  | 'text';

interface DetectedContent {
  kind: DetectedKind;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  primaryAction?: {
    label: string;
    appName: string;
    onPress: () => void;
  };
  parsedFields?: { label: string; value: string }[];
}

function tryOpen(url: string, fallbackMsg: string): void {
  Linking.canOpenURL(url)
    .then((supported) => {
      if (supported) {
        return Linking.openURL(url);
      } else {
        Alert.alert('No App Found', fallbackMsg);
      }
    })
    .catch(() => Alert.alert('Error', 'Could not open this content.'));
}

function parseWifi(data: string) {
  // WIFI:T:WPA;S:NetworkName;P:password;H:true;;
  const fields: Record<string, string> = {};
  const body = data.replace(/^WIFI:/i, '').replace(/;;$/, '');
  body.split(';').forEach((part) => {
    const [k, ...rest] = part.split(':');
    if (k && rest.length) fields[k.toUpperCase()] = rest.join(':');
  });
  return {
    ssid: fields['S'] || '',
    password: fields['P'] || '',
    encryption: fields['T'] || 'WPA',
    hidden: fields['H'] === 'true',
  };
}

function parseVCard(data: string) {
  const fields: Record<string, string> = {};
  data.split(/\r?\n/).forEach((line) => {
    const m = line.match(/^([A-Z]+)(?:;[^:]*)?:(.+)$/i);
    if (m) {
      const key = m[1].toUpperCase();
      if (!fields[key]) fields[key] = m[2];
    }
  });
  return {
    name: fields['FN'] || fields['N']?.replace(/;/g, ' ').trim() || '',
    phone: fields['TEL'] || '',
    email: fields['EMAIL'] || '',
    org: fields['ORG'] || '',
    title: fields['TITLE'] || '',
    url: fields['URL'] || '',
  };
}

function parseMeCard(data: string) {
  // MECARD:N:Name;TEL:1234;EMAIL:foo@bar;;
  const fields: Record<string, string> = {};
  const body = data.replace(/^MECARD:/i, '').replace(/;;$/, '');
  body.split(';').forEach((part) => {
    const [k, ...rest] = part.split(':');
    if (k && rest.length) fields[k.toUpperCase()] = rest.join(':');
  });
  return {
    name: fields['N'] || '',
    phone: fields['TEL'] || '',
    email: fields['EMAIL'] || '',
    url: fields['URL'] || '',
  };
}

function detectContent(data: string): DetectedContent {
  const lower = data.toLowerCase();

  // --- UPI Payment (Google Pay, PhonePe, Paytm) ---
  if (lower.startsWith('upi://')) {
    const url = new URL(data.replace('upi://', 'https://upi/'));
    const pa = url.searchParams.get('pa') || '';
    const pn = url.searchParams.get('pn') || '';
    const am = url.searchParams.get('am') || '';
    return {
      kind: 'upi',
      label: 'UPI Payment',
      icon: 'payments',
      iconColor: '#00c853',
      primaryAction: {
        label: 'Pay with UPI App',
        appName: 'Google Pay / PhonePe / Paytm',
        onPress: () => tryOpen(data, 'No UPI payment app installed.'),
      },
      parsedFields: [
        pn && { label: 'Payee', value: pn },
        pa && { label: 'UPI ID', value: pa },
        am && { label: 'Amount', value: `₹${am}` },
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  // --- Bitcoin / Crypto ---
  if (lower.startsWith('bitcoin:')) {
    return {
      kind: 'bitcoin',
      label: 'Bitcoin Address',
      icon: 'currency-bitcoin',
      iconColor: '#f7931a',
      primaryAction: { label: 'Open in Wallet', appName: 'Bitcoin Wallet', onPress: () => tryOpen(data, 'No Bitcoin wallet app installed.') },
    };
  }
  if (lower.startsWith('ethereum:')) {
    return {
      kind: 'ethereum',
      label: 'Ethereum Address',
      icon: 'token',
      iconColor: '#627eea',
      primaryAction: { label: 'Open in Wallet', appName: 'Crypto Wallet', onPress: () => tryOpen(data, 'No crypto wallet app installed.') },
    };
  }

  // --- PayPal ---
  if (lower.includes('paypal.me/') || lower.startsWith('paypal:')) {
    return {
      kind: 'paypal',
      label: 'PayPal Payment',
      icon: 'payments',
      iconColor: '#003087',
      primaryAction: { label: 'Open in PayPal', appName: 'PayPal', onPress: () => tryOpen(data, 'PayPal app or browser not available.') },
    };
  }

  // --- WhatsApp ---
  if (lower.includes('wa.me/') || lower.startsWith('whatsapp:')) {
    return {
      kind: 'whatsapp',
      label: 'WhatsApp',
      icon: 'chat',
      iconColor: '#25d366',
      primaryAction: { label: 'Open in WhatsApp', appName: 'WhatsApp', onPress: () => tryOpen(data, 'WhatsApp not installed.') },
    };
  }

  // --- Instagram ---
  if (lower.includes('instagram.com/') || lower.startsWith('instagram:')) {
    return {
      kind: 'instagram',
      label: 'Instagram',
      icon: 'camera-alt',
      iconColor: '#e1306c',
      primaryAction: { label: 'Open in Instagram', appName: 'Instagram', onPress: () => tryOpen(data, 'Instagram not installed.') },
    };
  }

  // --- Twitter / X ---
  if (lower.includes('twitter.com/') || lower.includes('x.com/')) {
    return {
      kind: 'twitter',
      label: 'X (Twitter)',
      icon: 'alternate-email',
      iconColor: '#1da1f2',
      primaryAction: { label: 'Open Profile', appName: 'X / Browser', onPress: () => tryOpen(data, 'Could not open link.') },
    };
  }

  // --- Facebook ---
  if (lower.includes('facebook.com/') || lower.includes('fb.com/')) {
    return {
      kind: 'facebook',
      label: 'Facebook',
      icon: 'thumb-up',
      iconColor: '#1877f2',
      primaryAction: { label: 'Open in Facebook', appName: 'Facebook', onPress: () => tryOpen(data, 'Could not open link.') },
    };
  }

  // --- LinkedIn ---
  if (lower.includes('linkedin.com/')) {
    return {
      kind: 'linkedin',
      label: 'LinkedIn',
      icon: 'work',
      iconColor: '#0a66c2',
      primaryAction: { label: 'Open in LinkedIn', appName: 'LinkedIn', onPress: () => tryOpen(data, 'Could not open link.') },
    };
  }

  // --- Telegram ---
  if (lower.includes('t.me/') || lower.startsWith('tg:')) {
    return {
      kind: 'telegram',
      label: 'Telegram',
      icon: 'send',
      iconColor: '#0088cc',
      primaryAction: { label: 'Open in Telegram', appName: 'Telegram', onPress: () => tryOpen(data, 'Telegram not installed.') },
    };
  }

  // --- YouTube ---
  if (lower.includes('youtube.com/') || lower.includes('youtu.be/')) {
    return {
      kind: 'youtube',
      label: 'YouTube',
      icon: 'play-circle-filled',
      iconColor: '#ff0000',
      primaryAction: { label: 'Open in YouTube', appName: 'YouTube', onPress: () => tryOpen(data, 'Could not open link.') },
    };
  }

  // --- Spotify ---
  if (lower.startsWith('spotify:') || lower.includes('open.spotify.com/')) {
    return {
      kind: 'spotify',
      label: 'Spotify',
      icon: 'music-note',
      iconColor: '#1db954',
      primaryAction: { label: 'Open in Spotify', appName: 'Spotify', onPress: () => tryOpen(data, 'Spotify not installed.') },
    };
  }

  // --- Play Store ---
  if (lower.startsWith('market://') || lower.includes('play.google.com/store/')) {
    return {
      kind: 'playstore',
      label: 'Play Store App',
      icon: 'android',
      iconColor: '#3ddc84',
      primaryAction: { label: 'Open in Play Store', appName: 'Play Store', onPress: () => tryOpen(data, 'Could not open Play Store.') },
    };
  }

  // --- App Store ---
  if (lower.startsWith('itms-apps:') || lower.includes('apps.apple.com/')) {
    return {
      kind: 'appstore',
      label: 'App Store App',
      icon: 'apple',
      iconColor: '#a2aaad',
      primaryAction: { label: 'Open in App Store', appName: 'App Store', onPress: () => tryOpen(data, 'Could not open App Store.') },
    };
  }

  // --- Maps / Geo ---
  if (lower.startsWith('geo:') || lower.includes('maps.google.com/') || lower.includes('google.com/maps/') || lower.includes('maps.apple.com/')) {
    return {
      kind: 'maps',
      label: 'Location',
      icon: 'location-on',
      iconColor: '#ea4335',
      primaryAction: { label: 'Open in Maps', appName: 'Maps', onPress: () => tryOpen(data, 'No maps app installed.') },
    };
  }

  // --- WiFi ---
  if (data.toUpperCase().startsWith('WIFI:')) {
    const wifi = parseWifi(data);
    return {
      kind: 'wifi',
      label: 'Wi-Fi Network',
      icon: 'wifi',
      iconColor: '#00daf3',
      primaryAction: {
        label: 'Copy Password',
        appName: 'Clipboard',
        onPress: async () => {
          if (wifi.password) {
            await Clipboard.setStringAsync(wifi.password);
            Alert.alert('Copied!', 'Wi-Fi password copied to clipboard.');
          } else {
            Alert.alert('Open Network', 'This network has no password.');
          }
        },
      },
      parsedFields: [
        { label: 'Network', value: wifi.ssid },
        { label: 'Security', value: wifi.encryption === 'nopass' ? 'None' : wifi.encryption },
        wifi.password && { label: 'Password', value: wifi.password },
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  // --- vCard ---
  if (data.toUpperCase().startsWith('BEGIN:VCARD')) {
    const v = parseVCard(data);
    return {
      kind: 'vcard',
      label: 'Contact Card',
      icon: 'person',
      iconColor: '#bbc3ff',
      primaryAction: v.phone ? {
        label: 'Call',
        appName: 'Phone',
        onPress: () => tryOpen(`tel:${v.phone}`, 'Cannot make calls.'),
      } : undefined,
      parsedFields: [
        v.name && { label: 'Name', value: v.name },
        v.org && { label: 'Company', value: v.org },
        v.title && { label: 'Title', value: v.title },
        v.phone && { label: 'Phone', value: v.phone },
        v.email && { label: 'Email', value: v.email },
        v.url && { label: 'Website', value: v.url },
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  // --- MeCard ---
  if (data.toUpperCase().startsWith('MECARD:')) {
    const m = parseMeCard(data);
    return {
      kind: 'mecard',
      label: 'Contact (MeCard)',
      icon: 'person',
      iconColor: '#bbc3ff',
      primaryAction: m.phone ? {
        label: 'Call',
        appName: 'Phone',
        onPress: () => tryOpen(`tel:${m.phone}`, 'Cannot make calls.'),
      } : undefined,
      parsedFields: [
        m.name && { label: 'Name', value: m.name },
        m.phone && { label: 'Phone', value: m.phone },
        m.email && { label: 'Email', value: m.email },
        m.url && { label: 'Website', value: m.url },
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  // --- Email ---
  if (lower.startsWith('mailto:') || lower.startsWith('matmsg:')) {
    const addr = data.replace(/^mailto:/i, '').split('?')[0];
    return {
      kind: 'email',
      label: 'Email',
      icon: 'email',
      iconColor: '#ea4335',
      primaryAction: { label: 'Send Email', appName: 'Email App', onPress: () => tryOpen(data, 'No email app installed.') },
      parsedFields: [{ label: 'To', value: addr }],
    };
  }

  // --- SMS ---
  if (lower.startsWith('sms:') || lower.startsWith('smsto:')) {
    return {
      kind: 'sms',
      label: 'SMS Message',
      icon: 'sms',
      iconColor: '#25d366',
      primaryAction: { label: 'Send SMS', appName: 'Messages', onPress: () => tryOpen(data, 'Cannot send SMS.') },
    };
  }

  // --- Phone ---
  if (lower.startsWith('tel:') || lower.startsWith('telprompt:')) {
    return {
      kind: 'phone',
      label: 'Phone Number',
      icon: 'call',
      iconColor: '#00c853',
      primaryAction: { label: 'Call', appName: 'Phone', onPress: () => tryOpen(data, 'Cannot make calls.') },
      parsedFields: [{ label: 'Number', value: data.replace(/^tel:/i, '') }],
    };
  }

  // --- Calendar Event ---
  if (data.toUpperCase().startsWith('BEGIN:VEVENT') || data.toUpperCase().startsWith('BEGIN:VCALENDAR')) {
    return {
      kind: 'calendar',
      label: 'Calendar Event',
      icon: 'event',
      iconColor: '#4285f4',
      primaryAction: {
        label: 'Copy Event Data',
        appName: 'Clipboard',
        onPress: async () => {
          await Clipboard.setStringAsync(data);
          Alert.alert('Copied!', 'Event data copied. Paste it into your calendar app.');
        },
      },
    };
  }

  // --- 2FA / OTP ---
  if (lower.startsWith('otpauth://')) {
    return {
      kind: 'otpauth',
      label: '2FA Token',
      icon: 'security',
      iconColor: '#ff6b35',
      primaryAction: { label: 'Open in Authenticator', appName: 'Authenticator App', onPress: () => tryOpen(data, 'No authenticator app installed.') },
    };
  }

  // --- Magnet link ---
  if (lower.startsWith('magnet:')) {
    return {
      kind: 'magnet',
      label: 'Magnet Link',
      icon: 'link',
      iconColor: '#9c27b0',
      primaryAction: { label: 'Open in Torrent App', appName: 'Torrent Client', onPress: () => tryOpen(data, 'No torrent app installed.') },
    };
  }

  // --- HTTP/HTTPS ---
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    let host = '';
    try { host = new URL(data).hostname.replace(/^www\./, ''); } catch {}
    return {
      kind: 'url',
      label: 'Website',
      icon: 'language',
      iconColor: '#4285f4',
      primaryAction: { label: 'Open in Browser', appName: 'Browser', onPress: () => tryOpen(data, 'Could not open URL.') },
      parsedFields: host ? [{ label: 'Host', value: host }] : undefined,
    };
  }

  // --- Generic deep link (something://) ---
  if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(data)) {
    return {
      kind: 'text',
      label: 'Deep Link',
      icon: 'open-in-new',
      iconColor: DS.secondary,
      primaryAction: { label: 'Try Open', appName: 'Compatible App', onPress: () => tryOpen(data, 'No app handles this link.') },
    };
  }

  // --- Plain text ---
  return {
    kind: 'text',
    label: 'Text',
    icon: 'text-fields',
    iconColor: DS.onSurfaceVariant,
  };
}

// === MAIN COMPONENT ===

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<{ type: string; data: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { scanHistory, addScanToHistory, deleteScanFromHistory, clearScanHistory } = useQRDesign();
  const screenWidth = Dimensions.get('window').width;
  const frameSize = Math.min(screenWidth - 80, 280);

  const detected = useMemo(() => (scanned ? detectContent(scanned.data) : null), [scanned]);

  const handleBarcodeScanned = useCallback(({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned({ type, data });
    addScanToHistory(data, type);
  }, [scanned, addScanToHistory]);

  const handleCopy = useCallback(async () => {
    if (scanned) {
      await Clipboard.setStringAsync(scanned.data);
      Alert.alert('Copied!', 'Raw data copied to clipboard.');
    }
  }, [scanned]);

  const handleScanAgain = useCallback(() => setScanned(null), []);

  const handleHistoryItemPress = useCallback((entry: ScanHistoryEntry) => {
    setHistoryOpen(false);
    setScanned({ data: entry.data, type: entry.type });
  }, []);

  const handleClearHistory = useCallback(() => {
    Alert.alert('Clear History', 'Remove all scanned items? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => clearScanHistory() },
    ]);
  }, [clearScanHistory]);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    deleteScanFromHistory(id);
  }, [deleteScanFromHistory]);

  // --- Permission states ---
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.statusText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionBox}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="qr-code-scanner" size={48} color={DS.secondary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionDesc}>To scan QR codes, please allow access to your camera.</Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>Grant Permission</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr', 'pdf417', 'aztec', 'datamatrix', 'ean13', 'ean8', 'code128', 'code39'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Header */}
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <Text style={styles.headerSubtitle}>Position the code inside the frame</Text>
      </View>

      {/* History button */}
      <Pressable style={styles.historyFab} onPress={() => setHistoryOpen(true)} hitSlop={8}>
        <MaterialIcons name="history" size={22} color={DS.onSurface} />
        {scanHistory.length > 0 && (
          <View style={styles.historyBadge}>
            <Text style={styles.historyBadgeText}>{scanHistory.length > 99 ? '99+' : scanHistory.length}</Text>
          </View>
        )}
      </Pressable>

      {/* Scanning frame */}
      <View style={styles.frameWrapper} pointerEvents="none">
        <View style={[styles.scanFrame, { width: frameSize, height: frameSize }]}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </View>

      {/* Result overlay */}
      {scanned && detected && (
        <View style={styles.resultOverlay}>
          <ScrollView style={styles.resultCard} contentContainerStyle={{ gap: 14 }}>
            {/* Header */}
            <View style={styles.resultHeader}>
              <View style={[styles.resultIcon, { backgroundColor: `${detected.iconColor}22` }]}>
                <MaterialIcons name={detected.icon} size={26} color={detected.iconColor} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resultLabel}>Detected</Text>
                <Text style={styles.resultType}>{detected.label}</Text>
              </View>
            </View>

            {/* Parsed fields */}
            {detected.parsedFields && detected.parsedFields.length > 0 && (
              <View style={styles.fieldsBox}>
                {detected.parsedFields.map((f, i) => (
                  <View key={i} style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>{f.label}</Text>
                    <Text style={styles.fieldValue} numberOfLines={2}>{f.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Raw data */}
            {(!detected.parsedFields || detected.parsedFields.length === 0) && (
              <Text style={styles.resultData} numberOfLines={6}>{scanned.data}</Text>
            )}

            {/* Primary action */}
            {detected.primaryAction && (
              <Pressable style={styles.primaryActionBtn} onPress={detected.primaryAction.onPress}>
                <MaterialIcons name="open-in-new" size={20} color={DS.onPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.primaryActionText}>{detected.primaryAction.label}</Text>
                  <Text style={styles.primaryActionSub}>{detected.primaryAction.appName}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={DS.onPrimary} />
              </Pressable>
            )}

            {/* Secondary actions */}
            <View style={styles.resultActions}>
              <Pressable style={styles.actionBtn} onPress={handleCopy}>
                <MaterialIcons name="content-copy" size={18} color={DS.primary} />
                <Text style={styles.actionBtnText}>Copy</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.scanAgainBtn]} onPress={handleScanAgain}>
                <MaterialIcons name="qr-code-scanner" size={18} color={DS.onPrimary} />
                <Text style={[styles.actionBtnText, { color: DS.onPrimary }]}>Scan Again</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      )}

      {/* History panel */}
      {historyOpen && (
        <View style={styles.historyOverlay}>
          <View style={styles.historyPanel}>
            <View style={styles.historyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.historyTitle}>Scan History</Text>
                <Text style={styles.historySubtitle}>
                  {scanHistory.length === 0 ? 'No scans yet' : `${scanHistory.length} ${scanHistory.length === 1 ? 'scan' : 'scans'}`}
                </Text>
              </View>
              {scanHistory.length > 0 && (
                <Pressable style={styles.clearAllBtn} onPress={handleClearHistory}>
                  <MaterialIcons name="delete-sweep" size={18} color={DS.error} />
                  <Text style={styles.clearAllText}>Clear All</Text>
                </Pressable>
              )}
              <Pressable style={styles.closeBtn} onPress={() => setHistoryOpen(false)}>
                <MaterialIcons name="close" size={22} color={DS.onSurface} />
              </Pressable>
            </View>

            {scanHistory.length === 0 ? (
              <View style={styles.historyEmpty}>
                <MaterialIcons name="history" size={48} color={DS.outlineVariant} />
                <Text style={styles.historyEmptyText}>Scanned codes will appear here</Text>
              </View>
            ) : (
              <ScrollView style={styles.historyList} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
                {scanHistory.map((entry) => {
                  const det = detectContent(entry.data);
                  return (
                    <Pressable
                      key={entry.id}
                      style={styles.historyItem}
                      onPress={() => handleHistoryItemPress(entry)}>
                      <View style={[styles.historyItemIcon, { backgroundColor: `${det.iconColor}22` }]}>
                        <MaterialIcons name={det.icon} size={20} color={det.iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.historyItemLabel}>{det.label}</Text>
                        <Text style={styles.historyItemData} numberOfLines={1}>{entry.data}</Text>
                        <Text style={styles.historyItemTime}>{historyTimeAgo(entry.scannedAt)}</Text>
                      </View>
                      <Pressable
                        hitSlop={10}
                        style={styles.historyDeleteBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDeleteHistoryItem(entry.id);
                        }}>
                        <MaterialIcons name="delete-outline" size={20} color={DS.onSurfaceVariant} />
                      </Pressable>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

function historyTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, backgroundColor: DS.surface, alignItems: 'center', justifyContent: 'center', padding: 24 },
  statusText: { color: DS.onSurfaceVariant, fontSize: 14 },

  permissionBox: { alignItems: 'center', gap: 14, maxWidth: 320 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: DS.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: DS.onSurface, marginTop: 4 },
  permissionDesc: { fontSize: 14, color: DS.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  permissionBtn: { backgroundColor: DS.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  permissionBtnText: { color: DS.onPrimary, fontWeight: '800', fontSize: 15 },

  headerOverlay: { position: 'absolute', top: 30, left: 0, right: 0, alignItems: 'center', gap: 4, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  frameWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { position: 'relative' },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: DS.secondaryFixedDim },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },

  // Result
  resultOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 20, maxHeight: '70%' },
  resultCard: {
    backgroundColor: DS.surfaceContainerHigh, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: `${DS.secondaryFixedDim}33`,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultLabel: { fontSize: 10, fontWeight: '700', color: DS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  resultType: { fontSize: 17, fontWeight: '800', color: DS.onSurface, marginTop: 1 },

  fieldsBox: {
    backgroundColor: DS.surfaceContainerLowest, borderRadius: 12, padding: 12, gap: 8,
  },
  fieldRow: { gap: 2 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: DS.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldValue: { fontSize: 14, fontWeight: '600', color: DS.onSurface },

  resultData: {
    fontSize: 13, color: DS.onSurface, lineHeight: 19,
    backgroundColor: DS.surfaceContainerLowest, padding: 12, borderRadius: 10,
  },

  primaryActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: DS.primary, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
  },
  primaryActionText: { fontSize: 14, fontWeight: '800', color: DS.onPrimary },
  primaryActionSub: { fontSize: 11, fontWeight: '600', color: DS.onPrimary, opacity: 0.7, marginTop: 1 },

  resultActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 10, backgroundColor: DS.surfaceContainer,
  },
  scanAgainBtn: { backgroundColor: DS.primaryContainer },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: DS.primary },

  // History FAB
  historyFab: {
    position: 'absolute', top: 24, right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(40, 42, 44, 0.85)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${DS.outlineVariant}55`,
  },
  historyBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: DS.secondaryFixedDim,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: DS.surface,
  },
  historyBadgeText: { fontSize: 9, fontWeight: '900', color: DS.surface },

  // History Panel
  historyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  historyPanel: {
    backgroundColor: DS.surfaceContainerLow,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24,
    maxHeight: '85%',
  },
  historyHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingBottom: 14, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: `${DS.outlineVariant}22`,
  },
  historyTitle: { fontSize: 20, fontWeight: '800', color: DS.onSurface },
  historySubtitle: { fontSize: 12, color: DS.onSurfaceVariant, marginTop: 2 },
  clearAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: `${DS.errorContainer}33`,
  },
  clearAllText: { fontSize: 12, fontWeight: '700', color: DS.error },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: DS.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  historyEmpty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  historyEmptyText: { fontSize: 14, color: DS.onSurfaceVariant },
  historyList: { maxHeight: '100%' },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: DS.surfaceContainerHigh,
    borderRadius: 12, padding: 12,
  },
  historyItemIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  historyItemLabel: { fontSize: 12, fontWeight: '700', color: DS.onSurface },
  historyItemData: { fontSize: 13, color: DS.onSurfaceVariant, marginTop: 1 },
  historyItemTime: { fontSize: 10, color: DS.outline, marginTop: 3 },
  historyDeleteBtn: { padding: 6 },
});
