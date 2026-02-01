import { useState, useEffect } from 'react';
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import { getDailyTip } from '../lib/pregnancy';

const ALL_HABITS = [
  { id: 'running', emoji: '🏃', title: 'Running' },
  { id: 'strength', emoji: '💪', title: 'Strength Training' },
  { id: 'noSugar', emoji: '🍎', title: 'No Processed Sugar' },
  { id: 'meditation', emoji: '🧘', title: 'Meditation' },
  { id: 'gratitude', emoji: '🙏', title: 'Gratitude Practice' }
];

export default function Settings() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [remindersCount, setRemindersCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [pregnancyInfo, setPregnancyInfo] = useState(null);

  // Edit states
  const [editingHabits, setEditingHabits] = useState(false);
  const [editHabits, setEditHabits] = useState([]);
  const [editMileGoal, setEditMileGoal] = useState(35);

  const [editingPregnancy, setEditingPregnancy] = useState(false);
  const [editTrackPregnancy, setEditTrackPregnancy] = useState(true);
  const [editLmpDate, setEditLmpDate] = useState('');
  const [editCycleLength, setEditCycleLength] = useState(28);

  const [editingDocs, setEditingDocs] = useState(false);
  const [editDocUrls, setEditDocUrls] = useState(['', '', '', '', '']);

  const [editingWhy, setEditingWhy] = useState(false);
  const [editDadMeaning, setEditDadMeaning] = useState('');
  const [editDadFears, setEditDadFears] = useState('');

  const [showResetConfirm, setShowResetConfirm] = useState(false);
  // loadingReminders removed - re-extraction handled from dashboard

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem('dadReadySettings');
    if (saved) {
      const s = JSON.parse(saved);
      setSettings(s);
      if (s.trackPregnancy && s.lmpDate) {
        setPregnancyInfo(getDailyTip(s.lmpDate, s.cycleLength || 28));
      }
    } else {
      router.push('/onboarding');
      return;
    }
    const savedWins = localStorage.getItem('dadReadyReminders');
    if (savedWins) {
      setRemindersCount(JSON.parse(savedWins).length);
    }
  }, [router]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  const saveSettings = (updates) => {
    const updated = { ...settings, ...updates };
    setSettings(updated);
    localStorage.setItem('dadReadySettings', JSON.stringify(updated));
    // Recalculate pregnancy info
    if (updated.trackPregnancy && updated.lmpDate) {
      setPregnancyInfo(getDailyTip(updated.lmpDate, updated.cycleLength || 28));
    } else {
      setPregnancyInfo(null);
    }
  };

  // Habit editing
  const startEditHabits = () => {
    setEditHabits([...(settings.habits || [])]);
    setEditMileGoal(settings.weeklyMileGoal || 35);
    setEditingHabits(true);
  };
  const saveHabits = () => {
    saveSettings({ habits: editHabits, weeklyMileGoal: editMileGoal });
    setEditingHabits(false);
  };
  const toggleEditHabit = (id) => {
    setEditHabits(prev => prev.includes(id) ? prev.filter(h => h !== id) : [...prev, id]);
  };

  // Pregnancy editing
  const startEditPregnancy = () => {
    setEditTrackPregnancy(settings.trackPregnancy);
    setEditLmpDate(settings.lmpDate || '');
    setEditCycleLength(settings.cycleLength || 28);
    setEditingPregnancy(true);
  };
  const savePregnancy = () => {
    saveSettings({ trackPregnancy: editTrackPregnancy, lmpDate: editLmpDate, cycleLength: editCycleLength });
    setEditingPregnancy(false);
  };

  // Docs editing
  const startEditDocs = () => {
    const urls = [...(settings.docUrls || [])];
    while (urls.length < 5) urls.push('');
    setEditDocUrls(urls);
    setEditingDocs(true);
  };
  const saveDocs = () => {
    saveSettings({ docUrls: editDocUrls.filter(u => u.trim()) });
    setEditingDocs(false);
  };

  // Why editing
  const startEditWhy = () => {
    setEditDadMeaning(settings.dadMeaning || '');
    setEditDadFears(settings.dadFears || '');
    setEditingWhy(true);
  };
  const saveWhy = () => {
    saveSettings({ dadMeaning: editDadMeaning, dadFears: editDadFears });
    setEditingWhy(false);
  };

  const clearReminders = () => {
    localStorage.removeItem('dadReadyReminders');
    setRemindersCount(0);
  };

  const resetAllData = () => {
    localStorage.removeItem('dadReadySettings');
    localStorage.removeItem('dadReadyTracker2026');
    localStorage.removeItem('dadReadyReminders');
    router.push('/onboarding');
  };

  // Calculate challenge progress
  const getChallengeProgress = () => {
    const today = new Date();
    const start = new Date(2026, 1, 1);
    const end = new Date(2026, 1, 28);
    if (today < start) return { day: 0, remaining: 28 };
    if (today > end) return { day: 28, remaining: 0 };
    const day = Math.ceil((today - start) / (1000 * 60 * 60 * 24)) + 1;
    return { day, remaining: 28 - day };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const truncateUrl = (url) => {
    if (!url) return '';
    if (url.length > 55) return url.substring(0, 55) + '...';
    return url;
  };

  if (status === "loading" || !mounted || !settings) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (!session) return null;

  const challenge = getChallengeProgress();
  const activeHabits = ALL_HABITS.filter(h => settings.habits?.includes(h.id));
  const docCount = settings.docUrls?.length || 0;

  return (
    <>
      <Head>
        <title>Settings | Dad Ready</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="settings-page">
        <div className="background" />

        <header className="header">
          <button onClick={() => router.push('/')} className="back-btn">
            ← Back to Dashboard
          </button>
          <h1 className="page-title">Settings</h1>
          <div className="header-spacer" />
        </header>

        <main className="main">
          {/* Profile & Account */}
          <section className="card profile-card">
            <div className="profile-row">
              {session.user?.image && (
                <img src={session.user.image} alt="" className="avatar" referrerPolicy="no-referrer" />
              )}
              <div className="profile-info">
                <h2 className="profile-name">{session.user?.name}</h2>
                <p className="profile-email">{session.user?.email}</p>
                {settings.createdAt && (
                  <p className="profile-since">Member since {formatDate(settings.createdAt.split('T')[0])}</p>
                )}
              </div>
              <button onClick={() => signOut()} className="sign-out-btn">Sign Out</button>
            </div>
          </section>

          {/* My Habits */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">My Habits</h2>
              {!editingHabits && (
                <button onClick={startEditHabits} className="edit-btn">Edit</button>
              )}
            </div>

            {editingHabits ? (
              <div className="edit-section">
                <div className="habit-edit-grid">
                  {ALL_HABITS.map(h => (
                    <div
                      key={h.id}
                      className={`habit-edit-item ${editHabits.includes(h.id) ? 'selected' : ''}`}
                      onClick={() => toggleEditHabit(h.id)}
                    >
                      <span>{h.emoji}</span>
                      <span>{h.title}</span>
                      <span className={`check ${editHabits.includes(h.id) ? 'on' : ''}`}>
                        {editHabits.includes(h.id) ? '✓' : ''}
                      </span>
                    </div>
                  ))}
                </div>
                {editHabits.includes('running') && (
                  <div className="inline-field">
                    <label>Weekly mile goal</label>
                    <input
                      type="number"
                      value={editMileGoal}
                      onChange={(e) => setEditMileGoal(Number(e.target.value))}
                      min="1" max="100"
                    />
                  </div>
                )}
                <div className="edit-actions">
                  <button onClick={saveHabits} className="save-btn">Save</button>
                  <button onClick={() => setEditingHabits(false)} className="cancel-btn">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="habit-pills">
                {activeHabits.length > 0 ? activeHabits.map(h => (
                  <span key={h.id} className="habit-pill">{h.emoji} {h.title}</span>
                )) : (
                  <p className="empty-text">No habits selected</p>
                )}
                {settings.habits?.includes('running') && (
                  <p className="meta-text">Weekly goal: {settings.weeklyMileGoal || 35} miles</p>
                )}
              </div>
            )}
          </section>

          {/* Partner & Pregnancy */}
          <section className="card pregnancy-card-section">
            <div className="card-header">
              <h2 className="card-title">Partner & Pregnancy</h2>
              {!editingPregnancy && (
                <button onClick={startEditPregnancy} className="edit-btn">Edit</button>
              )}
            </div>

            {editingPregnancy ? (
              <div className="edit-section">
                <div className="toggle-row">
                  <span>Track pregnancy</span>
                  <button
                    className={`toggle-btn ${editTrackPregnancy ? 'active' : ''}`}
                    onClick={() => setEditTrackPregnancy(!editTrackPregnancy)}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>
                {editTrackPregnancy && (
                  <>
                    <div className="inline-field">
                      <label>LMP Date</label>
                      <input
                        type="date"
                        value={editLmpDate}
                        onChange={(e) => setEditLmpDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                    <div className="inline-field">
                      <label>Cycle length</label>
                      <div className="cycle-edit">
                        <input
                          type="number"
                          value={editCycleLength}
                          onChange={(e) => setEditCycleLength(Number(e.target.value))}
                          min="21" max="40"
                        />
                        <span>days</span>
                      </div>
                    </div>
                  </>
                )}
                <div className="edit-actions">
                  <button onClick={savePregnancy} className="save-btn">Save</button>
                  <button onClick={() => setEditingPregnancy(false)} className="cancel-btn">Cancel</button>
                </div>
              </div>
            ) : settings.trackPregnancy && pregnancyInfo ? (
              <div className="pregnancy-display">
                <div className="preg-stat-row">
                  <div className="preg-stat">
                    <span className="preg-stat-value">{pregnancyInfo.weeks}</span>
                    <span className="preg-stat-label">weeks, {pregnancyInfo.days} days</span>
                  </div>
                  <div className="trimester-badge">Trimester {pregnancyInfo.trimester}</div>
                </div>
                <div className="preg-details">
                  <p><strong>LMP:</strong> {formatDate(settings.lmpDate)}</p>
                  <p><strong>Cycle:</strong> {settings.cycleLength || 28} days</p>
                </div>
              </div>
            ) : (
              <p className="empty-text">Pregnancy tracking is off</p>
            )}
          </section>

          {/* Google Docs */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">My Google Docs</h2>
              {!editingDocs && (
                <button onClick={startEditDocs} className="edit-btn">Edit</button>
              )}
            </div>

            {editingDocs ? (
              <div className="edit-section">
                <div className="doc-edit-list">
                  {[0, 1, 2, 3, 4].map(i => (
                    <div key={i} className="doc-edit-row">
                      <span className="doc-num">{i + 1}</span>
                      <input
                        type="url"
                        placeholder="https://docs.google.com/document/d/..."
                        value={editDocUrls[i]}
                        onChange={(e) => {
                          const u = [...editDocUrls];
                          u[i] = e.target.value;
                          setEditDocUrls(u);
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="edit-actions">
                  <button onClick={saveDocs} className="save-btn">Save</button>
                  <button onClick={() => setEditingDocs(false)} className="cancel-btn">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="docs-display">
                {docCount > 0 ? (
                  <>
                    <p className="meta-text">{docCount} of 5 docs linked</p>
                    <div className="doc-list">
                      {settings.docUrls.map((url, i) => (
                        <div key={i} className="doc-item">
                          <span className="doc-icon">📄</span>
                          <span className="doc-url">{truncateUrl(url)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="empty-text">No docs linked yet</p>
                )}
              </div>
            )}
          </section>

          {/* My Why */}
          <section className="card why-card">
            <div className="card-header">
              <h2 className="card-title">My Why</h2>
              {!editingWhy && (
                <button onClick={startEditWhy} className="edit-btn">Edit</button>
              )}
            </div>

            {editingWhy ? (
              <div className="edit-section">
                <div className="why-edit-group">
                  <label>What does being a dad mean to you?</label>
                  <textarea
                    placeholder="Being a dad means..."
                    value={editDadMeaning}
                    onChange={(e) => setEditDadMeaning(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="why-edit-group">
                  <label>What are you most afraid of?</label>
                  <textarea
                    placeholder="I'm afraid that..."
                    value={editDadFears}
                    onChange={(e) => setEditDadFears(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="edit-actions">
                  <button onClick={saveWhy} className="save-btn">Save</button>
                  <button onClick={() => setEditingWhy(false)} className="cancel-btn">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="why-display">
                {settings.dadMeaning ? (
                  <div className="why-block">
                    <p className="why-label">What being a dad means to me</p>
                    <p className="why-text">{settings.dadMeaning}</p>
                  </div>
                ) : null}
                {settings.dadFears ? (
                  <div className="why-block">
                    <p className="why-label">What I'm afraid of</p>
                    <p className="why-text">{settings.dadFears}</p>
                  </div>
                ) : null}
                {!settings.dadMeaning && !settings.dadFears && (
                  <p className="empty-text">You haven't written your why yet. Tap edit to reflect on what drives you.</p>
                )}
              </div>
            )}
          </section>

          {/* Just A Reminder */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Just A Reminder</h2>
            </div>
            <div className="wins-display">
              <p className="wins-count">{remindersCount} reminders loaded</p>
              {remindersCount > 0 && (
                <div className="wins-actions">
                  <button onClick={clearReminders} className="action-btn secondary">Clear Reminders</button>
                </div>
              )}
            </div>
          </section>

          {/* Coach Conversations */}
          <section className="card">
            <div className="card-header">
              <h2 className="card-title">Coach Conversations</h2>
            </div>
            <div className="wins-display">
              <p className="wins-count">
                {(() => { try { return JSON.parse(localStorage.getItem('dadReadyCoachConversations') || '[]').length; } catch { return 0; } })()} conversations
              </p>
              <div className="wins-actions">
                <button onClick={() => router.push('/coach')} className="action-btn">
                  Open Coach
                </button>
                <button onClick={() => { localStorage.removeItem('dadReadyCoachConversations'); window.location.reload(); }} className="action-btn secondary">
                  Clear All Conversations
                </button>
              </div>
            </div>
          </section>

          {/* About Dad Ready */}
          <section className="card about-card">
            <h2 className="card-title">About Dad Ready</h2>
            <p className="about-text">
              Dad Ready is a 28-day personal challenge for February 2026. Built on the science of
              metabolic flourishing — the idea that when you align your daily habits with your biology,
              you don't just survive, you flourish. Every rep, every mile, every moment of gratitude
              compounds into the father you're becoming.
            </p>
            <div className="challenge-progress">
              <div className="challenge-dates">
                <span>February 1 – 28, 2026</span>
              </div>
              <div className="challenge-stats">
                <div className="challenge-stat">
                  <span className="challenge-num">{challenge.day}</span>
                  <span className="challenge-label">Day</span>
                </div>
                <div className="challenge-divider" />
                <div className="challenge-stat">
                  <span className="challenge-num">{challenge.remaining}</span>
                  <span className="challenge-label">Remaining</span>
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="card danger-card">
            <h2 className="card-title">Reset & Restart</h2>
            <div className="danger-actions">
              <div className="danger-item">
                <div>
                  <p className="danger-title">Restart Onboarding</p>
                  <p className="danger-desc">Go through the setup wizard again. Your data is preserved.</p>
                </div>
                <button onClick={() => router.push('/onboarding')} className="action-btn">
                  Restart
                </button>
              </div>
              <div className="danger-item destructive">
                <div>
                  <p className="danger-title">Reset All Data</p>
                  <p className="danger-desc">Erase all habits, tracking data, reminders, and settings. This cannot be undone.</p>
                </div>
                {showResetConfirm ? (
                  <div className="confirm-group">
                    <button onClick={resetAllData} className="action-btn destructive">Yes, Reset</button>
                    <button onClick={() => setShowResetConfirm(false)} className="action-btn secondary">Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setShowResetConfirm(true)} className="action-btn destructive">
                    Reset
                  </button>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>

      <style jsx>{`
        .settings-page {
          min-height: 100vh;
          position: relative;
          font-family: 'Inter', -apple-system, sans-serif;
          color: #fff;
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
          height: 60%;
          background: linear-gradient(180deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%);
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 720px;
          margin: 0 auto;
          padding: 28px 24px 0;
        }

        .back-btn {
          background: none;
          border: none;
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
          cursor: pointer;
          padding: 8px 0;
          transition: color 0.2s;
        }
        .back-btn:hover { color: #fff; }

        .page-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.8rem;
          font-weight: 400;
        }

        .header-spacer { width: 140px; }

        .main {
          max-width: 720px;
          margin: 0 auto;
          padding: 32px 24px 60px;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Card */
        .card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 20px;
          padding: 24px;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .card-title {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 400;
          margin: 0;
        }

        .edit-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.15);
          color: rgba(255,255,255,0.7);
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .edit-btn:hover {
          background: rgba(255,255,255,0.15);
          color: #fff;
        }

        /* Profile */
        .profile-card {
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
          border-color: rgba(102, 126, 234, 0.25);
        }

        .profile-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.2);
        }

        .profile-info { flex: 1; }

        .profile-name {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.4rem;
          font-weight: 400;
          margin: 0 0 2px 0;
        }

        .profile-email {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
          margin: 0 0 2px 0;
        }

        .profile-since {
          color: rgba(255,255,255,0.35);
          font-size: 0.78rem;
          margin: 0;
        }

        .sign-out-btn {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          color: rgba(255,255,255,0.7);
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 0.82rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .sign-out-btn:hover { background: rgba(255,255,255,0.15); color: #fff; }

        /* Habit pills */
        .habit-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .habit-pill {
          background: rgba(102, 126, 234, 0.2);
          border: 1px solid rgba(102, 126, 234, 0.3);
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 0.85rem;
        }

        .meta-text {
          color: rgba(255,255,255,0.45);
          font-size: 0.82rem;
          margin-top: 10px;
          width: 100%;
        }

        .empty-text {
          color: rgba(255,255,255,0.4);
          font-size: 0.9rem;
          font-style: italic;
          margin: 0;
        }

        /* Edit section */
        .edit-section {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .habit-edit-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .habit-edit-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
        }
        .habit-edit-item:hover { background: rgba(255,255,255,0.08); }
        .habit-edit-item.selected {
          background: rgba(102, 126, 234, 0.15);
          border-color: rgba(102, 126, 234, 0.4);
        }
        .habit-edit-item .check {
          margin-left: auto;
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          transition: all 0.2s;
        }
        .habit-edit-item .check.on {
          background: #667eea;
          border-color: #667eea;
          color: #fff;
        }

        .inline-field {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .inline-field label {
          color: rgba(255,255,255,0.6);
          font-size: 0.88rem;
          white-space: nowrap;
        }

        .inline-field input[type="number"],
        .inline-field input[type="date"] {
          padding: 10px 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          width: 100px;
        }

        .inline-field input[type="date"] {
          width: auto;
          max-width: 200px;
        }

        .inline-field input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }

        .cycle-edit {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .cycle-edit input {
          padding: 10px 14px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 8px;
          color: #fff;
          font-size: 0.9rem;
          width: 80px;
          text-align: center;
        }

        .cycle-edit span {
          color: rgba(255,255,255,0.5);
          font-size: 0.88rem;
        }

        .edit-actions {
          display: flex;
          gap: 10px;
        }

        .save-btn {
          padding: 10px 24px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }
        .save-btn:hover { box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4); }

        .cancel-btn {
          padding: 10px 24px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 10px;
          color: rgba(255,255,255,0.6);
          font-size: 0.88rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .cancel-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }

        /* Toggle */
        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .toggle-row > span {
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
        }

        .toggle-btn {
          width: 48px;
          height: 28px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 14px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
        }
        .toggle-btn.active { background: #667eea; }

        .toggle-knob {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 22px;
          height: 22px;
          background: white;
          border-radius: 50%;
          transition: all 0.2s;
        }
        .toggle-btn.active .toggle-knob { left: 23px; }

        /* Pregnancy display */
        .pregnancy-display {}

        .preg-stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .preg-stat { display: flex; align-items: baseline; gap: 8px; }

        .preg-stat-value {
          font-family: 'Crimson Pro', serif;
          font-size: 2.2rem;
          font-weight: 300;
          color: #e879f9;
        }

        .preg-stat-label {
          color: rgba(255,255,255,0.5);
          font-size: 0.9rem;
        }

        .trimester-badge {
          background: rgba(168, 85, 247, 0.3);
          padding: 5px 14px;
          border-radius: 16px;
          font-size: 0.78rem;
          color: #e879f9;
        }

        .preg-details p {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
          margin: 4px 0;
        }
        .preg-details strong { color: rgba(255,255,255,0.7); }

        .pregnancy-card-section {
          border-color: rgba(168, 85, 247, 0.2);
        }

        /* Docs display */
        .doc-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 10px;
        }

        .doc-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          background: rgba(255,255,255,0.04);
          border-radius: 8px;
        }

        .doc-icon { font-size: 1rem; }

        .doc-url {
          color: rgba(255,255,255,0.55);
          font-size: 0.82rem;
          font-family: monospace;
        }

        .doc-edit-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .doc-edit-row {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .doc-num {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255,255,255,0.08);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }

        .doc-edit-row input {
          flex: 1;
          padding: 10px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 10px;
          color: #fff;
          font-size: 0.85rem;
        }
        .doc-edit-row input:focus {
          outline: none;
          border-color: #667eea;
        }
        .doc-edit-row input::placeholder { color: rgba(255,255,255,0.25); }

        /* Why */
        .why-card {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.05) 100%);
          border-color: rgba(245, 158, 11, 0.2);
        }

        .why-display {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .why-block {}

        .why-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.4);
          margin: 0 0 6px 0;
        }

        .why-text {
          color: rgba(255,255,255,0.85);
          font-size: 0.95rem;
          line-height: 1.6;
          margin: 0;
        }

        .why-edit-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .why-edit-group label {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.7);
        }

        .why-edit-group textarea {
          width: 100%;
          padding: 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: #fff;
          font-family: inherit;
          font-size: 0.9rem;
          line-height: 1.6;
          resize: none;
        }
        .why-edit-group textarea:focus {
          outline: none;
          border-color: rgba(102, 126, 234, 0.5);
        }
        .why-edit-group textarea::placeholder { color: rgba(255,255,255,0.25); }

        /* Wins */
        .wins-display {}

        .wins-count {
          font-family: 'Crimson Pro', serif;
          font-size: 1.1rem;
          color: rgba(255,255,255,0.7);
          margin: 0 0 12px 0;
        }

        .wins-actions {
          display: flex;
          gap: 10px;
        }

        .action-btn {
          padding: 10px 20px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 10px;
          color: #fff;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        .action-btn:hover:not(:disabled) { background: rgba(255,255,255,0.15); }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .action-btn.secondary { color: rgba(255,255,255,0.6); border-color: rgba(255,255,255,0.1); }
        .action-btn.destructive {
          background: rgba(239, 68, 68, 0.15);
          border-color: rgba(239, 68, 68, 0.3);
          color: #f87171;
        }
        .action-btn.destructive:hover { background: rgba(239, 68, 68, 0.25); }

        /* About */
        .about-card {}

        .about-card .card-title { margin-bottom: 12px; }

        .about-text {
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
          line-height: 1.7;
          margin: 0 0 20px 0;
        }

        .challenge-progress {
          background: rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 20px;
        }

        .challenge-dates {
          text-align: center;
          margin-bottom: 16px;
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
        }

        .challenge-stats {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 32px;
        }

        .challenge-stat { text-align: center; }

        .challenge-num {
          display: block;
          font-family: 'Crimson Pro', serif;
          font-size: 2.5rem;
          font-weight: 300;
          color: #667eea;
        }

        .challenge-label {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 1px;
          color: rgba(255,255,255,0.4);
        }

        .challenge-divider {
          width: 1px;
          height: 40px;
          background: rgba(255,255,255,0.15);
        }

        /* Danger zone */
        .danger-card {
          border-color: rgba(255,255,255,0.08);
        }

        .danger-card .card-title { margin-bottom: 16px; }

        .danger-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .danger-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: rgba(255,255,255,0.03);
          border-radius: 12px;
        }

        .danger-item.destructive {
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .danger-title {
          font-weight: 500;
          font-size: 0.9rem;
          margin: 0 0 4px 0;
        }

        .danger-desc {
          color: rgba(255,255,255,0.45);
          font-size: 0.8rem;
          margin: 0;
        }

        .confirm-group {
          display: flex;
          gap: 8px;
        }

        @media (max-width: 600px) {
          .header { padding: 20px 16px 0; }
          .main { padding: 24px 16px 48px; }
          .page-title { font-size: 1.4rem; }
          .header-spacer { display: none; }
          .profile-row { flex-wrap: wrap; }
          .sign-out-btn { width: 100%; text-align: center; margin-top: 8px; }
          .danger-item { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </>
  );
}
