import { router } from 'expo-router';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const reports = [
  {
    title: '보도블록 파손',
    subtitle: '13명 확인 · 우선순위 78',
    status: '처리중',
    color: '#B87503',
  },
  {
    title: '경사로에 자전거 방치',
    subtitle: '2명 확인 · 우선순위 24',
    status: '신규',
    color: '#5C6663',
  },
  {
    title: '쓰러진 나무 제거',
    subtitle: 'Before / After 보기',
    status: '해결',
    color: '#0E8A5F',
  },
];

export default function ReportsScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>내 신고</Text>
          <Text style={styles.summary}>신고 2건 · 확인 7건 · 해결 1건</Text>
        </View>

        <View style={styles.chips}>
          <View style={[styles.chip, styles.activeChip]}>
            <Text style={styles.activeChipText}>전체</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>내가 쓴 신고</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>내가 확인</Text>
          </View>
        </View>

        <View style={styles.list}>
          {reports.map((report) => (
            <Pressable
              key={report.title}
              style={styles.card}
              onPress={() => router.push('/detail')}>
              <View style={styles.thumbnail} />

              <View style={styles.cardText}>
                <View style={[styles.status, { backgroundColor: `${report.color}18` }]}>
                  <Text style={[styles.statusText, { color: report.color }]}>
                    {report.status}
                  </Text>
                </View>
                <Text style={styles.reportTitle}>{report.title}</Text>
                <Text style={styles.subtitle}>{report.subtitle}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => router.replace('/')}>
          <View style={styles.navIcon} />
          <Text style={styles.navText}>홈</Text>
        </Pressable>

        <Pressable style={styles.navItem} onPress={() => router.replace('/')}>
          <View style={styles.navIcon} />
          <Text style={styles.navText}>지도</Text>
        </Pressable>

        <View style={styles.navItem}>
          <View style={[styles.navIcon, styles.activeNavIcon]} />
          <Text style={[styles.navText, styles.activeNavText]}>내 신고</Text>
        </View>

        <View style={styles.navItem}>
          <View style={styles.navIcon} />
          <Text style={styles.navText}>음성</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 24,
    paddingBottom: 110,
  },
  header: {
    marginTop: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: '#14181A',
  },
  summary: {
    marginTop: 8,
    fontSize: 16,
    color: '#5C6663',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
  },
  chip: {
    borderRadius: 24,
    backgroundColor: '#F5F6F5',
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  activeChip: {
    backgroundColor: '#14181A',
  },
  chipText: {
    color: '#5C6663',
    fontWeight: '700',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  list: {
    gap: 16,
    marginTop: 24,
  },
  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E6E8E7',
    borderRadius: 18,
    padding: 16,
    gap: 14,
  },
  thumbnail: {
    width: 86,
    height: 86,
    borderRadius: 12,
    backgroundColor: '#EEF1EF',
  },
  cardText: {
    flex: 1,
  },
  status: {
    alignSelf: 'flex-start',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '800',
  },
  reportTitle: {
    marginTop: 9,
    fontSize: 18,
    fontWeight: '800',
    color: '#14181A',
  },
  subtitle: {
    marginTop: 5,
    fontSize: 14,
    color: '#5C6663',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 13,
    paddingBottom: 22,
    borderTopWidth: 1,
    borderColor: '#EEF0EF',
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    alignItems: 'center',
    gap: 6,
    minWidth: 50,
  },
  navIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#CCD2D0',
  },
  activeNavIcon: {
    backgroundColor: '#0E8A5F',
  },
  navText: {
    fontSize: 12,
    color: '#84908B',
  },
  activeNavText: {
    color: '#0E8A5F',
    fontWeight: '800',
  },
});