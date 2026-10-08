import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/global.css';

function App() {
  const [state, setState] = useState({ loading: true });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    async function check() {
      try {
        const response = await fetch('/api/health', { signal: controller.signal });
        const body = await response.json();
        if (response.ok) setState({ message: 'API and database are ready.' });
        else setState({ error: body.error?.message ?? 'Readiness check failed.' });
      } catch (error) {
        if (error.name !== 'AbortError') setState({ error: 'Cannot reach the API. Check that the server is running.' });
      }
    }
    check();
    return () => controller.abort();
  }, [attempt]);

  return (
    <>
      <header className="app-header"><a className="app-header__brand" href="/">LabAccess</a></header>
      <main className="setup">
        <h1>LabAccess setup</h1>
        <p>Application foundations are ready. The resource catalog comes next.</p>
        <section className="setup__status" aria-labelledby="status-title">
          <h2 id="status-title">Service readiness</h2>
          <p role="status">{state.loading ? 'Checking API and database…' : state.error ?? state.message}</p>
          <button disabled={state.loading} onClick={() => setAttempt(value => value + 1)}>Check again</button>
        </section>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App /></React.StrictMode>);
