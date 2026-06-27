import { type ReactNode } from 'react';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

type Props = {
  children: ReactNode;
  delay?: number;
  style?: object;
};

export default function AnimatedScreen({ children, delay = 0, style }: Props) {
  return (
    <Animated.View entering={FadeIn.duration(400).delay(delay)} style={[{ flex: 1 }, style]}>
      {children}
    </Animated.View>
  );
}

export function AnimatedCard({ children, delay = 0, style }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).delay(delay)}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
