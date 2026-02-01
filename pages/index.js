import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Head from 'next/head';
import { quotes, getQuoteByDay } from '../lib/quotes';
import { getDailyTip } from '../lib/pregnancy';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [settings, setSettings] = useState(null);
  const [data, setData] = useState(null);
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
  const [wins, setWins] = useState([]);
  const [currentWin, setCurrentWin] = useState(null);
  const [loadingWins, setLoadingWins] = useState(false);
  const [pregnancyInfo, setPregnancyInfo] = useState(null);
  const [pregnancyExpanded, setPregnancyExpanded] = useState(false);

  const allHabits = [
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

    const savedSettings = localStorage.getItem('dadReadySettings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);

      if (parsed.trackPregnancy && parsed.lmpDate) {
        const info = getDailyTip(parsed.lmpDate, parsed.cycleLength || 28);
        setPregnancyInfo(info);
      }

      const savedWins = localStorage.getItem('dadReadyWins');
      if (savedWins) {
        const winsArray = JSON.parse(savedWins);
        setWins(winsArray);
        if (winsArray.length > 0) {
          setCurrentWin(winsArray[Math.floor(Math.random() * winsArray.length)]);
        }
      }
    } else {
      router.push('/onboarding');
      return;
    }

    const savedData = localStorage.getItem('dadReadyTracker2026');
    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      setData({
        habits: {},
        runningMiles: {},
        gratitude: {},
        journal: {},
      });
    }
  }, [router]);

  useEffect(() => {
    if (mounted && data) {
      localStorage.setItem('dadReadyTracker2026', JSON.stringify(data));
    }
  }, [data, mounted]);

  useEffect(() => {
    if (!data) return;

    if (data.gratitude?.[selectedDate]) {
      setGratitudeInput(data.gratitude[selectedDate]);
    } else {
      setGratitudeInput(['', '', '']);
    }
    if (data.runningMiles?.[selectedDate]) {
      setMilesInput(data.runningMiles[selectedDate].toString());
    } else {
      setMilesInput('');
    }
    if (data.journal?.[selectedDate]) {
      setJournalInput(data.journal[selectedDate]);
    } else {
      setJournalInput('');
    }
  }, [selectedDate, data]);

  const habits = allHabits.filter(h => settings?.habits?.includes(h.id));
  const weeklyMileGoal = settings?.weeklyMileGoal || 35;

  const toggleHabit = (habitId) => {
    if (habitId === 'running' || habitId === 'gratitude') return;
    setData(prev => ({
      ...prev,
      habits: {
        ...prev.habits,
        [selectedDate]: {
          ...prev.habits?.[selectedDate],
          [habitId]: !prev.habits?.[selectedDate]?.[habitId]
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
        [selectedDate]: { ...prev.habits?.[selectedDate], running: miles > 0 }
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
        [selectedDate]: { ...prev.habits?.[selectedDate], gratitude: filled }
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
    return weekDates.reduce((sum, date) => sum + (data?.runningMiles?.[date] || 0), 0);
  };

  const getCurrentWeek = () => {
    const dayOfMonth = new Date(selectedDate + 'T12:00:00').getDate();
    return Math.ceil(dayOfMonth / 7);
  };

  const getTotalMiles = () => {
    if (!data?.runningMiles) return 0;
    return Object.values(data.runningMiles).reduce((sum, m) => sum + m, 0);
  };

  const getStreak = () => {
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const endIdx = february2026.indexOf(today) >= 0 ? february2026.indexOf(today) : february2026.length - 1;
    for (let i = endIdx; i >= 0; i--) {
      const date = february2026[i];
      const dayHabits = data?.habits?.[date] || {};
      const allDone = habits.every(h => dayHabits[h.id]);
      if (allDone && habits.length > 0) streak++;
      else break;
    }
    return streak;
  };

  const getCompletionRate = () => {
    const today = new Date().toISOString().split('T')[0];
    const daysToCount = february2026.filter(d => d <= today);
    if (daysToCount.length === 0 || habits.length === 0) return 0;
    let totalCompleted = 0;
    let totalPossible = 0;
    daysToCount.forEach(date => {
      habits.forEach(h => {
        totalPossible++;
        if (data?.habits?.[date]?.[h.id]) totalCompleted++;
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
    const dayHabits = data?.habits?.[date] || {};
    const completed = habits.filter(h => dayHabits[h.id]).length;
    if (completed === habits.length && habits.length > 0) return 'complete';
    if (completed > 0) return 'partial';
    return 'empty';
  };

  const getDayOfMonth = (dateStr) => {
    return new Date(dateStr + 'T12:00:00').getDate();
  };

  const hasJournalEntry = (date) => {
    return data?.journal?.[date] && data.journal[date].trim().length > 0;
  };

  const loadWinsFromDocs = async () => {
    if (!settings?.docUrls?.length) return;

    setLoadingWins(true);
    const allWins = [];

    for (const url of settings.docUrls) {
      if (!url.trim()) continue;

      try {
        const docRes = await fetch('/api/fetch-doc', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docUrl: url })
        });

        if (!docRes.ok) continue;

        const docData = await docRes.json();

        const winsRes = await fetch('/api/extract-wins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: docData.content, title: docData.title })
        });

        if (winsRes.ok) {
          const winsData = await winsRes.json();
          allWins.push(...winsData.wins);
        }
      } catch (error) {
        console.error('Error loading wins from doc:', error);
      }
    }

    if (allWins.length > 0) {
      setWins(allWins);
      setCurrentWin(allWins[Math.floor(Math.random() * allWins.length)]);
      localStorage.setItem('dadReadyWins', JSON.stringify(allWins));
    }

    setLoadingWins(false);
  };

  const showNextWin = () => {
    if (wins.length > 0) {
      const currentIndex = wins.indexOf(currentWin);
      const nextIndex = (currentIndex + 1) % wins.length;
      setCurrentWin(wins[nextIndex]);
    }
  };

  const todayQuote = getQuoteByDay(getDayOfMonth(selectedDate));

  // Count today's completed habits
  const todayCompleted = habits.filter(h => data?.habits?.[selectedDate]?.[h.id]).length;
  const todayTotal = habits.length;

  if (status === "loading" || !mounted || !settings || !data) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1>Dad Ready</h1>
          <p>Loading...</p>
        </div>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-family: 'Inter', sans-serif;
          }
          .loading-content {
            text-align: center;
          }
          .loading-content h1 {
            font-size: 2rem;
            margin-bottom: 8px;
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
        <meta name="theme-color" content="#1a1a2e" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="app">
        <div className="background" />

        {/* Minimal Header */}
        <header className="header">
          <div className="header-left">
            <h1 className="logo">Dad Ready</h1>
          </div>
          <div className="header-right">
            <button onClick={() => router.push('/settings')} className="settings-btn">⚙️</button>
          </div>
        </header>

        <main className="main-content">
          {/* Inline Quote */}
          <div className="quote-inline">
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
              {/* Date + Progress Summary */}
              <div className="day-header">
                <h2 className="day-title">{formatDate(selectedDate)}</h2>
                {todayTotal > 0 && (
                  <span className="day-progress">{todayCompleted}/{todayTotal}</span>
                )}
              </div>

              {/* Habits — the main event */}
              {habits.length === 0 ? (
                <div className="card no-habits">
                  <p>No habits selected yet.</p>
                  <button onClick={() => router.push('/settings')} className="action-btn">
                    Choose Your Habits
                  </button>
                </div>
              ) : (
                <div className="habits-list">
                  {habits.map(habit => (
                    <div key={habit.id} className="habit-item-wrapper">
                      <div
                        onClick={() => toggleHabit(habit.id)}
                        className={`habit-item ${data.habits?.[selectedDate]?.[habit.id] ? 'completed' : ''} ${habit.id === 'running' || habit.id === 'gratitude' ? 'no-click' : ''}`}
                      >
                        <span className="habit-emoji">{habit.emoji}</span>
                        <span className="habit-label">{habit.label}</span>
                        {data.habits?.[selectedDate]?.[habit.id] && <span className="habit-check">✓</span>}
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
              )}

              {/* Running Progress (compact) */}
              {settings?.habits?.includes('running') && (
                <div className="card running-card">
                  <div className="running-header">
                    <span className="running-label">Week {getCurrentWeek()} Running</span>
                    <span className="running-stat">{getWeeklyMiles(getCurrentWeek()).toFixed(1)} / {weeklyMileGoal} mi</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${Math.min((getWeeklyMiles(getCurrentWeek()) / weeklyMileGoal) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Pregnancy Tip (collapsed by default) */}
              {pregnancyInfo && (
                <div className="card pregnancy-card">
                  <div className="pregnancy-summary" onClick={() => setPregnancyExpanded(!pregnancyExpanded)}>
                    <div className="pregnancy-left">
                      <span className="pregnancy-week-num">{pregnancyInfo.weeks}w {pregnancyInfo.days}d</span>
                      <span className="pregnancy-divider">·</span>
                      <span className="pregnancy-tip-preview">
                        {pregnancyExpanded ? 'Hide details' : pregnancyInfo.todaysTip}
                      </span>
                    </div>
                    <span className="pregnancy-toggle">{pregnancyExpanded ? '−' : '+'}</span>
                  </div>

                  {pregnancyExpanded && (
                    <div className="pregnancy-details">
                      <div className="pregnancy-detail-row">
                        <span className="detail-icon">👶</span>
                        <div>
                          <h4>Baby This Week</h4>
                          <p>{pregnancyInfo.baby}</p>
                        </div>
                      </div>
                      <div className="pregnancy-detail-row">
                        <span className="detail-icon">💜</span>
                        <div>
                          <h4>What She May Be Feeling</h4>
                          <p>{pregnancyInfo.mom}</p>
                        </div>
                      </div>
                      <div className="pregnancy-detail-row highlight">
                        <span className="detail-icon">💡</span>
                        <div>
                          <h4>Today's Support Tip</h4>
                          <p>{pregnancyInfo.todaysTip}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Journal */}
              <div className="card journal-card">
                <div className="card-label">Reflections</div>
                <textarea
                  placeholder="What's on your mind today?"
                  value={journalInput}
                  onChange={(e) => setJournalInput(e.target.value)}
                  onBlur={saveJournal}
                  className="journal-textarea"
                />
              </div>

              {/* Wins Feed (compact) */}
              {currentWin ? (
                <div className="card wins-card">
                  <div className="card-label">Your Wins</div>
                  <p className="win-text">{currentWin}</p>
                  <button onClick={showNextWin} className="win-btn">Another win →</button>
                </div>
              ) : settings?.docUrls?.some(url => url.trim()) ? (
                <div className="card wins-card">
                  <div className="card-label">Your Wins</div>
                  <p className="win-placeholder">Ready to load your wins.</p>
                  <button
                    onClick={loadWinsFromDocs}
                    className="action-btn"
                    disabled={loadingWins}
                  >
                    {loadingWins ? 'Loading...' : 'Extract My Wins'}
                  </button>
                </div>
              ) : null}
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
                    const dayStatus = getDayStatus(date);
                    const isSelected = date === selectedDate;
                    const dayNum = getDayOfMonth(date);
                    const hasJournal = hasJournalEntry(date);
                    return (
                      <button
                        key={date}
                        onClick={() => { setSelectedDate(date); setView('today'); }}
                        className={`calendar-day ${dayStatus} ${isSelected ? 'selected' : ''}`}
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

                {data.journal?.[selectedDate] && (
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
                  <div className="stat-label">Completion</div>
                  <div className="stat-value">{getCompletionRate()}%</div>
                </div>
                {settings?.habits?.includes('running') && (
                  <div className="card stat-card">
                    <div className="stat-label">Total Miles</div>
                    <div className="stat-value">{getTotalMiles().toFixed(1)}</div>
                  </div>
                )}
              </div>

              {settings?.habits?.includes('running') && (
                <div className="card weekly-card">
                  <h3 className="section-title">Weekly Running</h3>
                  {[1, 2, 3, 4].map(week => (
                    <div key={week} className="weekly-row">
                      <div className="weekly-info">
                        <span className="weekly-label">Week {week}</span>
                        <span className="weekly-miles">{getWeeklyMiles(week).toFixed(1)} / {weeklyMileGoal} mi</span>
                      </div>
                      <div className="progress-bar-bg small">
                        <div
                          className={`progress-bar-fill ${getWeeklyMiles(week) >= weeklyMileGoal ? 'complete' : ''}`}
                          style={{ width: `${Math.min((getWeeklyMiles(week) / weeklyMileGoal) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {wins.length > 0 && (
                <div className="card wins-summary-card">
                  <h3 className="section-title">Your Wins ({wins.length})</h3>
                  <div className="wins-list">
                    {wins.slice(0, 5).map((win, i) => (
                      <div key={i} className="win-item">
                        <span>✨</span>
                        <p>{win}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="card motivation-card">
                <p>"I'm getting dad-ready. By the end of February, I'll be in great shape, great health, and ready to meet my kid."</p>
              </div>
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #1a1a2e; }

        .app { min-height: 100vh; position: relative; color: #fff; }

        .background {
          position: fixed; inset: 0;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
          z-index: -2;
        }
        .background::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 60%;
          background: linear-gradient(180deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%);
        }

        /* Simplified Header */
        .header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px 32px; max-width: 680px; margin: 0 auto;
        }
        .logo { font-family: 'Crimson Pro', serif; font-size: 1.6rem; font-weight: 400; }
        .header-right { display: flex; align-items: center; gap: 12px; }
        .settings-btn {
          background: rgba(255,255,255,0.08); border: none; padding: 8px 12px;
          border-radius: 10px; cursor: pointer; font-size: 1rem; transition: background 0.2s;
        }
        .settings-btn:hover { background: rgba(255,255,255,0.15); }

        .main-content { max-width: 680px; margin: 0 auto; padding: 0 24px 48px; }

        /* Inline Quote */
        .quote-inline {
          text-align: center;
          padding: 0 8px 20px;
        }
        .quote-inline .quote-text {
          font-family: 'Crimson Pro', serif;
          font-size: 1.05rem;
          font-weight: 300;
          line-height: 1.5;
          color: rgba(255,255,255,0.5);
          margin-bottom: 4px;
        }
        .quote-inline .quote-author {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.3);
        }

        /* Nav Tabs */
        .nav-tabs { display: flex; gap: 6px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 14px; margin-bottom: 20px; }
        .nav-tab {
          flex: 1; padding: 10px 16px; border: none; border-radius: 10px;
          background: transparent; color: rgba(255,255,255,0.5); font-size: 0.85rem;
          font-weight: 500; cursor: pointer; transition: all 0.2s;
        }
        .nav-tab.active { background: rgba(102, 126, 234, 0.8); color: #fff; }

        /* Card */
        .card {
          background: rgba(255,255,255,0.06); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px;
        }
        .card-label {
          font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px;
          color: rgba(255,255,255,0.4); margin-bottom: 12px;
        }

        /* Day Header */
        .day-header {
          display: flex; justify-content: space-between; align-items: baseline;
          margin-bottom: 16px;
        }
        .day-title {
          font-family: 'Crimson Pro', serif; font-size: 1.3rem; font-weight: 400;
          color: rgba(255,255,255,0.85);
        }
        .day-progress {
          font-family: 'Crimson Pro', serif; font-size: 1.1rem;
          color: rgba(255,255,255,0.4);
        }

        /* Habits */
        .habits-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
        .no-habits { text-align: center; padding: 40px 20px; color: rgba(255,255,255,0.5); margin-bottom: 16px; }
        .no-habits p { margin-bottom: 16px; }

        .habit-item {
          display: flex; align-items: center; gap: 14px; padding: 14px 16px;
          background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
          border-radius: 12px; cursor: pointer; transition: all 0.2s;
        }
        .habit-item.no-click { cursor: default; }
        .habit-item:hover:not(.no-click) { background: rgba(255,255,255,0.08); }
        .habit-item.completed { background: rgba(34, 197, 94, 0.12); border-color: rgba(34, 197, 94, 0.25); }
        .habit-emoji { font-size: 1.3rem; }
        .habit-label { flex: 1; font-weight: 400; font-size: 0.9rem; color: rgba(255,255,255,0.85); }
        .habit-check { color: #22c55e; font-size: 1.1rem; font-weight: 600; }

        .habit-input-row { display: flex; gap: 10px; margin-top: 10px; }
        .input-field {
          flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
          color: #fff; font-size: 0.9rem;
        }
        .input-field:focus { outline: none; border-color: rgba(102, 126, 234, 0.5); }
        .input-field::placeholder { color: rgba(255,255,255,0.25); }
        .save-btn {
          padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none; border-radius: 10px; color: #fff; font-weight: 500; font-size: 0.85rem; cursor: pointer;
        }
        .gratitude-inputs { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
        .gratitude-input { width: 100%; }

        /* Running Card (compact) */
        .running-card { margin-bottom: 12px; padding: 16px 20px; }
        .running-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
        .running-label { font-size: 0.8rem; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.5px; }
        .running-stat { font-family: 'Crimson Pro', serif; font-size: 1rem; color: rgba(255,255,255,0.7); }

        .progress-bar-bg { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
        .progress-bar-bg.small { height: 5px; }
        .progress-bar-fill {
          height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
          border-radius: 3px; transition: width 0.3s;
        }
        .progress-bar-fill.complete { background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); }

        /* Pregnancy Card (collapsible) */
        .pregnancy-card {
          margin-bottom: 12px;
          background: rgba(168, 85, 247, 0.08);
          border-color: rgba(168, 85, 247, 0.2);
          padding: 0;
        }

        .pregnancy-summary {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 20px; cursor: pointer; user-select: none;
        }

        .pregnancy-left {
          display: flex; align-items: center; gap: 10px;
          min-width: 0; flex: 1;
        }

        .pregnancy-week-num {
          font-family: 'Crimson Pro', serif;
          font-size: 1rem; font-weight: 500;
          color: #e879f9; white-space: nowrap; flex-shrink: 0;
        }

        .pregnancy-divider { color: rgba(255,255,255,0.2); }

        .pregnancy-tip-preview {
          font-size: 0.85rem; color: rgba(255,255,255,0.55);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }

        .pregnancy-toggle {
          font-size: 1.2rem; color: rgba(255,255,255,0.3);
          width: 28px; text-align: center; flex-shrink: 0;
        }

        .pregnancy-details {
          padding: 0 20px 20px;
          display: flex; flex-direction: column; gap: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
          padding-top: 16px;
          margin: 0 12px;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .pregnancy-detail-row {
          display: flex; gap: 12px; padding: 12px;
          background: rgba(255,255,255,0.04); border-radius: 10px;
        }
        .pregnancy-detail-row.highlight {
          background: rgba(168, 85, 247, 0.15);
        }
        .detail-icon { font-size: 1.2rem; flex-shrink: 0; }
        .pregnancy-detail-row h4 {
          font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.5px;
          color: rgba(255,255,255,0.5); margin: 0 0 4px 0;
        }
        .pregnancy-detail-row p {
          margin: 0; font-size: 0.88rem; line-height: 1.5; color: rgba(255,255,255,0.8);
        }

        /* Journal Card */
        .journal-card { margin-bottom: 12px; }
        .journal-textarea {
          width: 100%; min-height: 80px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 14px;
          color: #fff; font-family: inherit; font-size: 0.9rem; line-height: 1.6; resize: none;
        }
        .journal-textarea:focus { outline: none; border-color: rgba(102, 126, 234, 0.4); }
        .journal-textarea::placeholder { color: rgba(255,255,255,0.2); }

        /* Wins Card (compact) */
        .wins-card {
          background: rgba(245, 158, 11, 0.08);
          border-color: rgba(245, 158, 11, 0.2);
          margin-bottom: 12px;
        }
        .win-text { font-family: 'Crimson Pro', serif; font-size: 1.05rem; line-height: 1.6; color: rgba(255,255,255,0.85); margin-bottom: 10px; }
        .win-placeholder { color: rgba(255,255,255,0.4); font-size: 0.88rem; margin-bottom: 10px; }
        .win-btn, .action-btn {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.7); padding: 8px 18px; border-radius: 8px;
          font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
        }
        .win-btn:hover, .action-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        /* Calendar */
        .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 12px; }
        .calendar-day-label { text-align: center; font-size: 0.72rem; color: rgba(255,255,255,0.35); text-transform: uppercase; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .calendar-day {
          aspect-ratio: 1; border: none; border-radius: 10px; background: rgba(255,255,255,0.05);
          color: #fff; font-size: 0.85rem; font-weight: 500; cursor: pointer; position: relative; transition: all 0.2s;
        }
        .calendar-day:hover { background: rgba(255,255,255,0.12); }
        .calendar-day.selected { border: 2px solid #667eea; }
        .calendar-day.complete { background: rgba(34, 197, 94, 0.25); }
        .calendar-day.partial { background: rgba(102, 126, 234, 0.25); }
        .journal-dot { position: absolute; bottom: 5px; right: 5px; width: 5px; height: 5px; background: #f59e0b; border-radius: 50%; }
        .calendar-legend { display: flex; gap: 20px; justify-content: center; margin-top: 20px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .legend-dot { width: 10px; height: 10px; border-radius: 3px; }
        .legend-dot.complete { background: rgba(34, 197, 94, 0.4); }
        .legend-dot.partial { background: rgba(102, 126, 234, 0.4); }
        .legend-dot.journal { width: 7px; height: 7px; background: #f59e0b; border-radius: 50%; }
        .journal-preview { margin-top: 20px; padding: 16px; background: rgba(245, 158, 11, 0.08); border-left: 3px solid rgba(245, 158, 11, 0.5); border-radius: 10px; }
        .journal-preview-date { font-size: 0.75rem; color: rgba(255,255,255,0.4); margin-bottom: 6px; }
        .journal-preview-text { color: rgba(255,255,255,0.7); font-size: 0.88rem; line-height: 1.6; white-space: pre-wrap; }

        /* Stats */
        .section-title { font-family: 'Crimson Pro', serif; font-size: 1.3rem; font-weight: 400; margin-bottom: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
        @media (max-width: 600px) { .stats-grid { grid-template-columns: 1fr; } }
        .stat-card { text-align: center; padding: 24px 16px; }
        .stat-card.main-stat { background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%); }
        .stat-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
        .stat-value { font-family: 'Crimson Pro', serif; font-size: 2.2rem; font-weight: 300; }
        .stat-value.large { font-size: 3.5rem; }
        .stat-unit { color: rgba(255,255,255,0.4); font-size: 0.82rem; margin-top: 4px; }

        .weekly-card { margin-bottom: 20px; }
        .weekly-card h3 { margin-bottom: 16px; }
        .weekly-row { margin-bottom: 14px; }
        .weekly-info { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .weekly-label { color: rgba(255,255,255,0.5); font-size: 0.82rem; }
        .weekly-miles { font-weight: 500; font-size: 0.88rem; }

        .wins-summary-card { margin-bottom: 20px; }
        .wins-list { display: flex; flex-direction: column; gap: 10px; }
        .win-item { display: flex; gap: 10px; padding: 10px; background: rgba(255,255,255,0.04); border-radius: 8px; }
        .win-item p { color: rgba(255,255,255,0.7); font-size: 0.88rem; line-height: 1.5; }

        .motivation-card {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
          border-left: 3px solid rgba(102, 126, 234, 0.5);
        }
        .motivation-card p { font-family: 'Crimson Pro', serif; font-size: 1rem; font-style: italic; line-height: 1.6; color: rgba(255,255,255,0.6); }

        @media (max-width: 600px) {
          .header { padding: 16px 16px; }
          .main-content { padding: 0 16px 32px; }
        }
      `}</style>
    </>
  );
}
