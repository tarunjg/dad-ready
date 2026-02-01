import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Head from 'next/head';
import { quotes, getQuoteByDay } from '../lib/quotes';

const DEFAULT_DATA = {
  habits: {},
  runningMiles: {},
  gratitude: {},
  journal: {},
  startDate: '2026-02-01'
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [data, setData] = useState(DEFAULT_DATA);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window === 'undefined') return '2026-02-01';
    const today = new Date().toISOString().split('T')[0];
    if (today >= '2026-02-01' && today <= '2026-02-28') return today;
    return '2026-02-01';
  });
  const [gratitudeInput, setGratitudeInput] = useState(['', '', '']);
  const [milesInput, setMilesInput] = useState('');
  const [journalInput, setJournalInput] = useState('');
  const [view, setView] = useState('today');
  const [mounted, setMounted] = useState(false);

  const habits = [
    { id: 'noCarbs', label: 'No processed/added carbs', emoji: '🥗' },
    { id: 'running', label: 'Running (log miles)', emoji: '🏃' },
    { id: 'strength', label: 'Strength training (20 min)', emoji: '💪' },
    { id: 'meditation', label: 'Meditation (20 min)', emoji: '🧘' },
    { id: 'gratitude', label: 'Gratitude journal (3 things)', emoji: '🙏' }
  ];

  const february2026 = Array.from({ length: 28 }, (_, i) => {
    const date = new Date(2026, 1, i + 1);
    return date.toISOString().split('T')[0];
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('dadReadyTracker2026');
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dadReadyTracker2026', JSON.stringify(data));
    }
  }, [data, mounted]);

  useEffect(() => {
    if (data.gratitude[selectedDate]) {
      setGratitudeInput(data.gratitude[selectedDate]);
    } else {
      setGratitudeInput(['', '', '']);
    }
    if (data.runningMiles[selectedDate]) {
      setMilesInput(data.runningMiles[selectedDate].toString());
    } else {
      setMilesInput('');
    }
    if (data.journal[selectedDate]) {
      setJournalInput(data.journal[selectedDate]);
    } else {
      setJournalInput('');
    }
  }, [selectedDate, data.gratitude, data.runningMiles, data.journal]);

  const toggleHabit = (habitId) => {
    if (habitId === 'running' || habitId === 'gratitude') return;
    setData(prev => ({
      ...prev,
      habits: {
        ...prev.habits,
        [selectedDate]: {
          ...prev.habits[selectedDate],
          [habitId]: !prev.habits[selectedDate]?.[habitId]
        }
      }
    }));
  };

  const saveMiles = () => {
    const miles = parseFloat(milesInput) || 0;
    setData(prev => ({
      ...prev,
      runningMiles: { ...prev.runningMiles, [selectedDate]: miles },
      habits: {
        ...prev.habits,
        [selectedDate]: { ...prev.habits[selectedDate], running: miles > 0 }
      }
    }));
  };

  const saveGratitude = () => {
    const filled = gratitudeInput.filter(g => g.trim()).length === 3;
    setData(prev => ({
      ...prev,
      gratitude: { ...prev.gratitude, [selectedDate]: gratitudeInput },
      habits: {
        ...prev.habits,
        [selectedDate]: { ...prev.habits[selectedDate], gratitude: filled }
      }
    }));
  };

  const saveJournal = () => {
    setData(prev => ({
      ...prev,
      journal: { ...prev.journal, [selectedDate]: journalInput }
    }));
  };

  const getWeeklyMiles = (weekNum) => {
    const weekStart = (weekNum - 1) * 7;
    const weekDates = february2026.slice(weekStart, weekStart + 7);
    return weekDates.reduce((sum, date) => sum + (data.runningMiles[date] || 0), 0);
  };

  const getCurrentWeek = () => {
    const dayOfMonth = new Date(selectedDate + 'T12:00:00').getDate();
    return Math.ceil(dayOfMonth / 7);
  };

  const getTotalMiles = () => {
    return Object.values(data.runningMiles).reduce((sum, m) => sum + m, 0);
  };

  const getStreak = () => {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const endIdx = february2026.indexOf(today) >= 0 ? february2026.indexOf(today) : february2026.length - 1;
    for (let i = endIdx; i >= 0; i--) {
      const date = february2026[i];
      const dayHabits = data.habits[date] || {};
      const allDone = habits.every(h => dayHabits[h.id]);
      if (allDone) streak++;
      else break;
    }
    return streak;
  };

  const getCompletionRate = () => {
    const today = new Date().toISOString().split('T')[0];
    const daysToCount = february2026.filter(d => d <= today);
    if (daysToCount.length === 0) return 0;
    let totalCompleted = 0;
    let totalPossible = 0;
    daysToCount.forEach(date => {
      habits.forEach(h => {
        totalPossible++;
        if (data.habits[date]?.[h.id]) totalCompleted++;
      });
    });
    return totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  };

  const formatDateShort = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayStatus = (date) => {
    const dayHabits = data.habits[date] || {};
    const completed = habits.filter(h => dayHabits[h.id]).length;
    if (completed === 5) return 'complete';
    if (completed > 0) return 'partial';
    return 'empty';
  };

  const getDayOfMonth = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').getDate();
  };

  const hasJournalEntry = (date) => {
    return data.journal[date] && data.journal[date].trim().length > 0;
  };

  const todayQuote = getQuoteByDay(getDayOfMonth(selectedDate));

  if (status === "loading" || !mounted) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1>Dad Ready</h1>
          <p>Loading...</p>
        </div>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .loading-content {
            text-align: center;
            color: white;
          }
          .loading-content h1 {
            font-family: 'Georgia', serif;
            font-size: 2.5rem;
            font-weight: 400;
            margin-bottom: 0.5rem;
          }
          .loading-content p {
            opacity: 0.8;
          }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Dad Ready | February 2026</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#667eea" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="app">
        {/* Background */}
        <div className="background-gradient" />
        
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <h1 className="logo">Dad Ready</h1>
            <span className="subtitle">February 2026</span>
          </div>
          <div className="header-right">
            <span className="user-email">{session.user?.name || session.user?.email}</span>
            <button onClick={() => signOut()} className="sign-out-btn">Sign Out</button>
          </div>
        </header>

        <main className="main-content">
          {/* Top Section: Music + Journal */}
          <div className="top-section">
            {/* Music Card */}
            <div className="card music-card">
              <div className="card-label">🎵 Your Focus Music</div>
              <div className="music-content">
                <iframe
                  width="100"
                  height="100"
                  src="https://www.youtube.com/embed/90Fpjwctqlw?autoplay=0&loop=1&playlist=90Fpjwctqlw"
                  title="Where Is My Mind"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="music-iframe"
                />
                <div className="music-info">
                  <h3>Where Is My Mind</h3>
                  <p>Pixies</p>
                  <p className="music-quote">"Let the music guide your focus"</p>
                </div>
              </div>
            </div>

            {/* Journal Card */}
            <div className="card journal-card">
              <div className="card-label">📝 Reflections — {formatDateShort(selectedDate)}</div>
              <textarea
                placeholder="What's on your mind today? Capture your thoughts, wins, and intentions..."
                value={journalInput}
                onChange={(e) => setJournalInput(e.target.value)}
                onBlur={saveJournal}
                className="journal-textarea"
              />
            </div>
          </div>

          {/* Quote Section */}
          <div className="quote-card">
            <p className="quote-text">"{todayQuote.text}"</p>
            <p className="quote-author">— {todayQuote.author}</p>
          </div>

          {/* Navigation */}
          <nav className="nav-tabs">
            {['today', 'calendar', 'stats'].map(v => (
              <button 
                key={v} 
                onClick={() => setView(v)} 
                className={`nav-tab ${view === v ? 'active' : ''}`}
              >
                {v === 'today' && '☀️ '}
                {v === 'calendar' && '📅 '}
                {v === 'stats' && '📊 '}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </nav>

          {/* Today View */}
          {view === 'today' && (
            <div className="view-content">
              <div className="card habits-card">
                <h2 className="section-title">{formatDate(selectedDate)}</h2>
                <div className="habits-list">
                  {habits.map(habit => (
                    <div key={habit.id} className="habit-item-wrapper">
                      <div 
                        onClick={() => toggleHabit(habit.id)} 
                        className={`habit-item ${data.habits[selectedDate]?.[habit.id] ? 'completed' : ''} ${habit.id === 'running' || habit.id === 'gratitude' ? 'no-click' : ''}`}
                      >
                        <span className="habit-emoji">{habit.emoji}</span>
                        <span className="habit-label">{habit.label}</span>
                        {data.habits[selectedDate]?.[habit.id] && <span className="habit-check">✓</span>}
                      </div>
                      
                      {habit.id === 'running' && (
                        <div className="habit-input-row">
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
                      )}
                      
                      {habit.id === 'gratitude' && (
                        <div className="gratitude-inputs">
                          {[0, 1, 2].map(i => (
                            <input 
                              key={i} 
                              type="text" 
                              placeholder={`I'm grateful for... (${i + 1})`} 
                              value={gratitudeInput[i]} 
                              onChange={(e) => { 
                                const n = [...gratitudeInput]; 
                                n[i] = e.target.value; 
                                setGratitudeInput(n); 
                              }} 
                              onBlur={saveGratitude} 
                              className="input-field gratitude-input"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="card progress-card">
                <div className="card-label">🏃 Week {getCurrentWeek()} Running Progress</div>
                <div className="progress-stats">
                  <span className="progress-number">{getWeeklyMiles(getCurrentWeek()).toFixed(1)}</span>
                  <span className="progress-goal">/ 35 miles</span>
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${Math.min((getWeeklyMiles(getCurrentWeek()) / 35) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Calendar View */}
          {view === 'calendar' && (
            <div className="view-content">
              <div className="card calendar-card">
                <div className="calendar-header">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                    <div key={i} className="calendar-day-label">{d}</div>
                  ))}
                </div>
                <div className="calendar-grid">
                  {february2026.map(date => {
                    const status = getDayStatus(date);
                    const isSelected = date === selectedDate;
                    const dayNum = getDayOfMonth(date);
                    const hasJournal = hasJournalEntry(date);
                    return (
                      <button
                        key={date}
                        onClick={() => { setSelectedDate(date); setView('today'); }}
                        className={`calendar-day ${status} ${isSelected ? 'selected' : ''}`}
                      >
                        {dayNum}
                        {hasJournal && <span className="journal-dot" />}
                      </button>
                    );
                  })}
                </div>
                <div className="calendar-legend">
                  <div className="legend-item"><span className="legend-dot complete" /> All done</div>
                  <div className="legend-item"><span className="legend-dot partial" /> Partial</div>
                  <div className="legend-item"><span className="legend-dot journal" /> Has notes</div>
                </div>

                {data.journal[selectedDate] && (
                  <div className="journal-preview">
                    <div className="journal-preview-date">{formatDateShort(selectedDate)}</div>
                    <p className="journal-preview-text">{data.journal[selectedDate]}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats View */}
          {view === 'stats' && (
            <div className="view-content">
              <div className="stats-grid">
                <div className="card stat-card main-stat">
                  <div className="stat-label">Current Streak</div>
                  <div className="stat-value large">{getStreak()}</div>
                  <div className="stat-unit">days</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-label">Completion Rate</div>
                  <div className="stat-value">{getCompletionRate()}%</div>
                </div>
                <div className="card stat-card">
                  <div className="stat-label">Total Miles</div>
                  <div className="stat-value">{getTotalMiles().toFixed(1)}</div>
                </div>
              </div>

              <div className="card weekly-card">
                <h3 className="section-title">Weekly Running Progress</h3>
                {[1, 2, 3, 4].map(week => (
                  <div key={week} className="weekly-row">
                    <div className="weekly-info">
                      <span className="weekly-label">Week {week}</span>
                      <span className="weekly-miles">{getWeeklyMiles(week).toFixed(1)} / 35 mi</span>
                    </div>
                    <div className="progress-bar-bg small">
                      <div 
                        className={`progress-bar-fill ${getWeeklyMiles(week) >= 35 ? 'complete' : ''}`}
                        style={{ width: `${Math.min((getWeeklyMiles(week) / 35) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="card motivation-card">
                <p>"I'm getting dad-ready. By the end of February, I'll be in great shape, great health, and ready to meet my kid."</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          background: #1a1a2e;
          min-height: 100vh;
        }

        .app {
          min-height: 100vh;
          position: relative;
          color: #fff;
        }

        .background-gradient {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          z-index: -2;
        }

        .background-gradient::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 60%;
          background: linear-gradient(180deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%);
          z-index: -1;
        }

        /* Header */
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }

        .logo {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 2rem;
          font-weight: 400;
          color: #fff;
          letter-spacing: -0.5px;
        }

        .subtitle {
          color: rgba(255,255,255,0.5);
          font-size: 0.9rem;
          font-weight: 300;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-email {
          color: rgba(255,255,255,0.6);
          font-size: 0.85rem;
        }

        .sign-out-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sign-out-btn:hover {
          background: rgba(255,255,255,0.2);
        }

        /* Main Content */
        .main-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 32px 48px;
        }

        /* Cards */
        .card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 24px;
        }

        .card-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 16px;
        }

        /* Top Section */
        .top-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .top-section {
            grid-template-columns: 1fr;
          }
        }

        /* Music Card */
        .music-content {
          display: flex;
          gap: 20px;
          align-items: flex-start;
        }

        .music-iframe {
          border-radius: 12px;
          flex-shrink: 0;
        }

        .music-info h3 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 400;
          margin-bottom: 4px;
        }

        .music-info p {
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
        }

        .music-quote {
          margin-top: 12px;
          font-style: italic;
          font-size: 0.85rem !important;
          color: rgba(255,255,255,0.4) !important;
        }

        /* Journal Card */
        .journal-textarea {
          width: 100%;
          min-height: 100px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          padding: 16px;
          color: #fff;
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.6;
          resize: none;
          transition: all 0.2s;
        }

        .journal-textarea:focus {
          outline: none;
          border-color: rgba(102, 126, 234, 0.5);
          background: rgba(255,255,255,0.08);
        }

        .journal-textarea::placeholder {
          color: rgba(255,255,255,0.3);
        }

        /* Quote Card */
        .quote-card {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
          border: 1px solid rgba(102, 126, 234, 0.3);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          text-align: center;
        }

        .quote-text {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.4rem;
          font-weight: 300;
          line-height: 1.6;
          color: #fff;
          margin-bottom: 12px;
        }

        .quote-author {
          color: rgba(255,255,255,0.5);
          font-size: 0.9rem;
        }

        /* Navigation */
        .nav-tabs {
          display: flex;
          gap: 8px;
          background: rgba(255,255,255,0.05);
          padding: 6px;
          border-radius: 16px;
          margin-bottom: 24px;
        }

        .nav-tab {
          flex: 1;
          padding: 12px 20px;
          border: none;
          border-radius: 12px;
          background: transparent;
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .nav-tab.active {
          background: rgba(102, 126, 234, 0.8);
          color: #fff;
        }

        .nav-tab:hover:not(.active) {
          background: rgba(255,255,255,0.1);
        }

        /* Habits */
        .section-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 400;
          margin-bottom: 24px;
          color: #fff;
        }

        .habits-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .habit-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 18px 20px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .habit-item.no-click {
          cursor: default;
        }

        .habit-item:hover:not(.no-click) {
          background: rgba(255,255,255,0.1);
        }

        .habit-item.completed {
          background: rgba(34, 197, 94, 0.15);
          border-color: rgba(34, 197, 94, 0.3);
        }

        .habit-emoji {
          font-size: 1.5rem;
        }

        .habit-label {
          flex: 1;
          font-weight: 400;
          color: rgba(255,255,255,0.9);
        }

        .habit-check {
          color: #22c55e;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .habit-input-row {
          display: flex;
          gap: 12px;
          margin-top: 12px;
        }

        .input-field {
          flex: 1;
          padding: 14px 18px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          color: #fff;
          font-size: 0.95rem;
          transition: all 0.2s;
        }

        .input-field:focus {
          outline: none;
          border-color: rgba(102, 126, 234, 0.5);
          background: rgba(255,255,255,0.08);
        }

        .input-field::placeholder {
          color: rgba(255,255,255,0.3);
        }

        .save-btn {
          padding: 14px 28px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 12px;
          color: #fff;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .save-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
        }

        .gratitude-inputs {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 12px;
        }

        .gratitude-input {
          width: 100%;
        }

        /* Progress Card */
        .progress-card {
          margin-top: 24px;
        }

        .progress-stats {
          display: flex;
          align-items: baseline;
          gap: 8px;
          margin-bottom: 16px;
        }

        .progress-number {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 3rem;
          font-weight: 300;
          color: #fff;
        }

        .progress-goal {
          color: rgba(255,255,255,0.5);
          font-size: 1.1rem;
        }

        .progress-bar-bg {
          height: 10px;
          background: rgba(255,255,255,0.1);
          border-radius: 5px;
          overflow: hidden;
        }

        .progress-bar-bg.small {
          height: 6px;
        }

        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 5px;
          transition: width 0.3s ease;
        }

        .progress-bar-fill.complete {
          background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
        }

        /* Calendar */
        .calendar-header {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
          margin-bottom: 12px;
        }

        .calendar-day-label {
          text-align: center;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 8px;
        }

        .calendar-day {
          aspect-ratio: 1;
          border: none;
          border-radius: 12px;
          background: rgba(255,255,255,0.05);
          color: #fff;
          font-weight: 500;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }

        .calendar-day:hover {
          background: rgba(255,255,255,0.15);
        }

        .calendar-day.selected {
          border: 2px solid #667eea;
        }

        .calendar-day.complete {
          background: rgba(34, 197, 94, 0.3);
        }

        .calendar-day.partial {
          background: rgba(102, 126, 234, 0.3);
        }

        .journal-dot {
          position: absolute;
          bottom: 6px;
          right: 6px;
          width: 6px;
          height: 6px;
          background: #f59e0b;
          border-radius: 50%;
        }

        .calendar-legend {
          display: flex;
          gap: 20px;
          justify-content: center;
          margin-top: 20px;
          flex-wrap: wrap;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
        }

        .legend-dot {
          width: 12px;
          height: 12px;
          border-radius: 4px;
        }

        .legend-dot.complete {
          background: rgba(34, 197, 94, 0.5);
        }

        .legend-dot.partial {
          background: rgba(102, 126, 234, 0.5);
        }

        .legend-dot.journal {
          width: 8px;
          height: 8px;
          background: #f59e0b;
          border-radius: 50%;
        }

        .journal-preview {
          margin-top: 24px;
          padding: 20px;
          background: rgba(245, 158, 11, 0.1);
          border-left: 3px solid #f59e0b;
          border-radius: 12px;
        }

        .journal-preview-date {
          font-size: 0.8rem;
          color: rgba(255,255,255,0.5);
          margin-bottom: 8px;
        }

        .journal-preview-text {
          color: rgba(255,255,255,0.8);
          font-size: 0.95rem;
          line-height: 1.6;
          white-space: pre-wrap;
        }

        /* Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 16px;
          margin-bottom: 24px;
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          text-align: center;
          padding: 28px;
        }

        .stat-card.main-stat {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%);
        }

        .stat-label {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 12px;
        }

        .stat-value {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 2.5rem;
          font-weight: 300;
          color: #fff;
        }

        .stat-value.large {
          font-size: 4rem;
        }

        .stat-unit {
          color: rgba(255,255,255,0.5);
          font-size: 0.9rem;
          margin-top: 4px;
        }

        .weekly-card h3 {
          margin-bottom: 20px;
        }

        .weekly-row {
          margin-bottom: 16px;
        }

        .weekly-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
        }

        .weekly-label {
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
        }

        .weekly-miles {
          font-weight: 500;
        }

        .motivation-card {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
          border-left: 3px solid #667eea;
          margin-top: 24px;
        }

        .motivation-card p {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.1rem;
          font-style: italic;
          line-height: 1.6;
          color: rgba(255,255,255,0.8);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .header {
            flex-direction: column;
            gap: 16px;
            padding: 20px;
          }
          
          .main-content {
            padding: 0 16px 32px;
          }

          .quote-text {
            font-size: 1.2rem;
          }

          .music-content {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
        }
      `}</style>
    </>
  );
}
