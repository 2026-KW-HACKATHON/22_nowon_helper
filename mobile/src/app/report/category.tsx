/** Screen 02 — category: three buttons, an optional AI hint, optional voice. */
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Category } from '../../../../contract/types';
import { classifyPhoto, checkNearby } from '@/api';
import { CLASSIFY_MIN_CONFIDENCE } from '@/api/config';
import { CATEGORY_LABEL } from '@/labels';
import { updateDraft, useDraft } from '@/report/draft';
import { CATEGORIES } from '@/report/labels';
import { locate } from '@/report/location';
import { C, Choice, ErrorText, PrimaryButton } from '@/report/ui';
import { useVoiceDraft } from '@/report/use-voice-draft';

export default function CategoryScreen() {
  const draft = useDraft();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // AI hint: a quiet background call. No answer or low confidence → no hint.
  const photoUri = draft.photo?.uri;
  useEffect(() => {
    if (!photoUri) return;
    let active = true;
    classifyPhoto(photoUri).then((r) => {
      if (active && isPickable(r.category) && r.confidence >= CLASSIFY_MIN_CONFIDENCE) updateDraft({ hint: r.category });
    });
    return () => {
      active = false;
    };
  }, [photoUri]);

  const voice = useVoiceDraft((result) => {
    updateDraft({ voice: result, ...(isPickable(result.category) ? { hint: result.category } : {}) });
  });

  async function next() {
    if (!draft.category) return;
    setBusy(true);
    setError(null);
    let coords;
    try {
      coords = await locate();
    } catch (e) {
      setError(e instanceof Error ? e.message : '현재 위치를 확인할 수 없어요.');
      setBusy(false);
      return;
    }
    try {
      const { duplicate } = await checkNearby({ ...coords, category: draft.category });
      updateDraft({ duplicate });
      router.push(duplicate ? '/report/duplicate' : '/report/details');
    } catch {
      // The duplicate check must never block a report — go straight to the form.
      updateDraft({ duplicate: null });
      router.push('/report/details');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={s.screen} edges={['bottom']}>
      <ScrollView contentContainerStyle={s.content}>
        {draft.photo ? (
          <Image source={{ uri: draft.photo.thumb_uri }} style={s.photo} contentFit="cover" />
        ) : null}

        <View style={s.grid}>
          {CATEGORIES.map((c) => (
            <Choice
              key={c}
              label={CATEGORY_LABEL[c]}
              selected={draft.category === c}
              hinted={draft.hint === c}
              onPress={() => updateDraft({ category: c })}
            />
          ))}
        </View>

        <Pressable
          onPress={voice.toggle}
          disabled={voice.state === 'processing'}
          accessibilityRole="button"
          style={({ pressed }) => [s.voice, voice.state === 'recording' && s.voiceRecording, pressed && s.pressed]}>
          <Text style={[s.voiceText, voice.state === 'recording' && s.voiceTextRecording]}>
            {voice.state === 'recording'
              ? '● 듣고 있어요 · 눌러서 끝내기'
              : voice.state === 'processing'
                ? '정리하는 중…'
                : '🎤 말로 설명하기'}
          </Text>
        </Pressable>
        {draft.voice?.transcript ? <Text style={s.transcript}>“{draft.voice.transcript}”</Text> : null}

        <ErrorText message={error} />
      </ScrollView>

      <View style={s.footer}>
        <PrimaryButton label="다음" onPress={next} disabled={!draft.category} busy={busy} />
      </View>
    </SafeAreaView>
  );
}

/** A hint for a category hidden from the picker is dropped. */
function isPickable(c: Category | null): c is Category {
  return c !== null && CATEGORIES.includes(c);
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  content: { padding: 16, gap: 16 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: C.border },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  voice: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
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
