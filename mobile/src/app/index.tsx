import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const markers = [
  { score: 12, top: 92, left: 130, size: 58, color: '#C0392B' },
  { score: 5, top: 38, left: 320, size: 48, color: '#B87503' },
  { score: 3, top: 210, left: 365, size: 46, color: '#B87503' },
  { score: 2, top: 255, left: 195, size: 43, color: '#0E8A5F' },
];

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="dark" />

      <View style={styles.phone}>
        <View style={styles.locationBox}>
          <View style={styles.greenDot} />
          <Text style={styles.locationText}>월계동 · 반경 500m</Text>
        </View>

        <View style={styles.chips}>
          <View style={[styles.chip, styles.chipActive]}>
            <Text style={styles.chipActiveText}>전체 8</Text>
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
          {Array.from({ length: 8 }).map((_, index) => (
            <View
              key={index}
              style={[styles.gridLine, { top: 36 + index * 42 }]}
            />
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

          <View style={styles.currentLocationRing}>
            <View style={styles.currentLocation} />
          </View>

          <View style={styles.mapControls}>
            <View style={styles.mapButton}>
              <Text style={styles.mapButtonText}>내 위치</Text>
            </View>
            <View style={styles.mapButton}>
              <Text style={styles.mapButtonText}>목록</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>가장 시급한 문제</Text>
            <View style={styles.priorityPill}>
              <Text style={styles.priorityPillText}>우선순위 78</Text>
            </View>
          </View>

          <View style={styles.reportRow}>
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoText}>사진</Text>
            </View>

            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>보도블록 파손</Text>
              <Text style={styles.reportMeta}>32m · 12명 확인 · 4일 경과</Text>
              <View style={styles.priorityBarBackground}>
                <View style={styles.priorityBar} />
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <View style={styles.confirmButton}>
              <Text style={styles.confirmButtonText}>확인 +1</Text>
            </View>
            <View style={styles.detailButton}>
              <Text style={styles.detailButtonText}>상세</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomNav}>
          <View style={styles.navItem}>
            <View style={[styles.navIcon, styles.navIconActive]} />
            <Text style={styles.navTextActive}>홈</Text>
          </View>
          <View style={styles.navItem}>
            <View style={styles.navIcon} />
            <Text style={styles.navText}>지도</Text>
          </View>
          <View style={styles.navItem}>
            <View style={styles.navIcon} />
            <Text style={styles.navText}>내 신고</Text>
          </View>
          <View style={styles.navItem}>
            <View style={styles.navIcon} />
            <Text style={styles.navText}>음성</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F6F5',
  },
  phone: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    backgroundColor: '#F5F6F5',
  },
  locationBox: {
    marginHorizontal: 20,
    marginTop: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 19,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0E8A5F',
    marginRight: 10,
  },
  locationText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#14181A',
  },
  chips: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginRight: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chipActive: {
    backgroundColor: '#14181A',
  },
  chipText: {
    color: '#5C6663',
    fontWeight: '700',
  },
  chipActiveText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  map: {
    flex: 1,
    minHeight: 340,
    backgroundColor: '#E8ECEA',
    overflow: 'hidden',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D8DEDA',
  },
  marker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 7,
    elevation: 5,
  },
  markerText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 17,
  },
  currentLocationRing: {
    position: 'absolute',
    top: 146,
    left: 238,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: 'rgba(42, 120, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentLocation: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#2878FF',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  mapControls: {
    position: 'absolute',
    right: 18,
    bottom: 18,
  },
  mapButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 15,
    marginTop: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mapButtonText: {
    fontWeight: '700',
    color: '#343B39',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -18,
    paddingHorizontal: 20,
    paddingTop: 11,
    paddingBottom: 16,
  },
  sheetHandle: {
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D9DEDC',
    alignSelf: 'center',
    marginBottom: 15,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 23,
    fontWeight: '800',
    color: '#14181A',
  },
  priorityPill: {
    backgroundColor: '#FBE8E5',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  priorityPillText: {
    color: '#C0392B',
    fontWeight: '800',
  },
  reportRow: {
    flexDirection: 'row',
  },
  photoPlaceholder: {
    width: 82,
    height: 82,
    borderRadius: 12,
    backgroundColor: '#EEF1EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  photoText: {
    color: '#9BA6A1',
    fontSize: 12,
  },
  reportInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  reportTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#14181A',
    marginBottom: 5,
  },
  reportMeta: {
    color: '#6C7572',
    fontSize: 13,
    marginBottom: 10,
  },
  priorityBarBackground: {
    height: 7,
    backgroundColor: '#ECEFEE',
    borderRadius: 4,
    overflow: 'hidden',
  },
  priorityBar: {
    width: '78%',
    height: '100%',
    borderRadius: 4,
    backgroundColor: '#C0392B',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 16,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 17,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#0E8A5F',
    marginRight: 10,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  detailButton: {
    width: 110,
    paddingVertical: 17,
    borderRadius: 15,
    alignItems: 'center',
    backgroundColor: '#F3F5F4',
    borderWidth: 1,
    borderColor: '#E0E5E2',
  },
  detailButtonText: {
    color: '#26302D',
    fontSize: 17,
    fontWeight: '800',
  },
  bottomNav: {
    height: 76,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEA',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
  },
  navIcon: {
    width: 24,
    height: 24,
    borderRadius: 7,
    backgroundColor: '#CDD3D0',
    marginBottom: 4,
  },
  navIconActive: {
    backgroundColor: '#0E8A5F',
  },
  navText: {
    color: '#929B97',
    fontSize: 12,
  },
  navTextActive: {
    color: '#0E8A5F',
    fontSize: 12,
    fontWeight: '800',
  },
});