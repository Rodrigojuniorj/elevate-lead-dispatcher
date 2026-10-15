import { useEffect, useState } from 'react';

type HealthResponse = {
  status: 'ok';
  service: string;
};

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export function App() {
  const [connection, setConnection] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    void fetch(`${apiUrl}/health`)
      .then((response) => {
        if (!response.ok) throw new Error('API indisponível');
        return response.json() as Promise<HealthResponse>;
      })
      .then(() => setConnection('online'))
      .catch(() => setConnection('offline'));
  }, []);

  return (
    <main className="shell">
      <p className="eyebrow">Elevate</p>
      <h1>Lead Dispatcher</h1>
      <p className="description">
        Base do painel administrativo. O próximo incremento será o recebimento e a consulta de leads.
      </p>
      <p className={`connection connection--${connection}`} role="status">
        API: {connection === 'checking' ? 'verificando…' : connection === 'online' ? 'conectada' : 'indisponível'}
      </p>
    </main>
  );
}
