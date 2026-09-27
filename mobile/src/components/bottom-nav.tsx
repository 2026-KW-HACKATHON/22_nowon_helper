import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon, type IconName } from './icon';

type Tab = 'home' | 'map' | 'reports';

/**
 * The tab bar: 01 홈, 04 지도, 06 내 신고. 음성 belongs to the create
 * path (FE-1) and has no screen yet, so it is shown but does nothing.
 */
export function BottomNav({ active }: { active: Tab }) {
  const items: { label: string; icon: IconName; tab: Tab | null; go?: () => void }[] = [
    { label: '홈', icon: 'home', tab: 'home', go: () => router.replace('/') },
    { label: '지도', icon: 'map', tab: 'map', go: () => router.replace('/map') },
    { label: '내 신고', icon: 'list', tab: 'reports', go: () => router.replace('/reports') },
    { label: '음성', icon: 'mic', tab: null },
  ];

  return (
    <View style={styles.bar}>
      {items.map((item) => {
        const isActive = item.tab === active;
        return (
          <Pressable
            key={item.label}
            style={styles.item}
            disabled={!item.go || isActive}
            onPress={item.go}>
            <Icon name={item.icon} size={24} color={isActive ? '#0E8A5F' : '#A3ACA8'} />
            <Text style={[styles.text, isActive && styles.activeText]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 13,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderColor: '#EEF0EF',
    backgroundColor: '#FFFFFF',
  },
  item: {
    width: 56,
    alignItems: 'center',
    gap: 6,
  },
  text: {
    color: '#84908B',
    fontSize: 12,
  },
  activeText: {
    color: '#0E8A5F',
    fontWeight: '900',
  },
});
