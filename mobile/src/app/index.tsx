import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Category, Report } from '../../../contract/types';
import { confirmReport, DEMO_BBOX, getMap } from '@/api';
import { BottomNav } from '@/components/bottom-nav';
import { Icon } from '@/components/icon';
import { useLoad } from '@/hooks/use-load';
import { CATEGORY_LABEL } from '@/labels';
import { CATEGORIES } from '@/report/labels';

/** Same spot as the map screen: 32 m from report 1042 in the fixtures. */
const DEMO_LOCATION = { lat: 37.62012, lng: 127.05981 };
const NEARBY_RADIUS_M = 500;
const NEARBY_SHOWN = 3;

/** Screen 01 — home: pick what is wrong, see what is already reported nearby. */
export default function HomeScreen() {
  const { data, error, refreshing, refresh } = useLoad(() => getMap(DEMO_BBOX));
  const [category, setCategory] = useState<Category | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // The report whose 확인 +1 is in flight: a second tap must not send a second request.
  const [confirming, setConfirming] = useState<string | null>(null);

  const nearby = (data?.reports ?? [])
    .filter((report) => report.status !== 'resolved')
    .map((report) => ({ report, distance: distanceM(DEMO_LOCATION, report) }))
    .filter((item) => item.distance <= NEARBY_RADIUS_M)
    .sort((a, b) => a.distance - b.distance);

  const startReport = () =>
    router.push(category ? { pathname: '/report', params: { category } } : '/report');

  const confirm = async (report: Report) => {
    if (confirming) return;
    setConfirming(report.id);
    try {
      await confirmReport(report.id);
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setConfirming(null);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
        <View style={styles.locationRow}>
          <Icon name="location" size={16} color="#0E8A5F" />
          <Text style={styles.locationText}>월계동 · 광운대 인근</Text>
        </View>

        <Text style={styles.title}>무엇이{'\n'}불편하신가요?</Text>
        <Text style={styles.subtitle}>사진 한 장으로 신고가 끝납니다</Text>

        <View style={styles.grid}>
          {CATEGORIES.map((c) => {
            const selected = category === c;
            return (
              <Pressable
                key={c}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                style={[styles.tile, selected && styles.tileSelected]}
                onPress={() => setCategory(selected ? null : c)}>
                <View style={[styles.tileIcon, selected && styles.tileIconSelected]}>
                  <Icon name={c} size={20} color={selected ? '#FFFFFF' : '#0E8A5F'} />
                </View>
                <Text style={[styles.tileText, selected && styles.tileTextSelected]}>{CATEGORY_LABEL[c]}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionTitle}>내 주변 문제 {nearby.length}건</Text>
          <Pressable onPress={() => router.push('/map')} hitSlop={8}>
            <Text style={styles.link}>지도에서 보기</Text>
          </Pressable>
        </View>

        {error && <Text style={styles.message}>{error}</Text>}
        {!data && !error && <Text style={styles.message}>불러오는 중…</Text>}
        {data && nearby.length === 0 && <Text style={styles.message}>주변에 신고된 문제가 없어요.</Text>}

        {nearby.slice(0, NEARBY_SHOWN).map(({ report, distance }) => (
          <Pressable
            key={report.id}
            style={styles.row}
            onPress={() => router.push({ pathname: '/detail', params: { id: report.id } })}>
            <View style={styles.thumbnail}>
              <Icon name={report.category} size={22} color="#AAB4AF" />
              <Image source={report.photos.before_thumb_url} style={StyleSheet.absoluteFill} contentFit="cover" />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle}>
                {CATEGORY_LABEL[report.category]} · {Math.round(distance)}m
              </Text>
              <Text style={styles.rowSub}>{report.confirmation_count}명이 확인했어요</Text>
            </View>
            <Pressable
              style={[styles.confirmChip, report.confirmed_by_me && styles.confirmedChip]}
              disabled={report.confirmed_by_me || confirming !== null}
              onPress={() => confirm(report)}>
              {report.confirmed_by_me && <Icon name="check" size={14} color="#84908B" />}
              <Text style={[styles.confirmChipText, report.confirmed_by_me && styles.confirmedChipText]}>
                {report.confirmed_by_me ? '확인함' : '확인 +1'}
              </Text>
            </Pressable>
          </Pressable>
        ))}

        {notice && <Text style={styles.message}>{notice}</Text>}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" style={styles.primary} onPress={startReport}>
          <Icon name="camera" size={22} color="#FFFFFF" />
          <Text style={styles.primaryText}>사진으로 신고하기</Text>
        </Pressable>
      </View>

      <BottomNav active="home" />
    </SafeAreaView>
  );
}

/** Straight-line distance in meters — enough to sort a few pins by closeness. */
function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLng = (b.lng - a.lng) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6_371_000 * Math.asin(Math.sqrt(h));
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    // Full width on every phone; only the web preview keeps a phone-sized column.
    ...Platform.select({ web: { maxWidth: 390, alignSelf: 'center' as const } }),
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 20,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  locationText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#14181A',
  },
  title: {
    marginTop: 22,
    fontSize: 30,
    lineHeight: 38,
    fontWeight: '900',
    color: '#14181A',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 15,
    color: '#68736E',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 22,
  },
  tile: {
    flexGrow: 1,
    flexBasis: '30%',
    height: 96,
    borderRadius: 16,
    padding: 14,
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#F3F5F4',
    backgroundColor: '#F3F5F4',
  },
  tileSelected: {
    borderColor: '#0E8A5F',
    backgroundColor: '#E7F3EE',
  },
  tileIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  tileIconSelected: {
    backgroundColor: '#0E8A5F',
  },
  tileText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14181A',
  },
  tileTextSelected: {
    color: '#0E8A5F',
  },
  sectionHeading: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#14181A',
  },
  link: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0E8A5F',
  },
  message: {
    marginTop: 16,
    color: '#68736E',
    fontSize: 14,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEF0EF',
  },
  thumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1EF',
  },
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#14181A',
  },
  rowSub: {
    marginTop: 4,
    fontSize: 13,
    color: '#68736E',
  },
  confirmChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#E7F3EE',
  },
  confirmedChip: {
    backgroundColor: '#F3F5F4',
  },
  confirmChipText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0E8A5F',
  },
  confirmedChipText: {
    color: '#84908B',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primary: {
    height: 56,
    flexDirection: 'row',
    gap: 8,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E8A5F',
  },
  primaryText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
});
