import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Tab = 'home' | 'reports';

/**
 * The tab bar, shared by the browse screens. 음성 belongs to the create
 * path (FE-1) and has no screen yet, so it is shown but does nothing.
 */
export function BottomNav({ active }: { active: Tab }) {
  const items: { label: string; tab: Tab | null; go?: () => void }[] = [
    { label: '홈', tab: 'home', go: () => router.replace('/') },
    { label: '지도', tab: 'home', go: () => router.replace('/') },
    { label: '내 신고', tab: 'reports', go: () => router.replace('/reports') },
    { label: '음성', tab: null },
  ];

  return (
    <View style={styles.bar}>
      {items.map((item, index) => {
        // 홈 and 지도 are the same screen for now; only 홈 lights up.
        const isActive = item.tab === active && !(active === 'home' && index === 1);
        return (
          <Pressable
            key={item.label}
            style={styles.item}
            disabled={!item.go || isActive}
            onPress={item.go}>
            <View style={[styles.icon, isActive && styles.activeIcon]} />
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
  icon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#CCD2D0',
  },
  activeIcon: {
    backgroundColor: '#0E8A5F',
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
