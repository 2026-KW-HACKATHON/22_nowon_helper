import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import type { StyleProp, ViewStyle } from 'react-native';

/**
 * One icon set for every screen: SF Symbols on iOS, Material Symbols on
 * Android and web — what the system apps on each phone use.
 */
const ICONS = {
  home: { ios: 'house.fill', android: 'home' },
  map: { ios: 'map.fill', android: 'map' },
  list: { ios: 'list.bullet.rectangle.fill', android: 'list_alt' },
  mic: { ios: 'mic.fill', android: 'mic' },
  location: { ios: 'location.fill', android: 'location_on' },
  camera: { ios: 'camera.fill', android: 'photo_camera' },
  photo: { ios: 'photo', android: 'image' },
  check: { ios: 'checkmark', android: 'check' },
  checkCircle: { ios: 'checkmark.circle.fill', android: 'check_circle' },
  back: { ios: 'chevron.left', android: 'arrow_back_ios_new' },
  forward: { ios: 'chevron.right', android: 'chevron_right' },
  close: { ios: 'xmark', android: 'close' },
  ai: { ios: 'sparkles', android: 'auto_awesome' },
  flame: { ios: 'flame.fill', android: 'local_fire_department' },
  clock: { ios: 'clock.fill', android: 'schedule' },
  people: { ios: 'person.2.fill', android: 'group' },
  // Categories
  fallen_tree: { ios: 'tree.fill', android: 'park' },
  broken_sidewalk: { ios: 'square.grid.2x2.fill', android: 'grid_view' },
  blocked_ramp: { ios: 'figure.roll', android: 'accessible' },
  broken_facility: { ios: 'wrench.and.screwdriver.fill', android: 'build' },
  // Affected groups
  wheelchair: { ios: 'figure.roll', android: 'accessible' },
  elderly: { ios: 'figure.walk.motion', android: 'elderly' },
  stroller: { ios: 'stroller.fill', android: 'stroller' },
  visually_impaired: { ios: 'eye.slash.fill', android: 'visibility_off' },
} satisfies Record<string, { ios: SFSymbol; android: AndroidSymbol }>;

/** Category and group codes are icon names too — `<Icon name={report.category} />`. */
export type IconName = keyof typeof ICONS;

export function Icon(props: { name: IconName; size?: number; color?: string; style?: StyleProp<ViewStyle> }) {
  const icon = ICONS[props.name];
  return (
    <SymbolView
      name={{ ios: icon.ios, android: icon.android, web: icon.android }}
      size={props.size ?? 22}
      tintColor={props.color ?? '#14181A'}
      style={props.style}
    />
  );
}
