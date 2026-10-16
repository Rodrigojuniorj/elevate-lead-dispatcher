import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../contexts/Auth.context';

export function LoginPage() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setIsSubmitting(true);
    try { await signIn(email, password); } catch { setError('Não foi possível entrar. Confira seu e-mail e senha.'); } finally { setIsSubmitting(false); }
  }
  return <main className="shell"><p className="eyebrow">Elevate</p><h1>Lead Dispatcher</h1><p className="description">Entre para acessar o painel operacional.</p><form className="login-form" onSubmit={handleSubmit}><label htmlFor="email">E-mail</label><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /><label htmlFor="password">Senha</label><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={1} />{error && <p className="form-error" role="alert">{error}</p>}<button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Entrando…' : 'Entrar'}</button></form></main>;
}
