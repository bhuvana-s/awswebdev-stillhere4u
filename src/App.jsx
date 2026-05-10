import { lazy, Suspense, useEffect, useState } from 'react';
import StillHereLanding from './stillhere_waitlist.jsx';

const StatsPage = lazy(() => import('./stats_page.jsx'));

function currentRoute() {
  const h = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  return h === 'stats' ? 'stats' : 'landing';
}

export default function App() {
  const [route, setRoute] = useState(currentRoute());

  useEffect(() => {
    const onChange = () => setRoute(currentRoute());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  if (route === 'stats') {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: '#1B2838' }} />}>
        <StatsPage />
      </Suspense>
    );
  }
  return <StillHereLanding />;
}
