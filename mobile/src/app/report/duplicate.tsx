/** Screen 07 — the problem is already reported nearby: 확인 +1 instead of a new report. */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, useAnimatedValue, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DUPLICATE_RADIUS_M, type ConfirmResponse } from '../../../../contract/types';
import { ApiRequestError, confirmReport } from '@/api';
import { CATEGORY_LABEL, GROUP_LABEL, STATUS_COLOR, STATUS_LABEL } from '@/labels';
import { updateDraft, useDraft } from '@/report/draft';
import { C, ErrorText, PrimaryButton, SecondaryButton } from '@/report/ui';

export default function DuplicateScreen() {
  const { duplicate } = useDraft();
  const [result, setResult] = useState<ConfirmResponse | null>(null);
  const [busy, setBusy] = useState(false);
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
    setBusy(true);
    setError(null);
    try {
      const response = await confirmReport(duplicate!.id);
      setResult(response);
      updateDraft({ duplicate: response.report });
    } catch (e) {
      if (e instanceof ApiRequestError && e.code === 'already_confirmed') setAlreadyConfirmed(true);
      setError(e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content}>
        <Text style={s.lead}>
          {/* distance_m only ever comes from the original /nearby hit — ConfirmResponse.report has no such field. */}
          {duplicate.distance_m != null ? `${duplicate.distance_m}m 거리` : `반경 ${DUPLICATE_RADIUS_M}m 안`}에 같은 문제가
          이미 신고되어 있어요.
        </Text>

        <View style={s.card}>
          {report.photos.before_thumb_url ? (
            <Image source={{ uri: report.photos.before_thumb_url }} style={s.thumb} contentFit="cover" />
          ) : null}
          <View style={s.cardBody}>
            <View style={s.row}>
              <Text style={s.category}>{CATEGORY_LABEL[report.category]}</Text>
              <Text style={[s.status, { color: STATUS_COLOR[report.status] }]}>{STATUS_LABEL[report.status]}</Text>
            </View>
            <Text style={s.address}>{report.address}</Text>
            {report.affected_groups.length ? (
              <Text style={s.groups}>{report.affected_groups.map((g) => GROUP_LABEL[g]).join(' · ')}</Text>
            ) : null}
          </View>
        </View>

        <View style={s.stats}>
          <Stat
            label="확인"
            value={report.confirmation_count}
            previous={result?.previous_confirmation_count}
            suffix="명"
          />
          <Stat label="우선순위" value={report.priority_score} previous={result?.previous_priority_score} />
        </View>

        {result ? <Text style={s.thanks}>확인해 주셔서 감사해요. 우선순위가 올라갔어요.</Text> : null}
        <ErrorText message={error} />
      </ScrollView>

      <View style={s.footer}>
        {result || alreadyConfirmed ? (
          <PrimaryButton label="완료" onPress={() => router.replace('/')} />
        ) : (
          <>
            <PrimaryButton label="확인 +1" onPress={confirm} busy={busy} />
            <SecondaryButton label="다른 문제예요 · 새로 신고하기" onPress={() => router.push('/report/details')} />
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
  content: { padding: 16, gap: 16 },
  lead: { color: C.text, fontSize: 21, fontWeight: '700', lineHeight: 30 },
  card: { backgroundColor: C.card, borderRadius: 16, overflow: 'hidden' },
  thumb: { width: '100%', aspectRatio: 16 / 9, backgroundColor: C.border },
  cardBody: { padding: 14, gap: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  category: { color: C.text, fontSize: 19, fontWeight: '700' },
  status: { fontSize: 16, fontWeight: '700' },
  address: { color: C.textSoft, fontSize: 17 },
  groups: { color: C.textMuted, fontSize: 16 },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 14, gap: 4 },
  statLabel: { color: C.textSoft, fontSize: 16, fontWeight: '600' },
  statRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline' },
  statPrevious: { color: C.textMuted, fontSize: 23, fontWeight: '600' },
  statValue: { color: C.text, fontSize: 36, fontWeight: '800' },
  statValueChanged: { color: C.green },
  statSuffix: { color: C.textSoft, fontSize: 18, marginLeft: 2 },
  thanks: { color: C.green, fontSize: 18, fontWeight: '600' },
  footer: { padding: 16, paddingTop: 8, gap: 10 },
});
