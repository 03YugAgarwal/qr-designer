import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Alert,
  Dimensions,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useQRDesign, type ScanHistoryEntry } from '@/context/qr-design-context';
import { useDS, type DSPalette } from '@/theme/theme-provider';
import { useT } from '@/i18n';

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

type TFn = (key: string, fallback?: string) => string;

function detectContent(data: string, ds: DSPalette, t: TFn): DetectedContent {
  const lower = data.toLowerCase();

  if (lower.startsWith('upi://')) {
    const url = new URL(data.replace('upi://', 'https://upi/'));
    const pa = url.searchParams.get('pa') || '';
    const pn = url.searchParams.get('pn') || '';
    const am = url.searchParams.get('am') || '';
    return {
      kind: 'upi',
      label: t('scan.kinds.upi'),
      icon: 'payments',
      iconColor: '#00c853',
      primaryAction: {
        label: t('scan.actions.payUpi'),
        appName: t('scan.appNames.upiApp'),
        onPress: () => tryOpen(data, t('scan.appNames.noUpi')),
      },
      parsedFields: [
        pn && { label: t('scan.kinds.mecard'), value: pn },
        pa && { label: 'UPI ID', value: pa },
        am && { label: 'Amount', value: `₹${am}` },
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  if (lower.startsWith('bitcoin:')) {
    return {
      kind: 'bitcoin', label: t('scan.kinds.bitcoin'), icon: 'currency-bitcoin', iconColor: '#f7931a',
      primaryAction: { label: t('scan.actions.openWallet'), appName: t('scan.appNames.btcWallet'), onPress: () => tryOpen(data, t('scan.appNames.noBtc')) },
    };
  }
  if (lower.startsWith('ethereum:')) {
    return {
      kind: 'ethereum', label: t('scan.kinds.ethereum'), icon: 'token', iconColor: '#627eea',
      primaryAction: { label: t('scan.actions.openWallet'), appName: t('scan.appNames.cryptoWallet'), onPress: () => tryOpen(data, t('scan.appNames.noCrypto')) },
    };
  }

  if (lower.includes('paypal.me/') || lower.startsWith('paypal:')) {
    return {
      kind: 'paypal', label: t('scan.kinds.paypal'), icon: 'payments', iconColor: '#003087',
      primaryAction: { label: t('scan.actions.openPayPal'), appName: t('scan.appNames.paypal'), onPress: () => tryOpen(data, t('scan.appNames.noPaypal')) },
    };
  }

  if (lower.includes('wa.me/') || lower.startsWith('whatsapp:')) {
    return {
      kind: 'whatsapp', label: t('scan.kinds.whatsapp'), icon: 'chat', iconColor: '#25d366',
      primaryAction: { label: t('scan.actions.openApp'), appName: t('scan.appNames.whatsapp'), onPress: () => tryOpen(data, t('scan.appNames.noWhatsapp')) },
    };
  }

  if (lower.includes('instagram.com/') || lower.startsWith('instagram:')) {
    return {
      kind: 'instagram', label: t('scan.kinds.instagram'), icon: 'camera-alt', iconColor: '#e1306c',
      primaryAction: { label: t('scan.actions.openApp'), appName: t('scan.appNames.instagram'), onPress: () => tryOpen(data, t('scan.appNames.noInstagram')) },
    };
  }

  if (lower.includes('twitter.com/') || lower.includes('x.com/')) {
    return {
      kind: 'twitter', label: t('scan.kinds.twitter'), icon: 'alternate-email', iconColor: '#1da1f2',
      primaryAction: { label: t('scan.actions.openApp'), appName: t('scan.appNames.twitter'), onPress: () => tryOpen(data, t('scan.appNames.noTwitter')) },
    };
  }

  if (lower.includes('facebook.com/') || lower.includes('fb.com/')) {
    return {
      kind: 'facebook', label: t('scan.kinds.facebook'), icon: 'thumb-up', iconColor: '#1877f2',
      primaryAction: { label: t('scan.actions.openApp'), appName: t('scan.appNames.facebook'), onPress: () => tryOpen(data, t('scan.appNames.noFacebook')) },
    };
  }

  if (lower.includes('linkedin.com/')) {
    return {
      kind: 'linkedin', label: t('scan.kinds.linkedin'), icon: 'work', iconColor: '#0a66c2',
      primaryAction: { label: t('scan.actions.openApp'), appName: t('scan.appNames.linkedin'), onPress: () => tryOpen(data, t('scan.appNames.noLinkedin')) },
    };
  }

  if (lower.includes('t.me/') || lower.startsWith('tg:')) {
    return {
      kind: 'telegram', label: t('scan.kinds.telegram'), icon: 'send', iconColor: '#0088cc',
      primaryAction: { label: t('scan.actions.openApp'), appName: t('scan.appNames.telegram'), onPress: () => tryOpen(data, t('scan.appNames.noTelegram')) },
    };
  }

  if (lower.includes('youtube.com/') || lower.includes('youtu.be/')) {
    return {
      kind: 'youtube', label: t('scan.kinds.youtube'), icon: 'play-circle-filled', iconColor: '#ff0000',
      primaryAction: { label: t('scan.actions.openApp'), appName: t('scan.appNames.youtube'), onPress: () => tryOpen(data, t('scan.appNames.noYoutube')) },
    };
  }

  if (lower.startsWith('spotify:') || lower.includes('open.spotify.com/')) {
    return {
      kind: 'spotify', label: t('scan.kinds.spotify'), icon: 'music-note', iconColor: '#1db954',
      primaryAction: { label: t('scan.actions.openApp'), appName: t('scan.appNames.spotify'), onPress: () => tryOpen(data, t('scan.appNames.noSpotify')) },
    };
  }

  if (lower.startsWith('market://') || lower.includes('play.google.com/store/')) {
    return {
      kind: 'playstore', label: t('scan.kinds.playstore'), icon: 'android', iconColor: '#3ddc84',
      primaryAction: { label: t('scan.actions.openPlayStore'), appName: t('scan.appNames.playstore'), onPress: () => tryOpen(data, t('scan.appNames.noPlayStore')) },
    };
  }

  if (lower.startsWith('itms-apps:') || lower.includes('apps.apple.com/')) {
    return {
      kind: 'appstore', label: t('scan.kinds.appstore'), icon: 'apple', iconColor: '#a2aaad',
      primaryAction: { label: t('scan.actions.openAppStore'), appName: t('scan.appNames.appstore'), onPress: () => tryOpen(data, t('scan.appNames.noAppStore')) },
    };
  }

  if (lower.startsWith('geo:') || lower.includes('maps.google.com/') || lower.includes('google.com/maps/') || lower.includes('maps.apple.com/')) {
    return {
      kind: 'maps', label: t('scan.kinds.maps'), icon: 'location-on', iconColor: '#ea4335',
      primaryAction: { label: t('scan.actions.openMap'), appName: t('scan.appNames.maps'), onPress: () => tryOpen(data, t('scan.appNames.noMaps')) },
    };
  }

  if (data.toUpperCase().startsWith('WIFI:')) {
    const wifi = parseWifi(data);
    return {
      kind: 'wifi', label: t('scan.kinds.wifi'), icon: 'wifi', iconColor: '#00daf3',
      primaryAction: {
        label: t('scan.actions.connectWifi'),
        appName: t('scan.appNames.wifiHint'),
        onPress: async () => {
          if (wifi.password) {
            await Clipboard.setStringAsync(wifi.password);
            Alert.alert(t('common.copied'), t('scan.copiedMsg'));
          }
        },
      },
      parsedFields: [
        { label: t('home.wifiSsid'), value: wifi.ssid },
        { label: t('home.wifiPassword'), value: wifi.encryption === 'nopass' ? t('common.none') : wifi.encryption },
        wifi.password && { label: t('home.wifiPassword'), value: wifi.password },
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  if (data.toUpperCase().startsWith('BEGIN:VCARD')) {
    const v = parseVCard(data);
    return {
      kind: 'vcard', label: t('scan.kinds.vcard'), icon: 'person', iconColor: '#bbc3ff',
      primaryAction: v.phone ? {
        label: t('scan.actions.call'), appName: t('scan.appNames.phone'),
        onPress: () => tryOpen(`tel:${v.phone}`, t('scan.appNames.noPhone')),
      } : undefined,
      parsedFields: [
        v.name && { label: t('home.contactName'), value: v.name },
        v.org && { label: 'Company', value: v.org },
        v.title && { label: 'Title', value: v.title },
        v.phone && { label: t('home.contactPhone'), value: v.phone },
        v.email && { label: t('home.contactEmail'), value: v.email },
        v.url && { label: t('scan.kinds.website'), value: v.url },
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  if (data.toUpperCase().startsWith('MECARD:')) {
    const m = parseMeCard(data);
    return {
      kind: 'mecard', label: t('scan.kinds.mecard'), icon: 'person', iconColor: '#bbc3ff',
      primaryAction: m.phone ? {
        label: t('scan.actions.call'), appName: t('scan.appNames.phone'),
        onPress: () => tryOpen(`tel:${m.phone}`, t('scan.appNames.noPhone')),
      } : undefined,
      parsedFields: [
        m.name && { label: t('home.contactName'), value: m.name },
        m.phone && { label: t('home.contactPhone'), value: m.phone },
        m.email && { label: t('home.contactEmail'), value: m.email },
        m.url && { label: t('scan.kinds.website'), value: m.url },
      ].filter(Boolean) as { label: string; value: string }[],
    };
  }

  if (lower.startsWith('mailto:') || lower.startsWith('matmsg:')) {
    const addr = data.replace(/^mailto:/i, '').split('?')[0];
    return {
      kind: 'email', label: t('scan.kinds.email'), icon: 'email', iconColor: '#ea4335',
      primaryAction: { label: t('scan.actions.sendEmail'), appName: t('scan.appNames.mail'), onPress: () => tryOpen(data, t('scan.appNames.noMail')) },
      parsedFields: [{ label: t('home.contactEmail'), value: addr }],
    };
  }

  if (lower.startsWith('sms:') || lower.startsWith('smsto:')) {
    return {
      kind: 'sms', label: t('scan.kinds.sms'), icon: 'sms', iconColor: '#25d366',
      primaryAction: { label: t('scan.actions.sendSms'), appName: t('scan.appNames.messages'), onPress: () => tryOpen(data, t('scan.appNames.noSms')) },
    };
  }

  if (lower.startsWith('tel:') || lower.startsWith('telprompt:')) {
    return {
      kind: 'phone', label: t('scan.kinds.phone'), icon: 'call', iconColor: '#00c853',
      primaryAction: { label: t('scan.actions.call'), appName: t('scan.appNames.phone'), onPress: () => tryOpen(data, t('scan.appNames.noPhone')) },
      parsedFields: [{ label: t('home.contactPhone'), value: data.replace(/^tel:/i, '') }],
    };
  }

  if (data.toUpperCase().startsWith('BEGIN:VEVENT') || data.toUpperCase().startsWith('BEGIN:VCALENDAR')) {
    return {
      kind: 'calendar', label: t('scan.kinds.calendar'), icon: 'event', iconColor: '#4285f4',
      primaryAction: {
        label: t('scan.actions.addCalendar'), appName: t('scan.appNames.calendar'),
        onPress: async () => {
          await Clipboard.setStringAsync(data);
          Alert.alert(t('common.copied'), t('scan.copiedMsg'));
        },
      },
    };
  }

  if (lower.startsWith('otpauth://')) {
    return {
      kind: 'otpauth', label: t('scan.kinds.otpauth'), icon: 'security', iconColor: '#ff6b35',
      primaryAction: { label: t('scan.actions.openApp'), appName: t('scan.appNames.compatible'), onPress: () => tryOpen(data, t('scan.appNames.noHandler')) },
    };
  }

  if (lower.startsWith('magnet:')) {
    return {
      kind: 'magnet', label: t('scan.kinds.magnet'), icon: 'link', iconColor: '#9c27b0',
      primaryAction: { label: t('scan.actions.openTorrent'), appName: t('scan.appNames.torrent'), onPress: () => tryOpen(data, t('scan.appNames.noTorrent')) },
    };
  }

  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    let host = '';
    try { host = new URL(data).hostname.replace(/^www\./, ''); } catch {}
    return {
      kind: 'url', label: t('scan.kinds.website'), icon: 'language', iconColor: '#4285f4',
      primaryAction: { label: t('scan.actions.openBrowser'), appName: t('scan.appNames.browser'), onPress: () => tryOpen(data, t('scan.appNames.noBrowser')) },
      parsedFields: host ? [{ label: 'Host', value: host }] : undefined,
    };
  }

  if (/^[a-z][a-z0-9+\-.]*:\/\//i.test(data)) {
    return {
      kind: 'text', label: t('scan.kinds.deeplink'), icon: 'open-in-new', iconColor: ds.secondary,
      primaryAction: { label: t('scan.actions.tryOpen'), appName: t('scan.appNames.compatible'), onPress: () => tryOpen(data, t('scan.appNames.noHandler')) },
    };
  }

  return {
    kind: 'text', label: t('scan.kinds.text'), icon: 'text-fields', iconColor: ds.onSurfaceVariant,
  };
}

// === MAIN COMPONENT ===

type ScanMode = 'qr' | 'barcode';

const QR_TYPES = ['qr', 'aztec', 'datamatrix', 'pdf417'] as const;
const BARCODE_TYPES = ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'code93', 'codabar', 'itf14'] as const;

export default function ScanScreen() {
  const t = useT();
  const ds = useDS();
  const styles = useMemo(() => createStyles(ds), [ds]);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState<{ type: string; data: string } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [scanMode, setScanMode] = useState<ScanMode>('qr');

  const activeBarcodeTypes = useMemo(
    () => (scanMode === 'qr' ? [...QR_TYPES] : [...BARCODE_TYPES]),
    [scanMode]
  );
  const { scanHistory, addScanToHistory, deleteScanFromHistory, clearScanHistory } = useQRDesign();
  const screenWidth = Dimensions.get('window').width;
  const frameSize = Math.min(screenWidth - 80, 280);

  const detected = useMemo(() => (scanned ? detectContent(scanned.data, ds, t) : null), [scanned, ds, t]);

  const isProductBarcode = useMemo(() => {
    if (!scanned) return false;
    const t = scanned.type.toLowerCase();
    if (/ean|upc/.test(t)) return /^\d{8,14}$/.test(scanned.data);
    return false;
  }, [scanned]);

  const [product, setProduct] = useState<
    | { status: 'loading' }
    | { status: 'found'; name: string; brand?: string; image?: string; quantity?: string; categories?: string }
    | { status: 'notfound' }
    | { status: 'error' }
    | null
  >(null);

  useEffect(() => {
    if (!scanned || !isProductBarcode) {
      setProduct(null);
      return;
    }
    let cancelled = false;
    setProduct({ status: 'loading' });
    fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(scanned.data)}.json?fields=product_name,brands,image_front_small_url,image_small_url,quantity,categories`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        if (json.status === 1 && json.product) {
          const p = json.product;
          const name = p.product_name || p.generic_name || '';
          if (!name) { setProduct({ status: 'notfound' }); return; }
          setProduct({
            status: 'found',
            name,
            brand: p.brands || undefined,
            image: p.image_front_small_url || p.image_small_url || undefined,
            quantity: p.quantity || undefined,
            categories: p.categories ? String(p.categories).split(',')[0].trim() : undefined,
          });
        } else {
          setProduct({ status: 'notfound' });
        }
      })
      .catch(() => { if (!cancelled) setProduct({ status: 'error' }); });
    return () => { cancelled = true; };
  }, [scanned, isProductBarcode]);

  const handleBarcodeScanned = useCallback(({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned({ type, data });
    addScanToHistory(data, type);
  }, [scanned, addScanToHistory]);

  const handleCopy = useCallback(async () => {
    if (scanned) {
      await Clipboard.setStringAsync(scanned.data);
      Alert.alert(t('common.copied'), t('scan.copiedMsg'));
    }
  }, [scanned]);

  const handleScanAgain = useCallback(() => setScanned(null), []);

  const handleHistoryItemPress = useCallback((entry: ScanHistoryEntry) => {
    setHistoryOpen(false);
    setScanned({ data: entry.data, type: entry.type });
  }, []);

  const handleClearHistory = useCallback(() => {
    Alert.alert(t('scan.historyClearTitle'), t('scan.historyClear'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.clearAll'), style: 'destructive', onPress: () => clearScanHistory() },
    ]);
  }, [clearScanHistory]);

  const handleDeleteHistoryItem = useCallback((id: string) => {
    deleteScanFromHistory(id);
  }, [deleteScanFromHistory]);

  // --- Permission states ---
  if (!permission) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.statusText}>{t('scan.loadingCamera')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.centerContainer}>
        <View style={styles.permissionBox}>
          <View style={styles.iconCircle}>
            <MaterialIcons name="qr-code-scanner" size={48} color={ds.secondary} />
          </View>
          <Text style={styles.permissionTitle}>{t('scan.permissionTitle')}</Text>
          <Text style={styles.permissionDesc}>{t('scan.permissionDesc')}</Text>
          <Pressable style={styles.permissionBtn} onPress={requestPermission}>
            <Text style={styles.permissionBtnText}>{t('scan.permissionGrant')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        key={scanMode}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: activeBarcodeTypes,
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Header */}
      <View style={styles.headerOverlay}>
        <Text style={styles.headerTitle}>
          {scanMode === 'qr' ? t('scan.title') : t('scan.titleBarcode')}
        </Text>
        <Text style={styles.headerSubtitle}>{t('scan.subtitle')}</Text>
      </View>

      {/* Mode selector */}
      <View style={styles.modeSelector} pointerEvents="box-none">
        <View style={styles.modeSelectorInner}>
          {(['qr', 'barcode'] as ScanMode[]).map((m) => {
            const active = scanMode === m;
            return (
              <Pressable
                key={m}
                style={[styles.modeOption, active && styles.modeOptionActive]}
                onPress={() => setScanMode(m)}>
                <MaterialIcons
                  name={m === 'qr' ? 'qr-code-2' : 'view-week'}
                  size={16}
                  color={active ? ds.onPrimary : '#fff'}
                />
                <Text style={[styles.modeOptionText, active && styles.modeOptionTextActive]}>
                  {m === 'qr' ? t('scan.modeQR') : t('scan.modeBarcode')}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* History button */}
      <Pressable style={styles.historyFab} onPress={() => setHistoryOpen(true)} hitSlop={8}>
        <MaterialIcons name="history" size={22} color="#fff" />
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
                <Text style={styles.resultLabel}>{t('scan.detected')}</Text>
                <Text style={styles.resultType}>
                  {isProductBarcode ? `Product Barcode (${scanned.type.toUpperCase()})` : detected.label}
                </Text>
              </View>
            </View>

            {/* Product lookup */}
            {isProductBarcode && (
              <View style={styles.productBox}>
                {product?.status === 'loading' && (
                  <View style={styles.productLoading}>
                    <ActivityIndicator size="small" color={ds.primary} />
                    <Text style={styles.productLoadingText}>{t('scan.productLookup')}</Text>
                  </View>
                )}
                {product?.status === 'found' && (
                  <View style={styles.productRow}>
                    {product.image ? (
                      <Image source={{ uri: product.image }} style={styles.productImage} />
                    ) : (
                      <View style={[styles.productImage, styles.productImagePlaceholder]}>
                        <MaterialIcons name="inventory-2" size={28} color={ds.onSurfaceVariant} />
                      </View>
                    )}
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                      {!!product.brand && <Text style={styles.productBrand} numberOfLines={1}>{product.brand}</Text>}
                      {!!product.quantity && <Text style={styles.productMeta} numberOfLines={1}>{product.quantity}</Text>}
                      {!!product.categories && <Text style={styles.productMeta} numberOfLines={1}>{product.categories}</Text>}
                    </View>
                  </View>
                )}
                {(product?.status === 'notfound' || product?.status === 'error') && (
                  <Text style={styles.productEmpty}>
                    {product.status === 'error' ? t('scan.productLookupFailed') : t('scan.productNotFound')}
                  </Text>
                )}
              </View>
            )}

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

            {/* Barcode online search */}
            {isProductBarcode && (
              <Pressable
                style={styles.primaryActionBtn}
                onPress={() => tryOpen(`https://www.google.com/search?q=${encodeURIComponent(scanned.data)}`, 'Could not open browser.')}>
                <MaterialIcons name="search" size={20} color={ds.onPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.primaryActionText}>{t('common.searchOnline')}</Text>
                  <Text style={styles.primaryActionSub}>{t('scan.googleThis')}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={ds.onPrimary} />
              </Pressable>
            )}

            {/* Primary action */}
            {!isProductBarcode && detected.primaryAction && (
              <Pressable style={styles.primaryActionBtn} onPress={detected.primaryAction.onPress}>
                <MaterialIcons name="open-in-new" size={20} color={ds.onPrimary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.primaryActionText}>{detected.primaryAction.label}</Text>
                  <Text style={styles.primaryActionSub}>{detected.primaryAction.appName}</Text>
                </View>
                <MaterialIcons name="arrow-forward" size={20} color={ds.onPrimary} />
              </Pressable>
            )}

            {/* Secondary actions */}
            <View style={styles.resultActions}>
              <Pressable style={styles.actionBtn} onPress={handleCopy}>
                <MaterialIcons name="content-copy" size={18} color={ds.primary} />
                <Text style={styles.actionBtnText}>{t('common.copy')}</Text>
              </Pressable>
              <Pressable style={[styles.actionBtn, styles.scanAgainBtn]} onPress={handleScanAgain}>
                <MaterialIcons name="qr-code-scanner" size={18} color={ds.onPrimary} />
                <Text style={[styles.actionBtnText, { color: ds.onPrimary }]}>{t('scan.scanAgain')}</Text>
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
                <Text style={styles.historyTitle}>{t('scan.history')}</Text>
                <Text style={styles.historySubtitle}>
                  {scanHistory.length === 0
                    ? t('scan.noScans')
                    : (scanHistory.length === 1 ? t('scan.scanCount') : t('scan.scansCount')).replace('{n}', String(scanHistory.length))}
                </Text>
              </View>
              {scanHistory.length > 0 && (
                <Pressable style={styles.clearAllBtn} onPress={handleClearHistory}>
                  <MaterialIcons name="delete-sweep" size={18} color={ds.error} />
                  <Text style={styles.clearAllText}>{t('common.clearAll')}</Text>
                </Pressable>
              )}
              <Pressable style={styles.closeBtn} onPress={() => setHistoryOpen(false)}>
                <MaterialIcons name="close" size={22} color={ds.onSurface} />
              </Pressable>
            </View>

            {scanHistory.length === 0 ? (
              <View style={styles.historyEmpty}>
                <MaterialIcons name="history" size={48} color={ds.outlineVariant} />
                <Text style={styles.historyEmptyText}>{t('scan.historyEmpty')}</Text>
              </View>
            ) : (
              <ScrollView style={styles.historyList} contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
                {scanHistory.map((entry) => {
                  const det = detectContent(entry.data, ds, t);
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
                        <MaterialIcons name="delete-outline" size={20} color={ds.onSurfaceVariant} />
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

function createStyles(ds: DSPalette) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centerContainer: { flex: 1, backgroundColor: ds.surface, alignItems: 'center', justifyContent: 'center', padding: 24 },
  statusText: { color: ds.onSurfaceVariant, fontSize: 14 },

  permissionBox: { alignItems: 'center', gap: 14, maxWidth: 320 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: ds.surfaceContainerHigh, alignItems: 'center', justifyContent: 'center' },
  permissionTitle: { fontSize: 22, fontWeight: '800', color: ds.onSurface, marginTop: 4 },
  permissionDesc: { fontSize: 14, color: ds.onSurfaceVariant, textAlign: 'center', lineHeight: 20 },
  permissionBtn: { backgroundColor: ds.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12, marginTop: 8 },
  permissionBtnText: { color: ds.onPrimary, fontWeight: '800', fontSize: 15 },

  headerOverlay: { position: 'absolute', top: 30, left: 0, right: 0, alignItems: 'center', gap: 4, paddingHorizontal: 20 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textShadowColor: 'rgba(0,0,0,0.6)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 },

  modeSelector: {
    position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center',
  },
  modeSelectorInner: {
    flexDirection: 'row', gap: 4, padding: 4,
    backgroundColor: 'rgba(40, 42, 44, 0.85)',
    borderRadius: 999,
    borderWidth: 1, borderColor: `${ds.outlineVariant}55`,
  },
  modeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
  },
  modeOptionActive: { backgroundColor: ds.primary },
  modeOptionText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  modeOptionTextActive: { color: ds.onPrimary },

  frameWrapper: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  scanFrame: { position: 'relative' },
  corner: { position: 'absolute', width: 36, height: 36, borderColor: ds.secondaryFixedDim },
  cornerTL: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 8 },

  // Result
  resultOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingHorizontal: 14, paddingBottom: 20, maxHeight: '70%' },
  resultCard: {
    backgroundColor: ds.surfaceContainerHigh, borderRadius: 18, padding: 16,
    borderWidth: 1, borderColor: `${ds.secondaryFixedDim}33`,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resultIcon: { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  resultLabel: { fontSize: 10, fontWeight: '700', color: ds.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 1 },
  resultType: { fontSize: 17, fontWeight: '800', color: ds.onSurface, marginTop: 1 },

  fieldsBox: {
    backgroundColor: ds.surfaceContainerLowest, borderRadius: 12, padding: 12, gap: 8,
  },
  fieldRow: { gap: 2 },
  fieldLabel: { fontSize: 10, fontWeight: '700', color: ds.onSurfaceVariant, textTransform: 'uppercase', letterSpacing: 0.8 },
  fieldValue: { fontSize: 14, fontWeight: '600', color: ds.onSurface },

  productBox: {
    backgroundColor: ds.surfaceContainerLowest, borderRadius: 12, padding: 12,
  },
  productLoading: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  productLoadingText: { fontSize: 13, color: ds.onSurfaceVariant },
  productRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  productImage: { width: 64, height: 64, borderRadius: 8, backgroundColor: ds.surfaceContainer },
  productImagePlaceholder: { alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 15, fontWeight: '800', color: ds.onSurface },
  productBrand: { fontSize: 13, fontWeight: '600', color: ds.primary },
  productMeta: { fontSize: 11, color: ds.onSurfaceVariant },
  productEmpty: { fontSize: 13, color: ds.onSurfaceVariant, fontStyle: 'italic' },

  resultData: {
    fontSize: 13, color: ds.onSurface, lineHeight: 19,
    backgroundColor: ds.surfaceContainerLowest, padding: 12, borderRadius: 10,
  },

  primaryActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: ds.primary, paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12,
  },
  primaryActionText: { fontSize: 14, fontWeight: '800', color: ds.onPrimary },
  primaryActionSub: { fontSize: 11, fontWeight: '600', color: ds.onPrimary, opacity: 0.7, marginTop: 1 },

  resultActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 12, borderRadius: 10, backgroundColor: ds.surfaceContainer,
  },
  scanAgainBtn: { backgroundColor: ds.primaryContainer },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: ds.primary },

  // History FAB
  historyFab: {
    position: 'absolute', top: 24, right: 16,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(40, 42, 44, 0.85)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${ds.outlineVariant}55`,
  },
  historyBadge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: ds.secondaryFixedDim,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: ds.surface,
  },
  historyBadgeText: { fontSize: 9, fontWeight: '900', color: ds.surface },

  // History Panel
  historyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  historyPanel: {
    backgroundColor: ds.surfaceContainerLow,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24,
    maxHeight: '85%',
  },
  historyHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingBottom: 14, marginBottom: 8,
    borderBottomWidth: 1, borderBottomColor: `${ds.outlineVariant}22`,
  },
  historyTitle: { fontSize: 20, fontWeight: '800', color: ds.onSurface },
  historySubtitle: { fontSize: 12, color: ds.onSurfaceVariant, marginTop: 2 },
  clearAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: `${ds.errorContainer}33`,
  },
  clearAllText: { fontSize: 12, fontWeight: '700', color: ds.error },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ds.surfaceContainerHigh,
    alignItems: 'center', justifyContent: 'center',
  },
  historyEmpty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  historyEmptyText: { fontSize: 14, color: ds.onSurfaceVariant },
  historyList: { maxHeight: '100%' },
  historyItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: ds.surfaceContainerHigh,
    borderRadius: 12, padding: 12,
  },
  historyItemIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  historyItemLabel: { fontSize: 12, fontWeight: '700', color: ds.onSurface },
  historyItemData: { fontSize: 13, color: ds.onSurfaceVariant, marginTop: 1 },
  historyItemTime: { fontSize: 10, color: ds.outline, marginTop: 3 },
  historyDeleteBtn: { padding: 6 },
  });
}
