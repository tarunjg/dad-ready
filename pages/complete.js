import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { PILLARS, getAllHabits } from '../lib/pillars';

const ALL_HABITS = [
  { id: 'running', emoji: '🏃', label: 'Running', hasInput: 'miles', pillar: 'body' },
  { id: 'strength', emoji: '💪', label: 'Strength Training (20 min)', pillar: 'body' },
  { id: 'noSugar', emoji: '🍎', label: 'No processed sugar', pillar: 'body' },
  { id: 'meditation', emoji: '🧘', label: 'Meditation (20 min)', pillar: 'mind' },
  { id: 'gratitude', emoji: '🙏', label: 'Gratitude (3 things)', hasInput: 'gratitude', pillar: 'mind' },
];

const PILLAR_COLORS = {
  body: '#22c55e',
  mind: '#a78bfa',
  soul: '#f59e0b',
};

export default function CompletePage() {
  const router = useRouter();
  const { d: date, e: email, t: token, mark } = router.query;

  const [mounted, setMounted] = useState(false);
  const [habits, setHabits] = useState({});
  const [milesInput, setMilesInput] = useState('');
  const [gratitudeInput, setGratitudeInput] = useState(['', '', '']);
  const [activeHabitIds, setActiveHabitIds] = useState([]);
  const [justCompleted, setJustCompleted] = useState(null);
  const [allSaved, setAllSaved] = useState(false);
  const [tokenValid, setTokenValid] = useState(null);

  // Validate token server-side
  useEffect(() => {
    if (!date || !email || !token) return;
    fetch(`/api/verify-token?d=${date}&e=${encodeURIComponent(email)}&t=${token}`)
      .then(r => r.json())
      .then(data => setTokenValid(data.valid))
      .catch(() => setTokenValid(false));
  }, [date, email, token]);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    // Load settings to know which habits are active
    const savedSettings = localStorage.getItem('dadReadySettings');
    if (savedSettings) {
      const s = JSON.parse(savedSettings);
      setActiveHabitIds(s.habits || ['running', 'strength', 'noSugar', 'meditation', 'gratitude']);
    } else {
      setActiveHabitIds(['running', 'strength', 'noSugar', 'meditation', 'gratitude']);
    }

    // Load existing data
    const savedData = localStorage.getItem('dadReadyTracker2026');
    if (savedData && date) {
      const parsed = JSON.parse(savedData);
      const dayHabits = parsed.habits?.[date] || {};
      setHabits(dayHabits);
      setMilesInput(parsed.runningMiles?.[date]?.toString() || '');
      setGratitudeInput(parsed.gratitude?.[date] || ['', '', '']);
    }
  }, [date]);

  // Auto-mark the habit from the email link
  useEffect(() => {
    if (!mark || !mounted || tokenValid !== true) return;
    // Only auto-mark if not already marked
    setHabits(prev => {
      if (prev[mark]) return prev;
      setJustCompleted(mark);
      return { ...prev, [mark]: true };
    });
  }, [mark, mounted, tokenValid]);

  // Save to localStorage whenever habits change
  const saveToLocalStorage = useCallback((updatedHabits, miles, gratitude) => {
    if (typeof window === 'undefined' || !date) return;

    const savedData = localStorage.getItem('dadReadyTracker2026');
    const parsed = savedData ? JSON.parse(savedData) : { habits: {}, runningMiles: {}, gratitude: {} };

    parsed.habits = { ...parsed.habits, [date]: updatedHabits };

    if (miles !== undefined) {
      parsed.runningMiles = { ...parsed.runningMiles, [date]: parseFloat(miles) || 0 };
    }
    if (gratitude !== undefined) {
      parsed.gratitude = { ...parsed.gratitude, [date]: gratitude };
    }

    localStorage.setItem('dadReadyTracker2026', JSON.stringify(parsed));
  }, [date]);

  // Save whenever habits change
  useEffect(() => {
    if (!mounted || !date || tokenValid !== true) return;
    saveToLocalStorage(habits, milesInput, gratitudeInput);
  }, [habits, mounted, date, tokenValid, saveToLocalStorage, milesInput, gratitudeInput]);

  const toggleHabit = (habitId) => {
    // For habits with inputs, don't toggle via click
    if (habitId === 'running' || habitId === 'gratitude') return;

    setHabits(prev => {
      const updated = { ...prev, [habitId]: !prev[habitId] };
      return updated;
    });
    setJustCompleted(null);
  };

  const saveMiles = () => {
    const miles = parseFloat(milesInput) || 0;
    if (miles > 0) {
      setHabits(prev => ({ ...prev, running: true }));
    }
  };

  const saveGratitude = () => {
    const filled = gratitudeInput.filter(g => g.trim()).length;
    if (filled >= 3) {
      setHabits(prev => ({ ...prev, gratitude: true }));
    }
  };

  const handleDone = () => {
    setAllSaved(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.close();
        // If window.close doesn't work (most browsers block it), show a message
        setAllSaved('permanent');
      }
    }, 1500);
  };

  if (!mounted || tokenValid === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <>
        <Head>
          <title>Invalid Link | Dad Ready</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </Head>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff', fontFamily: "'Inter', sans-serif", padding: '24px', textAlign: 'center' }}>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 400, fontSize: '28px', marginBottom: '12px' }}>Link Expired</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', maxWidth: '360px' }}>This completion link is no longer valid. Please check today's email for a fresh link.</p>
          <a href="/" style={{ marginTop: '24px', padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', textDecoration: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 500 }}>Open Dashboard</a>
        </div>
      </>
    );
  }

  const d = date ? new Date(date + 'T12:00:00') : new Date();
  const dayOfMonth = d.getDate();
  const dateLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const visibleHabits = ALL_HABITS.filter(h => activeHabitIds.includes(h.id));
  const completedCount = visibleHabits.filter(h => habits[h.id]).length;
  const totalCount = visibleHabits.length;
  const allComplete = completedCount === totalCount;

  if (allSaved === 'permanent') {
    return (
      <>
        <Head>
          <title>All Done! | Dad Ready</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
        </Head>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)', color: '#fff', fontFamily: "'Inter', sans-serif", padding: '24px', textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>&#10003;</div>
          <h1 style={{ fontFamily: "'Crimson Pro', Georgia, serif", fontWeight: 400, fontSize: '32px', marginBottom: '8px' }}>Saved</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '15px', marginBottom: '24px' }}>{completedCount}/{totalCount} habits completed for {dateLabel}</p>
          <a href="/" style={{ padding: '12px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff', textDecoration: 'none', borderRadius: '12px', fontSize: '15px', fontWeight: 500 }}>Open Dashboard</a>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Check In | Dad Ready</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="complete-page">
        <div className="background" />

        <header className="header">
          <p className="date-label">{dateLabel}</p>
          <h1 className="title">Daily Check-In</h1>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }} />
          </div>
          <p className="progress-text">{completedCount} of {totalCount} complete</p>
        </header>

        <main className="habits-list">
          {justCompleted && (
            <div className="just-completed-banner">
              &#10003; {ALL_HABITS.find(h => h.id === justCompleted)?.label} marked complete!
            </div>
          )}

          {visibleHabits.map(habit => {
            const isComplete = habits[habit.id];
            const color = PILLAR_COLORS[habit.pillar];

            return (
              <div key={habit.id}>
                <div
                  className={`habit-row ${isComplete ? 'done' : ''}`}
                  onClick={() => toggleHabit(habit.id)}
                  style={isComplete ? {
                    background: `${color}15`,
                    borderColor: `${color}40`,
                  } : {}}
                >
                  <div className="habit-left">
                    <span className="habit-emoji">{habit.emoji}</span>
                    <span className="habit-label">{habit.label}</span>
                  </div>
                  <div
                    className={`check-circle ${isComplete ? 'checked' : ''}`}
                    style={isComplete ? { background: color, borderColor: color } : {}}
                  >
                    {isComplete && <span>&#10003;</span>}
                  </div>
                </div>

                {habit.hasInput === 'miles' && (
                  <div className="input-section">
                    <div className="input-row">
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Miles today"
                        value={milesInput}
                        onChange={(e) => setMilesInput(e.target.value)}
                        className="input-field"
                      />
                      <button onClick={saveMiles} className="save-btn">Save</button>
                    </div>
                  </div>
                )}

                {habit.hasInput === 'gratitude' && (
                  <div className="input-section">
                    {[0, 1, 2].map(i => (
                      <input
                        key={i}
                        type="text"
                        placeholder={`${i + 1}. I'm grateful for...`}
                        value={gratitudeInput[i] || ''}
                        onChange={(e) => {
                          const updated = [...gratitudeInput];
                          updated[i] = e.target.value;
                          setGratitudeInput(updated);
                        }}
                        className="input-field gratitude-input"
                      />
                    ))}
                    <button onClick={saveGratitude} className="save-btn gratitude-save">Save Gratitude</button>
                  </div>
                )}
              </div>
            );
          })}
        </main>

        <footer className="footer">
          {allSaved === true ? (
            <div className="saved-message">&#10003; Saved!</div>
          ) : (
            <button onClick={handleDone} className="done-btn">
              {allComplete ? "All Done — Save & Close" : `Save (${completedCount}/${totalCount})`}
            </button>
          )}
          <a href="/" className="dashboard-link">Open Full Dashboard</a>
        </footer>
      </div>

      <style jsx>{`
        .complete-page {
          min-height: 100vh;
          min-height: 100dvh;
          position: relative;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #fff;
          display: flex;
          flex-direction: column;
        }

        .background {
          position: fixed;
          inset: 0;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          z-index: -1;
        }
        .background::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 50%;
          background: linear-gradient(180deg, rgba(102, 126, 234, 0.12) 0%, transparent 100%);
        }

        .header {
          padding: 40px 24px 24px;
          max-width: 560px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
        }

        .date-label {
          font-size: 13px;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 2px;
          margin: 0 0 8px;
        }

        .title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 32px;
          font-weight: 400;
          margin: 0 0 20px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          border-radius: 3px;
          transition: width 0.5s ease;
        }

        .progress-text {
          font-size: 13px;
          color: rgba(255,255,255,0.45);
          margin: 8px 0 0;
        }

        .habits-list {
          flex: 1;
          padding: 0 24px 24px;
          max-width: 560px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .just-completed-banner {
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          color: #22c55e;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          text-align: center;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .habit-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
          -webkit-tap-highlight-color: transparent;
        }

        .habit-row:active {
          transform: scale(0.98);
        }

        .habit-left {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .habit-emoji {
          font-size: 22px;
        }

        .habit-label {
          font-size: 15px;
          font-weight: 400;
        }

        .habit-row.done .habit-label {
          color: rgba(255,255,255,0.9);
        }

        .check-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
          color: #fff;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .check-circle.checked {
          border-color: transparent;
        }

        .input-section {
          padding: 12px 20px 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-top: none;
          border-radius: 0 0 14px 14px;
          margin-top: -8px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-row {
          display: flex;
          gap: 8px;
        }

        .input-field {
          flex: 1;
          padding: 10px 14px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
        }
        .input-field:focus {
          outline: none;
          border-color: rgba(102, 126, 234, 0.5);
        }
        .input-field::placeholder {
          color: rgba(255,255,255,0.25);
        }

        .gratitude-input {
          width: 100%;
          box-sizing: border-box;
        }

        .save-btn {
          padding: 10px 20px;
          background: rgba(102, 126, 234, 0.3);
          border: 1px solid rgba(102, 126, 234, 0.4);
          border-radius: 10px;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .save-btn:active { transform: scale(0.95); }

        .gratitude-save {
          align-self: flex-start;
        }

        .footer {
          padding: 16px 24px 32px;
          max-width: 560px;
          margin: 0 auto;
          width: 100%;
          box-sizing: border-box;
          text-align: center;
        }

        .done-btn {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-family: inherit;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .done-btn:active { transform: scale(0.98); }

        .saved-message {
          padding: 16px;
          background: rgba(34, 197, 94, 0.15);
          border: 1px solid rgba(34, 197, 94, 0.3);
          border-radius: 14px;
          color: #22c55e;
          font-size: 16px;
          font-weight: 600;
          animation: fadeIn 0.3s ease;
        }

        .dashboard-link {
          display: inline-block;
          margin-top: 16px;
          color: rgba(255,255,255,0.4);
          font-size: 13px;
          text-decoration: none;
        }
        .dashboard-link:hover {
          color: rgba(255,255,255,0.7);
        }

        @media (max-width: 600px) {
          .header { padding: 32px 16px 20px; }
          .habits-list { padding: 0 16px 20px; }
          .footer { padding: 12px 16px 28px; }
          .title { font-size: 28px; }
        }
      `}</style>
    </>
  );
}
