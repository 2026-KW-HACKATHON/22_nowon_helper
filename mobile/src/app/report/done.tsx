/** After 02 or 03 created a new report: the finished score from the server. */
import { router } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { CATEGORY_LABEL } from '@/labels';
import { useDraft } from '@/report/draft';
import { C, PrimaryButton, SecondaryButton } from '@/report/ui';

export default function DoneScreen() {
  const { created } = useDraft();

  // Android back goes home too. Behind this screen is the camera with the
  // draft just sent: a new shot there would reuse its severity and groups.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.dismissTo('/');
      return true;
    });
    return () => sub.remove();
  }, []);

  return (
    <SafeAreaView style={s.screen}>
      <View style={s.done}>
        <Icon name="checkCircle" size={64} color={C.green} />
        <Text style={s.title}>신고가 접수됐어요</Text>
        {created ? (
          <>
            <Text style={s.body}>{CATEGORY_LABEL[created.category]}</Text>
            <View style={s.score}>
              <Text style={s.scoreLabel}>우선순위</Text>
              <Text style={s.scoreValue} maxFontSizeMultiplier={1.5}>
                {created.priority_score}
              </Text>
            </View>
          </>
        ) : null}
        <Text style={s.hint}>이웃이 확인할수록 우선순위가 올라가요.</Text>
      </View>
      <View style={s.footer}>
        {created ? (
          <SecondaryButton
            label="내 신고 보기"
            onPress={() => router.replace({ pathname: '/detail', params: { id: created.id } })}
          />
        ) : null}
        <PrimaryButton label="홈으로" onPress={() => router.dismissTo('/')} />
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.bg },
  done: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 },
  title: { color: C.text, fontSize: 28, fontWeight: '800' },
  body: { color: C.textSoft, fontSize: 19 },
  score: { alignItems: 'center', backgroundColor: C.card, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 32 },
  scoreLabel: { color: C.textSoft, fontSize: 16, fontWeight: '600' },
  scoreValue: { color: C.green, fontSize: 48, fontWeight: '800' },
  hint: { color: C.textMuted, fontSize: 17, textAlign: 'center' },
  footer: { padding: 16, paddingTop: 8, gap: 10 },
});
