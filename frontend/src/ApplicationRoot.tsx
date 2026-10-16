import { App } from './App';
import { AuthProvider } from './contexts/Auth.context';

export function ApplicationRoot() {
  return <AuthProvider><App /></AuthProvider>;
}
