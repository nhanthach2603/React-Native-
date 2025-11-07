// d:\React-Native-\components\QuickNav.tsx

import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, styles } from '../styles/homeStyle';

export const QuickNav = () => {
  const insets = useSafeAreaInsets();

  // Thanh điều hướng nhanh sẽ là một thanh cố định ở cuối màn hình
  return (
    <View style={[styles.pickingStyles.footer, { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom }]}>
      <View style={styles.pickingStyles.quickNavContainer}>
        <Link href="/(tabs)/home" asChild>
          <TouchableOpacity style={styles.pickingStyles.quickNavItem}>
            <Ionicons name="home-outline" size={24} color={COLORS.text_secondary} />
            <Text style={styles.pickingStyles.quickNavText}>Trang chủ</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/profile" asChild>
          <TouchableOpacity style={styles.pickingStyles.quickNavItem}>
            <Ionicons name="person-outline" size={24} color={COLORS.text_secondary} />
            <Text style={styles.pickingStyles.quickNavText}>Cá nhân</Text>
          </TouchableOpacity>
        </Link>
        <Link href="/(tabs)/chat" asChild>
          <TouchableOpacity style={styles.pickingStyles.quickNavItem}>
            <Ionicons name="chatbubbles-outline" size={24} color={COLORS.text_secondary} />
            <Text style={styles.pickingStyles.quickNavText}>Trò chuyện</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};