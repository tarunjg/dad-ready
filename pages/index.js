import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from 'next/head';
import { getQuoteByDay } from '../lib/quotes';
import { getDailyTip, getPregnancyPercentage, getEstimatedDueDate, getPregnancyInfoAtDate, pregnancyMilestones, getWeeklyAction } from '../lib/pregnancy';
import { PILLARS, getAllHabits, getTotalCompletion, getPillarCompletion, migrateSettings } from '../lib/pillars';

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ytPlayerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Core state
  const [settings, setSettings] = useState(null);
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    if (typeof window === 'undefined') return '2026-02-01';
    const today = new Date().toISOString().split('T')[0];
    return today;
  });
  const [view, setView] = useState('today');
  const [mounted, setMounted] = useState(false);

  // Inputs
  const [gratitudeInput, setGratitudeInput] = useState(['', '', '']);
  const [milesInput, setMilesInput] = useState('');

  // Pregnancy
  const [pregnancyInfo, setPregnancyInfo] = useState(null);
  const [pregnancyPercent, setPregnancyPercent] = useState(null);
  const [pregnancyExpanded, setPregnancyExpanded] = useState(false);

  // Weekly action
  const [weeklyActionDone, setWeeklyActionDone] = useState(false);

  // Reminders (formerly wins)
  const [reminders, setReminders] = useState([]);
  const [currentReminder, setCurrentReminder] = useState(null);
  const [loadingReminders, setLoadingReminders] = useState(false);

  // Audio
  const [audioPlaying, setAudioPlaying] = useState(false);

  // Save confirmations
  const [savedSection, setSavedSection] = useState(null);
  const savedTimerRef = useRef(null);
  const flashSaved = (section) => {
    setSavedSection(section);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => setSavedSection(null), 2000);
  };

  // Coach state
  const [coachOpen, setCoachOpen] = useState(false);
  const [coachConversations, setCoachConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [coachInput, setCoachInput] = useState('');
  const [coachSending, setCoachSending] = useState(false);
  const [showCoachThreads, setShowCoachThreads] = useState(false);
  const [coachImageAttachments, setCoachImageAttachments] = useState([]);

  // Coach voice recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  // Milestones sidebar checkboxes
  const [checkedMilestones, setCheckedMilestones] = useState(new Set());

  // Calendar month navigation
  const [calendarMonth, setCalendarMonth] = useState(1); // February = 1 (0-indexed)
  const [calendarYear, setCalendarYear] = useState(2026);

  const today = typeof window !== 'undefined' ? new Date().toISOString().split('T')[0] : '2026-02-01';

  // Generate days for any month
  function getMonthDays(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(year, month, i + 1);
      return date.toISOString().split('T')[0];
    });
  }

  // All February days (for stats/streaks that still reference Feb)
  const february2026 = getMonthDays(2026, 1);

  // All days from Feb to current calendar month for broader stat calculations
  function getAllDaysUpToToday() {
    const days = [];
    for (let m = 1; m <= 5; m++) { // Feb through Jun
      const monthDays = getMonthDays(2026, m);
      days.push(...monthDays.filter(d => d <= today));
    }
    return days;
  }

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

        // Load weekly action state
        const actionKey = `dadReadyWeeklyAction_${info.weeks}`;
        setWeeklyActionDone(localStorage.getItem(actionKey) === 'true');
      }

      // Load reminders
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

    // Load coach conversations
    const savedConvos = localStorage.getItem('dadReadyCoachConversations');
    if (savedConvos) {
      const parsed = JSON.parse(savedConvos);
      setCoachConversations(parsed);
      if (parsed.length > 0) setActiveConversationId(parsed[0].id);
    }

    // Load checked milestones
    const savedChecked = localStorage.getItem('dadReadyCheckedMilestones');
    if (savedChecked) setCheckedMilestones(new Set(JSON.parse(savedChecked)));

    // Check if opened with ?coach=open
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('coach') === 'open') {
      setCoachOpen(true);
    }
  }, [router]);

  // Persist data
  useEffect(() => {
    if (mounted && data) {
      localStorage.setItem('dadReadyTracker2026', JSON.stringify(data));
    }
  }, [data, mounted]);

  // Persist coach conversations
  useEffect(() => {
    if (mounted && coachConversations.length > 0) {
      localStorage.setItem('dadReadyCoachConversations', JSON.stringify(coachConversations));
    }
  }, [coachConversations, mounted]);

  // Load date-specific inputs
  useEffect(() => {
    if (!data) return;
    setGratitudeInput(data.gratitude?.[selectedDate] || ['', '', '']);
    setMilesInput(data.runningMiles?.[selectedDate]?.toString() || '');
  }, [selectedDate, data]);

  // Scroll coach messages
  useEffect(() => {
    if (coachOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [coachConversations, activeConversationId, coachOpen]);

  // YouTube IFrame API
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const createPlayer = () => {
      if (ytPlayerRef.current) return;
      ytPlayerRef.current = new window.YT.Player('yt-player-container', {
        videoId: 'A4ZK0vt8GQU',
        playerVars: { autoplay: 0, loop: 1, playlist: 'A4ZK0vt8GQU', origin: window.location.origin },
        events: {
          onReady: () => { console.log('YT player ready'); },
          onError: (e) => { console.error('YT player error:', e.data); }
        }
      });
    };
    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
      window.onYouTubeIframeAPIReady = createPlayer;
    }
  }, []);

  // Time-of-day background
  const [timeOfDay, setTimeOfDay] = useState('night');
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) setTimeOfDay('morning');
    else if (hour >= 11 && hour < 17) setTimeOfDay('day');
    else if (hour >= 17 && hour < 21) setTimeOfDay('evening');
    else setTimeOfDay('night');
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
    flashSaved('miles');
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
    flashSaved('gratitude');
  };

  // Weekly action toggle
  const toggleWeeklyAction = () => {
    const newVal = !weeklyActionDone;
    setWeeklyActionDone(newVal);
    if (pregnancyInfo) {
      localStorage.setItem(`dadReadyWeeklyAction_${pregnancyInfo.weeks}`, newVal.toString());
    }
  };

  // Milestone checkbox toggle
  const toggleMilestone = (milestoneKey) => {
    setCheckedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(milestoneKey)) next.delete(milestoneKey);
      else next.add(milestoneKey);
      localStorage.setItem('dadReadyCheckedMilestones', JSON.stringify([...next]));
      return next;
    });
  };

  // Audio controls
  const toggleAudio = () => {
    if (!ytPlayerRef.current || typeof ytPlayerRef.current.playVideo !== 'function') {
      window.open('https://www.youtube.com/watch?v=A4ZK0vt8GQU', '_blank');
      return;
    }
    if (audioPlaying) {
      ytPlayerRef.current.pauseVideo();
    } else {
      ytPlayerRef.current.playVideo();
    }
    setAudioPlaying(!audioPlaying);
  };

  // ── Coach Functions ──
  const activeConversation = coachConversations.find(c => c.id === activeConversationId);

  const createNewConversation = () => {
    const newConvo = {
      id: Date.now().toString(),
      title: 'New conversation',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    setCoachConversations(prev => [newConvo, ...prev]);
    setActiveConversationId(newConvo.id);
    setShowCoachThreads(false);
  };

  const deleteConversation = (id) => {
    setCoachConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      if (activeConversationId === id) {
        setActiveConversationId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const handleCoachImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => setCoachImageAttachments(prev => [...prev, reader.result]);
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const sendCoachMessage = async () => {
    if ((!coachInput.trim() && coachImageAttachments.length === 0) || coachSending) return;
    let convoId = activeConversationId;
    if (!convoId) {
      const newConvo = {
        id: Date.now().toString(),
        title: 'New conversation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: []
      };
      setCoachConversations(prev => [newConvo, ...prev]);
      convoId = newConvo.id;
      setActiveConversationId(convoId);
    }

    const userMessage = {
      role: 'user',
      content: coachInput,
      images: coachImageAttachments.length > 0 ? coachImageAttachments : undefined,
      timestamp: new Date().toISOString()
    };

    setCoachConversations(prev => prev.map(c => {
      if (c.id === convoId) {
        return { ...c, messages: [...c.messages, userMessage], updatedAt: new Date().toISOString() };
      }
      return c;
    }));

    const currentInput = coachInput;
    setCoachInput('');
    setCoachImageAttachments([]);
    setCoachSending(true);

    try {
      const currentConvo = coachConversations.find(c => c.id === convoId);
      const allMessages = [...(currentConvo?.messages || []), userMessage];
      const recentMessages = allMessages.slice(-20);

      const pregnancyContext = pregnancyInfo ? { weeks: pregnancyInfo.weeks, days: pregnancyInfo.days, trimester: pregnancyInfo.trimester } : null;

      const res = await fetch('/api/coach-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentMessages.map(m => ({ role: m.role, content: m.content, images: m.images })),
          pregnancyContext
        })
      });

      if (res.ok) {
        const { reply } = await res.json();
        const assistantMessage = { role: 'assistant', content: reply, timestamp: new Date().toISOString() };
        setCoachConversations(prev => prev.map(c => {
          if (c.id === convoId) {
            const updated = { ...c, messages: [...c.messages, assistantMessage], updatedAt: new Date().toISOString() };
            if (c.messages.length <= 1 && c.title === 'New conversation') {
              updated.title = currentInput.slice(0, 40) + (currentInput.length > 40 ? '...' : '');
            }
            return updated;
          }
          return c;
        }));
      } else {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        alert('Coach error: ' + err.error);
      }
    } catch (err) {
      console.error('Coach chat error:', err);
      alert('Failed to reach the coach. Please try again.');
    }
    setCoachSending(false);
  };

  // Voice recording for coach
  const blobToBase64 = (blob) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };

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
        setRecordingDuration(0);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const base64 = await blobToBase64(blob);
        setTranscribing(true);
        try {
          const res = await fetch('/api/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio: base64.split(',')[1] })
          });
          if (res.ok) {
            const { text } = await res.json();
            setCoachInput(prev => prev ? `${prev} ${text}` : text);
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
      recordingTimerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
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

  // Reminders
  const loadRemindersFromDocs = async () => {
    if (!settings?.docUrls?.length) return;
    setLoadingReminders(true);
    const allReminders = [];
    for (const url of settings.docUrls) {
      if (!url.trim()) continue;
      try {
        const docRes = await fetch('/api/fetch-doc', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ docUrl: url }) });
        if (!docRes.ok) continue;
        const docData = await docRes.json();
        const remRes = await fetch('/api/extract-wins', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: docData.content, title: docData.title }) });
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

  function getCurrentWeek() {
    const d = new Date(selectedDate + 'T12:00:00').getDate();
    return Math.ceil(d / 7);
  }

  function getWeeklyMiles(weekNum, monthDays) {
    const days = monthDays || february2026;
    const weekStart = (weekNum - 1) * 7;
    return days.slice(weekStart, weekStart + 7).reduce((sum, d) => sum + (data?.runningMiles?.[d] || 0), 0);
  }

  function getTotalMiles() {
    if (!data?.runningMiles) return 0;
    return Object.values(data.runningMiles).reduce((s, m) => s + m, 0);
  }

  function getStreak() {
    const allDays = getAllDaysUpToToday();
    let streak = 0;
    for (let i = allDays.length - 1; i >= 0; i--) {
      const d = allDays[i];
      const dh = data?.habits?.[d] || {};
      const allDone = activeHabitIds.every(id => dh[id]);
      if (allDone && activeHabitIds.length > 0) streak++;
      else break;
    }
    return streak;
  }

  function getCompletionRate() {
    const allDays = getAllDaysUpToToday();
    if (allDays.length === 0 || activeHabitIds.length === 0) return 0;
    let done = 0, possible = 0;
    allDays.forEach(d => {
      activeHabitIds.forEach(id => { possible++; if (data?.habits?.[d]?.[id]) done++; });
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

  // Pillar streak
  function getPillarStreak(pillarKey) {
    const pillar = PILLARS[pillarKey];
    const pillarHabitIds = pillar.habits.filter(h => activeHabitIds.includes(h.id)).map(h => h.id);
    if (pillarHabitIds.length === 0) return 0;
    const allDays = getAllDaysUpToToday();
    let streak = 0;
    for (let i = allDays.length - 1; i >= 0; i--) {
      const d = allDays[i];
      const dh = data?.habits?.[d] || {};
      if (pillarHabitIds.every(id => dh[id])) streak++;
      else break;
    }
    return streak;
  }

  function getPillarStats(pillarKey) {
    const pillar = PILLARS[pillarKey];
    const allDays = getAllDaysUpToToday();
    let total = 0, done = 0;
    pillar.habits.forEach(h => {
      if (!activeHabitIds.includes(h.id)) return;
      allDays.forEach(d => { total++; if (data?.habits?.[d]?.[h.id]) done++; });
    });
    return { total, done, rate: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  // Get milestones for a given month
  function getMonthMilestones(year, month) {
    if (!settings?.lmpDate) return [];
    const lmp = new Date(settings.lmpDate);
    const cycleLength = settings.cycleLength || 28;
    const ovulationDay = cycleLength - 14;
    const adjustment = ovulationDay - 14;
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);

    return pregnancyMilestones.map(m => {
      const milestoneDate = new Date(lmp);
      milestoneDate.setDate(milestoneDate.getDate() + (m.week * 7) + adjustment);
      return { ...m, date: milestoneDate };
    }).filter(m => m.date >= monthStart && m.date <= monthEnd);
  }

  // Calendar month name
  function getMonthName(year, month) {
    return new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  // Navigate calendar
  function prevMonth() {
    if (calendarMonth === 1 && calendarYear === 2026) return; // Don't go before Feb 2026
    if (calendarMonth === 0) { setCalendarMonth(11); setCalendarYear(calendarYear - 1); }
    else setCalendarMonth(calendarMonth - 1);
  }
  function nextMonth() {
    if (calendarMonth === 5 && calendarYear === 2026) return; // Don't go past Jun 2026
    if (calendarMonth === 11) { setCalendarMonth(0); setCalendarYear(calendarYear + 1); }
    else setCalendarMonth(calendarMonth + 1);
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
          {dayHabits[habit.id] && <span className="habit-check" style={{ color: pillar.color }}>&#10003;</span>}
        </div>

        {habit.hasInput === 'miles' && (
          <div className="habit-input-row">
            <input type="number" step="0.1" placeholder="Miles today" value={milesInput}
              onChange={(e) => setMilesInput(e.target.value)} className="input-field" />
            <button onClick={saveMiles} className="save-btn">Save</button>
            {savedSection === 'miles' && <span className="saved-flash">Saved &#10003;</span>}
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
            <div className="gratitude-save-row">
              <button onClick={saveGratitude} className="save-btn small">Save</button>
              {savedSection === 'gratitude' && <span className="saved-flash">Saved &#10003;</span>}
            </div>
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

  // Get current month milestones for sidebar
  const currentMonthMilestones = getMonthMilestones(2026, new Date().getMonth());
  const weeklyAction = settings?.lmpDate ? getWeeklyAction(settings.lmpDate, settings.cycleLength || 28) : null;

  return (
    <>
      <Head>
        <title>Dad Ready</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="theme-color" content="#1a1a2e" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      {/* Hidden YouTube Player */}
      <div style={{ position: 'fixed', top: -9999, left: -9999 }}>
        <div id="yt-player-container" />
      </div>

      <div className="app">
        <div className={`background ${timeOfDay}`} />

        <header className="header">
          <div className="header-left">
            {session?.user?.image && (
              <img src={session.user.image} alt="" className="header-avatar" referrerPolicy="no-referrer" />
            )}
            <div className="header-info">
              <span className="header-welcome">Welcome, {session?.user?.name?.split(' ')[0] || 'there'}</span>
              <span className="header-tagline">Let's Lock In Your Inner Game</span>
            </div>
          </div>
          <div className="header-right">
            <button onClick={toggleAudio} className={`audio-toggle ${audioPlaying ? 'playing' : ''}`}>
              {audioPlaying ? '🔊' : '🔇'}
            </button>
            <button onClick={() => router.push('/settings')} className="settings-btn">&#9881;&#65039;</button>
          </div>
        </header>

        <div className="layout-wrapper">
          {/* ── MAIN CONTENT ── */}
          <main className="main-content">
            {/* Inline Quote */}
            <div className="quote-inline">
              <p className="quote-text">"{todayQuote.text}"</p>
              <p className="quote-author">&mdash; {todayQuote.author}</p>
            </div>

            {/* Navigation */}
            <nav className="nav-tabs">
              {['today', 'calendar', 'stats'].map(v => (
                <button key={v} onClick={() => setView(v)} className={`nav-tab ${view === v ? 'active' : ''}`}>
                  {v === 'today' && '\u2600\uFE0F '}{v === 'calendar' && '\uD83D\uDCC5 '}{v === 'stats' && '\uD83D\uDCCA '}
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
                          Your Partner Is Due {getEstimatedDueDate(settings.lmpDate, settings.cycleLength || 28)
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
                        <span className="pregnancy-toggle">{pregnancyExpanded ? '\u2212' : '+'}</span>
                      </div>

                      {pregnancyExpanded && (
                        <div className="pregnancy-details">
                          <div className="pregnancy-detail-row">
                            <span className="detail-icon">{'\uD83D\uDC76'}</span>
                            <div><h4>Baby This Week</h4><p>{pregnancyInfo.baby}</p></div>
                          </div>
                          <div className="pregnancy-detail-row">
                            <span className="detail-icon">{'\uD83D\uDC9C'}</span>
                            <div><h4>What She May Be Feeling</h4><p>{pregnancyInfo.mom}</p></div>
                          </div>
                          <div className="pregnancy-detail-row highlight">
                            <span className="detail-icon">{'\uD83D\uDCA1'}</span>
                            <div><h4>Today's Support Tip</h4><p>{pregnancyInfo.todaysTip}</p></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Weekly Action Checkbox */}
                  {weeklyAction && (
                    <div className="weekly-action-card">
                      <div className="weekly-action-header">
                        <span className="weekly-action-label">{'\uD83C\uDFAF'} This Week's Action</span>
                      </div>
                      <div className="weekly-action-item" onClick={toggleWeeklyAction}>
                        <span className={`weekly-action-check ${weeklyActionDone ? 'done' : ''}`}>
                          {weeklyActionDone ? '\u2705' : '\u2B1C'}
                        </span>
                        <span className={`weekly-action-text ${weeklyActionDone ? 'done' : ''}`}>
                          {weeklyAction.emoji} {weeklyAction.text}
                        </span>
                      </div>
                    </div>
                  )}
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
                </div>

                {/* ── JUST A REMINDER ── */}
                {currentReminder ? (
                  <div className="reminder-card">
                    <div className="reminder-label">Just A Reminder</div>
                    <p className="reminder-text">{currentReminder}</p>
                    <button onClick={showNextReminder} className="reminder-btn">Show me another &rarr;</button>
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
                  <div className="calendar-nav">
                    <button onClick={prevMonth} className="cal-nav-btn" disabled={calendarMonth === 1 && calendarYear === 2026}>&larr;</button>
                    <h3 className="cal-month-title">{getMonthName(calendarYear, calendarMonth)}</h3>
                    <button onClick={nextMonth} className="cal-nav-btn" disabled={calendarMonth === 5 && calendarYear === 2026}>&rarr;</button>
                  </div>
                  <div className="calendar-header">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => (
                      <div key={i} className="calendar-day-label">{d}</div>
                    ))}
                  </div>
                  <div className="calendar-grid">
                    {/* Empty cells for first day offset */}
                    {Array.from({ length: new Date(calendarYear, calendarMonth, 1).getDay() }, (_, i) => (
                      <div key={`empty-${i}`} className="calendar-day-empty" />
                    ))}
                    {getMonthDays(calendarYear, calendarMonth).map(date => {
                      const dayStatus = getDayStatus(date);
                      const isSelected = date === selectedDate;
                      const dayNum = getDayOfMonth(date);
                      const hasJournal = hasJournalEntry(date);
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
                {selectedDate && selectedDate <= today && (
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
                          </div>
                        );
                      })}
                    </div>
                    {(data?.reflections?.[selectedDate]?.text || data?.journal?.[selectedDate]) && (
                      <div className="journal-preview">
                        <p className="journal-preview-text">{data.reflections?.[selectedDate]?.text || data.journal[selectedDate]}</p>
                      </div>
                    )}
                    <button onClick={() => setView('today')} className="action-btn" style={{ marginTop: 12 }}>
                      View full day &rarr;
                    </button>
                  </div>
                )}

                {/* Future date: Pregnancy focus */}
                {selectedDate && selectedDate > today && (
                  <div className="calendar-detail card">
                    <h3 className="detail-date">{formatDate(selectedDate)}</h3>
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
                              <span className="detail-icon">{'\uD83D\uDC76'}</span>
                              <div><h4>Baby</h4><p>{futurePreg.baby}</p></div>
                            </div>
                            <div className="future-preg-row">
                              <span className="detail-icon">{'\uD83D\uDC9C'}</span>
                              <div><h4>What She May Be Feeling</h4><p>{futurePreg.mom}</p></div>
                            </div>
                          </div>
                          {futurePreg.upcomingMilestones?.length > 0 && (
                            <div className="future-milestones">
                              <h4 className="milestones-title">Key Dates Coming Up</h4>
                              {futurePreg.upcomingMilestones.map((m, i) => (
                                <div key={i} className="future-milestone-detail">
                                  <div className="milestone-item">
                                    <span className="milestone-emoji">{m.emoji}</span>
                                    <span className="milestone-week">Week {m.week}</span>
                                    <span className="milestone-label">{m.label}</span>
                                  </div>
                                  {m.description && <p className="milestone-description">{m.description}</p>}
                                  {m.couple && (
                                    <div className="milestone-couple">
                                      <span className="milestone-couple-icon">{'\uD83D\uDC6B'}</span>
                                      <p className="milestone-couple-text">{m.couple}</p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* ============ STATS VIEW ============ */}
            {view === 'stats' && (
              <div className="view-content">
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
                      const allDays = getAllDaysUpToToday();
                      const done = allDays.filter(d => data?.habits?.[d]?.[h.id]).length;
                      return (
                        <div key={h.id} className="pstat-item">
                          <span className="pstat-label">{h.emoji} {h.label.split('(')[0].trim()}</span>
                          <span className="pstat-value">{done}/{allDays.length} days</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mind Stats */}
                <div className="pillar-stat-card" style={{ borderLeftColor: PILLARS.mind.borderColor }}>
                  <h3 className="pillar-stat-title" style={{ color: PILLARS.mind.color }}>Mind</h3>
                  <div className="pillar-stat-grid">
                    {pregnancyInfo && pregnancyPercent && (
                      <div className="pstat-item">
                        <span className="pstat-label">Pregnancy</span>
                        <span className="pstat-value">{pregnancyInfo.weeks}w {pregnancyInfo.days}d &mdash; {pregnancyPercent.percent}%</span>
                      </div>
                    )}
                    <div className="pstat-item">
                      <span className="pstat-label">Coach conversations</span>
                      <span className="pstat-value">{coachConversations.length}</span>
                    </div>
                  </div>
                </div>

                {/* Soul Stats */}
                <div className="pillar-stat-card" style={{ borderLeftColor: PILLARS.soul.borderColor }}>
                  <h3 className="pillar-stat-title" style={{ color: PILLARS.soul.color }}>Soul</h3>
                  <div className="pillar-stat-grid">
                    {PILLARS.soul.habits.filter(h => activeHabitIds.includes(h.id)).map(h => {
                      const allDays = getAllDaysUpToToday();
                      const done = allDays.filter(d => data?.habits?.[d]?.[h.id]).length;
                      return (
                        <div key={h.id} className="pstat-item">
                          <span className="pstat-label">{h.emoji} {h.label.split('(')[0].trim()}</span>
                          <span className="pstat-value">{done}/{allDays.length} days</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Reminders in stats */}
                {reminders.length > 0 && (
                  <div className="reminder-card">
                    <div className="reminder-label">Just A Reminder ({reminders.length})</div>
                    <div className="reminders-list">
                      {reminders.slice(0, 5).map((rem, i) => (
                        <div key={i} className="reminder-list-item">
                          <span className="reminder-icon">{'\u2728'}</span>
                          <p>{rem}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>

          {/* ── RIGHT SIDEBAR: This Month ── */}
          {view === 'today' && pregnancyInfo && settings?.lmpDate && (
            <aside className="sidebar-right">
              <div className="sidebar-card">
                <div className="sidebar-title">This Month</div>
                {(() => {
                  const milestones = currentMonthMilestones;
                  return milestones.length > 0 ? (
                    <div className="sidebar-milestones">
                      {milestones.map((m, i) => {
                        const key = `${m.week}-${m.label}`;
                        const checked = checkedMilestones.has(key);
                        return (
                          <div key={i} className={`sidebar-milestone-item ${checked ? 'checked' : ''}`} onClick={() => toggleMilestone(key)}>
                            <span className="sidebar-check">{checked ? '\u2705' : '\u2B1C'}</span>
                            <div className="sidebar-milestone-info">
                              <span className="sidebar-milestone-date">
                                {m.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                              <span className="sidebar-milestone-label">{m.emoji} {m.label}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="sidebar-empty">No major milestones this month &mdash; keep showing up.</p>
                  );
                })()}
                <div className="sidebar-tip">
                  <span>{'\uD83D\uDCA1'}</span>
                  <p>{pregnancyInfo.todaysTip}</p>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* ── FLOATING COACH BUTTON ── */}
        <button className={`coach-fab ${coachOpen ? 'hidden' : ''}`} onClick={() => setCoachOpen(true)}>
          <span className="coach-fab-avatar">{'\uD83E\uDDD4'}</span>
          <span className="coach-fab-label">Coach</span>
        </button>

        {/* ── COACH DRAWER ── */}
        {coachOpen && (
          <>
            <div className="coach-overlay" onClick={() => setCoachOpen(false)} />
            <div className="coach-drawer">
              <div className="coach-drawer-header">
                <div className="coach-drawer-title-row">
                  <span className="coach-drawer-avatar">{'\uD83E\uDDD4'}</span>
                  <h3>Your Coach</h3>
                </div>
                <div className="coach-drawer-actions">
                  <button onClick={() => setShowCoachThreads(!showCoachThreads)} className="coach-threads-btn">
                    {showCoachThreads ? 'Chat' : 'Threads'}
                  </button>
                  <button onClick={createNewConversation} className="coach-new-btn">+</button>
                  <button onClick={() => setCoachOpen(false)} className="coach-close-btn">&times;</button>
                </div>
              </div>

              {showCoachThreads ? (
                <div className="coach-thread-list">
                  {coachConversations.map(c => (
                    <div key={c.id}
                      className={`coach-thread-item ${c.id === activeConversationId ? 'active' : ''}`}
                      onClick={() => { setActiveConversationId(c.id); setShowCoachThreads(false); }}
                    >
                      <span className="coach-thread-title">{c.title}</span>
                      <div className="coach-thread-meta">
                        <span>{new Date(c.updatedAt).toLocaleDateString()}</span>
                        <button onClick={(e) => { e.stopPropagation(); deleteConversation(c.id); }} className="coach-thread-delete">&times;</button>
                      </div>
                    </div>
                  ))}
                  {coachConversations.length === 0 && (
                    <p className="coach-empty">No conversations yet. Start one!</p>
                  )}
                </div>
              ) : (
                <>
                  <div className="coach-messages">
                    {!activeConversation || activeConversation.messages.length === 0 ? (
                      <div className="coach-welcome">
                        <p>Ask anything about pregnancy, supporting your partner, or what to expect. Drop a voice note or type a message.</p>
                        {pregnancyInfo && (
                          <p className="coach-context">Week {pregnancyInfo.weeks}, Day {pregnancyInfo.days} &mdash; the coach knows.</p>
                        )}
                      </div>
                    ) : (
                      activeConversation.messages.map((msg, i) => (
                        <div key={i} className={`coach-msg ${msg.role}`}>
                          {msg.images && msg.images.length > 0 && (
                            <div className="coach-msg-images">
                              {msg.images.map((img, j) => (
                                <img key={j} src={img} alt="Uploaded" className="coach-msg-image" />
                              ))}
                            </div>
                          )}
                          <div className="coach-msg-content">{msg.content}</div>
                          <div className="coach-msg-time">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ))
                    )}
                    {coachSending && (
                      <div className="coach-msg assistant">
                        <div className="typing-indicator"><span /><span /><span /></div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Coach image preview */}
                  {coachImageAttachments.length > 0 && (
                    <div className="coach-img-preview">
                      {coachImageAttachments.map((img, i) => (
                        <div key={i} className="coach-img-thumb">
                          <img src={img} alt="Preview" />
                          <button onClick={() => setCoachImageAttachments(prev => prev.filter((_, idx) => idx !== i))} className="coach-img-remove">&times;</button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="coach-input-area">
                    <button onClick={() => fileInputRef.current?.click()} className="coach-attach-btn">{'\uD83D\uDCCE'}</button>
                    <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleCoachImageUpload} style={{ display: 'none' }} />

                    {typeof navigator !== 'undefined' && navigator.mediaDevices && (
                      <button
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`coach-voice-btn ${isRecording ? 'recording' : ''}`}
                        disabled={transcribing}
                      >
                        {transcribing ? '\u23F3' : isRecording ? `\u23F9 ${recordingDuration}s` : '\uD83C\uDF99\uFE0F'}
                      </button>
                    )}

                    <textarea
                      placeholder="Ask the coach anything..."
                      value={coachInput}
                      onChange={(e) => setCoachInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCoachMessage(); } }}
                      className="coach-text-input"
                      rows={1}
                    />
                    <button onClick={sendCoachMessage} disabled={coachSending || (!coachInput.trim() && coachImageAttachments.length === 0)} className="coach-send-btn">
                      {coachSending ? '...' : '\u2192'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', -apple-system, sans-serif; background: #1a1a2e; }
        .app { min-height: 100vh; position: relative; color: #fff; }
        .background { position: fixed; inset: 0; z-index: -2; transition: background 1s ease; }
        .background.night { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); }
        .background.night::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 60%; background: linear-gradient(180deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%); }
        .background.morning { background: linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 30%, #4a2040 60%, #c0584f 85%, #e8956a 100%); }
        .background.morning::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 60%; background: linear-gradient(180deg, rgba(232, 149, 106, 0.2) 0%, transparent 100%); }
        .background.day { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); }
        .background.day::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 60%; background: linear-gradient(180deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%); }
        .background.evening { background: linear-gradient(135deg, #1a1a2e 0%, #2d1b3d 30%, #3d1f4e 50%, #7b3f5e 75%, #c46050 100%); }
        .background.evening::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 60%; background: linear-gradient(180deg, rgba(196, 96, 80, 0.2) 0%, transparent 100%); }

        /* Header */
        .header { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; max-width: 960px; margin: 0 auto; }
        .header-left { display: flex; align-items: center; gap: 12px; }
        .header-avatar { width: 40px; height: 40px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.15); }
        .header-info { display: flex; flex-direction: column; }
        .header-welcome { font-family: 'Crimson Pro', serif; font-size: 1.1rem; font-weight: 400; color: rgba(255,255,255,0.85); }
        .header-tagline { font-size: 0.78rem; color: #e879f9; margin-top: 2px; font-weight: 500; letter-spacing: 0.5px; }
        .header-right { display: flex; align-items: center; gap: 8px; }
        .audio-toggle { background: rgba(255,255,255,0.08); border: none; padding: 8px 12px; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
        .audio-toggle.playing { background: rgba(245, 158, 11, 0.15); }
        .audio-toggle:hover { background: rgba(255,255,255,0.15); }
        .settings-btn { background: rgba(255,255,255,0.08); border: none; padding: 8px 12px; border-radius: 10px; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
        .settings-btn:hover { background: rgba(255,255,255,0.15); }

        /* Layout */
        .layout-wrapper { display: flex; max-width: 960px; margin: 0 auto; gap: 24px; padding: 0 24px 48px; }
        .main-content { flex: 1; min-width: 0; max-width: 640px; }
        .sidebar-right { width: 260px; flex-shrink: 0; position: sticky; top: 20px; align-self: flex-start; }

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

        .habit-input-row { display: flex; gap: 10px; margin-top: 10px; align-items: center; }
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

        /* Weekly Action */
        .weekly-action-card {
          margin-top: 14px; padding: 16px; background: rgba(167, 139, 250, 0.08);
          border: 1px solid rgba(167, 139, 250, 0.2); border-radius: 12px;
        }
        .weekly-action-header { margin-bottom: 10px; }
        .weekly-action-label { font-size: 0.78rem; font-weight: 600; color: rgba(167, 139, 250, 0.8); text-transform: uppercase; letter-spacing: 1px; }
        .weekly-action-item { display: flex; align-items: center; gap: 12px; cursor: pointer; padding: 8px 0; user-select: none; }
        .weekly-action-check { font-size: 1.2rem; flex-shrink: 0; }
        .weekly-action-text { font-size: 0.92rem; color: rgba(255,255,255,0.85); line-height: 1.4; }
        .weekly-action-text.done { text-decoration: line-through; color: rgba(255,255,255,0.4); }

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
        .calendar-nav { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
        .cal-nav-btn { background: rgba(255,255,255,0.08); border: none; padding: 8px 14px; border-radius: 8px; color: rgba(255,255,255,0.7); font-size: 1rem; cursor: pointer; transition: background 0.2s; }
        .cal-nav-btn:hover { background: rgba(255,255,255,0.15); }
        .cal-nav-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .cal-month-title { font-family: 'Crimson Pro', serif; font-size: 1.2rem; font-weight: 400; color: rgba(255,255,255,0.85); }
        .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; margin-bottom: 12px; }
        .calendar-day-label { text-align: center; font-size: 0.72rem; color: rgba(255,255,255,0.35); text-transform: uppercase; }
        .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .calendar-day-empty { aspect-ratio: 1; }
        .calendar-day { aspect-ratio: 1; border: none; border-radius: 10px; background: rgba(255,255,255,0.05); color: #fff; font-size: 0.85rem; font-weight: 500; cursor: pointer; position: relative; transition: all 0.2s; }
        .calendar-day:hover { background: rgba(255,255,255,0.12); }
        .calendar-day.selected { border: 2px solid #667eea; }
        .calendar-day.complete { background: rgba(34, 197, 94, 0.25); }
        .calendar-day.partial { background: rgba(102, 126, 234, 0.25); }
        .calendar-day.future { color: rgba(255,255,255,0.4); }
        .journal-dot { position: absolute; bottom: 4px; right: 4px; width: 5px; height: 5px; background: #f59e0b; border-radius: 50%; }
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
        .journal-preview { margin-top: 14px; padding: 14px; background: rgba(245, 158, 11, 0.06); border-left: 3px solid rgba(245, 158, 11, 0.4); border-radius: 8px; }
        .journal-preview-text { color: rgba(255,255,255,0.65); font-size: 0.85rem; line-height: 1.5; white-space: pre-wrap; }

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
        .future-milestone-detail { padding: 14px; background: rgba(232, 121, 249, 0.06); border-radius: 10px; margin-bottom: 10px; }
        .future-milestone-detail .milestone-item { padding: 0 0 8px 0; }
        .milestone-description { font-size: 0.85rem; color: rgba(255,255,255,0.6); line-height: 1.6; margin-bottom: 10px; }
        .milestone-couple { display: flex; gap: 10px; padding: 12px; background: rgba(232, 121, 249, 0.08); border-radius: 10px; }
        .milestone-couple-icon { font-size: 1rem; flex-shrink: 0; }
        .milestone-couple-text { font-size: 0.82rem; color: rgba(255,255,255,0.7); line-height: 1.5; margin: 0; font-style: italic; }

        /* Save confirmation flash */
        .saved-flash { color: #22c55e; font-size: 0.78rem; font-weight: 500; animation: flashIn 0.3s ease; }
        @keyframes flashIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .gratitude-save-row { display: flex; align-items: center; gap: 10px; margin-top: 8px; }

        /* Sidebar */
        .sidebar-card {
          background: rgba(255,255,255,0.06); backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.08); border-left: 3px solid rgba(232, 121, 249, 0.4);
          border-radius: 16px; padding: 18px;
        }
        .sidebar-title { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 1.5px; color: rgba(232, 121, 249, 0.7); margin-bottom: 14px; font-weight: 600; }
        .sidebar-milestones { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
        .sidebar-milestone-item {
          display: flex; align-items: flex-start; gap: 10px; padding: 10px;
          background: rgba(255,255,255,0.04); border-radius: 10px; cursor: pointer;
          transition: all 0.2s; user-select: none;
        }
        .sidebar-milestone-item:hover { background: rgba(255,255,255,0.08); }
        .sidebar-milestone-item.checked { opacity: 0.6; }
        .sidebar-check { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
        .sidebar-milestone-info { display: flex; flex-direction: column; gap: 2px; }
        .sidebar-milestone-date { font-size: 0.72rem; color: #e879f9; font-weight: 500; }
        .sidebar-milestone-label { font-size: 0.82rem; color: rgba(255,255,255,0.8); }
        .sidebar-empty { font-size: 0.82rem; color: rgba(255,255,255,0.4); font-style: italic; margin-bottom: 14px; }
        .sidebar-tip { display: flex; gap: 8px; padding-top: 12px; border-top: 1px solid rgba(232, 121, 249, 0.15); }
        .sidebar-tip p { font-size: 0.78rem; color: rgba(255,255,255,0.5); line-height: 1.4; margin: 0; }

        /* Stats */
        .stats-overall { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 12px; margin-bottom: 16px; }
        .stat-card { text-align: center; padding: 24px 16px; }
        .stat-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); margin-bottom: 8px; }
        .stat-value { font-family: 'Crimson Pro', serif; font-size: 2.2rem; font-weight: 300; }
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

        /* Floating Coach Button */
        .coach-fab {
          position: fixed; bottom: 24px; left: 24px; z-index: 50;
          display: flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none; border-radius: 28px; padding: 12px 20px;
          color: #fff; cursor: pointer; box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
          transition: all 0.3s; font-size: 0.88rem; font-weight: 500;
        }
        .coach-fab:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5); }
        .coach-fab.hidden { display: none; }
        .coach-fab-avatar { font-size: 1.3rem; }
        .coach-fab-label { font-size: 0.82rem; }

        /* Coach Overlay */
        .coach-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 98; }

        /* Coach Drawer */
        .coach-drawer {
          position: fixed; left: 0; top: 0; bottom: 0; width: 380px;
          background: rgba(15, 15, 30, 0.98); backdrop-filter: blur(20px);
          border-right: 1px solid rgba(255,255,255,0.1);
          z-index: 100; display: flex; flex-direction: column;
          animation: slideIn 0.3s ease;
        }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }

        .coach-drawer-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 16px 18px; border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .coach-drawer-title-row { display: flex; align-items: center; gap: 10px; }
        .coach-drawer-avatar { font-size: 1.5rem; }
        .coach-drawer-title-row h3 { font-family: 'Crimson Pro', serif; font-size: 1.15rem; font-weight: 400; color: #a78bfa; }
        .coach-drawer-actions { display: flex; gap: 6px; }
        .coach-threads-btn, .coach-new-btn, .coach-close-btn {
          background: rgba(255,255,255,0.08); border: none; padding: 6px 12px;
          border-radius: 8px; color: rgba(255,255,255,0.6); font-size: 0.78rem; cursor: pointer;
        }
        .coach-close-btn { font-size: 1.2rem; padding: 4px 10px; }
        .coach-threads-btn:hover, .coach-new-btn:hover, .coach-close-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

        /* Coach Threads */
        .coach-thread-list { flex: 1; overflow-y: auto; padding: 12px; }
        .coach-thread-item {
          padding: 12px; border-radius: 10px; cursor: pointer; margin-bottom: 4px;
          transition: background 0.2s;
        }
        .coach-thread-item:hover { background: rgba(255,255,255,0.08); }
        .coach-thread-item.active { background: rgba(102, 126, 234, 0.2); }
        .coach-thread-title { font-size: 0.85rem; color: rgba(255,255,255,0.85); display: block; margin-bottom: 4px; }
        .coach-thread-meta { display: flex; justify-content: space-between; align-items: center; }
        .coach-thread-meta span { font-size: 0.72rem; color: rgba(255,255,255,0.3); }
        .coach-thread-delete { background: none; border: none; color: rgba(255,255,255,0.2); cursor: pointer; font-size: 1rem; }
        .coach-thread-delete:hover { color: #ef4444; }
        .coach-empty { text-align: center; color: rgba(255,255,255,0.3); font-size: 0.85rem; padding: 20px; }

        /* Coach Messages */
        .coach-messages { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
        .coach-welcome { text-align: center; margin: auto; max-width: 300px; padding: 30px 16px; }
        .coach-welcome p { color: rgba(255,255,255,0.5); font-size: 0.85rem; line-height: 1.5; }
        .coach-context { margin-top: 8px; color: #a78bfa; font-size: 0.78rem; }

        .coach-msg { max-width: 85%; padding: 12px 16px; border-radius: 14px; }
        .coach-msg.user {
          align-self: flex-end; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-bottom-right-radius: 4px;
        }
        .coach-msg.assistant {
          align-self: flex-start; background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.1); border-bottom-left-radius: 4px;
        }
        .coach-msg-content { font-size: 0.85rem; line-height: 1.6; white-space: pre-wrap; }
        .coach-msg-time { font-size: 0.65rem; color: rgba(255,255,255,0.35); margin-top: 4px; }
        .coach-msg-images { display: flex; gap: 6px; margin-bottom: 6px; flex-wrap: wrap; }
        .coach-msg-image { max-width: 150px; max-height: 150px; border-radius: 8px; object-fit: cover; }

        .typing-indicator { display: flex; gap: 6px; padding: 4px 0; }
        .typing-indicator span {
          width: 8px; height: 8px; background: rgba(255,255,255,0.4); border-radius: 50%;
          animation: typingBounce 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typingBounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }

        /* Coach Image Preview */
        .coach-img-preview { display: flex; gap: 6px; padding: 6px 16px; border-top: 1px solid rgba(255,255,255,0.08); }
        .coach-img-thumb { position: relative; }
        .coach-img-thumb img { width: 50px; height: 50px; border-radius: 8px; object-fit: cover; }
        .coach-img-remove {
          position: absolute; top: -4px; right: -4px; width: 18px; height: 18px;
          background: #ef4444; border: none; border-radius: 50%; color: #fff;
          font-size: 0.65rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
        }

        /* Coach Input */
        .coach-input-area {
          display: flex; align-items: flex-end; gap: 6px;
          padding: 12px 16px; border-top: 1px solid rgba(255,255,255,0.08);
        }
        .coach-attach-btn, .coach-voice-btn {
          background: rgba(255,255,255,0.08); border: none; padding: 10px;
          border-radius: 10px; font-size: 1rem; cursor: pointer; flex-shrink: 0;
          color: rgba(255,255,255,0.6);
        }
        .coach-attach-btn:hover, .coach-voice-btn:hover { background: rgba(255,255,255,0.12); }
        .coach-voice-btn.recording { background: rgba(239, 68, 68, 0.15); color: #ef4444; animation: pulse 1s infinite; }
        .coach-voice-btn:disabled { opacity: 0.5; cursor: not-allowed; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        .coach-text-input {
          flex: 1; padding: 10px 14px; background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12); border-radius: 10px;
          color: #fff; font-family: inherit; font-size: 0.85rem; resize: none;
          max-height: 100px; min-height: 40px;
        }
        .coach-text-input:focus { outline: none; border-color: rgba(167, 139, 250, 0.5); }
        .coach-text-input::placeholder { color: rgba(255,255,255,0.25); }
        .coach-send-btn {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none; padding: 10px 16px; border-radius: 10px;
          color: #fff; font-size: 0.95rem; font-weight: 600; cursor: pointer; flex-shrink: 0;
        }
        .coach-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

        @media (max-width: 768px) {
          .layout-wrapper { flex-direction: column; padding: 0 16px 32px; }
          .sidebar-right { width: 100%; position: static; order: 10; margin-top: 16px; }
          .header { padding: 16px 16px; }
          .main-content { max-width: 100%; }
          .stats-overall { grid-template-columns: 1fr; }
          .coach-drawer { width: 100%; }
          .coach-fab { bottom: 16px; left: 16px; }
        }
      `}</style>
    </>
  );
}
