/** Screen 03 — 신고 작성 2/2: the problem is already reported nearby, 확인 +1 instead of a new report. */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DUPLICATE_RADIUS_M, type ConfirmResponse } from '../../../../contract/types';
import { ApiRequestError, confirmReport } from '@/api';
import { Icon } from '@/components/icon';
import { daysSince } from '@/format';
import { CATEGORY_LABEL, STATUS_COLOR, STATUS_LABEL } from '@/labels';
import { updateDraft, useDraft } from '@/report/draft';
import { submitDraft } from '@/report/submit';
import { C, ErrorText, PrimaryButton, SecondaryButton } from '@/report/ui';

export default function DuplicateScreen() {
  const { duplicate } = useDraft();
  const [result, setResult] = useState<ConfirmResponse | null>(null);
  const [busy, setBusy] = useState<'confirm' | 'new' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(duplicate?.confirmed_by_me ?? false);

  if (!duplicate) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.content}>
          <ErrorText message="표시할 문제가 없어요." />
          <SecondaryButton label="처음으로" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  const report = result?.report ?? duplicate;

  async function confirm() {
    setBusy('confirm');
    setError(null);
    try {
      const response = await confirmReport(duplicate!.id);
      setResult(response);
      updateDraft({ duplicate: response.report });
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'already_confirmed') setAlreadyConfirmed(true);
      setError(e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(null);
    }
  }

  async function reportNew() {
    setBusy('new');
    setError(null);
    try {
      await submitDraft();
      router.replace('/report/done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(null);
    }
  }

  // distance_m only ever comes from the original /nearby hit — ConfirmResponse.report has no such field.
  const distance = duplicate.distance_m != null ? `${duplicate.distance_m}m` : `${DUPLICATE_RADIUS_M}m 안`;

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.title}>근처에 같은 문제가{'\n'}있어요</Text>
        <Text style={s.lead}>새로 쓰지 않고 확인만 해주세요. 확인이 많을수록 우선순위가 올라갑니다.</Text>

        <View style={s.card}>
          {report.photos.before_thumb_url ? (
            <Image source={{ uri: report.photos.before_thumb_url }} style={s.thumb} contentFit="cover" />
          ) : (
            <View style={s.thumb}>
              <Icon name="photo" size={32} color={C.textMuted} />
            </View>
          )}
          <View style={s.cardBody}>
            <View style={s.metaRow}>
              <View style={[s.statusPill, { borderColor: STATUS_COLOR[report.status] }]}>
                <Text style={[s.statusText, { color: STATUS_COLOR[report.status] }]}>{STATUS_LABEL[report.status]}</Text>
              </View>
              <Icon name="location" size={13} color={C.textMuted} />
              <Text style={s.meta}>
                {distance} · {daysSince(report.created_at)}일 전
              </Text>
            </View>
            <Text style={s.category}>{CATEGORY_LABEL[report.category]}</Text>
            <Text style={s.address}>{report.address}</Text>

            {result ? (
              <View style={s.stats}>
                <Stat label="확인" value={report.confirmation_count} previous={result.previous_confirmation_count} suffix="명" />
                <Stat label="우선순위" value={report.priority_score} previous={result.previous_priority_score} />
              </View>
            ) : (
              <View style={s.confirmedRow}>
                <Icon name="people" size={18} color={C.green} />
                <Text style={s.confirmed}>{report.confirmation_count}명이 확인</Text>
              </View>
            )}
          </View>
        </View>

        {result ? (
          <View style={s.thanksRow}>
            <Icon name="checkCircle" size={20} color={C.green} />
            <Text style={s.thanks}>확인해 주셔서 감사해요. 우선순위가 올라갔어요.</Text>
          </View>
        ) : (
          <Text style={s.note}>확인은 1인 1회만 가능합니다. 같은 문제가 아니라면 아래에서 새로 신고하세요.</Text>
        )}
        <ErrorText message={error} />
      </ScrollView>

      <View style={s.footer}>
        {result || alreadyConfirmed ? (
          <PrimaryButton label="완료" onPress={() => router.replace('/')} />
        ) : (
          <>
            <PrimaryButton
              label={`확인 +1 · ${report.confirmation_count + 1}명으로`}
              onPress={confirm}
              busy={busy === 'confirm'}
              disabled={busy === 'new'}
            />
            <SecondaryButton label="다른 문제입니다 · 새로 신고" onPress={reportNew} disabled={busy !== null} />
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

/** Numbers are already large — cap their growth under big system fonts. */
const BIG_NUMBER_SCALE = 1.5;

/** "12 → 13": the previous value from ConfirmResponse, the new one pops in. */
function Stat(props: { label: string; value: number; previous?: number; suffix?: string }) {
  const scale = useAnimatedValue(1);
  const changed = props.previous != null && props.previous !== props.value;

  useEffect(() => {
    if (!changed) return;
    scale.setValue(1.5);
    Animated.spring(scale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [changed, scale]);

  return (
    <View style={s.stat}>
      <Text style={s.statLabel}>{props.label}</Text>
      <View style={s.statRow}>
        {changed ? <Text style={s.statPrevious} maxFontSizeMultiplier={BIG_NUMBER_SCALE}>{props.previous} → </Text> : null}
        <Animated.Text maxFontSizeMultiplier={BIG_NUMBER_SCALE} style={[s.statValue, changed && s.statValueChanged, { transform: [{ scale }] }]}>
          {props.value}
        </Animated.Text>
        {props.suffix ? <Text style={s.statSuffix}>{props.suffix}</Text> : null}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 14 },
  title: { color: C.text, fontSize: 28, fontWeight: '800', lineHeight: 36 },
  lead: { color: C.textSoft, fontSize: 16, lineHeight: 23 },
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: C.green,
    overflow: 'hidden',
  },
  thumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center' },
  cardBody: { padding: 14, gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusPill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusText: { fontSize: 13, fontWeight: '700' },
  meta: { color: C.textMuted, fontSize: 14 },
  category: { color: C.text, fontSize: 20, fontWeight: '800' },
  address: { color: C.textSoft, fontSize: 15 },
  confirmedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  confirmed: { color: C.text, fontSize: 16, fontWeight: '700' },
  note: { color: C.textMuted, fontSize: 14, lineHeight: 20, backgroundColor: C.card, borderRadius: 12, padding: 12 },
  stats: { flexDirection: 'row', gap: 10, marginTop: 6 },
  stat: { flex: 1, backgroundColor: C.bg, borderRadius: 14, padding: 12, gap: 2 },
  statLabel: { color: C.textSoft, fontSize: 15, fontWeight: '600' },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  statPrevious: { color: C.textMuted, fontSize: 21, fontWeight: '600' },
  statValue: { color: C.text, fontSize: 32, fontWeight: '800' },
  statValueChanged: { color: C.green },
  statSuffix: { color: C.textSoft, fontSize: 17, marginLeft: 2 },
  thanksRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  thanks: { flex: 1, color: C.green, fontSize: 18, fontWeight: '600' },
  footer: { padding: 16, paddingTop: 8, gap: 10 },
});
