import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { DS } from '@/constants/theme';
import type { BodyShape, EyeFrameShape, EyeBallShape, GradientConfig } from '@/components/custom-qr';

// --- Types ---

export type QRContentType =
  | 'web' | 'wifi' | 'contact' | 'text'
  | 'email' | 'phone' | 'sms'
  | 'facebook' | 'instagram' | 'twitter' | 'youtube' | 'tiktok'
  | 'linkedin' | 'snapchat' | 'discord' | 'whatsapp' | 'telegram'
  | 'spotify' | 'pinterest' | 'reddit';

// Per-type config: URL template, placeholder, label, icon, brand color
export interface ContentTypeConfig {
  key: QRContentType;
  label: string;
  iconSet: 'mi' | 'fa5b';
  iconName: string;
  color: string;
  placeholder: string;
  buildUrl: (input: string) => string;
}

export const CONTENT_TYPES: ContentTypeConfig[] = [
  { key: 'web',       label: 'Web',       iconSet: 'mi',   iconName: 'language',       color: '#4285f4', placeholder: 'https://your-site.com',           buildUrl: (s) => s },
  { key: 'text',      label: 'Text',      iconSet: 'mi',   iconName: 'text-fields',    color: '#bbc3ff', placeholder: 'Enter any text...',                buildUrl: (s) => s },
  { key: 'wifi',      label: 'Wi-Fi',     iconSet: 'mi',   iconName: 'wifi',           color: '#00daf3', placeholder: '',                                  buildUrl: (s) => s },
  { key: 'contact',   label: 'Contact',   iconSet: 'mi',   iconName: 'contact-page',   color: '#cdbdff', placeholder: '',                                  buildUrl: (s) => s },
  { key: 'email',     label: 'Email',     iconSet: 'mi',   iconName: 'email',          color: '#ea4335', placeholder: 'name@example.com',                  buildUrl: (s) => `mailto:${s}` },
  { key: 'phone',     label: 'Phone',     iconSet: 'mi',   iconName: 'call',           color: '#00c853', placeholder: '+1 555 123 4567',                   buildUrl: (s) => `tel:${s.replace(/\s/g, '')}` },
  { key: 'sms',       label: 'SMS',       iconSet: 'mi',   iconName: 'sms',            color: '#34b7f1', placeholder: '+1 555 123 4567',                   buildUrl: (s) => `sms:${s.replace(/\s/g, '')}` },
  { key: 'whatsapp',  label: 'WhatsApp',  iconSet: 'fa5b', iconName: 'whatsapp',       color: '#25d366', placeholder: '15551234567 (with country code)',   buildUrl: (s) => `https://wa.me/${s.replace(/\D/g, '')}` },
  { key: 'facebook',  label: 'Facebook',  iconSet: 'fa5b', iconName: 'facebook-f',     color: '#1877f2', placeholder: 'username or page',                  buildUrl: (s) => `https://facebook.com/${s.replace(/^@/, '')}` },
  { key: 'instagram', label: 'Instagram', iconSet: 'fa5b', iconName: 'instagram',      color: '#e1306c', placeholder: 'username (without @)',              buildUrl: (s) => `https://instagram.com/${s.replace(/^@/, '')}` },
  { key: 'twitter',   label: 'X',         iconSet: 'fa5b', iconName: 'twitter',        color: '#1da1f2', placeholder: 'handle (without @)',                buildUrl: (s) => `https://x.com/${s.replace(/^@/, '')}` },
  { key: 'youtube',   label: 'YouTube',   iconSet: 'fa5b', iconName: 'youtube',        color: '#ff0000', placeholder: '@channel or full URL',              buildUrl: (s) => s.startsWith('http') ? s : `https://youtube.com/${s.startsWith('@') ? s : '@' + s}` },
  { key: 'tiktok',    label: 'TikTok',    iconSet: 'fa5b', iconName: 'tiktok',         color: '#000000', placeholder: 'username (without @)',              buildUrl: (s) => `https://tiktok.com/@${s.replace(/^@/, '')}` },
  { key: 'snapchat',  label: 'Snapchat',  iconSet: 'fa5b', iconName: 'snapchat-ghost', color: '#fffc00', placeholder: 'username',                          buildUrl: (s) => `https://snapchat.com/add/${s.replace(/^@/, '')}` },
  { key: 'linkedin',  label: 'LinkedIn',  iconSet: 'fa5b', iconName: 'linkedin-in',    color: '#0a66c2', placeholder: 'username (in/username)',            buildUrl: (s) => `https://linkedin.com/in/${s.replace(/^@/, '')}` },
  { key: 'discord',   label: 'Discord',   iconSet: 'fa5b', iconName: 'discord',        color: '#5865f2', placeholder: 'invite code (after discord.gg/)',   buildUrl: (s) => s.startsWith('http') ? s : `https://discord.gg/${s}` },
  { key: 'telegram',  label: 'Telegram',  iconSet: 'fa5b', iconName: 'telegram-plane', color: '#0088cc', placeholder: 'username',                          buildUrl: (s) => `https://t.me/${s.replace(/^@/, '')}` },
  { key: 'spotify',   label: 'Spotify',   iconSet: 'fa5b', iconName: 'spotify',        color: '#1db954', placeholder: 'Paste Spotify URL',                 buildUrl: (s) => s },
  { key: 'pinterest', label: 'Pinterest', iconSet: 'fa5b', iconName: 'pinterest-p',    color: '#e60023', placeholder: 'username',                          buildUrl: (s) => `https://pinterest.com/${s.replace(/^@/, '')}` },
  { key: 'reddit',    label: 'Reddit',    iconSet: 'fa5b', iconName: 'reddit-alien',   color: '#ff4500', placeholder: 'u/username or r/subreddit',         buildUrl: (s) => `https://reddit.com/${s.startsWith('u/') || s.startsWith('r/') ? s : 'u/' + s.replace(/^@/, '')}` },
];

export function getContentTypeConfig(key: QRContentType): ContentTypeConfig {
  return CONTENT_TYPES.find((t) => t.key === key) || CONTENT_TYPES[0];
}

export type TemplateId = 'minimal' | 'cyber' | 'editorial' | 'soft';

export type { BodyShape, EyeFrameShape, EyeBallShape, GradientConfig };

export interface WifiData {
  ssid: string;
  password: string;
  encryption: 'WPA' | 'WEP' | 'nopass';
}

export interface ContactData {
  name: string;
  phone: string;
  email: string;
}

export interface QRDesign {
  id: string;
  name: string;
  content: string;
  contentType: QRContentType;
  bodyColor: string;
  bgColor: string;
  bgImageUri: string | null;
  bgImageOpacity: number;
  eyeFrameColor: string;
  eyeBallColor: string;
  bodyShape: BodyShape;
  eyeFrameShape: EyeFrameShape;
  eyeBallShape: EyeBallShape;
  bodyGradient: GradientConfig | null;
  logoUri: string | null;
  builtInLogoId: string | null;
  centerText: string;
  captionText: string;
  templateId: TemplateId;
  createdAt: number;
  updatedAt: number;
}

export interface QRDesignState {
  content: string;
  contentType: QRContentType;
  wifiData: WifiData;
  contactData: ContactData;
  bodyColor: string;
  bgColor: string;
  bgImageUri: string | null;
  bgImageOpacity: number;
  eyeFrameColor: string;
  eyeBallColor: string;
  bodyShape: BodyShape;
  eyeFrameShape: EyeFrameShape;
  eyeBallShape: EyeBallShape;
  bodyGradient: GradientConfig | null;
  logoUri: string | null;
  builtInLogoId: string | null;
  centerText: string;
  captionText: string;
  templateId: TemplateId;
  designName: string;
  savedDesigns: QRDesign[];
  scanHistory: ScanHistoryEntry[];
}

export interface ScanHistoryEntry {
  id: string;
  data: string;
  type: string;        // raw barcode type (e.g. 'qr')
  scannedAt: number;
}

interface QRDesignContextValue extends QRDesignState {
  setContent: (content: string) => void;
  setContentType: (type: QRContentType) => void;
  setWifiData: (data: Partial<WifiData>) => void;
  setContactData: (data: Partial<ContactData>) => void;
  setBodyColor: (color: string) => void;
  setBgColor: (color: string) => void;
  setBgImageUri: (uri: string | null) => void;
  setBgImageOpacity: (opacity: number) => void;
  setEyeFrameColor: (color: string) => void;
  setEyeBallColor: (color: string) => void;
  setBodyShape: (shape: BodyShape) => void;
  setEyeFrameShape: (shape: EyeFrameShape) => void;
  setEyeBallShape: (shape: EyeBallShape) => void;
  setBodyGradient: (g: GradientConfig | null) => void;
  setLogoUri: (uri: string | null) => void;
  setBuiltInLogoId: (id: string | null) => void;
  setCenterText: (text: string) => void;
  setCaptionText: (text: string) => void;
  setDesignName: (name: string) => void;
  applyTemplate: (id: TemplateId) => void;
  saveCurrentDesign: () => Promise<string>;
  loadDesign: (id: string) => void;
  deleteDesign: (id: string) => Promise<void>;
  resetDesign: () => void;
  getQRValue: () => string;

  // Scan history
  addScanToHistory: (data: string, type: string) => Promise<void>;
  deleteScanFromHistory: (id: string) => Promise<void>;
  clearScanHistory: () => Promise<void>;
}

// --- Template presets ---

const TEMPLATE_PRESETS: Record<TemplateId, Partial<QRDesignState>> = {
  minimal: {
    bodyColor: '#0c0e10',
    bgColor: '#ffffff',
    eyeFrameColor: '#0c0e10',
    eyeBallColor: '#0c0e10',
    bodyShape: 'square',
    eyeFrameShape: 'square',
    eyeBallShape: 'square',
    bodyGradient: null,
  },
  cyber: {
    bodyColor: DS.secondaryFixedDim,
    bgColor: DS.surface,
    eyeFrameColor: DS.primaryContainer,
    eyeBallColor: DS.secondaryFixedDim,
    bodyShape: 'dots',
    eyeFrameShape: 'rounded',
    eyeBallShape: 'circle',
    bodyGradient: { colors: [DS.primaryContainer, DS.secondaryFixedDim], angle: 135 },
  },
  editorial: {
    bodyColor: '#000000',
    bgColor: '#f5f5f5',
    eyeFrameColor: '#1a1a2e',
    eyeBallColor: '#000000',
    bodyShape: 'classy',
    eyeFrameShape: 'leaf',
    eyeBallShape: 'leaf',
    bodyGradient: null,
  },
  soft: {
    bodyColor: DS.primary,
    bgColor: DS.surfaceContainerLow,
    eyeFrameColor: DS.primary,
    eyeBallColor: DS.primaryContainer,
    bodyShape: 'rounded',
    eyeFrameShape: 'rounded',
    eyeBallShape: 'rounded',
    bodyGradient: { colors: [DS.primary, DS.tertiary], angle: 45 },
  },
};

const STORAGE_FILE = `${FileSystem.documentDirectory}qr_designs.json`;
const HISTORY_FILE = `${FileSystem.documentDirectory}qr_scan_history.json`;
const MAX_HISTORY = 100;

const defaultState: QRDesignState = {
  content: '',
  contentType: 'web',
  wifiData: { ssid: '', password: '', encryption: 'WPA' },
  contactData: { name: '', phone: '', email: '' },
  bodyColor: '#0c0e10',
  bgColor: '#ffffff',
  bgImageUri: null,
  bgImageOpacity: 0.4,
  eyeFrameColor: '#0c0e10',
  eyeBallColor: '#0c0e10',
  bodyShape: 'square',
  eyeFrameShape: 'square',
  eyeBallShape: 'square',
  bodyGradient: null,
  logoUri: null,
  builtInLogoId: null,
  centerText: '',
  captionText: '',
  templateId: 'minimal',
  designName: '',
  savedDesigns: [],
  scanHistory: [],
};

// --- Context ---

const QRDesignContext = createContext<QRDesignContextValue | null>(null);

export function QRDesignProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<QRDesignState>(defaultState);

  useEffect(() => {
    FileSystem.readAsStringAsync(STORAGE_FILE)
      .then((raw) => {
        const designs: QRDesign[] = JSON.parse(raw);
        setState((s) => ({ ...s, savedDesigns: designs }));
      })
      .catch(() => {});

    FileSystem.readAsStringAsync(HISTORY_FILE)
      .then((raw) => {
        const history: ScanHistoryEntry[] = JSON.parse(raw);
        setState((s) => ({ ...s, scanHistory: history }));
      })
      .catch(() => {});
  }, []);

  const persistDesigns = useCallback(async (designs: QRDesign[]) => {
    await FileSystem.writeAsStringAsync(STORAGE_FILE, JSON.stringify(designs));
  }, []);

  const persistHistory = useCallback(async (history: ScanHistoryEntry[]) => {
    await FileSystem.writeAsStringAsync(HISTORY_FILE, JSON.stringify(history));
  }, []);

  const set = useCallback(<K extends keyof QRDesignState>(key: K, val: QRDesignState[K]) => {
    setState((s) => ({ ...s, [key]: val }));
  }, []);

  const setContent = useCallback((v: string) => set('content', v), [set]);
  const setContentType = useCallback((v: QRContentType) => set('contentType', v), [set]);
  const setWifiData = useCallback((data: Partial<WifiData>) => {
    setState((s) => ({ ...s, wifiData: { ...s.wifiData, ...data } }));
  }, []);
  const setContactData = useCallback((data: Partial<ContactData>) => {
    setState((s) => ({ ...s, contactData: { ...s.contactData, ...data } }));
  }, []);
  const setBodyColor = useCallback((v: string) => set('bodyColor', v), [set]);
  const setBgColor = useCallback((v: string) => set('bgColor', v), [set]);
  const setBgImageUri = useCallback((v: string | null) => set('bgImageUri', v), [set]);
  const setBgImageOpacity = useCallback((v: number) => set('bgImageOpacity', v), [set]);
  const setEyeFrameColor = useCallback((v: string) => set('eyeFrameColor', v), [set]);
  const setEyeBallColor = useCallback((v: string) => set('eyeBallColor', v), [set]);
  const setBodyShape = useCallback((v: BodyShape) => set('bodyShape', v), [set]);
  const setEyeFrameShape = useCallback((v: EyeFrameShape) => set('eyeFrameShape', v), [set]);
  const setEyeBallShape = useCallback((v: EyeBallShape) => set('eyeBallShape', v), [set]);
  const setBodyGradient = useCallback((v: GradientConfig | null) => set('bodyGradient', v), [set]);
  const setLogoUri = useCallback((v: string | null) => set('logoUri', v), [set]);
  const setBuiltInLogoId = useCallback((v: string | null) => set('builtInLogoId', v), [set]);
  const setCenterText = useCallback((v: string) => set('centerText', v), [set]);
  const setCaptionText = useCallback((v: string) => set('captionText', v), [set]);
  const setDesignName = useCallback((v: string) => set('designName', v), [set]);

  const applyTemplate = useCallback((id: TemplateId) => {
    const preset = TEMPLATE_PRESETS[id];
    setState((s) => ({ ...s, ...preset, templateId: id }));
  }, []);

  const getQRValue = useCallback(() => {
    if (state.contentType === 'wifi') {
      const { ssid, password, encryption } = state.wifiData;
      if (!ssid) return 'WIFI:S:MyNetwork;T:WPA;P:password;;';
      return `WIFI:S:${ssid};T:${encryption};P:${password};;`;
    }
    if (state.contentType === 'contact') {
      const { name, phone, email } = state.contactData;
      if (!name && !phone && !email) return 'https://example.com';
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
      if (name) lines.push(`FN:${name}`);
      if (phone) lines.push(`TEL:${phone}`);
      if (email) lines.push(`EMAIL:${email}`);
      lines.push('END:VCARD');
      return lines.join('\n');
    }

    // Simple-input types: route through the per-type URL builder
    if (!state.content) return 'https://example.com';
    const cfg = getContentTypeConfig(state.contentType);
    return cfg.buildUrl(state.content);
  }, [state.content, state.contentType, state.wifiData, state.contactData]);

  const saveCurrentDesign = useCallback(async () => {
    const now = Date.now();
    const id = `qr_${now}`;
    const design: QRDesign = {
      id,
      name: state.designName || `Design ${state.savedDesigns.length + 1}`,
      content: state.contentType === 'wifi'
        ? JSON.stringify(state.wifiData)
        : state.contentType === 'contact'
          ? JSON.stringify(state.contactData)
          : state.content,
      contentType: state.contentType,
      bodyColor: state.bodyColor,
      bgColor: state.bgColor,
      bgImageUri: state.bgImageUri,
      bgImageOpacity: state.bgImageOpacity,
      eyeFrameColor: state.eyeFrameColor,
      eyeBallColor: state.eyeBallColor,
      bodyShape: state.bodyShape,
      eyeFrameShape: state.eyeFrameShape,
      eyeBallShape: state.eyeBallShape,
      bodyGradient: state.bodyGradient,
      logoUri: state.logoUri,
      builtInLogoId: state.builtInLogoId,
      centerText: state.centerText,
      captionText: state.captionText,
      templateId: state.templateId,
      createdAt: now,
      updatedAt: now,
    };
    const updated = [design, ...state.savedDesigns];
    setState((s) => ({ ...s, savedDesigns: updated }));
    await persistDesigns(updated);
    return id;
  }, [state, persistDesigns]);

  const loadDesign = useCallback((id: string) => {
    const design = state.savedDesigns.find((d) => d.id === id);
    if (!design) return;

    let content = design.content;
    let wifiData = defaultState.wifiData;
    let contactData = defaultState.contactData;

    if (design.contentType === 'wifi') {
      try { wifiData = JSON.parse(design.content); } catch {}
      content = '';
    } else if (design.contentType === 'contact') {
      try { contactData = JSON.parse(design.content); } catch {}
      content = '';
    }

    setState((s) => ({
      ...s,
      content,
      contentType: design.contentType,
      wifiData,
      contactData,
      bodyColor: design.bodyColor,
      bgColor: design.bgColor,
      bgImageUri: design.bgImageUri ?? null,
      bgImageOpacity: design.bgImageOpacity ?? 0.4,
      eyeFrameColor: design.eyeFrameColor,
      eyeBallColor: design.eyeBallColor,
      bodyShape: design.bodyShape,
      eyeFrameShape: design.eyeFrameShape,
      eyeBallShape: design.eyeBallShape,
      bodyGradient: design.bodyGradient,
      logoUri: design.logoUri,
      builtInLogoId: design.builtInLogoId ?? null,
      centerText: design.centerText ?? '',
      captionText: design.captionText ?? '',
      templateId: design.templateId,
      designName: design.name,
    }));
  }, [state.savedDesigns]);

  const deleteDesign = useCallback(async (id: string) => {
    const updated = state.savedDesigns.filter((d) => d.id !== id);
    setState((s) => ({ ...s, savedDesigns: updated }));
    await persistDesigns(updated);
  }, [state.savedDesigns, persistDesigns]);

  const resetDesign = useCallback(() => {
    setState((s) => ({
      ...s,
      ...defaultState,
      savedDesigns: s.savedDesigns,
      scanHistory: s.scanHistory,
    }));
  }, []);

  // --- Scan history actions ---
  const addScanToHistory = useCallback(async (data: string, type: string) => {
    const entry: ScanHistoryEntry = {
      id: `scan_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      data,
      type,
      scannedAt: Date.now(),
    };
    // Skip if the most recent entry is the same data within 2 seconds (debounce duplicates)
    const last = state.scanHistory[0];
    if (last && last.data === data && Date.now() - last.scannedAt < 2000) return;

    const updated = [entry, ...state.scanHistory].slice(0, MAX_HISTORY);
    setState((s) => ({ ...s, scanHistory: updated }));
    await persistHistory(updated);
  }, [state.scanHistory, persistHistory]);

  const deleteScanFromHistory = useCallback(async (id: string) => {
    const updated = state.scanHistory.filter((e) => e.id !== id);
    setState((s) => ({ ...s, scanHistory: updated }));
    await persistHistory(updated);
  }, [state.scanHistory, persistHistory]);

  const clearScanHistory = useCallback(async () => {
    setState((s) => ({ ...s, scanHistory: [] }));
    await persistHistory([]);
  }, [persistHistory]);

  const value: QRDesignContextValue = {
    ...state,
    setContent, setContentType, setWifiData, setContactData,
    setBodyColor, setBgColor, setBgImageUri, setBgImageOpacity, setEyeFrameColor, setEyeBallColor,
    setBodyShape, setEyeFrameShape, setEyeBallShape, setBodyGradient,
    setLogoUri, setBuiltInLogoId, setCenterText, setCaptionText, setDesignName,
    applyTemplate, saveCurrentDesign, loadDesign, deleteDesign, resetDesign, getQRValue,
    addScanToHistory, deleteScanFromHistory, clearScanHistory,
  };

  return <QRDesignContext.Provider value={value}>{children}</QRDesignContext.Provider>;
}

export function useQRDesign() {
  const ctx = useContext(QRDesignContext);
  if (!ctx) throw new Error('useQRDesign must be used within QRDesignProvider');
  return ctx;
}
