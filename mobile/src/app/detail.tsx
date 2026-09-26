import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
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

import { PRIORITY_CAPS } from '../../../contract/types';
import type { Report } from '../../../contract/types';
import { confirmReport, getReport } from '@/api';
import { Icon } from '@/components/icon';
import { daysSince, monthDay, points } from '@/format';
import { useLoad } from '@/hooks/use-load';
import {
  CATEGORY_LABEL,
  GROUP_LABEL,
  SEVERITY_LABEL,
  STATUS_COLOR,
  STATUS_LABEL,
  priorityColor,
} from '@/labels';

export default function DetailScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const { data: report, error, refreshing, refresh } = useLoad(() => getReport(id), id);
  const [notice, setNotice] = useState<string | null>(null);

  const confirm = async () => {
    try {
      await confirmReport(id);
      await refresh();
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <Pressable
          style={styles.backButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}>
          <Icon name="back" size={20} />
        </Pressable>
        <Text style={styles.headerTitle}>문제 상세</Text>
      </View>

      {!report ? (
        <Text style={styles.message}>{error ?? '불러오는 중…'}</Text>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.content}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}>
            {/* The full image is loaded here and only here (CLAUDE.md, rule 7). */}
            <View style={styles.photo}>
              <Icon name="photo" size={40} color="#AAB4AF" />
              <Image
                source={report.photos.before_url ?? report.photos.before_thumb_url}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            </View>

            <View style={styles.badges}>
              <View
                style={[styles.badge, { backgroundColor: `${STATUS_COLOR[report.status]}1F` }]}>
                <Text style={[styles.badgeText, { color: STATUS_COLOR[report.status] }]}>
                  {STATUS_LABEL[report.status]}
                </Text>
              </View>
              <View style={[styles.badge, styles.scoreBadge]}>
                <Icon name="flame" size={14} color="#C0392B" />
                <Text style={[styles.badgeText, styles.scoreBadgeText]}>
                  우선순위 {report.priority_score}
                </Text>
              </View>
            </View>

            <Text style={styles.title}>{CATEGORY_LABEL[report.category]}</Text>
            <View style={styles.infoRow}>
              <Icon name="location" size={15} color="#6C7572" />
              <Text style={styles.address}>
                {report.address} · {daysSince(report.created_at)}일 전 신고
              </Text>
            </View>
            {report.affected_groups.length > 0 && (
              <View style={styles.groupRow}>
                {report.affected_groups.map((group) => (
                  <View key={group} style={styles.groupChip}>
                    <Icon name={group} size={15} color="#0E8A5F" />
                    <Text style={styles.groups}>{GROUP_LABEL[group]}</Text>
                  </View>
                ))}
              </View>
            )}

            <PriorityCard report={report} />

            {report.status_log && (
              <>
                <Text style={styles.sectionTitle}>진행 상황</Text>

                {report.status_log.map((entry) => (
                  <View key={`${entry.to_status}-${entry.created_at}`} style={styles.timelineRow}>
                    <View
                      style={[
                        styles.timelineDot,
                        { backgroundColor: STATUS_COLOR[entry.to_status] },
                      ]}
                    />
                    <View>
                      <Text style={styles.timelineTitle}>
                        {STATUS_LABEL[entry.to_status]}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </Text>
                      <Text style={styles.timelineDate}>{monthDay(entry.created_at)}</Text>
                    </View>
                  </View>
                ))}

                {report.status !== 'resolved' && (
                  <View style={styles.timelineRow}>
                    <View style={[styles.timelineDot, styles.pendingDot]} />
                    <Text style={[styles.timelineTitle, styles.disabled]}>
                      해결 · After 사진 대기
                    </Text>
                  </View>
                )}
              </>
            )}

            <View style={styles.beforeAfterTitle}>
              <Text style={styles.beforeAfterLabel}>BEFORE</Text>
              <Text style={styles.beforeAfterLabel}>AFTER</Text>
            </View>

            <View style={styles.beforeAfter}>
              <View style={styles.beforeBox}>
                <Icon name="photo" size={26} color="#AAB4AF" />
                <Image
                  source={report.photos.before_thumb_url}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
              </View>
              {report.photos.after_url ? (
                <View style={styles.beforeBox}>
                  <Icon name="photo" size={26} color="#AAB4AF" />
                  <Image
                    source={report.photos.after_url}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                </View>
              ) : (
                <View style={styles.afterBox}>
                  <Icon name="clock" size={22} color="#AAB2AF" />
                  <Text style={styles.afterText}>대기</Text>
                </View>
              )}
            </View>

            {notice && <Text style={styles.message}>{notice}</Text>}
          </ScrollView>

          {report.status !== 'resolved' && (
            <Pressable
              style={[styles.confirmButton, report.confirmed_by_me && styles.confirmedButton]}
              disabled={report.confirmed_by_me}
              onPress={confirm}>
              <Icon
                name={report.confirmed_by_me ? 'check' : 'people'}
                size={20}
                color={report.confirmed_by_me ? '#0E8A5F' : '#FFFFFF'}
              />
              <Text style={[styles.confirmText, report.confirmed_by_me && styles.confirmedText]}>
                {report.confirmed_by_me ? '확인함' : '나도 확인 +1'}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

/**
 * "Why it matters": the four parts of the score, as the server computed
 * them. The client never recomputes the score (CLAUDE.md, rule 4).
 */
function PriorityCard({ report }: { report: Report }) {
  const breakdown = report.priority_breakdown;
  const rows = breakdown && [
    {
      label: `확인 ${report.confirmation_count}명`,
      value: breakdown.confirmations,
      max: PRIORITY_CAPS.confirmations,
    },
    {
      label: `심각도 ${SEVERITY_LABEL[report.severity]}`,
      value: breakdown.severity,
      max: PRIORITY_CAPS.severity,
    },
    {
      label: `경과 ${daysSince(report.created_at)}일`,
      value: breakdown.duration,
      max: PRIORITY_CAPS.duration,
    },
    {
      label: `영향 그룹 ${report.affected_groups.length}`,
      value: breakdown.impact,
      max: PRIORITY_CAPS.impact,
    },
  ];

  return (
    <View style={styles.priorityCard}>
      <View style={styles.cardTitleRow}>
        <Text style={styles.cardTitle}>우선순위 점수</Text>
        <Text style={[styles.score, { color: priorityColor(report.priority_score) }]}>
          {report.priority_score} / 100
        </Text>
      </View>

      <View style={styles.barBackground}>
        <View
          style={[
            styles.bar,
            {
              width: `${report.priority_score}%`,
              backgroundColor: priorityColor(report.priority_score),
            },
          ]}
        />
      </View>

      {rows && (
        <View style={styles.scoreGrid}>
          {rows.map((row) => (
            <View key={row.label} style={styles.gridCell}>
              <Text style={styles.gridText}>{row.label}</Text>
              <Text style={styles.gridPoints}>
                {points(row.value)}
                <Text style={styles.gridMax}> / {row.max}</Text>
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    // Full width on every phone; only the web preview keeps a phone-sized column.
    ...Platform.select({ web: { maxWidth: 390, alignSelf: 'center' as const } }),
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
  headerTitle: {
    flex: 1,
    marginLeft: 16,
    fontSize: 20,
    fontWeight: '800',
    color: '#14181A',
  },
  message: {
    marginTop: 16,
    color: '#68736E',
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  photo: {
    height: 255,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#EEF1EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 17,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  badgeText: {
    fontWeight: '800',
  },
  scoreBadge: {
    backgroundColor: '#FBE8E5',
  },
  scoreBadgeText: {
    color: '#C0392B',
  },
  title: {
    marginTop: 14,
    fontSize: 31,
    fontWeight: '900',
    color: '#14181A',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  address: {
    flex: 1,
    color: '#6C7572',
    fontSize: 15,
  },
  groupRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  groupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#E7F3EE',
  },
  groups: {
    color: '#0E8A5F',
    fontSize: 13,
    fontWeight: '700',
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
    height: '100%',
  },
  scoreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 18,
  },
  gridCell: {
    width: '50%',
    marginBottom: 12,
  },
  gridText: {
    color: '#5C6663',
    fontSize: 14,
  },
  gridPoints: {
    marginTop: 2,
    color: '#14181A',
    fontSize: 17,
    fontWeight: '800',
  },
  gridMax: {
    color: '#9BA6A1',
    fontSize: 13,
    fontWeight: '600',
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
  pendingDot: {
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
    gap: '4%',
    marginTop: 10,
  },
  beforeBox: {
    width: '48%',
    height: 116,
    borderRadius: 14,
    overflow: 'hidden',
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
  afterText: {
    marginTop: 4,
    color: '#AAB2AF',
  },
  confirmButton: {
    position: 'absolute',
    bottom: 18,
    left: 20,
    right: 20,
    backgroundColor: '#0E8A5F',
    paddingVertical: 19,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
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
});
