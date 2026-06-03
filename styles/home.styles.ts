// styles/home.styles.ts
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const cardWidth = (width - 56) / 2;

// 加上 export 將樣式匯出
export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F4F7FB' 
  },
  scrollContent: { 
    padding: 20, 
    paddingTop: 50, 
    paddingBottom: 40 
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 32 
  },
  headerTitle: { 
    fontSize: 28, 
    fontWeight: '800', 
    color: '#1E293B', 
    letterSpacing: 0.5 
  },
  welcomeText: { 
    fontSize: 16, 
    color: '#64748B', 
    marginTop: 6, 
    fontWeight: '500' 
  },
  avatarPlaceholder: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#FFFFFF', 
    justifyContent: 'center', 
    alignItems: 'center', 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 4, 
    elevation: 2 
  },
  menuContainer: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    gap: 16 
  },
  menuCard: { 
    width: cardWidth, 
    backgroundColor: '#FFFFFF', 
    padding: 20, 
    borderRadius: 24, 
    shadowColor: '#94A3B8', 
    shadowOffset: { width: 0, height: 8 }, 
    shadowOpacity: 0.12, 
    shadowRadius: 16, 
    elevation: 4,
    marginBottom: 4
  },
  iconContainer: { 
    width: 52, 
    height: 52, 
    borderRadius: 16, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: 16 
  },
  menuTitle: { 
    fontSize: 17, 
    fontWeight: '700', 
    color: '#334155', 
    marginBottom: 6 
  },
  menuDesc: { 
    fontSize: 13, 
    color: '#94A3B8', 
    fontWeight: '500',
    lineHeight: 18
  },
  infoBanner: { 
    flexDirection: 'row', 
    backgroundColor: '#E8F4FD', 
    padding: 16, 
    borderRadius: 16, 
    marginTop: 32, 
    alignItems: 'center' 
  },
  infoBannerConnected: { 
    flexDirection: 'row', 
    backgroundColor: '#E6F8F3', 
    padding: 16, 
    borderRadius: 16, 
    marginTop: 32, 
    alignItems: 'center' 
  },
  infoTextContainer: { 
    marginLeft: 12, 
    flex: 1 
  },
  infoTitle: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#0D6EFD', 
    marginBottom: 2 
  },
  infoTitleConnected: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#10B981', 
    marginBottom: 2 
  },
  infoDesc: { 
    fontSize: 13, 
    color: '#64748B' 
  },
});