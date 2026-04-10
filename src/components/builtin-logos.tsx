import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

export type IconSet = 'fa5b' | 'fa5s' | 'mci';

export interface BuiltInLogo {
  id: string;
  name: string;
  set: IconSet;
  iconName: string;
  color: string;
}

// A curated catalog of famous brands and useful icons
export const BUILTIN_LOGOS: BuiltInLogo[] = [
  // --- Social Media ---
  { id: 'instagram',  name: 'Instagram',  set: 'fa5b', iconName: 'instagram',     color: '#e1306c' },
  { id: 'facebook',   name: 'Facebook',   set: 'fa5b', iconName: 'facebook-f',    color: '#1877f2' },
  { id: 'twitter',    name: 'X / Twitter',set: 'fa5b', iconName: 'twitter',       color: '#1da1f2' },
  { id: 'tiktok',     name: 'TikTok',     set: 'fa5b', iconName: 'tiktok',        color: '#000000' },
  { id: 'snapchat',   name: 'Snapchat',   set: 'fa5b', iconName: 'snapchat-ghost',color: '#fffc00' },
  { id: 'pinterest',  name: 'Pinterest',  set: 'fa5b', iconName: 'pinterest-p',   color: '#e60023' },
  { id: 'reddit',     name: 'Reddit',     set: 'fa5b', iconName: 'reddit-alien',  color: '#ff4500' },
  { id: 'linkedin',   name: 'LinkedIn',   set: 'fa5b', iconName: 'linkedin-in',   color: '#0a66c2' },

  // --- Messaging ---
  { id: 'whatsapp',   name: 'WhatsApp',   set: 'fa5b', iconName: 'whatsapp',      color: '#25d366' },
  { id: 'telegram',   name: 'Telegram',   set: 'fa5b', iconName: 'telegram-plane',color: '#0088cc' },
  { id: 'discord',    name: 'Discord',    set: 'fa5b', iconName: 'discord',       color: '#5865f2' },
  { id: 'slack',      name: 'Slack',      set: 'fa5b', iconName: 'slack-hash',    color: '#4a154b' },
  { id: 'skype',      name: 'Skype',      set: 'fa5b', iconName: 'skype',         color: '#00aff0' },
  { id: 'wechat',     name: 'WeChat',     set: 'fa5b', iconName: 'weixin',        color: '#07c160' },

  // --- Video / Music ---
  { id: 'youtube',    name: 'YouTube',    set: 'fa5b', iconName: 'youtube',       color: '#ff0000' },
  { id: 'spotify',    name: 'Spotify',    set: 'fa5b', iconName: 'spotify',       color: '#1db954' },
  { id: 'twitch',     name: 'Twitch',     set: 'fa5b', iconName: 'twitch',        color: '#9146ff' },
  { id: 'soundcloud', name: 'SoundCloud', set: 'fa5b', iconName: 'soundcloud',    color: '#ff5500' },
  { id: 'vimeo',      name: 'Vimeo',      set: 'fa5b', iconName: 'vimeo-v',       color: '#1ab7ea' },
  { id: 'netflix',    name: 'Netflix',    set: 'mci',  iconName: 'netflix',       color: '#e50914' },

  // --- Tech ---
  { id: 'google',     name: 'Google',     set: 'fa5b', iconName: 'google',        color: '#4285f4' },
  { id: 'apple',      name: 'Apple',      set: 'fa5b', iconName: 'apple',         color: '#000000' },
  { id: 'microsoft',  name: 'Microsoft',  set: 'fa5b', iconName: 'microsoft',     color: '#00a4ef' },
  { id: 'amazon',     name: 'Amazon',     set: 'fa5b', iconName: 'amazon',        color: '#ff9900' },
  { id: 'github',     name: 'GitHub',     set: 'fa5b', iconName: 'github',        color: '#181717' },
  { id: 'gitlab',     name: 'GitLab',     set: 'fa5b', iconName: 'gitlab',        color: '#fc6d26' },
  { id: 'android',    name: 'Android',    set: 'fa5b', iconName: 'android',       color: '#3ddc84' },
  { id: 'firefox',    name: 'Firefox',    set: 'fa5b', iconName: 'firefox',       color: '#ff7139' },
  { id: 'chrome',     name: 'Chrome',     set: 'fa5b', iconName: 'chrome',        color: '#4285f4' },

  // --- Payments ---
  { id: 'paypal',     name: 'PayPal',     set: 'fa5b', iconName: 'paypal',        color: '#003087' },
  { id: 'visa',       name: 'Visa',       set: 'fa5b', iconName: 'cc-visa',       color: '#1a1f71' },
  { id: 'mastercard', name: 'Mastercard', set: 'fa5b', iconName: 'cc-mastercard', color: '#eb001b' },
  { id: 'stripe',     name: 'Stripe',     set: 'fa5b', iconName: 'stripe-s',      color: '#635bff' },
  { id: 'bitcoin',    name: 'Bitcoin',    set: 'fa5b', iconName: 'bitcoin',       color: '#f7931a' },
  { id: 'ethereum',   name: 'Ethereum',   set: 'fa5b', iconName: 'ethereum',      color: '#627eea' },

  // --- Generic ---
  { id: 'wifi',       name: 'Wi-Fi',      set: 'fa5s', iconName: 'wifi',          color: '#00daf3' },
  { id: 'phone',      name: 'Phone',      set: 'fa5s', iconName: 'phone',         color: '#00c853' },
  { id: 'envelope',   name: 'Email',      set: 'fa5s', iconName: 'envelope',      color: '#ea4335' },
  { id: 'globe',      name: 'Website',    set: 'fa5s', iconName: 'globe',         color: '#4285f4' },
  { id: 'heart',      name: 'Heart',      set: 'fa5s', iconName: 'heart',         color: '#e94560' },
  { id: 'star',       name: 'Star',       set: 'fa5s', iconName: 'star',          color: '#ffc107' },
  { id: 'camera',     name: 'Camera',     set: 'fa5s', iconName: 'camera',        color: '#9c27b0' },
  { id: 'music',      name: 'Music',      set: 'fa5s', iconName: 'music',         color: '#ff6b35' },
  { id: 'shopping',   name: 'Shop',       set: 'fa5s', iconName: 'shopping-bag',  color: '#2196f3' },
  { id: 'gift',       name: 'Gift',       set: 'fa5s', iconName: 'gift',          color: '#e91e63' },
];

export function getLogoById(id: string | null | undefined): BuiltInLogo | null {
  if (!id) return null;
  return BUILTIN_LOGOS.find((l) => l.id === id) || null;
}

interface BrandIconProps {
  logo: BuiltInLogo;
  size: number;
  monochrome?: boolean;
  color?: string;
}

export function BrandIcon({ logo, size, monochrome, color }: BrandIconProps) {
  const c = monochrome ? (color || '#000') : logo.color;
  if (logo.set === 'fa5b') {
    return <FontAwesome5 name={logo.iconName as any} size={size} color={c} brand />;
  }
  if (logo.set === 'fa5s') {
    return <FontAwesome5 name={logo.iconName as any} size={size} color={c} solid />;
  }
  return <MaterialCommunityIcons name={logo.iconName as any} size={size} color={c} />;
}

interface CenterOverlayProps {
  logoId?: string | null;
  centerText?: string | null;
  textColor?: string;
  qrSize: number;
  bgColor?: string;
}

/**
 * Renders a centered brand icon OR a small text label with a rounded background.
 * Designed to be placed absolutely on top of a CustomQRCode of `qrSize`.
 *
 * Logo takes priority over text. If neither is set, renders nothing.
 */
export function LogoOverlay({ logoId, centerText, textColor, qrSize, bgColor = '#ffffff' }: CenterOverlayProps) {
  const logo = getLogoById(logoId);
  const hasText = !!(centerText && centerText.trim().length > 0);

  if (!logo && !hasText) return null;

  if (logo) {
    const boxSize = qrSize * 0.26;
    const iconSize = qrSize * 0.18;
    const radius = boxSize * 0.18;
    return (
      <View
        pointerEvents="none"
        style={[styles.overlay, { width: qrSize, height: qrSize }]}>
        <View
          style={{
            width: boxSize,
            height: boxSize,
            borderRadius: radius,
            backgroundColor: bgColor,
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <BrandIcon logo={logo} size={iconSize} />
        </View>
      </View>
    );
  }

  // Text overlay
  const text = (centerText || '').trim().slice(0, 6); // cap at 6 chars
  const fontSize = qrSize * (text.length <= 2 ? 0.16 : text.length <= 4 ? 0.11 : 0.085);
  const padH = qrSize * 0.04;
  const padV = qrSize * 0.025;
  const radius = qrSize * 0.04;

  return (
    <View
      pointerEvents="none"
      style={[styles.overlay, { width: qrSize, height: qrSize }]}>
      <View
        style={{
          paddingHorizontal: padH,
          paddingVertical: padV,
          borderRadius: radius,
          backgroundColor: bgColor,
          maxWidth: qrSize * 0.55,
        }}>
        <Text
          numberOfLines={1}
          style={{
            fontSize,
            fontWeight: '900',
            color: textColor || '#000000',
            letterSpacing: -0.5,
            textAlign: 'center',
          }}>
          {text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
