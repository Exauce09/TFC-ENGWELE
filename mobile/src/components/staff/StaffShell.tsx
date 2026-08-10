import { type ReactNode } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ROLE_LABELS } from '@/src/constants/roles';
import { colors, radius } from '@/src/constants/theme';
import { useAuth } from '@/src/context/AuthContext';

type NavItem = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  href: string;
  active?: boolean;
};

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  nav?: NavItem[];
  refreshing?: boolean;
  onRefresh?: () => void;
  contentStyle?: ViewStyle;
  scroll?: boolean;
};

export default function StaffShell({
  title,
  subtitle,
  children,
  nav,
  refreshing,
  onRefresh,
  contentStyle,
  scroll = true,
}: Props) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  const body = (
    <>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brand}>Centre Médical AMEN</Text>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.subtitle}>
              {subtitle ?? `${ROLE_LABELS[user?.role ?? ''] ?? user?.role} · ${user?.name ?? ''}`}
            </Text>
          </View>
          <Pressable onPress={handleLogout} style={styles.logoutBtn} hitSlop={8}>
            <Ionicons name="log-out-outline" size={22} color={colors.error} />
          </Pressable>
        </View>
        {nav && nav.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navRow}>
            {nav.map((item) => (
              <Pressable
                key={item.href}
                onPress={() => router.push(item.href as never)}
                style={[styles.navChip, item.active && styles.navChipActive]}
              >
                <Ionicons
                  name={item.icon}
                  size={16}
                  color={item.active ? colors.white : colors.primary}
                />
                <Text style={[styles.navText, item.active && styles.navTextActive]}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[styles.content, contentStyle]}
          refreshControl={
            onRefresh ? (
              <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            ) : undefined
          }
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </>
  );

  return <View style={styles.screen}>{body}</View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: { fontSize: 22, fontWeight: '800', color: colors.text, marginTop: 2 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: { gap: 8, paddingRight: 8 },
  navChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  navChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  navText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  navTextActive: { color: colors.white },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
});
