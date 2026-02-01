import { useState, useEffect } from 'react';
import Head from 'next/head';
import { quotes, getQuoteByDay } from '../lib/quotes';

const DEFAULT_DATA = {
  habits: {},
  runningMiles: {},
  gratitude: {},
  startDate: '2025-02-01'
};

export default function Home() {
  const [data, setData] = useState(DEFAULT_DATA);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window === 'undefined') return '2025-02-01';
    const today = new Date().toISOString().split('T')[0];
    if (today >= '2025-02-01' && today <= '2025-02-28') return today;
    return '2025-02-01';
  });
  const [gratitudeInput, setGratitudeInput] = useState(['', '', '']);
  const [milesInput, setMilesInput] = useState('');
  const [view, setView] = useState('today');
  const [mounted, setMounted] = useState(false);

  const habits = [
    { id: 'noCarbs', label: 'No processed/added carbs', emoji: '🥗' },
    { id: 'running', label: 'Running (log miles)', emoji: '🏃' },
    { id: 'strength', label: 'Strength training (20 min)', emoji: '💪' },
    { id: 'meditation', label: 'Meditation (20 min)', emoji: '🧘' },
    { id: 'gratitude', label: 'Gratitude journal (3 things)', emoji: '🙏' }
  ];

  const february2025 = Array.from({ length: 28 }, (_, i) => {
    const date = new Date(2025, 1, i + 1);
    return date.toISOString().split('T')[0];
  });

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('dadReadyTracker');
    if (saved) {
      setData(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem('dadReadyTracker', JSON.stringify(data));
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
  }, [selectedDate, data.gratitude, data.runningMiles]);

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

  const getWeeklyMiles = (weekNum) => {
    const weekStart = (weekNum - 1) * 7;
    const weekDates = february2025.slice(weekStart, weekStart + 7);
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
    const endIdx = february2025.indexOf(today) >= 0 ? february2025.indexOf(today) : february2025.length - 1;
    for (let i = endIdx; i >= 0; i--) {
      const date = february2025[i];
      const dayHabits = data.habits[date] || {};
      const allDone = habits.every(h => dayHabits[h.id]);
      if (allDone) streak++;
      else break;
    }
    return streak;
  };

  const getCompletionRate = () => {
    const today = new Date().toISOString().split('T')[0];
    const daysToCount = february2025.filter(d => d <= today);
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
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

  const todayQuote = getQuoteByDay(getDayOfMonth(selectedDate));

  if (!mounted) {
    return null;
  }

  return (
    <>
      <Head>
        <title>Dad Ready | February 2025</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0a0a0a" />
        <link rel="manifest" href="/manifest.json" />
      </Head>

      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        padding: '20px',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', margin: '0 0 4px 0' }}>Dad Ready</h1>
          <p style={{ color: '#888', margin: 0, fontSize: '14px' }}>February 2025</p>
        </div>

        {/* Daily Quote */}
        <div style={{
          backgroundColor: '#1e293b',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '20px',
          borderLeft: '4px solid #f59e0b'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '15px', lineHeight: '1.5', color: '#e2e8f0', fontStyle: 'italic' }}>
            "{todayQuote.text}"
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            — {todayQuote.author}
          </p>
        </div>

        {/* Navigation */}
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          backgroundColor: '#1a1a1a',
          borderRadius: '12px',
          padding: '4px'
        }}>
          {['today', 'calendar', 'stats'].map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                flex: 1,
                padding: '10px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: view === v ? '#2563eb' : 'transparent',
                color: view === v ? '#fff' : '#888',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '14px',
                textTransform: 'capitalize'
              }}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Today View */}
        {view === 'today' && (
          <div>
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px'
            }}>
              <h2 style={{ margin: '0 0 16px 0', fontSize: '18px' }}>{formatDate(selectedDate)}</h2>
              
              {habits.map(habit => (
                <div key={habit.id} style={{ marginBottom: '16px' }}>
                  <div
                    onClick={() => toggleHabit(habit.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '16px',
                      backgroundColor: data.habits[selectedDate]?.[habit.id] ? '#1e3a2f' : '#252525',
                      borderRadius: '12px',
                      cursor: habit.id === 'running' || habit.id === 'gratitude' ? 'default' : 'pointer',
                      border: data.habits[selectedDate]?.[habit.id] ? '1px solid #22c55e' : '1px solid #333'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{habit.emoji}</span>
                    <span style={{ flex: 1, fontWeight: '500' }}>{habit.label}</span>
                    {data.habits[selectedDate]?.[habit.id] && (
                      <span style={{ color: '#22c55e', fontSize: '20px' }}>✓</span>
                    )}
                  </div>

                  {habit.id === 'running' && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Miles today"
                        value={milesInput}
                        onChange={(e) => setMilesInput(e.target.value)}
                        style={{
                          flex: 1,
                          padding: '12px',
                          borderRadius: '8px',
                          border: '1px solid #333',
                          backgroundColor: '#252525',
                          color: '#fff',
                          fontSize: '16px'
                        }}
                      />
                      <button
                        onClick={saveMiles}
                        style={{
                          padding: '12px 20px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: '#2563eb',
                          color: '#fff',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Save
                      </button>
                    </div>
                  )}

                  {habit.id === 'gratitude' && (
                    <div style={{ marginTop: '8px' }}>
                      {[0, 1, 2].map(i => (
                        <input
                          key={i}
                          type="text"
                          placeholder={`Grateful for... (${i + 1})`}
                          value={gratitudeInput[i]}
                          onChange={(e) => {
                            const newGratitude = [...gratitudeInput];
                            newGratitude[i] = e.target.value;
                            setGratitudeInput(newGratitude);
                          }}
                          onBlur={saveGratitude}
                          style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #333',
                            backgroundColor: '#252525',
                            color: '#fff',
                            fontSize: '14px',
                            marginBottom: '8px',
                            boxSizing: 'border-box'
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Weekly Running Progress */}
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', color: '#888' }}>
                Week {getCurrentWeek()} Running
              </h3>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '36px', fontWeight: '700' }}>
                  {getWeeklyMiles(getCurrentWeek()).toFixed(1)}
                </span>
                <span style={{ color: '#888' }}>/ 35 miles</span>
              </div>
              <div style={{
                height: '8px',
                backgroundColor: '#333',
                borderRadius: '4px',
                marginTop: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '100%',
                  width: `${Math.min((getWeeklyMiles(getCurrentWeek()) / 35) * 100, 100)}%`,
                  backgroundColor: getWeeklyMiles(getCurrentWeek()) >= 35 ? '#22c55e' : '#2563eb',
                  borderRadius: '4px',
                  transition: 'width 0.3s'
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Calendar View */}
        {view === 'calendar' && (
          <div style={{
            backgroundColor: '#1a1a1a',
            borderRadius: '16px',
            padding: '20px'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px',
              marginBottom: '12px'
            }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{ textAlign: 'center', color: '#666', fontSize: '12px', fontWeight: '600' }}>
                  {d}
                </div>
              ))}
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              gap: '8px'
            }}>
              {/* Feb 1, 2025 is Saturday - 6 empty cells */}
              {[...Array(6)].map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {february2025.map(date => {
                const status = getDayStatus(date);
                const isSelected = date === selectedDate;
                const dayNum = getDayOfMonth(date);
                return (
                  <button
                    key={date}
                    onClick={() => { setSelectedDate(date); setView('today'); }}
                    style={{
                      aspectRatio: '1',
                      border: isSelected ? '2px solid #2563eb' : 'none',
                      borderRadius: '8px',
                      backgroundColor: status === 'complete' ? '#166534' : status === 'partial' ? '#1e3a5f' : '#252525',
                      color: '#fff',
                      fontWeight: '600',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#166534', borderRadius: '3px' }} />
                All done
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#888' }}>
                <div style={{ width: '12px', height: '12px', backgroundColor: '#1e3a5f', borderRadius: '3px' }} />
                Partial
              </div>
            </div>
          </div>
        )}

        {/* Stats View */}
        {view === 'stats' && (
          <div>
            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '16px',
              textAlign: 'center'
            }}>
              <p style={{ color: '#888', margin: '0 0 4px 0', fontSize: '14px' }}>Current Streak</p>
              <p style={{ fontSize: '48px', fontWeight: '700', margin: '0' }}>{getStreak()}</p>
              <p style={{ color: '#888', margin: '4px 0 0 0', fontSize: '14px' }}>days</p>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#888', margin: '0 0 4px 0', fontSize: '14px' }}>Completion</p>
                <p style={{ fontSize: '32px', fontWeight: '700', margin: '0' }}>{getCompletionRate()}%</p>
              </div>
              <div style={{
                backgroundColor: '#1a1a1a',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center'
              }}>
                <p style={{ color: '#888', margin: '0 0 4px 0', fontSize: '14px' }}>Total Miles</p>
                <p style={{ fontSize: '32px', fontWeight: '700', margin: '0' }}>{getTotalMiles().toFixed(1)}</p>
              </div>
            </div>

            <div style={{
              backgroundColor: '#1a1a1a',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Weekly Running</h3>
              {[1, 2, 3, 4].map(week => (
                <div key={week} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#888', fontSize: '14px' }}>Week {week}</span>
                    <span style={{ fontWeight: '600' }}>{getWeeklyMiles(week).toFixed(1)} / 35 mi</span>
                  </div>
                  <div style={{
                    height: '8px',
                    backgroundColor: '#333',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.min((getWeeklyMiles(week) / 35) * 100, 100)}%`,
                      backgroundColor: getWeeklyMiles(week) >= 35 ? '#22c55e' : '#2563eb',
                      borderRadius: '4px'
                    }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              padding: '20px',
              marginTop: '16px',
              borderLeft: '4px solid #2563eb'
            }}>
              <p style={{ margin: 0, fontStyle: 'italic', color: '#cbd5e1' }}>
                "I'm getting dad-ready. By the end of February, I'll be in great shape, great health, and ready to meet my kid."
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx global>{`
        * {
          box-sizing: border-box;
          -webkit-tap-highlight-color: transparent;
        }
        body {
          margin: 0;
          padding: 0;
          background-color: #0a0a0a;
        }
        input:focus {
          outline: none;
          border-color: #2563eb !important;
        }
        button:active {
          transform: scale(0.98);
        }
      `}</style>
    </>
  );
}
