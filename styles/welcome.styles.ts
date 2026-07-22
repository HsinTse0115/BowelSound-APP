// styles/welcome.styles.ts
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  // 響應式容器
  responsiveWrapper: {
    flex: 1,
    width: '100%',
  },
  // 垂直排列模式 (手機)
  verticalContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  // 水平排列模式 (平板/網頁)
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 40,
    paddingTop: 80,
    minHeight: '100%',
  },
  
  // 左半部或上半部：硬體圖片區域
  imageSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageSectionVertical: {
    width: '100%',
    marginBottom: 30,
  },
  imageSectionHorizontal: {
    width: '45%',
    marginRight: 40,
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 10,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hardwareImage: {
    borderRadius: 24,
    backgroundColor: '#E8F4FD',
  },
  
  // 右半部或下半部：文字介紹區域
  textSection: {
    flex: 1,
  },
  textSectionVertical: {
    width: '100%',
  },
  textSectionHorizontal: {
    width: '50%',
    paddingRight: 20,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F4FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 16,
    gap: 6,
  },
  brandBadgeText: {
    color: '#0D6EFD',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0D6EFD',
    marginBottom: 16,
  },
  introText: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 24,
    fontWeight: '500',
    marginBottom: 24,
  },
  
  // 產品特色卡片
  featuresContainer: {
    gap: 16,
    marginBottom: 32,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#94A3B8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    fontWeight: '500',
  },
  
  // 底部進入按鈕
  buttonSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 10,
  },
  ctaButton: {
    flexDirection: 'row',
    backgroundColor: '#0D6EFD',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D6EFD',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
    gap: 10,
    width: '100%',
    maxWidth: 320,
  },
  ctaButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scrollHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  scrollHintText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
