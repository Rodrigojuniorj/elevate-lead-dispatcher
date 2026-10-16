import { LoadingState } from './components/feedback/LoadingState.component';
import { useAuth } from './contexts/Auth.context';
import { DashboardPage } from './pages/dashboard/Dashboard.page';
import { LoginPage } from './pages/login/Login.page';

export function App() {
  const { isLoading, user } = useAuth();
  if (isLoading) return <LoadingState />;
  return user ? <DashboardPage /> : <LoginPage />;
}
