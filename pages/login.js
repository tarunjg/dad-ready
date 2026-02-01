import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";
import Head from "next/head";

export default function Login() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { error } = router.query;

  useEffect(() => {
    if (session) {
      router.push("/");
    }
  }, [session, router]);

  if (status === "loading") {
    return (
      <div className="loading">
        <p>Loading...</p>
        <style jsx>{`
          .loading {
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Dad Ready | Sign In</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#1a1a2e" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="login-page">
        <div className="background" />
        
        <div className="content">
          <div className="brand">
            <h1>Dad Ready</h1>
            <p className="tagline">February 2026</p>
          </div>

          {error && (
            <div className="error-message">
              Access denied. Your email is not authorized.
            </div>
          )}

          <div className="login-card">
            <div className="quote">
              <p>"The moment you give up is the moment you let someone else win."</p>
              <span>— Kobe Bryant</span>
            </div>
            
            <button onClick={() => signIn("google")} className="google-btn">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign in with Google
            </button>
          </div>

          <p className="footer-text">🏀 Prepare for the most important role of your life</p>
        </div>
      </div>

      <style jsx>{`
        .login-page {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .background {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          z-index: -2;
        }

        .background::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 70%;
          background: linear-gradient(180deg, rgba(102, 126, 234, 0.2) 0%, transparent 100%);
        }

        .content {
          text-align: center;
          padding: 40px 20px;
          max-width: 440px;
          width: 100%;
        }

        .brand h1 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 3.5rem;
          font-weight: 400;
          color: #fff;
          margin: 0 0 8px 0;
          letter-spacing: -1px;
        }

        .tagline {
          color: rgba(255,255,255,0.5);
          font-size: 1rem;
          font-weight: 300;
          margin: 0 0 48px 0;
        }

        .error-message {
          background: rgba(220, 38, 38, 0.2);
          border: 1px solid rgba(220, 38, 38, 0.4);
          border-radius: 12px;
          padding: 14px 20px;
          margin-bottom: 24px;
          color: #fecaca;
          font-size: 0.9rem;
        }

        .login-card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 40px 32px;
        }

        .quote {
          margin-bottom: 32px;
        }

        .quote p {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 300;
          line-height: 1.6;
          color: rgba(255,255,255,0.9);
          margin: 0 0 12px 0;
          font-style: italic;
        }

        .quote span {
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
        }

        .google-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          width: 100%;
          padding: 16px 24px;
          background: #fff;
          color: #333;
          border: none;
          border-radius: 14px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .google-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.3);
        }

        .footer-text {
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
          margin-top: 48px;
        }
      `}</style>
    </>
  );
}
