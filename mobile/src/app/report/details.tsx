/** Screen 03 — severity, affected groups, optional note → POST /api/reports. */
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AffectedGroup, Report, Severity } from '../../../../contract/types';
import { createReport } from '@/api';
import { uploadPhoto } from '@/api/upload';
import { CATEGORY_LABEL, GROUP_LABEL, SEVERITY_LABEL } from '@/labels';
import { useDraft } from '@/report/draft';
import { GROUPS, SEVERITIES } from '@/report/labels';
import { locate } from '@/report/location';
import { C, Choice, ErrorText, PrimaryButton, SectionTitle } from '@/report/ui';

export default function DetailsScreen() {
  const draft = useDraft();
  // Voice draft prefills the form; the resident can change anything.
  const [severity, setSeverity] = useState<Severity | null>(null);
  const [groups, setGroups] = useState<AffectedGroup[]>(draft.voice?.affected_groups ?? []);
  const [description, setDescription] = useState(draft.voice?.transcript ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Report | null>(null);

  function toggleGroup(g: AffectedGroup) {
    setGroups((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));
  }

  async function submit() {
    const { photo, category } = draft;
    if (!photo || !category || !severity) return;
    setBusy(true);
    setError(null);
    try {
      const coords = await locate();
      const uploaded = await uploadPhoto(photo);
      const note = description.trim();
      const report = await createReport({
        ...coords,
        category,
        severity,
        affected_groups: groups,
        ...uploaded,
        ...(note ? { description: note } : {}),
      });
      setCreated(report);
    } catch (e) {
      setError(e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <SafeAreaView style={s.screen}>
        <View style={s.done}>
          <Text style={s.doneTitle}>신고가 접수됐어요</Text>
          <Text style={s.doneBody}>{CATEGORY_LABEL[created.category]}</Text>
          <View style={s.score}>
            <Text style={s.scoreLabel}>우선순위</Text>
            <Text style={s.scoreValue} maxFontSizeMultiplier={1.5}>{created.priority_score}</Text>
          </View>
          <Text style={s.doneHint}>이웃이 확인할수록 우선순위가 올라가요.</Text>
        </View>
        <View style={s.footer}>
          <PrimaryButton label="지도로 돌아가기" onPress={() => router.replace('/')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        {draft.category ? <Text style={s.category}>{CATEGORY_LABEL[draft.category]}</Text> : null}

        <SectionTitle>얼마나 위험한가요?</SectionTitle>
        <View style={s.row}>
          {SEVERITIES.map((v) => (
            <Choice key={v} label={SEVERITY_LABEL[v]} selected={severity === v} onPress={() => setSeverity(v)} />
          ))}
        </View>

        <SectionTitle>누가 불편한가요? (여러 개 선택)</SectionTitle>
        <View style={s.grid}>
          {GROUPS.map((g) => (
            <Choice key={g} label={GROUP_LABEL[g]} selected={groups.includes(g)} onPress={() => toggleGroup(g)} />
          ))}
        </View>

        <SectionTitle>설명 (선택)</SectionTitle>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="예: 휠체어가 지나가기 어려워요"
          placeholderTextColor={C.textMuted}
          multiline
          maxLength={300}
          style={s.input}
        />

        <ErrorText message={error} />
      </ScrollView>

      <View style={s.footer}>
        <PrimaryButton label="신고하기" onPress={submit} disabled={!severity || !draft.photo} busy={busy} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 12 },
  category: { color: C.text, fontSize: 23, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  input: {
    minHeight: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    padding: 12,
    fontSize: 18,
    color: C.text,
    textAlignVertical: 'top',
  },
  footer: { padding: 16, paddingTop: 8 },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  doneTitle: { color: C.text, fontSize: 28, fontWeight: '800' },
  doneBody: { color: C.textSoft, fontSize: 19 },
  score: { alignItems: 'center', backgroundColor: C.card, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 32 },
  scoreLabel: { color: C.textSoft, fontSize: 16, fontWeight: '600' },
  scoreValue: { color: C.green, fontSize: 48, fontWeight: '800' },
  doneHint: { color: C.textMuted, fontSize: 17, textAlign: 'center' },
});
