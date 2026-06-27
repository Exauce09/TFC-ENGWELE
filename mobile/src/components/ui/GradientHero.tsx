import { ImageBackground, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { colors, radius } from '@/src/constants/theme';

type Props = {
  imageUri: string;
  title: string;
  subtitle?: string;
  height?: number;
  children?: React.ReactNode;
};

export default function GradientHero({ imageUri, title, subtitle, height = 220, children }: Props) {
  return (
    <View style={[styles.wrap, { height }]}>
      <ImageBackground source={{ uri: imageUri }} style={styles.image} resizeMode="cover">
        <LinearGradient
          colors={['rgba(15,23,42,0.75)', 'rgba(15,23,42,0.35)', 'rgba(241,245,249,1)']}
          locations={[0, 0.55, 1]}
          style={styles.gradient}
        >
          <View style={styles.textBlock}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Centre Médical AMEN</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {children}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    overflow: 'hidden',
  },
  image: { flex: 1, width: '100%' },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  textBlock: { gap: 6 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(13,148,136,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 20,
  },
});
