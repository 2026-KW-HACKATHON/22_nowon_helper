import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DEMO_BBOX, getMap } from '@/api';
import { BottomNav } from '@/components/bottom-nav';
import { useLoad } from '@/hooks/use-load';
import { CATEGORY_LABEL, STATUS_COLOR, STATUS_LABEL } from '@/labels';

/**
 * 내 신고.
 *
 * TEMPORARY: the contract has no endpoint for "my reports" yet — it is
 * on the list of questions for the team. Until then this screen shows
 * the problems this device confirmed (confirmed_by_me), taken from the
 * map response. Creating a report also confirms it, so the reports this
 * device wrote are in this list too.
 */
export default function ReportsScreen() {
  const { data, error, refreshing, refresh } = useLoad(() => getMap(DEMO_BBOX));

  const mine = (data?.reports ?? []).filter((report) => report.confirmed_by_me);
  const resolved = mine.filter((report) => report.status === 'resolved').length;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.header}>
          <Text style={styles.title}>내 신고</Text>
          {data && (
            <Text style={styles.summary}>
              확인 {mine.length}건 · 해결 {resolved}건
            </Text>
          )}
        </View>

        {error && <Text style={styles.message}>{error}</Text>}
        {!data && !error && <Text style={styles.message}>불러오는 중…</Text>}
        {data && mine.length === 0 && (
          <Text style={styles.message}>아직 확인한 문제가 없습니다.</Text>
        )}

        <View style={styles.list}>
          {mine.map((report) => (
            <Pressable
              key={report.id}
              style={styles.card}
              onPress={() => router.push({ pathname: '/detail', params: { id: report.id } })}>
              <View style={styles.thumbnail}>
                <Image
                  source={report.photos.before_thumb_url}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </View>

              <View style={styles.cardText}>
                <View
                  style={[styles.status, { backgroundColor: `${STATUS_COLOR[report.status]}18` }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLOR[report.status] }]}>
                    {STATUS_LABEL[report.status]}
                  </Text>
                </View>
                <Text style={styles.reportTitle}>{CATEGORY_LABEL[report.category]}</Text>
                <Text style={styles.subtitle}>
                  {report.status === 'resolved'
                    ? 'Before / After 보기'
                    : `${report.confirmation_count}명 확인 · 우선순위 ${report.priority_score}`}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <BottomNav active="reports" />
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
  message: {
    marginTop: 24,
    color: '#68736E',
    fontSize: 14,
    textAlign: 'center',
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
    overflow: 'hidden',
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
});
