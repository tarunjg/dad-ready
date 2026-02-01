import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from 'next/head';
import { getQuoteByDay } from '../lib/quotes';
import { getDailyTip, getPregnancyPercentage, getEstimatedDueDate, getPregnancyInfoAtDate, pregnancyMilestones } from '../lib/pregnancy';
import { PILLARS, getAllHabits, getTotalCompletion, getPillarCompletion, migrateSettings } from '../lib/pillars';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ytPlayerRef = useRef(null);

  // Core state
  const [settings, setSettings] = useState(null);
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window === 'undefined') return '2026-02-01';
    const today = new Date().toISOString().split('T')[0];
    if (today >= '2026-02-01' && today <= '2026-02-28') return today;
    return '2026-02-01';
  });
  const [view, setView] = useState('today');
  const [mounted, setMounted] = useState(false);

  // Inputs
  const [gratitudeInput, setGratitudeInput] = useState(['', '', '']);
  const [milesInput, setMilesInput] = useState('');
  const [reflectionInput, setReflectionInput] = useState('');

  // Pregnancy
  const [pregnancyInfo, setPregnancyInfo] = useState(null);
  const [pregnancyPercent, setPregnancyPercent] = useState(null);
  const [pregnancyExpanded, setPregnancyExpanded] = useState(false);

  // Reminders (formerly wins)
  const [reminders, setReminders] = useState([]);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [loadingReminders, setLoadingReminders] = useState(false);

  // Audio & Recording
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Voice notes
  const [voiceNotes, setVoiceNotes] = useState([]);

  // Calendar intentions
  const [intentionInput, setIntentionInput] = useState('');
  const [intentionGoals, setIntentionGoals] = useState([]);
  const [newGoalInput, setNewGoalInput] = useState('');

  const february2026 = Array.from({ length: 28 }, (_, i) => {
    const date = new Date(2026, 1, i + 1);
    return date.toISOString().split('T')[0];
  });

  const today = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '2026-02-01';
  const isFutureDate = selectedDate > today;

  // Auth redirect
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  // Load data on mount
  useEffect(() => {
    setMounted(true);
    const savedSettings = localStorage.getItem('dadReadySettings');
    if (savedSettings) {
      let parsed = JSON.parse(savedSettings);
      parsed = migrateSettings(parsed);
      setSettings(parsed);

      if (parsed.trackPregnancy && parsed.lmpDate) {
        const info = getDailyTip(parsed.lmpDate, parsed.cycleLength || 28);
        setPregnancyInfo(info);
        const pct = getPregnancyPercentage(parsed.lmpDate, parsed.cycleLength || 28);
        setPregnancyPercent(pct);
      }

      // Load reminders (migrating from old wins key)
      const savedReminders = localStorage.getItem('dadReadyReminders') || localStorage.getItem('dadReadyWins');
      if (savedReminders) {
        const arr = JSON.parse(savedReminders);
        setReminders(arr);
        if (arr.length > 0) setCurrentReminder(arr[Math.floor(Math.random() * arr.length)]);
      }
    } else {
      router.push('/onboarding');
      return;
    }

    const savedData = localStorage.getItem('dadReadyTracker2026');
    if (savedData) {
      setData(JSON.parse(savedData));
    } else {
      setData({ habits: {}, runningMiles: {}, gratitude: {}, journal: {}, reflections: {}, intentions: {} });
    }
  }, [router]);

  // Persist data
  useEffect(() => {
    if (mounted && data) {
      localStorage.setItem('dadReadyTracker2026', JSON.stringify(data));
    }
  }, [data, mounted]);

  // Load date-specific inputs
  useEffect(() => {
    if (!data) return;
    setGratitudeInput(data.gratitude?.[selectedDate] || ['', '', '']);
    setMilesInput(data.runningMiles?.[selectedDate]?.toString() || '');
    setReflectionInput(data.reflections?.[selectedDate]?.text || data.journal?.[selectedDate] || '');
    setVoiceNotes(data.reflections?.[selectedDate]?.voiceNotes || []);

    // Load intentions for future dates
    const intent = data.intentions?.[selectedDate];
    setIntentionGoals(intent?.goals || []);
    setIntentionInput(intent?.notes || '');
  }, [selectedDate, data]);

  // YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.YT) return;

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => {
      ytPlayerRef.current = new window.YT.Player('yt-player-container', {
        videoId: 'A4ZK0vt8GQU',
        playerVars: { autoplay: 0, loop: 1, playlist: 'A4ZK0vt8GQU' },
        events: {
          onReady: () => {},
        }
      });
    };
  }, []);

  // Active habits from settings
  const allHabits = getAllHabits();
  const activeHabitIds = settings?.habits || [];
  const weeklyMileGoal = settings?.weeklyMileGoal || 35;

  // Habit actions
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

  const saveReflection = useCallback(() => {
    setData(prev => ({
      ...prev,
      reflections: {
        ...prev.reflections,
        [selectedDate]: {
          ...prev.reflections?.[selectedDate],
          text: reflectionInput,
          voiceNotes: voiceNotes,
          savedAt: new Date().toISOString()
        }
      },
      journal: { ...prev.journal, [selectedDate]: reflectionInput }
    }));
  }, [reflectionInput, voiceNotes, selectedDate]);

  // Audio controls
  const toggleAudio = () => {
    if (!ytPlayerRef.current) return;
    if (audioPlaying) {
      ytPlayerRef.current.pauseVideo();
    } else {
      ytPlayerRef.current.playVideo();
    }
    setAudioPlaying(!audioPlaying);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop());
        clearInterval(recordingTimerRef.current);
        const duration = recordingDuration;
        setRecordingDuration(0);

        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(blob);

        // Transcribe
        setTranscribing(true);
        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64.split(',')[1] })
          });

          if (res.ok) {
            const { text } = await res.json();
            const newNote = {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              transcript: text,
              duration: duration
            };
            const updated = [...voiceNotes, newNote];
            setVoiceNotes(updated);

            // Also append to reflection text
            setReflectionInput(prev => prev ? `${prev}\n\n[Voice note]: ${text}` : `[Voice note]: ${text}`);
          } else {
            const err = await res.json();
            alert(`Transcription failed: ${err.error}`);
          }
        } catch (err) {
          console.error('Transcription error:', err);
          alert('Failed to transcribe. Please try again.');
        }
        setTranscribing(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access denied:', err);
      alert('Microphone access is required for voice notes.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const blobToBase64 = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

  const deleteVoiceNote = (noteId) => {
    setVoiceNotes(prev => prev.filter(n => n.id !== noteId));
  };

  // Reminders (formerly wins)
  const loadRemindersFromDocs = async () => {
    if (!settings?.docUrls?.length) return;
    setLoadingReminders(true);
    const allReminders = [];

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

        const remRes = await fetch('/api/extract-wins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: docData.content, title: docData.title })
        });
        if (remRes.ok) {
          const remData = await remRes.json();
          allReminders.push(...remData.wins);
        }
      } catch (error) {
        console.error('Error loading reminders:', error);
      }
    }

    if (allReminders.length > 0) {
      setReminders(allReminders);
      setCurrentReminder(allReminders[Math.floor(Math.random() * allReminders.length)]);
      localStorage.setItem('dadReadyReminders', JSON.stringify(allReminders));
    }
    setLoadingReminders(false);
  };

  const showNextReminder = () => {
    if (reminders.length > 0) {
      const idx = reminders.indexOf(currentReminder);
      setCurrentReminder(reminders[(idx + 1) % reminders.length]);
    }
  };

  // Intentions (for future dates)
  const addIntentionGoal = () => {
    if (!newGoalInput.trim()) return;
    const updated = [...intentionGoals, newGoalInput.trim()];
    setIntentionGoals(updated);
    setNewGoalInput('');
    setData(prev => ({
      ...prev,
      intentions: {
        ...prev.intentions,
        [selectedDate]: { goals: updated, notes: prev.intentions?.[selectedDate]?.notes || '' }
      }
    }));
  };

  const removeIntentionGoal = (idx) => {
    const updated = intentionGoals.filter((_, i) => i !== idx);
    setIntentionGoals(updated);
    setData(prev => ({
      ...prev,
      intentions: {
        ...prev.intentions,
        [selectedDate]: { ...prev.intentions?.[selectedDate], goals: updated }
      }
    }));
  };

  const saveIntentionNotes = () => {
    setData(prev => ({
      ...prev,
      intentions: {
        ...prev.intentions,
        [selectedDate]: { ...prev.intentions?.[selectedDate], goals: intentionGoals, notes: intentionInput }
      }
    }));
  };

  // Computed values
  const todayQuote = getQuoteByDay(getDayOfMonth(selectedDate));
  const dayHabits = data?.habits?.[selectedDate] || {};
  const { completed: todayCompleted, total: todayTotal } = getTotalCompletion(dayHabits, activeHabitIds);

  // Helpers
  function getDayOfMonth(dateStr) {
    return new Date(dateStr + 'T12:00:00').getDate();
  }

  function formatDate(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function formatDateShort(dateStr) {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function getCurrentWeek() {
    const d = new Date(selectedDate + 'T12:00:00').getDate();
    return Math.ceil(d / 7);
  }

  function getWeeklyMiles(weekNum) {
    const weekStart = (weekNum - 1) * 7;
    return february2026.slice(weekStart, weekStart + 7).reduce((sum, d) => sum + (data?.runningMiles?.[d] || 0), 0);
  }

  function getTotalMiles() {
    if (!data?.runningMiles) return 0;
    return Object.values(data.runningMiles).reduce((s, m) => s + m, 0);
  }

  function getStreak() {
    let streak = 0;
    const endIdx = february2026.indexOf(today) >= 0 ? february2026.indexOf(today) : february2026.length - 1;
    for (let i = endIdx; i >= 0; i--) {
      const d = february2026[i];
      const dh = data?.habits?.[d] || {};
      const allDone = activeHabitIds.every(id => dh[id]);
      if (allDone && activeHabitIds.length > 0) streak++;
      else break;
    }
    return streak;
  }

  function getCompletionRate() {
    const daysToCount = february2026.filter(d => d <= today);
    if (daysToCount.length === 0 || activeHabitIds.length === 0) return 0;
    let done = 0, possible = 0;
    daysToCount.forEach(d => {
      activeHabitIds.forEach(id => {
        possible++;
        if (data?.habits?.[d]?.[id]) done++;
      });
    });
    return possible > 0 ? Math.round((done / possible) * 100) : 0;
  }

  function getDayStatus(date) {
    const dh = data?.habits?.[date] || {};
    const completed = activeHabitIds.filter(id => dh[id]).length;
    if (completed === activeHabitIds.length && activeHabitIds.length > 0) return 'complete';
    if (completed > 0) return 'partial';
    return 'empty';
  }

  function hasJournalEntry(date) {
    return (data?.reflections?.[date]?.text || data?.journal?.[date] || '').trim().length > 0;
  }

  function hasIntentions(date) {
    const intent = data?.intentions?.[date];
    return intent && (intent.goals?.length > 0 || intent.notes?.trim());
  }

  // Pillar streak (consecutive days from today backwards)
  function getPillarStreak(pillarKey) {
    const pillar = PILLARS[pillarKey];
    const pillarHabitIds = pillar.habits.filter(h => activeHabitIds.includes(h.id)).map(h => h.id);
    if (pillarHabitIds.length === 0) return 0;
    let streak = 0;
    const endIdx = february2026.indexOf(today) >= 0 ? february2026.indexOf(today) : -1;
    if (endIdx < 0) return 0;
    for (let i = endIdx; i >= 0; i--) {
      const d = february2026[i];
      const dh = data?.habits?.[d] || {};
      if (pillarHabitIds.every(id => dh[id])) streak++;
      else break;
    }
    return streak;
  }

  // Pillar stats for stats view
  function getPillarStats(pillarKey) {
    const pillar = PILLARS[pillarKey];
    const daysToCount = february2026.filter(d => d <= today);
    let total = 0, done = 0;
    pillar.habits.forEach(h => {
      if (!activeHabitIds.includes(h.id)) return;
      daysToCount.forEach(d => {
        total++;
        if (data?.habits?.[d]?.[h.id]) done++;
      });
    });
    return { total, done, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  // Miles projection
  function getMilesProjection(futureDate) {
    const totalSoFar = getTotalMiles();
    const daysSoFar = february2026.filter(d => d <= today).length || 1;
    const avgPerDay = totalSoFar / daysSoFar;
    const targetDayIdx = february2026.indexOf(futureDate);
    return totalSoFar + avgPerDay * (targetDayIdx + 1 - daysSoFar);
  }

  // Reflections count for stats
  function getReflectionStats() {
    const daysToCount = february2026.filter(d => d <= today);
    let entries = 0, noteCount = 0;
    daysToCount.forEach(d => {
      if (data?.reflections?.[d]?.text || data?.journal?.[d]) entries++;
      noteCount += (data?.reflections?.[d]?.voiceNotes?.length || 0);
    });
    return { entries, noteCount };
  }

  // Render helpers
  const renderPillarHabits = (pillarKey) => {
    const pillar = PILLARS[pillarKey];
    const pillarHabits = pillar.habits.filter(h => activeHabitIds.includes(h.id));
    if (pillarHabits.length === 0 && !pillar.sections?.length) return null;

    return pillarHabits.map(habit => (
      <div key={habit.id} className="habit-item-wrapper">
        <div
          onClick={() => toggleHabit(habit.id)}
          className={`habit-item ${dayHabits[habit.id] ? 'completed' : ''} ${habit.hasInput ? 'no-click' : ''}`}
          style={dayHabits[habit.id] ? { background: `${pillar.colorAlpha}`, borderColor: pillar.borderColor } : {}}
        >
          <span className="habit-emoji">{habit.emoji}</span>
          <span className="habit-label">{habit.label}</span>
          {dayHabits[habit.id] && <span className="habit-check" style={{ color: pillar.color }}>✓</span>}
        </div>

        {habit.hasInput === 'miles' && (
          <div className="habit-input-row">
            <input type="number" step="0.1" placeholder="Miles today" value={milesInput}
              onChange={(e) => setMilesInput(e.target.value)} className="input-field" />
            <button onClick={saveMiles} className="save-btn">Save</button>
          </div>
        )}

        {habit.hasInput === 'gratitude' && (
          <div className="gratitude-inputs">
            {[0, 1, 2].map(i => (
              <input key={i} type="text" placeholder={`I'm grateful for... (${i + 1})`}
                value={gratitudeInput[i]}
                onChange={(e) => { const n = [...gratitudeInput]; n[i] = e.target.value; setGratitudeInput(n); }}
                onBlur={saveGratitude} className="input-field gratitude-input" />
            ))}
          </div>
        )}
      </div>
    ));
  };

  if (status === "loading" || !mounted || !settings || !data) {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <h1>Dad Ready</h1>
          <p>Loading...</p>
        </div>
        <style jsx>{`
          .loading-screen { min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); display: flex; align-items: center; justify-content: center; color: white; font-family: 'Inter', sans-serif; }
          .loading-content { text-align: center; }
          .loading-content h1 { font-size: 2rem; margin-bottom: 8px; }
        `}</style>
      </div>
    );
  }

  if (!session) return null;

  return (
    <>
      <Head>
        <title>Dad Ready | February 2026</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#1a1a2e" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      {/* Hidden YouTube Player */}
      <div style={{ position: 'fixed', top: -9999, left: -9999 }}>
        <div id="yt-player-container" />
      </div>

      <div className="app">
        <div className="background" />

        <header className="header">
          <div className="header-left">
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="header-avatar" referrerPolicy="no-referrer" />
            )}
            <div className="header-info">
              <span className="header-welcome">Welcome, {session?.user?.name?.split(' ')[0] || 'there'}</span>
              {pregnancyInfo && pregnancyPercent && (
                <span className="header-pregnancy">{pregnancyInfo.weeks}w {pregnancyInfo.days}d &bull; {pregnancyPercent.percent}%</span>
              )}
            </div>
          </div>
          <button onClick={() => router.push('/settings')} className="settings-btn">⚙️</button>
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
              <button key={v} onClick={() => setView(v)} className={`nav-tab ${view === v ? 'active' : ''}`}>
                {v === 'today' && '☀️ '}{v === 'calendar' && '📅 '}{v === 'stats' && '📊 '}
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </nav>

          {/* ============ TODAY VIEW ============ */}
          {view === 'today' && (
            <div className="view-content">
              <div className="day-header">
                <h2 className="day-title">{formatDate(selectedDate)}</h2>
                {todayTotal > 0 && <span className="day-progress">{todayCompleted}/{todayTotal}</span>}
              </div>

              {/* ── BODY PILLAR ── */}
              {(PILLARS.body.habits.some(h => activeHabitIds.includes(h.id))) && (
                <div className="pillar-card" style={{ borderLeftColor: PILLARS.body.borderColor }}>
                  <div className="pillar-header">
                    <span className="pillar-label" style={{ color: PILLARS.body.color }}>Body</span>
                    {(() => {
                      const { completed, total } = getPillarCompletion('body', dayHabits, activeHabitIds);
                      return total > 0 ? <span className="pillar-count" style={{ color: PILLARS.body.color }}>{completed}/{total}</span> : null;
                    })()}
                  </div>
                  <div className="habits-list">
                    {renderPillarHabits('body')}
                  </div>

                  {/* Running progress bar */}
                  {activeHabitIds.includes('running') && (
                    <div className="running-inline">
                      <div className="running-header">
                        <span className="running-label">Week {getCurrentWeek()} Running</span>
                        <span className="running-stat">{getWeeklyMiles(getCurrentWeek()).toFixed(1)} / {weeklyMileGoal} mi</span>
                      </div>
                      <div className="progress-bar-bg">
                        <div className="progress-bar-fill" style={{
                          width: `${Math.min((getWeeklyMiles(getCurrentWeek()) / weeklyMileGoal) * 100, 100)}%`,
                          background: `linear-gradient(90deg, ${PILLARS.body.color}, #16a34a)`
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MIND PILLAR ── */}
              <div className="pillar-card" style={{ borderLeftColor: PILLARS.mind.borderColor }}>
                <div className="pillar-header">
                  <span className="pillar-label" style={{ color: PILLARS.mind.color }}>Mind</span>
                </div>

                {/* Pregnancy */}
                {pregnancyInfo && pregnancyPercent && (
                  <div className="pregnancy-section">
                    {settings?.lmpDate && (
                      <div className="pregnancy-due-date">
                        Est. due {getEstimatedDueDate(settings.lmpDate, settings.cycleLength || 28)
                          .toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    )}
                    <div className="pregnancy-top-row">
                      <span className="pregnancy-week-badge">{pregnancyInfo.weeks}w {pregnancyInfo.days}d</span>
                      <div className="pregnancy-progress-wrap">
                        <div className="pregnancy-progress-bar">
                          <div className="pregnancy-progress-fill" style={{ width: `${pregnancyPercent.percent}%` }} />
                        </div>
                        <span className="pregnancy-pct">{pregnancyPercent.percent}%</span>
                      </div>
                    </div>

                    <div className="pregnancy-summary" onClick={() => setPregnancyExpanded(!pregnancyExpanded)}>
                      <span className="pregnancy-tip-preview">
                        {pregnancyExpanded ? 'Hide details' : pregnancyInfo.todaysTip}
                      </span>
                      <span className="pregnancy-toggle">{pregnancyExpanded ? '−' : '+'}</span>
                    </div>

                    {pregnancyExpanded && (
                      <div className="pregnancy-details">
                        <div className="pregnancy-detail-row">
                          <span className="detail-icon">👶</span>
                          <div><h4>Baby This Week</h4><p>{pregnancyInfo.baby}</p></div>
                        </div>
                        <div className="pregnancy-detail-row">
                          <span className="detail-icon">💜</span>
                          <div><h4>What She May Be Feeling</h4><p>{pregnancyInfo.mom}</p></div>
                        </div>
                        <div className="pregnancy-detail-row highlight">
                          <span className="detail-icon">💡</span>
                          <div><h4>Today's Support Tip</h4><p>{pregnancyInfo.todaysTip}</p></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Coach link */}
                <button onClick={() => router.push('/coach')} className="coach-btn">
                  💬 Ask the Pregnancy Coach
                  <span className="coach-arrow">→</span>
                </button>
              </div>

              {/* ── SOUL PILLAR ── */}
              <div className="pillar-card" style={{ borderLeftColor: PILLARS.soul.borderColor }}>
                <div className="pillar-header">
                  <span className="pillar-label" style={{ color: PILLARS.soul.color }}>Soul</span>
                  {(() => {
                    const { completed, total } = getPillarCompletion('soul', dayHabits, activeHabitIds);
                    return total > 0 ? <span className="pillar-count" style={{ color: PILLARS.soul.color }}>{completed}/{total}</span> : null;
                  })()}
                </div>
                <div className="habits-list">
                  {renderPillarHabits('soul')}
                </div>

                {/* Reflections */}
                <div className="reflections-section">
                  <div className="reflections-label">Reflections</div>
                  <textarea
                    placeholder="What's on your mind today? Let it flow..."
                    value={reflectionInput}
                    onChange={(e) => setReflectionInput(e.target.value)}
                    onBlur={saveReflection}
                    className="reflection-textarea"
                  />

                  <div className="reflection-actions">
                    <button onClick={toggleAudio} className={`audio-btn ${audioPlaying ? 'playing' : ''}`}>
                      🎵 {audioPlaying ? 'Pause Audio' : 'Ambient Audio'}
                    </button>
                    {typeof navigator !== 'undefined' && navigator.mediaDevices && (
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`record-btn ${isRecording ? 'recording' : ''}`}
                        disabled={transcribing}
                      >
                        {transcribing ? '⏳ Transcribing...' : isRecording ? `⏹ Stop (${recordingDuration}s)` : '🎤 Record'}
                      </button>
                    )}
                  </div>

                  {/* Voice notes */}
                  {voiceNotes.length > 0 && (
                    <div className="voice-notes-list">
                      {voiceNotes.map(note => (
                        <div key={note.id} className="voice-note-item">
                          <div className="voice-note-meta">
                            <span className="voice-note-time">
                              {new Date(note.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="voice-note-duration">{note.duration}s</span>
                            <button onClick={() => deleteVoiceNote(note.id)} className="voice-note-delete">×</button>
                          </div>
                          <p className="voice-note-transcript">"{note.transcript}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── JUST A REMINDER ── */}
              {currentReminder ? (
                <div className="reminder-card">
                  <div className="reminder-label">Just A Reminder</div>
                  <p className="reminder-text">{currentReminder}</p>
                  <button onClick={showNextReminder} className="reminder-btn">Show me another →</button>
                  {pregnancyInfo && (
                    <div className="reminder-support-tip">
                      <span className="support-tip-icon">💡</span>
                      <p className="support-tip-text">{pregnancyInfo.todaysTip}</p>
                    </div>
                  )}
                </div>
              ) : settings?.docUrls?.some(url => url.trim()) ? (
                <div className="reminder-card">
                  <div className="reminder-label">Just A Reminder</div>
                  <p className="reminder-placeholder">Ready to uncover your gold.</p>
                  <button onClick={loadRemindersFromDocs} className="action-btn" disabled={loadingReminders}>
                    {loadingReminders ? 'Loading...' : 'Extract My Reminders'}
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* ============ CALENDAR VIEW ============ */}
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
                    const hasIntent = hasIntentions(date);
                    const isFuture = date > today;
                    const isMilestoneDate = (() => {
                      if (!settings?.trackPregnancy || !settings?.lmpDate) return false;
                      const pi = getPregnancyInfoAtDate(settings.lmpDate, date, settings.cycleLength || 28);
                      return pi && pi.days === 0 && pregnancyMilestones.some(m => m.week === pi.weeks);
                    })();
                    return (
                      <button key={date}
                        onClick={() => setSelectedDate(date)}
                        className={`calendar-day ${dayStatus} ${isSelected ? 'selected' : ''} ${isFuture ? 'future' : ''}`}
                      >
                        {dayNum}
                        {hasJournal && <span className="journal-dot" />}
                        {isMilestoneDate && <span className="milestone-dot" />}
                        {hasIntent && isFuture && !isMilestoneDate && <span className="intent-dot" />}
                      </button>
                    );
                  })}
                </div>
                <div className="calendar-legend">
                  <div className="legend-item"><span className="legend-dot complete" /> All done</div>
                  <div className="legend-item"><span className="legend-dot partial" /> Partial</div>
                  <div className="legend-item"><span className="legend-dot journal" /> Notes</div>
                  <div className="legend-item"><span className="legend-dot milestone" /> Milestone</div>
                </div>
              </div>

              {/* Date detail panel */}
              {selectedDate && !isFutureDate && (
                <div className="calendar-detail card">
                  <h3 className="detail-date">{formatDate(selectedDate)}</h3>
                  <div className="detail-pillars">
                    {Object.entries(PILLARS).map(([key, pillar]) => {
                      const { completed, total } = getPillarCompletion(key, data?.habits?.[selectedDate] || {}, activeHabitIds);
                      if (total === 0 && !pillar.sections?.length) return null;
                      return (
                        <div key={key} className="detail-pillar-row">
                          <span className="detail-pillar-name" style={{ color: pillar.color }}>{pillar.label}</span>
                          {total > 0 && <span className="detail-pillar-score">{completed}/{total}</span>}
                          {key === 'mind' && pregnancyInfo && <span className="detail-pillar-score">Tip viewed</span>}
                        </div>
                      );
                    })}
                  </div>
                  {(data?.reflections?.[selectedDate]?.text || data?.journal?.[selectedDate]) && (
                    <div className="journal-preview">
                      <p className="journal-preview-text">{data.reflections?.[selectedDate]?.text || data.journal[selectedDate]}</p>
                    </div>
                  )}
                  <button onClick={() => { setView('today'); }} className="action-btn" style={{ marginTop: 12 }}>
                    View full day →
                  </button>
                </div>
              )}

              {/* Future date: Pregnancy focus */}
              {selectedDate && isFutureDate && (
                <div className="calendar-detail card">
                  <h3 className="detail-date">{formatDate(selectedDate)}</h3>

                  {/* Pregnancy info for this future date */}
                  {(() => {
                    if (!settings?.trackPregnancy || !settings?.lmpDate) return null;
                    const futurePreg = getPregnancyInfoAtDate(settings.lmpDate, selectedDate, settings.cycleLength || 28);
                    if (!futurePreg || futurePreg.weeks < 1) return null;
                    return (
                      <div className="future-pregnancy">
                        <div className="future-preg-header">
                          <span className="future-preg-badge">{futurePreg.weeks}w {futurePreg.days}d</span>
                          <span className="future-preg-trimester">Trimester {futurePreg.trimester}</span>
                        </div>
                        <div className="future-preg-info">
                          <div className="future-preg-row">
                            <span className="detail-icon">👶</span>
                            <div><h4>Baby</h4><p>{futurePreg.baby}</p></div>
                          </div>
                          <div className="future-preg-row">
                            <span className="detail-icon">💜</span>
                            <div><h4>What She May Be Feeling</h4><p>{futurePreg.mom}</p></div>
                          </div>
                        </div>
                        {futurePreg.upcomingMilestones?.length > 0 && (
                          <div className="future-milestones">
                            <h4 className="milestones-title">Key Dates Coming Up</h4>
                            {futurePreg.upcomingMilestones.map((m, i) => (
                              <div key={i} className="milestone-item">
                                <span className="milestone-emoji">{m.emoji}</span>
                                <span className="milestone-week">Week {m.week}</span>
                                <span className="milestone-label">{m.label}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* Miles projection */}
                  {activeHabitIds.includes('running') && (
                    <div className="projection-grid" style={{ marginTop: 16 }}>
                      <div className="projection-item">
                        <span className="proj-label">Est. total miles by then</span>
                        <span className="proj-value">{getMilesProjection(selectedDate).toFixed(1)} mi</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ============ STATS VIEW ============ */}
          {view === 'stats' && (
            <div className="view-content">
              {/* Overall */}
              <div className="stats-overall">
                <div className="card stat-card">
                  <div className="stat-label">Completion</div>
                  <div className="stat-value">{getCompletionRate()}%</div>
                </div>
                {PILLARS.body.habits.some(h => activeHabitIds.includes(h.id)) && (
                  <div className="card stat-card" style={{ borderBottom: `2px solid ${PILLARS.body.color}` }}>
                    <div className="stat-label">Body Streak</div>
                    <div className="stat-value">{getPillarStreak('body')}</div>
                    <div className="stat-unit">days</div>
                  </div>
                )}
                {PILLARS.soul.habits.some(h => activeHabitIds.includes(h.id)) && (
                  <div className="card stat-card" style={{ borderBottom: `2px solid ${PILLARS.soul.color}` }}>
                    <div className="stat-label">Soul Streak</div>
                    <div className="stat-value">{getPillarStreak('soul')}</div>
                    <div className="stat-unit">days</div>
                  </div>
                )}
              </div>

              {/* Body Stats */}
              <div className="pillar-stat-card" style={{ borderLeftColor: PILLARS.body.borderColor }}>
                <h3 className="pillar-stat-title" style={{ color: PILLARS.body.color }}>Body</h3>
                <div className="pillar-stat-grid">
                  {activeHabitIds.includes('running') && (
                    <div className="pstat-item">
                      <span className="pstat-label">Total Miles</span>
                      <span className="pstat-value">{getTotalMiles().toFixed(1)}</span>
                    </div>
                  )}
                  {PILLARS.body.habits.filter(h => activeHabitIds.includes(h.id)).map(h => {
                    const daysToCount = february2026.filter(d => d <= today);
                    const done = daysToCount.filter(d => data?.habits?.[d]?.[h.id]).length;
                    return (
                      <div key={h.id} className="pstat-item">
                        <span className="pstat-label">{h.emoji} {h.label.split('(')[0].trim()}</span>
                        <span className="pstat-value">{done}/{daysToCount.length} days</span>
                      </div>
                    );
                  })}
                </div>
                {activeHabitIds.includes('running') && (
                  <div className="weekly-running">
                    {[1, 2, 3, 4].map(week => (
                      <div key={week} className="weekly-row">
                        <div className="weekly-info">
                          <span className="weekly-label">Week {week}</span>
                          <span className="weekly-miles">{getWeeklyMiles(week).toFixed(1)} / {weeklyMileGoal} mi</span>
                        </div>
                        <div className="progress-bar-bg small">
                          <div className={`progress-bar-fill ${getWeeklyMiles(week) >= weeklyMileGoal ? 'complete' : ''}`}
                            style={{ width: `${Math.min((getWeeklyMiles(week) / weeklyMileGoal) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Mind Stats */}
              <div className="pillar-stat-card" style={{ borderLeftColor: PILLARS.mind.borderColor }}>
                <h3 className="pillar-stat-title" style={{ color: PILLARS.mind.color }}>Mind</h3>
                <div className="pillar-stat-grid">
                  {pregnancyInfo && pregnancyPercent && (
                    <div className="pstat-item">
                      <span className="pstat-label">Pregnancy</span>
                      <span className="pstat-value">{pregnancyInfo.weeks}w {pregnancyInfo.days}d — {pregnancyPercent.percent}%</span>
                    </div>
                  )}
                  <div className="pstat-item">
                    <span className="pstat-label">Coach conversations</span>
                    <span className="pstat-value">
                      {(() => {
                        try {
                          const convos = JSON.parse(localStorage.getItem('dadReadyCoachConversations') || '[]');
                          return convos.length;
                        } catch { return 0; }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Soul Stats */}
              <div className="pillar-stat-card" style={{ borderLeftColor: PILLARS.soul.borderColor }}>
                <h3 className="pillar-stat-title" style={{ color: PILLARS.soul.color }}>Soul</h3>
                <div className="pillar-stat-grid">
                  {PILLARS.soul.habits.filter(h => activeHabitIds.includes(h.id)).map(h => {
                    const daysToCount = february2026.filter(d => d <= today);
                    const done = daysToCount.filter(d => data?.habits?.[d]?.[h.id]).length;
                    return (
                      <div key={h.id} className="pstat-item">
                        <span className="pstat-label">{h.emoji} {h.label.split('(')[0].trim()}</span>
                        <span className="pstat-value">{done}/{daysToCount.length} days</span>
                      </div>
                    );
                  })}
                  {(() => {
                    const { entries, noteCount } = getReflectionStats();
                    return (
                      <div className="pstat-item">
                        <span className="pstat-label">📝 Reflections</span>
                        <span className="pstat-value">{entries} entries{noteCount > 0 ? `, ${noteCount} voice notes` : ''}</span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Reminders in stats */}
              {reminders.length > 0 && (
                <div className="reminder-card">
                  <div className="reminder-label">Just A Reminder ({reminders.length})</div>
                  <div className="reminders-list">
                    {reminders.slice(0, 5).map((rem, i) => (
                      <div key={i} className="reminder-list-item">
                        <span className="reminder-icon">✨</span>
                        <p>{rem}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #1a1a2e; }
        .app { min-height: 100vh; position: relative; color: #fff; }
        .background { position: fixed; inset: 0; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); z-index: -2; }
        .background::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 60%; background: linear-gradient(180deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%); }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; max-width: 680px; margin: 0 auto; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .header-avatar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); }
        .header-info { display: flex; flex-direction: column; }
        .header-welcome { font-family: 'Crimson Pro', serif; font-size: 1.1rem; font-weight: 400; color: rgba(255,255,255,0.85); }
        .header-pregnancy { font-size: 0.75rem; color: #e879f9; margin-top: 2px; }
        .settings-btn { background: rgba(255,255,255,0.08); border: none; padding: 8px 12px; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
        .settings-btn:hover { background: rgba(255,255,255,0.15); }

        .main-content { max-width: 680px; margin: 0 auto; padding: 0 24px 48px; }

        /* Quote */
        .quote-inline { text-align: center; padding: 0 8px 20px; }
        .quote-inline .quote-text { font-family: 'Crimson Pro', serif; font-size: 1.05rem; font-weight: 300; line-height: 1.5; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
        .quote-inline .quote-author { font-size: 0.75rem; color: rgba(255,255,255,0.3); }

        /* Nav */
        .nav-tabs { display: flex; gap: 6px; background: rgba(255,255,255,0.05); padding: 5px; border-radius: 14px; margin-bottom: 20px; }
        .nav-tab { flex: 1; padding: 10px 16px; border: none; border-radius: 10px; background: transparent; color: rgba(255,255,255,0.5); font-size: 0.85rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
        .nav-tab.active { background: rgba(102, 126, 234, 0.8); color: #fff; }

        /* Day Header */
        .day-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
        .day-title { font-family: 'Crimson Pro', serif; font-size: 1.3rem; font-weight: 400; color: rgba(255,255,255,0.85); }
        .day-progress { font-family: 'Crimson Pro', serif; font-size: 1.1rem; color: rgba(255,255,255,0.4); }

        /* Pillar Cards */
        .pillar-card {
          background: rgba(255,255,255,0.06); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
          border-left: 3px solid; padding: 20px; margin-bottom: 16px;
        }
        .pillar-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; }
        .pillar-label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 2px; font-weight: 600; }
        .pillar-count { font-size: 0.85rem; font-weight: 500; }

        /* Habits */
        .habits-list { display: flex; flex-direction: column; gap: 8px; }
        .habit-item { display: flex; align-items: center; gap: 14px; padding: 14px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
        .habit-item.no-click { cursor: default; }
        .habit-item:hover:not(.no-click) { background: rgba(255,255,255,0.08); }
        .habit-item.completed { border-width: 1px; }
        .habit-emoji { font-size: 1.3rem; }
        .habit-label { flex: 1; font-weight: 400; font-size: 0.9rem; color: rgba(255,255,255,0.85); }
        .habit-check { font-size: 1.1rem; font-weight: 600; }

        .habit-input-row { display: flex; gap: 10px; margin-top: 10px; }
        .input-field { flex: 1; padding: 12px 16px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.12); border-radius: 10px; color: #fff; font-size: 0.9rem; }
        .input-field:focus { outline: none; border-color: rgba(102, 126, 234, 0.5); }
        .input-field::placeholder { color: rgba(255,255,255,0.25); }
        .save-btn { padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border: none; border-radius: 10px; color: #fff; font-weight: 500; font-size: 0.85rem; cursor: pointer; }
        .save-btn.small { padding: 12px 18px; }
        .gratitude-inputs { display: flex; flex-direction: column; gap: 6px; margin-top: 10px; }
        .gratitude-input { width: 100%; }

        /* Running inline */
        .running-inline { margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); }
        .running-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .running-label { font-size: 0.75rem; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: 0.5px; }
        .running-stat { font-family: 'Crimson Pro', serif; font-size: 0.95rem; color: rgba(255,255,255,0.7); }

        .progress-bar-bg { height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; overflow: hidden; }
        .progress-bar-bg.small { height: 5px; }
        .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); border-radius: 3px; transition: width 0.3s; }
        .progress-bar-fill.complete { background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); }

        /* Pregnancy in Mind pillar */
        .pregnancy-section { margin-bottom: 14px; }
        .pregnancy-top-row { display: flex; align-items: center; gap: 14px; margin-bottom: 10px; }
        .pregnancy-due-date { font-size: 0.78rem; color: rgba(232, 121, 249, 0.7); margin-bottom: 8px; }
        .pregnancy-week-badge { font-family: 'Crimson Pro', serif; font-size: 1.1rem; font-weight: 500; color: #e879f9; white-space: nowrap; }
        .pregnancy-progress-wrap { flex: 1; display: flex; align-items: center; gap: 10px; }
        .pregnancy-progress-bar { flex: 1; height: 8px; background: rgba(232, 121, 249, 0.15); border-radius: 4px; overflow: hidden; }
        .pregnancy-progress-fill { height: 100%; background: linear-gradient(90deg, #e879f9, #a855f7); border-radius: 4px; transition: width 0.3s; }
        .pregnancy-pct { font-size: 0.8rem; color: #e879f9; font-weight: 500; white-space: nowrap; }

        .pregnancy-summary { display: flex; justify-content: space-between; align-items: center; cursor: pointer; user-select: none; padding: 8px 0; }
        .pregnancy-tip-preview { font-size: 0.85rem; color: rgba(255,255,255,0.55); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
        .pregnancy-toggle { font-size: 1.2rem; color: rgba(255,255,255,0.3); width: 28px; text-align: center; }

        .pregnancy-details { display: flex; flex-direction: column; gap: 10px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.08); animation: fadeIn 0.2s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pregnancy-detail-row { display: flex; gap: 12px; padding: 12px; background: rgba(255,255,255,0.04); border-radius: 10px; }
        .pregnancy-detail-row.highlight { background: rgba(168, 85, 247, 0.15); }
        .detail-icon { font-size: 1.2rem; flex-shrink: 0; }
        .pregnancy-detail-row h4 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
        .pregnancy-detail-row p { font-size: 0.88rem; line-height: 1.5; color: rgba(255,255,255,0.8); }

        /* Coach button */
        .coach-btn {
          width: 100%; display: flex; justify-content: space-between; align-items: center;
          padding: 14px 18px; background: rgba(167, 139, 250, 0.1);
          border: 1px solid rgba(167, 139, 250, 0.25); border-radius: 12px;
          color: rgba(255,255,255,0.8); font-size: 0.9rem; cursor: pointer; transition: all 0.2s;
        }
        .coach-btn:hover { background: rgba(167, 139, 250, 0.18); }
        .coach-arrow { color: rgba(255,255,255,0.4); }

        /* Reflections */
        .reflections-section { margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
        .reflections-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.4); margin-bottom: 10px; }
        .reflection-textarea {
          width: 100%; min-height: 120px; background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px;
          color: #fff; font-family: inherit; font-size: 0.9rem; line-height: 1.6; resize: none;
        }
        .reflection-textarea:focus { outline: none; border-color: rgba(245, 158, 11, 0.4); }
        .reflection-textarea::placeholder { color: rgba(255,255,255,0.2); }

        .reflection-actions { display: flex; gap: 8px; margin-top: 10px; }
        .audio-btn, .record-btn {
          padding: 10px 16px; border-radius: 10px; font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
          border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.7);
        }
        .audio-btn:hover, .record-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .audio-btn.playing { background: rgba(245, 158, 11, 0.15); border-color: rgba(245, 158, 11, 0.3); color: #f59e0b; }
        .record-btn.recording { background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); color: #ef4444; animation: pulse 1s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .record-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .voice-notes-list { margin-top: 12px; display: flex; flex-direction: column; gap: 8px; }
        .voice-note-item { padding: 12px; background: rgba(245, 158, 11, 0.06); border: 1px solid rgba(245, 158, 11, 0.15); border-radius: 10px; }
        .voice-note-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .voice-note-time { font-size: 0.75rem; color: rgba(255,255,255,0.4); }
        .voice-note-duration { font-size: 0.72rem; color: rgba(255,255,255,0.3); }
        .voice-note-delete { background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 1rem; margin-left: auto; }
        .voice-note-delete:hover { color: #ef4444; }
        .voice-note-transcript { font-size: 0.85rem; color: rgba(255,255,255,0.65); line-height: 1.5; font-style: italic; }

        /* Reminder card */
        .reminder-card {
          background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.2);
          border-radius: 16px; padding: 20px; margin-bottom: 16px;
        }
        .reminder-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(245, 158, 11, 0.7); margin-bottom: 12px; }
        .reminder-text { font-family: 'Crimson Pro', serif; font-size: 1.05rem; line-height: 1.6; color: rgba(255,255,255,0.85); margin-bottom: 12px; }
        .reminder-placeholder { color: rgba(255,255,255,0.4); font-size: 0.88rem; margin-bottom: 10px; }
        .reminder-btn, .action-btn {
          background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.7); padding: 8px 18px; border-radius: 8px;
          font-size: 0.82rem; cursor: pointer; transition: all 0.2s;
        }
        .reminder-btn:hover, .action-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .reminders-list { display: flex; flex-direction: column; gap: 10px; }
        .reminder-list-item { display: flex; gap: 10px; padding: 10px; background: rgba(255,255,255,0.04); border-radius: 8px; }
        .reminder-list-item p { color: rgba(255,255,255,0.7); font-size: 0.88rem; line-height: 1.5; }
        .reminder-icon { flex-shrink: 0; }

        /* Card base */
        .card { background: rgba(255,255,255,0.06); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 20px; }

        /* Calendar */
        .calendar-card { margin-bottom: 16px; }
        .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 12px; }
        .calendar-day-label { text-align: center; font-size: 0.72rem; color: rgba(255,255,255,0.35); text-transform: uppercase; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .calendar-day { aspect-ratio: 1; border: none; border-radius: 10px; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.85rem; font-weight: 500; cursor: pointer; position: relative; transition: all 0.2s; }
        .calendar-day:hover { background: rgba(255,255,255,0.12); }
        .calendar-day.selected { border: 2px solid #667eea; }
        .calendar-day.complete { background: rgba(34, 197, 94, 0.25); }
        .calendar-day.partial { background: rgba(102, 126, 234, 0.25); }
        .calendar-day.future { color: rgba(255,255,255,0.4); }
        .journal-dot { position: absolute; bottom: 4px; right: 4px; width: 5px; height: 5px; background: #f59e0b; border-radius: 50%; }
        .intent-dot { position: absolute; bottom: 4px; left: 4px; width: 5px; height: 5px; background: #a78bfa; border-radius: 50%; }
        .milestone-dot { position: absolute; top: 4px; left: 4px; width: 5px; height: 5px; background: #e879f9; border-radius: 50%; }
        .calendar-legend { display: flex; gap: 16px; justify-content: center; margin-top: 16px; flex-wrap: wrap; }
        .legend-item { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: rgba(255,255,255,0.4); }
        .legend-dot { width: 10px; height: 10px; border-radius: 3px; }
        .legend-dot.complete { background: rgba(34, 197, 94, 0.4); }
        .legend-dot.partial { background: rgba(102, 126, 234, 0.4); }
        .legend-dot.journal { width: 7px; height: 7px; background: #f59e0b; border-radius: 50%; }
        .legend-dot.milestone { width: 7px; height: 7px; background: #e879f9; border-radius: 50%; }

        /* Calendar Detail */
        .calendar-detail { margin-bottom: 16px; }
        .detail-date { font-family: 'Crimson Pro', serif; font-size: 1.2rem; font-weight: 400; margin-bottom: 16px; }
        .detail-pillars { display: flex; flex-direction: column; gap: 8px; }
        .detail-pillar-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: 8px; }
        .detail-pillar-name { font-size: 0.82rem; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .detail-pillar-score { font-size: 0.85rem; color: rgba(255,255,255,0.6); }
        .detail-section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(255,255,255,0.4); margin-bottom: 10px; }

        .journal-preview { margin-top: 14px; padding: 14px; background: rgba(245, 158, 11, 0.06); border-left: 3px solid rgba(245, 158, 11, 0.4); border-radius: 8px; }
        .journal-preview-text { color: rgba(255,255,255,0.65); font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; }

        /* Intentions (future dates) */
        .intention-goals { margin-bottom: 12px; }
        .intention-goal-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(167, 139, 250, 0.08); border-radius: 8px; margin-bottom: 6px; font-size: 0.88rem; color: rgba(255,255,255,0.8); }
        .intention-remove { background: none; border: none; color: rgba(255,255,255,0.3); cursor: pointer; font-size: 1.1rem; }
        .intention-remove:hover { color: #ef4444; }
        .intention-add-row { display: flex; gap: 8px; }
        .intention-notes { width: 100%; min-height: 60px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; color: #fff; font-family: inherit; font-size: 0.88rem; line-height: 1.5; resize: none; margin-top: 8px; }
        .intention-notes:focus { outline: none; border-color: rgba(167, 139, 250, 0.4); }
        .intention-notes::placeholder { color: rgba(255,255,255,0.2); }

        .projection-grid { display: flex; flex-direction: column; gap: 8px; }
        .projection-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: 8px; }
        .proj-label { font-size: 0.82rem; color: rgba(255,255,255,0.5); }
        .proj-value { font-family: 'Crimson Pro', serif; font-size: 1rem; color: rgba(255,255,255,0.85); }

        /* Future pregnancy */
        .future-pregnancy { margin-bottom: 12px; }
        .future-preg-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
        .future-preg-badge { font-family: 'Crimson Pro', serif; font-size: 1.1rem; font-weight: 500; color: #e879f9; }
        .future-preg-trimester { font-size: 0.78rem; color: rgba(232, 121, 249, 0.6); background: rgba(232, 121, 249, 0.1); padding: 3px 10px; border-radius: 12px; }
        .future-preg-info { display: flex; flex-direction: column; gap: 10px; }
        .future-preg-row { display: flex; gap: 12px; padding: 12px; background: rgba(255,255,255,0.04); border-radius: 10px; }
        .future-preg-row h4 { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
        .future-preg-row p { font-size: 0.85rem; color: rgba(255,255,255,0.7); line-height: 1.5; }
        .future-milestones { margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); }
        .milestones-title { font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: rgba(232, 121, 249, 0.6); margin-bottom: 10px; }
        .milestone-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 0.85rem; }
        .milestone-emoji { font-size: 1rem; }
        .milestone-week { font-weight: 600; color: #e879f9; min-width: 60px; }
        .milestone-label { color: rgba(255,255,255,0.7); }

        /* Support tip in reminder */
        .reminder-support-tip { display: flex; gap: 10px; margin-top: 16px; padding-top: 14px; border-top: 1px solid rgba(245, 158, 11, 0.15); }
        .support-tip-icon { flex-shrink: 0; font-size: 1rem; }
        .support-tip-text { font-size: 0.82rem; color: rgba(255,255,255,0.5); line-height: 1.5; margin: 0; }

        /* Stats */
        .stats-overall { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 16px; }
        .stat-card { text-align: center; padding: 24px 16px; }
        .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
        .stat-value { font-family: 'Crimson Pro', serif; font-size: 2.2rem; font-weight: 300; }
        .stat-value.large { font-size: 3rem; }
        .stat-unit { color: rgba(255,255,255,0.4); font-size: 0.8rem; margin-top: 4px; }

        .pillar-stat-card {
          background: rgba(255,255,255,0.06); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
          border-left: 3px solid; padding: 20px; margin-bottom: 16px;
        }
        .pillar-stat-title { font-family: 'Crimson Pro', serif; font-size: 1.15rem; font-weight: 400; margin-bottom: 14px; }
        .pillar-stat-grid { display: flex; flex-direction: column; gap: 8px; }
        .pstat-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.04); border-radius: 8px; }
        .pstat-label { font-size: 0.82rem; color: rgba(255,255,255,0.6); }
        .pstat-value { font-size: 0.88rem; font-weight: 500; color: rgba(255,255,255,0.85); }

        .weekly-running { margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.08); }
        .weekly-row { margin-bottom: 12px; }
        .weekly-info { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .weekly-label { color: rgba(255,255,255,0.5); font-size: 0.8rem; }
        .weekly-miles { font-weight: 500; font-size: 0.85rem; }

        @media (max-width: 600px) {
          .header { padding: 16px 16px; }
          .main-content { padding: 0 16px 32px; }
          .stats-overall { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}
