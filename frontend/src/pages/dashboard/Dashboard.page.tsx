import { useAuth } from '../../contexts/Auth.context';

export function DashboardPage() {
  const { signOut, user } = useAuth();
  if (!user) return null;

  return (
    <main className="shell">
      <p className="eyebrow">Sessão autenticada</p>
      <h1>Olá, {user.name}</h1>
      <p className="description">Perfil atual: <strong>{user.role}</strong>.</p>
      {user.callCenterId && <p className="description">Call center: {user.callCenterId}</p>}
      <p className="description">As telas de leads e métricas serão adicionadas nos próximos incrementos.</p>
      <button className="secondary-button" type="button" onClick={signOut}>Sair</button>
    </main>
  );
}
