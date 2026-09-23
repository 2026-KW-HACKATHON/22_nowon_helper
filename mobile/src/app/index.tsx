import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const markers = [
  { score: '12', top: 82, left: 105, size: 58, color: '#C0392B' },
  { score: '5', top: 30, left: 255, size: 48, color: '#B87503' },
  { score: '3', top: 218, left: 285, size: 46, color: '#B87503' },
  { score: '2', top: 270, left: 138, size: 43, color: '#0E8A5F' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.screen}>
        <View style={styles.locationBox}>
          <View style={styles.greenDot} />
          <Text style={styles.locationText}>월계동 · 반경 500m</Text>
        </View>

        <View style={styles.chips}>
          <View style={[styles.chip, styles.activeChip]}>
            <Text style={styles.activeChipText}>전체 8</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>신규 3</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>처리중 4</Text>
          </View>
          <View style={styles.chip}>
            <Text style={styles.chipText}>해결 1</Text>
          </View>
        </View>

        <View style={styles.map}>
          {Array.from({ length: 7 }).map((_, index) => (
            <View key={index} style={[styles.mapLine, { top: index * 63 }]} />
          ))}

          {markers.map((marker) => (
            <View
              key={marker.score}
              style={[
                styles.marker,
                {
                  top: marker.top,
                  left: marker.left,
                  width: marker.size,
                  height: marker.size,
                  borderRadius: marker.size / 2,
                  backgroundColor: marker.color,
                },
              ]}>
              <Text style={styles.markerText}>{marker.score}</Text>
            </View>
          ))}

          <View style={styles.currentLocationOuter}>
            <View style={styles.currentLocation} />
          </View>

          <Pressable style={styles.mapControl}>
            <Text style={styles.mapControlText}>내 위치</Text>
          </Pressable>

          <Pressable style={[styles.mapControl, styles.listControl]}>
            <Text style={styles.mapControlText}>목록</Text>
          </Pressable>
        </View>

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.sheetHeading}>
            <Text style={styles.sheetTitle}>가장 시급한 문제</Text>
            <View style={styles.priorityPill}>
              <Text style={styles.priorityPillText}>우선순위 78</Text>
            </View>
          </View>

          <View style={styles.reportRow}>
            <View style={styles.thumbnail}>
              <Text style={styles.thumbnailText}>사진</Text>
            </View>

            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>보도블록 파손</Text>
              <Text style={styles.reportSub}>32m · 12명 확인 · 4일 경과</Text>
              <View style={styles.priorityTrack}>
                <View style={styles.priorityFill} />
              </View>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              style={styles.confirmButton}
              onPress={() => router.push('/detail')}>
              <Text style={styles.confirmText}>확인 +1</Text>
            </Pressable>

            <Pressable
              style={styles.detailButton}
              onPress={() => router.push('/detail')}>
              <Text style={styles.detailButtonText}>상세</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={() => router.replace('/')}>
            <View style={[styles.navIcon, styles.activeNavIcon]} />
            <Text style={[styles.navText, styles.activeNavText]}>홈</Text>
          </Pressable>

          <Pressable style={styles.navItem} onPress={() => router.replace('/')}>
            <View style={styles.navIcon} />
            <Text style={styles.navText}>지도</Text>
          </Pressable>

          <Pressable
            style={styles.navItem}
            onPress={() => router.push('/reports')}>
            <View style={styles.navIcon} />
            <Text style={styles.navText}>내 신고</Text>
          </Pressable>

          <Pressable style={styles.navItem}>
            <View style={styles.navIcon} />
            <Text style={styles.navText}>음성</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    width: '100%',
    maxWidth: 390,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
  },
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  locationBox: {
    height: 62,
    marginHorizontal: 20,
    marginTop: 18,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0E8A5F',
  },
  locationText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#14181A',
  },
  chips: {
    flexDirection: 'row',
    gap: 9,
    marginHorizontal: 20,
    marginTop: 18,
  },
  chip: {
    borderRadius: 22,
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  activeChip: {
    backgroundColor: '#14181A',
  },
  chipText: {
    color: '#5C6663',
    fontSize: 15,
    fontWeight: '800',
  },
  activeChipText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  map: {
    height: 465,
    marginTop: 20,
    backgroundColor: '#EEF1EF',
    overflow: 'hidden',
  },
  mapLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D8DEDB',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  markerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  currentLocationOuter: {
    position: 'absolute',
    top: 194,
    left: 166,
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#CFE0FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocation: {
    width: 43,
    height: 43,
    borderRadius: 22,
    borderWidth: 5,
    borderColor: '#FFFFFF',
    backgroundColor: '#2878F0',
  },
  mapControl: {
    position: 'absolute',
    right: 20,
    bottom: 91,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  listControl: {
    bottom: 24,
  },
  mapControlText: {
    color: '#14181A',
    fontSize: 15,
    fontWeight: '800',
  },
  sheet: {
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: '#FFFFFF',
    padding: 20,
    zIndex: 2,
  },
  handle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    backgroundColor: '#D7DCDA',
  },
  sheetHeading: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#14181A',
  },
  priorityPill: {
    borderRadius: 18,
    backgroundColor: '#FCE8E5',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  priorityPillText: {
    color: '#C0392B',
    fontSize: 14,
    fontWeight: '800',
  },
  reportRow: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 19,
  },
  thumbnail: {
    width: 92,
    height: 92,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF1EF',
  },
  thumbnailText: {
    color: '#AAB4AF',
    fontSize: 13,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14181A',
  },
  reportSub: {
    marginTop: 6,
    color: '#68736E',
    fontSize: 14,
  },
  priorityTrack: {
    height: 8,
    marginTop: 17,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: '#E9ECEA',
  },
  priorityFill: {
    width: '78%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#C0392B',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 22,
  },
  confirmButton: {
    flex: 1,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0E8A5F',
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  detailButton: {
    width: 106,
    height: 58,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E1E5E3',
    backgroundColor: '#F8F9F8',
  },
  detailButtonText: {
    color: '#14181A',
    fontSize: 17,
    fontWeight: '900',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 13,
    paddingBottom: 18,
    borderTopWidth: 1,
    borderColor: '#EEF0EF',
    backgroundColor: '#FFFFFF',
  },
  navItem: {
    width: 56,
    alignItems: 'center',
    gap: 6,
  },
  navIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#CCD2D0',
  },
  activeNavIcon: {
    backgroundColor: '#0E8A5F',
  },
  navText: {
    color: '#84908B',
    fontSize: 12,
  },
  activeNavText: {
    color: '#0E8A5F',
    fontWeight: '900',
  },
});