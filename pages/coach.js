import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CoachRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?coach=open');
  }, [router]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: "'Inter', sans-serif"
    }}>
      <p>Redirecting to coach...</p>
    </div>
  );
}
