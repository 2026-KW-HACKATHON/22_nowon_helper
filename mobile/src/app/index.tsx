import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Report } from '../../../contract/types';
import { confirmReport, DEMO_BBOX, getMap } from '@/api';
import { BottomNav } from '@/components/bottom-nav';
import { NeighborhoodMap } from '@/components/neighborhood-map';
import { daysSince } from '@/format';
import { useLoad } from '@/hooks/use-load';
import { CATEGORY_LABEL, priorityColor } from '@/labels';

/**
 * Until GPS is wired: the resident stands where the nearby fixture
 * says, 32 m from report 1042.
 */
const DEMO_LOCATION = { lat: 37.62012, lng: 127.05981 };

export default function HomeScreen() {
  const { data, error, refreshing, refresh } = useLoad(() => getMap(DEMO_BBOX));
  const [notice, setNotice] = useState<string | null>(null);
  // A finger on the map pans the map, not the page.
  const [pageScroll, setPageScroll] = useState(true);

  const reports = data?.reports ?? [];
  const counts = data?.counts;
  const urgent = reports
    .filter((report) => report.status !== 'resolved')
    .sort((a, b) => b.priority_score - a.priority_score)[0];

  const pins = useMemo(
    () => ({
      me: DEMO_LOCATION,
      reports: (data?.reports ?? []).map((report) => ({
        id: report.id,
        lat: report.lat,
        lng: report.lng,
        score: report.priority_score,
        color: priorityColor(report.priority_score),
        faded: report.status === 'resolved',
      })),
    }),
    [data],
  );

  const openDetailById = (id: string) => router.push({ pathname: '/detail', params: { id } });
  const openDetail = (report: Report) => openDetailById(report.id);

  const confirm = async (report: Report) => {
    try {
      await confirmReport(report.id);
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.screen}
        scrollEnabled={pageScroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.locationBox}>
          <View style={styles.greenDot} />
          <Text style={styles.locationText}>월계동</Text>
        </View>

        {counts && (
          <View style={styles.chips}>
            <View style={[styles.chip, styles.activeChip]}>
              <Text style={styles.activeChipText}>
                전체 {counts.new + counts.in_progress + counts.resolved}
              </Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>신규 {counts.new}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>처리중 {counts.in_progress}</Text>
            </View>
            <View style={styles.chip}>
              <Text style={styles.chipText}>해결 {counts.resolved}</Text>
            </View>
          </View>
        )}

        <View
          onTouchStart={() => setPageScroll(false)}
          onTouchEnd={() => setPageScroll(true)}
          onTouchCancel={() => setPageScroll(true)}>
          <NeighborhoodMap
            bbox={DEMO_BBOX}
            data={pins}
            onSelect={openDetailById}
            style={styles.map}
          />
        </View>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          {error && <Text style={styles.message}>{error}</Text>}
          {!data && !error && <Text style={styles.message}>불러오는 중…</Text>}

          {urgent && (
            <>
              <View style={styles.sheetHeading}>
                <Text style={styles.sheetTitle}>가장 시급한 문제</Text>
                <View style={styles.priorityPill}>
                  <Text style={styles.priorityPillText}>우선순위 {urgent.priority_score}</Text>
                </View>
              </View>

              <Pressable style={styles.reportRow} onPress={() => openDetail(urgent)}>
                <View style={styles.thumbnail}>
                  <Image
                    source={urgent.photos.before_thumb_url}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                  <Text style={styles.thumbnailText}>사진</Text>
                </View>

                <View style={styles.reportInfo}>
                  <Text style={styles.reportTitle}>{CATEGORY_LABEL[urgent.category]}</Text>
                  <Text style={styles.reportSub}>
                    {urgent.confirmation_count}명 확인 · {daysSince(urgent.created_at)}일 경과
                  </Text>
                  <View style={styles.priorityTrack}>
                    <View
                      style={[
                        styles.priorityFill,
                        {
                          width: `${urgent.priority_score}%`,
                          backgroundColor: priorityColor(urgent.priority_score),
                        },
                      ]}
                    />
                  </View>
                </View>
              </Pressable>

              <View style={styles.actionRow}>
                <Pressable
                  style={[styles.confirmButton, urgent.confirmed_by_me && styles.confirmedButton]}
                  disabled={urgent.confirmed_by_me}
                  onPress={() => confirm(urgent)}>
                  <Text
                    style={[styles.confirmText, urgent.confirmed_by_me && styles.confirmedText]}>
                    {urgent.confirmed_by_me ? '확인함 ✓' : '확인 +1'}
                  </Text>
                </Pressable>

                <Pressable style={styles.detailButton} onPress={() => openDetail(urgent)}>
                  <Text style={styles.detailButtonText}>상세</Text>
                </Pressable>
              </View>

              {notice && <Text style={styles.message}>{notice}</Text>}
            </>
          )}
        </View>
      </ScrollView>

      {/* TODO(FE-2 review): entry point into the create path (FE-1), wired here only
          so the end-to-end demo scenario has a way in. Feel free to restyle/relocate. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="신고하기"
        style={styles.fab}
        onPress={() => router.push('/report')}>
        <Text style={styles.fabText}>+ 신고하기</Text>
      </Pressable>

      <BottomNav active="home" />
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
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  locationBox: {
    height: 62,
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0E8A5F',
  },
  locationText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14181A',
  },
  chips: {
    flexDirection: 'row',
    gap: 9,
    marginHorizontal: 20,
    marginTop: 18,
  },
  chip: {
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  activeChip: {
    backgroundColor: '#14181A',
  },
  chipText: {
    color: '#5C6663',
    fontSize: 15,
    fontWeight: '800',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  map: {
    height: 465,
    marginTop: 20,
  },
  sheet: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 20,
    zIndex: 2,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: '#D7DCDA',
  },
  message: {
    marginTop: 16,
    color: '#68736E',
    fontSize: 14,
    textAlign: 'center',
  },
  sheetHeading: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#14181A',
  },
  priorityPill: {
    borderRadius: 18,
    backgroundColor: '#FCE8E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priorityPillText: {
    color: '#C0392B',
    fontSize: 14,
    fontWeight: '800',
  },
  reportRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 19,
  },
  thumbnail: {
    width: 92,
    height: 92,
    borderRadius: 14,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1EF',
  },
  thumbnailText: {
    color: '#AAB4AF',
    fontSize: 13,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14181A',
  },
  reportSub: {
    marginTop: 6,
    color: '#68736E',
    fontSize: 14,
  },
  priorityTrack: {
    height: 8,
    marginTop: 17,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E9ECEA',
  },
  priorityFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  confirmButton: {
    flex: 1,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E8A5F',
  },
  confirmedButton: {
    backgroundColor: '#E7F3EE',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  confirmedText: {
    color: '#0E8A5F',
  },
  detailButton: {
    width: 106,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E5E3',
    backgroundColor: '#F8F9F8',
  },
  detailButtonText: {
    color: '#14181A',
    fontSize: 17,
    fontWeight: '900',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 96,
    height: 52,
    paddingHorizontal: 20,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E8A5F',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
