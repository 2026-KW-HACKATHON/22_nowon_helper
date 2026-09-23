import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DetailScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.replace('/')}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>문제 상세</Text>
        <Text style={styles.shareText}>공유</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.photo}>
          <Text style={styles.photoText}>사진 · Before</Text>
        </View>

        <View style={styles.badges}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>처리중</Text>
          </View>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreBadgeText}>우선순위 78</Text>
          </View>
        </View>

        <Text style={styles.title}>보도블록 파손</Text>
        <Text style={styles.address}>월계동 광운로 20 앞 · 4일 전 신고</Text>

        <View style={styles.priorityCard}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>우선순위 점수</Text>
            <Text style={styles.score}>78 / 100</Text>
          </View>

          <View style={styles.barBackground}>
            <View style={styles.bar} />
          </View>

          <View style={styles.scoreGrid}>
            <Text style={styles.gridText}>확인 13명</Text>
            <Text style={styles.gridText}>심각도 높음</Text>
            <Text style={styles.gridText}>경과 4일</Text>
            <Text style={styles.gridText}>영향 그룹 2</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>진행 상황</Text>

        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, styles.green]} />
          <View>
            <Text style={styles.timelineTitle}>신규 접수</Text>
            <Text style={styles.timelineDate}>9월 13일</Text>
          </View>
        </View>

        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, styles.orange]} />
          <View>
            <Text style={styles.timelineTitle}>처리중 · 노원구 도로과</Text>
            <Text style={styles.timelineDate}>9월 16일</Text>
          </View>
        </View>

        <View style={styles.timelineRow}>
          <View style={[styles.timelineDot, styles.gray]} />
          <View>
            <Text style={[styles.timelineTitle, styles.disabled]}>해결 · After 사진 대기</Text>
          </View>
        </View>

        <View style={styles.beforeAfterTitle}>
          <Text style={styles.beforeAfterLabel}>BEFORE</Text>
          <Text style={styles.beforeAfterLabel}>AFTER</Text>
        </View>

        <View style={styles.beforeAfter}>
          <View style={styles.beforeBox}>
            <Text style={styles.beforeText}>Before 사진</Text>
          </View>
          <View style={styles.afterBox}>
            <Text style={styles.afterText}>대기</Text>
          </View>
        </View>
      </ScrollView>

      <Pressable
        style={styles.confirmButton}
        onPress={() => router.push('/reports')}>
        <Text style={styles.confirmText}>나도 확인 +1</Text>
      </Pressable>
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
  header: {
    height: 72,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#F5F6F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 36,
    lineHeight: 38,
    color: '#14181A',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
    fontSize: 20,
    fontWeight: '800',
    color: '#14181A',
  },
  shareText: {
    color: '#65706C',
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  photo: {
    height: 255,
    borderRadius: 20,
    backgroundColor: '#EEF1EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoText: {
    color: '#9BA6A1',
  },
  badges: {
    flexDirection: 'row',
    marginTop: 17,
  },
  statusBadge: {
    backgroundColor: '#FFF0D8',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  statusText: {
    color: '#B87503',
    fontWeight: '800',
  },
  scoreBadge: {
    backgroundColor: '#FBE8E5',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  scoreBadgeText: {
    color: '#C0392B',
    fontWeight: '800',
  },
  title: {
    marginTop: 14,
    fontSize: 31,
    fontWeight: '900',
    color: '#14181A',
  },
  address: {
    marginTop: 7,
    color: '#6C7572',
    fontSize: 15,
  },
  priorityCard: {
    marginTop: 25,
    borderWidth: 1,
    borderColor: '#E5E9E7',
    borderRadius: 17,
    padding: 20,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#26302D',
    fontSize: 17,
    fontWeight: '800',
  },
  score: {
    color: '#C0392B',
    fontSize: 26,
    fontWeight: '900',
  },
  barBackground: {
    height: 10,
    backgroundColor: '#EEF0EF',
    borderRadius: 5,
    overflow: 'hidden',
    marginTop: 15,
  },
  bar: {
    width: '78%',
    height: '100%',
    backgroundColor: '#C0392B',
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
  },
  gridText: {
    width: '50%',
    color: '#5C6663',
    fontSize: 15,
    marginBottom: 12,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 16,
    color: '#14181A',
    fontSize: 22,
    fontWeight: '900',
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  timelineDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 13,
  },
  green: {
    backgroundColor: '#0E8A5F',
  },
  orange: {
    backgroundColor: '#B87503',
  },
  gray: {
    backgroundColor: '#D9DEDC',
  },
  timelineTitle: {
    color: '#26302D',
    fontWeight: '800',
    fontSize: 16,
  },
  timelineDate: {
    marginTop: 3,
    color: '#8B9490',
  },
  disabled: {
    color: '#9BA6A1',
  },
  beforeAfterTitle: {
    flexDirection: 'row',
    marginTop: 12,
  },
  beforeAfterLabel: {
    width: '50%',
    color: '#87918D',
    fontSize: 13,
    fontWeight: '800',
  },
  beforeAfter: {
    flexDirection: 'row',
    marginTop: 10,
  },
  beforeBox: {
    width: '48%',
    height: 116,
    borderRadius: 14,
    marginRight: '4%',
    backgroundColor: '#EEF1EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  afterBox: {
    width: '48%',
    height: 116,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8CFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  beforeText: {
    color: '#9BA6A1',
  },
  afterText: {
    color: '#AAB2AF',
  },
  confirmButton: {
    position: 'absolute',
    bottom: 18,
    left: 20,
    right: 20,
    backgroundColor: '#0E8A5F',
    paddingVertical: 19,
    alignItems: 'center',
    borderRadius: 16,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
});