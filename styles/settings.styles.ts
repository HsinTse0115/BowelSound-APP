// styles/settings.styles.ts
import { StyleSheet } from 'react-native';

/**
 * 系統設定頁面專用樣式
 */
export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  header: {
    paddingTop: 55, // 微調頂部空間以適應手機狀態列
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative', // 讓裡面的返回按鈕可以絕對定位
  },
  backButton: {
    position: 'absolute',
    left: 20,
    bottom: 24, // 對齊標題高度
    zIndex: 10,
    padding: 5, // 增加點擊範圍
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1E293B',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1E293B',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  input: {
    flex: 1,
    height: 48,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  saveButton: {
    height: 48,
    backgroundColor: '#0D6EFD',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#0D6EFD',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  savedFeedback: {
    color: '#10B981',
    fontSize: 13,
    marginTop: 8,
    fontWeight: '600',
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  durationBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  durationBtnActive: {
    backgroundColor: '#0D6EFD',
    borderColor: '#0D6EFD',
  },
  durationBtnText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  durationBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  switchLabel: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '500',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  statusBadgeConnected: {
    backgroundColor: '#E6F8F3',
  },
  statusBadgeDisconnected: {
    backgroundColor: '#F1F5F9',
  },
  statusBadgeTextConnected: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
  },
  statusBadgeTextDisconnected: {
    color: '#64748B',
    fontWeight: '700',
    fontSize: 13,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  infoKey: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  infoVal: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  testButton: {
    minHeight: 46,
    marginTop: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CFE2FA',
    backgroundColor: '#F5F9FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonDisabled: {
    opacity: 0.55,
  },
  testButtonText: {
    color: '#1478F2',
    fontSize: 14,
    fontWeight: '700',
  },
  themeGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  themeButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#DCE3EA',
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  themeButtonSelected: {
    backgroundColor: '#26364A',
    borderColor: '#26364A',
  },
  themeButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  themeButtonTextSelected: {
    color: '#FFFFFF',
  },
  containerDark: { backgroundColor: '#101820' },
  headerDark: { backgroundColor: '#17212B', borderBottomColor: '#33404E' },
  sectionDark: { backgroundColor: '#17212B', borderColor: '#33404E' },
  textPrimaryDark: { color: '#EEF2F5' },
  textSecondaryDark: { color: '#A6B1BC' },
  inputContainerDark: { backgroundColor: '#202B36', borderColor: '#43505E' },
  inputDark: { color: '#EEF2F5' },
  themeButtonDark: { backgroundColor: '#202B36', borderColor: '#43505E' },
});
