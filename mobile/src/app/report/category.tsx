/** Screen 02 — 신고 작성 1/2: photo, AI hint, category, severity, affected groups, location. */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AffectedGroup, Category } from '../../../../contract/types';
import { classifyPhoto, checkNearby } from '@/api';
import { Icon } from '@/components/icon';
import { CLASSIFY_MIN_CONFIDENCE } from '@/api/config';
import { CATEGORY_LABEL, GROUP_LABEL, SEVERITY_LABEL } from '@/labels';
import { getDraft, updateDraft, useDraft } from '@/report/draft';
import { CATEGORIES, GROUPS, SEVERITIES } from '@/report/labels';
import { locate } from '@/report/location';
import { submitDraft } from '@/report/submit';
import { C, Chip, Choice, ErrorText, PrimaryButton, SectionTitle } from '@/report/ui';
import { useVoiceDraft } from '@/report/use-voice-draft';

type GpsState = 'searching' | 'ready' | 'failed';

export default function CategoryScreen() {
  const draft = useDraft();
  const [gps, setGps] = useState<GpsState>('searching');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI hint: a quiet background call. No answer or low confidence → no hint.
  const photoUri = draft.photo?.uri;
  useEffect(() => {
    if (!photoUri) return;
    let active = true;
    classifyPhoto(photoUri).then((r) => {
      if (!active || !isPickable(r.category) || r.confidence < CLASSIFY_MIN_CONFIDENCE) return;
      // The hint also preselects the chip, unless the resident already chose one on the home screen.
      updateDraft({ hint: r.category, confidence: r.confidence, category: getDraft().category ?? r.category });
    });
    return () => {
      active = false;
    };
  }, [photoUri]);

  // The camera screen already started the GPS fix; this awaits the same promise.
  useEffect(() => {
    locate().then(
      () => setGps('ready'),
      () => setGps('failed'),
    );
  }, []);

  function retryGps() {
    setGps('searching');
    locate().then(
      () => setGps('ready'),
      () => setGps('failed'),
    );
  }

  const voice = useVoiceDraft((result) => {
    updateDraft({
      voice: result,
      ...(isPickable(result.category) ? { hint: result.category, confidence: null } : {}),
      ...(result.affected_groups.length ? { groups: result.affected_groups } : {}),
    });
  });

  function toggleGroup(g: AffectedGroup) {
    const { groups } = draft;
    updateDraft({ groups: groups.includes(g) ? groups.filter((x) => x !== g) : [...groups, g] });
  }

  async function next() {
    if (!draft.category || !draft.severity) return;
    setBusy(true);
    setError(null);
    let coords;
    try {
      coords = await locate();
    } catch (e) {
      setGps('failed');
      setError(e instanceof Error ? e.message : '현재 위치를 확인할 수 없어요.');
      setBusy(false);
      return;
    }

    let duplicate = null;
    try {
      duplicate = (await checkNearby({ ...coords, category: draft.category })).duplicate;
    } catch {
      // The duplicate check must never block a report — go straight to creating it.
    }
    updateDraft({ duplicate });

    if (duplicate) {
      setBusy(false);
      router.push('/report/duplicate');
      return;
    }

    try {
      await submitDraft();
      router.replace('/report/done');
    } catch (e) {
      setError(e instanceof Error ? e.message : '잠시 후 다시 시도해 주세요.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content}>
        {draft.photo ? (
          <Image source={{ uri: draft.photo.thumb_uri }} style={s.photo} contentFit="cover" />
        ) : (
          <View style={[s.photo, s.photoEmpty]}>
            <Icon name="camera" size={36} color={C.textMuted} />
          </View>
        )}

        {draft.hint ? (
          <View style={s.hint}>
            <Icon name="ai" size={18} color={C.green} />
            <Text style={s.hintText}>
              {draft.confidence != null ? 'AI 분류' : '음성 분류'}: {CATEGORY_LABEL[draft.hint]}
              {draft.confidence != null ? ` · ${Math.round(draft.confidence * 100)}%` : ''}
            </Text>
          </View>
        ) : null}

        <SectionTitle>{draft.hint ? '맞습니까? 아니면 선택하세요' : '어떤 문제인가요?'}</SectionTitle>
        <View style={s.chips}>
          {CATEGORIES.map((c) => (
            <Chip
              key={c}
              label={CATEGORY_LABEL[c]}
              icon={c}
              selected={draft.category === c}
              onPress={() => updateDraft({ category: c })}
            />
          ))}
        </View>

        <SectionTitle>얼마나 위험한가요?</SectionTitle>
        <View style={s.chips}>
          {SEVERITIES.map((v) => (
            <Chip
              key={v}
              label={SEVERITY_LABEL[v]}
              selected={draft.severity === v}
              onPress={() => updateDraft({ severity: v })}
            />
          ))}
        </View>

        <SectionTitle>
          누가 불편한가요? <Text style={s.sectionNote}>복수 선택</Text>
        </SectionTitle>
        <View style={s.grid}>
          {GROUPS.map((g) => (
            <Choice key={g} label={GROUP_LABEL[g]} icon={g} selected={draft.groups.includes(g)} onPress={() => toggleGroup(g)} />
          ))}
        </View>

        <SectionTitle>위치</SectionTitle>
        <Pressable
          style={s.location}
          onPress={gps === 'failed' ? retryGps : undefined}
          disabled={gps !== 'failed'}
          accessibilityRole={gps === 'failed' ? 'button' : undefined}>
          <View style={[s.locationIcon, gps === 'failed' && s.locationIconFailed]}>
            <Icon name="location" size={20} color={gps === 'failed' ? C.red : C.green} />
          </View>
          <View style={s.locationBody}>
            <Text style={s.locationTitle}>현재 위치</Text>
            <Text style={s.locationSub}>
              {gps === 'ready' ? 'GPS 자동 인식' : gps === 'searching' ? '위치 찾는 중…' : '위치 확인 실패 · 눌러서 다시 시도'}
            </Text>
          </View>
        </Pressable>

        <Pressable
          onPress={voice.toggle}
          disabled={voice.state === 'processing'}
          accessibilityRole="button"
          style={({ pressed }) => [s.voice, voice.state === 'recording' && s.voiceRecording, pressed && s.pressed]}>
          <Icon name="mic" size={20} color={voice.state === 'recording' ? C.red : C.green} />
          <Text style={[s.voiceText, voice.state === 'recording' && s.voiceTextRecording]}>
            {voice.state === 'recording'
              ? '듣고 있어요 · 눌러서 끝내기'
              : voice.state === 'processing'
                ? '정리하는 중…'
                : '말로 설명하기'}
          </Text>
        </Pressable>
        {draft.voice?.transcript ? <Text style={s.transcript}>“{draft.voice.transcript}”</Text> : null}

        <ErrorText message={error} />
      </ScrollView>

      <View style={s.footer}>
        <PrimaryButton label="다음" onPress={next} disabled={!draft.category || !draft.severity || !draft.photo} busy={busy} />
      </View>
    </SafeAreaView>
  );
}

/** Voice and AI may answer with anything — only the four known categories become a hint. */
function isPickable(c: Category | null): c is Category {
  return c !== null && CATEGORIES.includes(c);
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 12 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: C.border },
  photoEmpty: { alignItems: 'center', justifyContent: 'center' },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: C.greenSoft,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  hintText: { color: C.green, fontSize: 16, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sectionNote: { color: C.textMuted, fontSize: 14, fontWeight: '600' },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    padding: 14,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.greenSoft,
  },
  locationIconFailed: { backgroundColor: '#FBEAEA' },
  locationBody: { flex: 1, gap: 2 },
  locationTitle: { color: C.text, fontSize: 17, fontWeight: '700' },
  locationSub: { color: C.textSoft, fontSize: 15 },
  voice: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceRecording: { borderColor: C.red, backgroundColor: '#FBEAEA' },
  voiceText: { color: C.text, fontSize: 18, fontWeight: '600' },
  voiceTextRecording: { color: C.red },
  transcript: { color: C.textSoft, fontSize: 17, fontStyle: 'italic' },
  pressed: { opacity: 0.75 },
  footer: { padding: 16, paddingTop: 8 },
});
