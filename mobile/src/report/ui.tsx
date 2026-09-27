import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon, type IconName } from '@/components/icon';

/** Same palette as the browse screens. */
export const C = {
  bg: '#F5F6F5',
  card: '#FFFFFF',
  text: '#14181A',
  textSoft: '#5C6663',
  textMuted: '#929B97',
  border: '#E1E5E3',
  green: '#0E8A5F',
  greenSoft: '#E3F3EC',
  amber: '#B87503',
  red: '#C0392B',
} as const;

export function PrimaryButton(props: { label: string; onPress: () => void; disabled?: boolean; busy?: boolean }) {
  const disabled = props.disabled || props.busy;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      disabled={disabled}
      style={({ pressed }) => [s.primary, disabled && s.primaryDisabled, pressed && s.pressed]}>
      {props.busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={s.primaryText}>{props.label}</Text>}
    </Pressable>
  );
}

export function SecondaryButton(props: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      disabled={props.disabled}
      style={({ pressed }) => [s.secondary, pressed && s.pressed]}>
      <Text style={s.secondaryText}>{props.label}</Text>
    </Pressable>
  );
}

export function Choice(props: {
  label: string;
  icon?: IconName;
  selected: boolean;
  hinted?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      style={({ pressed }) => [
        s.choice,
        props.hinted && s.choiceHinted,
        props.selected && s.choiceSelected,
        pressed && s.pressed,
      ]}>
      {props.icon ? <Icon name={props.icon} size={24} color={props.selected ? C.green : C.textSoft} /> : null}
      <Text style={[s.choiceText, props.selected && s.choiceTextSelected]}>{props.label}</Text>
      {props.hinted && !props.selected ? <Text style={s.hintTag}>AI 추천</Text> : null}
    </Pressable>
  );
}

/** A small pill — single-line choices on 02 (category, severity). */
export function Chip(props: { label: string; icon?: IconName; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: props.selected }}
      onPress={props.onPress}
      style={({ pressed }) => [s.chip, props.selected && s.chipSelected, pressed && s.pressed]}>
      {props.icon ? <Icon name={props.icon} size={16} color={props.selected ? '#FFFFFF' : C.green} /> : null}
      <Text style={[s.chipText, props.selected && s.chipTextSelected]}>{props.label}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <Text style={s.section}>{children}</Text>;
}

export function ErrorText({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={s.error}>
      <Text style={s.errorText}>{message}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  primary: {
    minHeight: 54,
    borderRadius: 14,
    backgroundColor: C.green,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primaryDisabled: { opacity: 0.45 },
  primaryText: { color: '#FFFFFF', fontSize: 19, fontWeight: '700' },
  secondary: {
    minHeight: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryText: { color: C.text, fontSize: 18, fontWeight: '600' },
  pressed: { opacity: 0.75 },
  choice: {
    flexGrow: 1,
    flexBasis: '45%',
    minHeight: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 4,
  },
  choiceHinted: { borderColor: C.green, borderStyle: 'dashed' },
  choiceSelected: { borderColor: C.green, borderStyle: 'solid', backgroundColor: C.greenSoft },
  choiceText: { color: C.text, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  choiceTextSelected: { color: C.green },
  hintTag: { color: C.green, fontSize: 14, fontWeight: '700' },
  chip: {
    minHeight: 44,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  chipSelected: { borderColor: C.green, backgroundColor: C.green },
  chipText: { color: C.text, fontSize: 16, fontWeight: '600' },
  chipTextSelected: { color: '#FFFFFF' },
  section: { color: C.textSoft, fontSize: 16, fontWeight: '700', marginTop: 8 },
  error: { borderRadius: 12, backgroundColor: '#FBEAEA', padding: 12 },
  errorText: { color: C.red, fontSize: 17 },
});
