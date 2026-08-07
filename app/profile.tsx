import { Redirect } from 'expo-router';

/**
 * 舊版「受試者個人資料」已併入病患管理。
 * 保留此路由轉址，避免既有書籤或導覽連結失效。
 */
export default function LegacyProfileRedirect() {
  return <Redirect href="/patients" />;
}
