// styles/record.styles.ts
import { StyleSheet, Dimensions } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4F7FB' 
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
    color: '#1E293B' 
  },
  subTitle: { 
    fontSize: 14, 
    color: '#64748B', 
    marginTop: 4, 
    fontWeight: '500' 
  },
  mainContent: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  
  // 病患選擇器樣式
  patientSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 20,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  patientSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  patientSelectorText: {
    fontSize: 15,
    color: '#334155',
    fontWeight: '600',
    marginLeft: 10,
    flex: 1,
  },
  patientSelectorPlaceholder: {
    fontSize: 15,
    color: '#94A3B8',
    fontWeight: '500',
    marginLeft: 10,
    flex: 1,
  },

  // Modal 選擇器樣式
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)', // 遮罩背景色
    justifyContent: 'flex-end', // 從底部彈出
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: SCREEN_HEIGHT * 0.7, // 限制最大高度為螢幕 70%
    paddingBottom: 40,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  patientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  patientItemSelected: {
    backgroundColor: '#F0F7FF', // 已選擇病患背景加亮
  },
  patientItemInfo: {
    flex: 1,
  },
  patientItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 4,
  },
  patientItemDetails: {
    fontSize: 13,
    color: '#64748B',
  },
  patientItemTextSelected: {
    color: '#0D6EFD',
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
    marginTop: 8,
  },

  waveformBox: { 
    width: '100%', 
    height: 200, 
    backgroundColor: '#FFFFFF', 
    borderRadius: 24, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 30,
    shadowColor: '#94A3B8', 
    shadowOffset: { width: 0, height: 6 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 16, 
    elevation: 3 
  },
  statusText: { 
    fontSize: 14, 
    color: '#64748B', 
    fontWeight: '600',
    marginTop: 8
  },
  timeDisplay: { 
    fontSize: 72, 
    fontWeight: '200', 
    color: '#1E293B',
    fontVariant: ['tabular-nums'] 
  },
  footer: { 
    padding: 30, 
    alignItems: 'center', 
    paddingBottom: 50 
  },
  recordButton: { 
    width: 140, 
    height: 140, 
    borderRadius: 70, 
    backgroundColor: '#0D6EFD', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#0D6EFD', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.3, 
    shadowRadius: 16, 
    elevation: 5 
  },
  recordButtonActive: { 
    backgroundColor: '#EF4444', 
    shadowColor: '#EF4444' 
  },
  recordButtonDisabled: {
    backgroundColor: '#CBD5E1', 
    shadowColor: '#CBD5E1',
    opacity: 0.8,
  },
  buttonText: { 
    color: '#FFFFFF', 
    fontSize: 20, 
    fontWeight: 'bold',
    letterSpacing: 1 
  },
  // 使用者填資料介面新增樣式
  statusBox: {
    padding: 16,
    backgroundColor: '#E8F4FD',
    borderRadius: 16,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#BAE7FF',
  },
  statusBoxText: {
    fontSize: 15,
    marginVertical: 4,
    color: '#0D6EFD',
    fontWeight: '600',
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    width: '100%',
  },
  rowItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#334155',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
    width: '100%',
    marginBottom: 20,
  },
  chip: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    margin: 4,
    backgroundColor: '#FFFFFF',
  },
  chipSelected: {
    backgroundColor: '#0D6EFD',
    borderColor: '#0D6EFD',
  },
  chipText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  statusBoxWarning: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  statusBoxWarningText: {
    color: '#EF4444',
  },
  warningAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 14,
    padding: 12,
    width: '100%',
    marginBottom: 20,
  },
  warningAlertText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  prepContainer: {
    width: '100%',
    alignItems: 'center',
  },
});