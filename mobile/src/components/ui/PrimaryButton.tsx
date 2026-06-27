import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet, Text, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { colors, gradients, radius, shadows } from '@/src/constants/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  style?: ViewStyle;
};

export default function PrimaryButton({
  label,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  style,
}: Props) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressHandlers = {
    onPress,
    onPressIn: () => {
      scale.value = withSpring(0.97);
    },
    onPressOut: () => {
      scale.value = withSpring(1);
    },
    disabled: disabled || loading,
  };

  if (variant === 'outline') {
    return (
      <AnimatedPressable {...pressHandlers} style={[animStyle, style]}>
        <Pressable
          style={[styles.btn, styles.outline, (disabled || loading) && styles.disabled]}
          {...pressHandlers}
        >
          <Text style={styles.labelOutline}>{label}</Text>
        </Pressable>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable {...pressHandlers} style={[animStyle, style]}>
      <LinearGradient
        colors={gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.btn, (disabled || loading) && styles.disabled]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.labelPrimary}>{label}</Text>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    ...shadows.button,
  },
  disabled: { opacity: 0.65 },
  outline: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  labelPrimary: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  labelOutline: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
  },
});
