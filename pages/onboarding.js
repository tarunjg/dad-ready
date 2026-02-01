import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";

const HABITS_INFO = [
  {
    id: 'noSugar',
    emoji: '🍎',
    title: 'No Processed Sugar',
    description: 'Eliminate processed sugar to reduce inflammation, stabilize energy, and sharpen mental clarity.',
    science: 'Cutting processed sugar reduces inflammation markers by up to 40% and stabilizes blood glucose, improving focus and mood.'
  },
  {
    id: 'running',
    emoji: '🏃',
    title: 'Running',
    description: 'Build cardiovascular endurance and unlock the mental benefits of sustained aerobic exercise.',
    science: 'Just 30 minutes of running increases BDNF (brain-derived neurotrophic factor) by 30%, enhancing neuroplasticity.'
  },
  {
    id: 'strength',
    emoji: '💪',
    title: 'Strength Training',
    description: 'Build lean muscle mass, boost metabolism, and increase functional strength for daily life.',
    science: 'Resistance training increases resting metabolic rate by 7% and improves insulin sensitivity for up to 48 hours.'
  },
  {
    id: 'meditation',
    emoji: '🧘',
    title: 'Meditation',
    description: 'Cultivate mental clarity, reduce stress, and build emotional resilience.',
    science: '20 minutes of daily meditation reduces cortisol by 23% and increases gray matter density in 8 weeks.'
  },
  {
    id: 'gratitude',
    emoji: '🙏',
    title: 'Gratitude Practice',
    description: 'Rewire your brain for positivity and strengthen your sense of wellbeing.',
    science: 'Gratitude journaling increases dopamine and serotonin production, improving sleep quality by 25%.'
  }
];

const STEP_LABELS = ['Welcome', 'Habits', 'Partner', 'Reminders', 'Your Why'];

export default function Onboarding() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedHabits, setSelectedHabits] = useState([]);
  const [docUrls, setDocUrls] = useState(['', '', '', '', '']);
  const [weeklyMileGoal, setWeeklyMileGoal] = useState(35);
  const [lmpDate, setLmpDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [trackPregnancy, setTrackPregnancy] = useState(true);
  const [dadMeaning, setDadMeaning] = useState('');
  const [dadFears, setDadFears] = useState('');
  const [direction, setDirection] = useState('forward');

  // Load existing settings if returning
  useEffect(() => {
    const saved = localStorage.getItem('dadReadySettings');
    if (saved) {
      const s = JSON.parse(saved);
      if (s.habits) setSelectedHabits(s.habits);
      if (s.docUrls) {
        const urls = [...s.docUrls];
        while (urls.length < 5) urls.push('');
        setDocUrls(urls);
      }
      if (s.weeklyMileGoal) setWeeklyMileGoal(s.weeklyMileGoal);
      if (s.lmpDate) setLmpDate(s.lmpDate);
      if (s.cycleLength) setCycleLength(s.cycleLength);
      if (s.trackPregnancy !== undefined) setTrackPregnancy(s.trackPregnancy);
      if (s.dadMeaning) setDadMeaning(s.dadMeaning);
      if (s.dadFears) setDadFears(s.dadFears);
    }
  }, []);

  if (status === "loading") {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#fff', fontFamily: "'Inter', sans-serif" }}>
        Loading...
      </div>
    );
  }

  if (!session) {
    router.push("/login");
    return null;
  }

  const goTo = (nextStep) => {
    setDirection(nextStep > step ? 'forward' : 'backward');
    setStep(nextStep);
  };

  const toggleHabit = (habitId) => {
    setSelectedHabits(prev =>
      prev.includes(habitId)
        ? prev.filter(h => h !== habitId)
        : [...prev, habitId]
    );
  };

  const handleDocUrlChange = (index, value) => {
    const newUrls = [...docUrls];
    newUrls[index] = value;
    setDocUrls(newUrls);
  };

  const completeOnboarding = () => {
    const existing = localStorage.getItem('dadReadySettings');
    const prev = existing ? JSON.parse(existing) : {};
    const settings = {
      ...prev,
      habits: selectedHabits,
      weeklyMileGoal: weeklyMileGoal,
      docUrls: docUrls.filter(url => url.trim() !== ''),
      trackPregnancy: trackPregnancy,
      lmpDate: lmpDate,
      cycleLength: cycleLength,
      dadMeaning: dadMeaning,
      dadFears: dadFears,
      onboardingComplete: true,
      createdAt: prev.createdAt || new Date().toISOString()
    };
    localStorage.setItem('dadReadySettings', JSON.stringify(settings));
    router.push('/');
  };

  const firstName = session.user?.name?.split(' ')[0] || 'there';

  return (
    <>
      <Head>
        <title>Welcome | Dad Ready</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="onboarding">
        <div className="background" />

        {/* Step Indicator */}
        <div className="stepper">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === step;
            const isComplete = stepNum < step;
            return (
              <div key={label} className={`stepper-item ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}>
                <div className="stepper-dot">
                  {isComplete ? '✓' : stepNum}
                </div>
                <span className="stepper-label">{label}</span>
                {i < STEP_LABELS.length - 1 && <div className="stepper-line" />}
              </div>
            );
          })}
        </div>

        <div className="content">
          {/* Step 1: Welcome */}
          {step === 1 && (
            <div className="step-content" key="step1">
              <div className="welcome-header">
                <h1>Welcome, {firstName}</h1>
                <p className="subtitle">
                  Getting ready for fatherhood means building yourself up — mind, body, and soul.
                  This is your 28-day challenge to become the dad you want to be.
                </p>
              </div>

              <div className="welcome-card">
                <h2>What is Dad Ready?</h2>
                <p>
                  Dad Ready is a personal challenge for February 2026. It's built around three pillars —
                  Body, Mind, and Soul — because the best dads take care of all of themselves.
                  The physical habits, the mental preparation, the inner reflection — they all compound
                  into the father you're becoming.
                </p>

                <div className="benefits-grid">
                  <div className="benefit">
                    <span>💪</span>
                    <div>
                      <strong>Body</strong>
                      <p>Build physical strength, endurance, and energy through daily habits</p>
                    </div>
                  </div>
                  <div className="benefit">
                    <span>🧠</span>
                    <div>
                      <strong>Mind</strong>
                      <p>Stay informed on your partner's pregnancy and prepare mentally for fatherhood</p>
                    </div>
                  </div>
                  <div className="benefit">
                    <span>🧘</span>
                    <div>
                      <strong>Soul</strong>
                      <p>Cultivate gratitude, reflection, and the emotional resilience your family needs</p>
                    </div>
                  </div>
                </div>

                <div className="how-it-works">
                  <h3>Here's how it works</h3>
                  <div className="how-steps">
                    <div className="how-step">
                      <span className="how-num">1</span>
                      <p>Choose the Body and Soul habits you want to build</p>
                    </div>
                    <div className="how-step">
                      <span className="how-num">2</span>
                      <p>Set up pregnancy tracking to support your partner's journey</p>
                    </div>
                    <div className="how-step">
                      <span className="how-num">3</span>
                      <p>Connect your journals to surface reminders of your gold</p>
                    </div>
                    <div className="how-step">
                      <span className="how-num">4</span>
                      <p>Reflect on your why — the soul behind the mission</p>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={() => goTo(2)} className="primary-btn">
                Let's Get Started
              </button>
            </div>
          )}

          {/* Step 2: Habit Selection */}
          {step === 2 && (
            <div className="step-content" key="step2">
              <div className="step-header">
                <h1>Choose Your Habits</h1>
                <p>Select the practices you want to track this February. You can always change these later in settings.</p>
              </div>

              <div className="habits-selection">
                {HABITS_INFO.map(habit => (
                  <div
                    key={habit.id}
                    className={`habit-card ${selectedHabits.includes(habit.id) ? 'selected' : ''}`}
                    onClick={() => toggleHabit(habit.id)}
                  >
                    <div className="habit-header">
                      <span className="habit-emoji">{habit.emoji}</span>
                      <div className="habit-title-area">
                        <h3>{habit.title}</h3>
                        <p>{habit.description}</p>
                      </div>
                      <div className={`habit-checkbox ${selectedHabits.includes(habit.id) ? 'checked' : ''}`}>
                        {selectedHabits.includes(habit.id) && '✓'}
                      </div>
                    </div>
                    <div className="habit-science">
                      <span>📊</span> {habit.science}
                    </div>
                  </div>
                ))}
              </div>

              {selectedHabits.includes('running') && (
                <div className="mile-goal-section">
                  <label>Weekly Running Goal (miles)</label>
                  <input
                    type="number"
                    value={weeklyMileGoal}
                    onChange={(e) => setWeeklyMileGoal(Number(e.target.value))}
                    min="1"
                    max="100"
                  />
                </div>
              )}

              <div className="step-buttons">
                <button onClick={() => goTo(1)} className="secondary-btn">Back</button>
                <button
                  onClick={() => goTo(3)}
                  className="primary-btn"
                  disabled={selectedHabits.length === 0}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Partner Support */}
          {step === 3 && (
            <div className="step-content" key="step3">
              <div className="step-header">
                <h1>Partner Support</h1>
                <p>
                  Get daily insights on what your partner might be experiencing and how you can support her through pregnancy.
                </p>
              </div>

              <div className="glass-card">
                <div className="toggle-row">
                  <div className="toggle-info">
                    <h3>Enable Pregnancy Tracking</h3>
                    <p>We'll show you daily tips based on her stage of pregnancy</p>
                  </div>
                  <button
                    className={`toggle-btn ${trackPregnancy ? 'active' : ''}`}
                    onClick={() => setTrackPregnancy(!trackPregnancy)}
                  >
                    <span className="toggle-knob" />
                  </button>
                </div>

                {trackPregnancy && (
                  <div className="pregnancy-inputs">
                    <div className="input-group">
                      <label>Her Last Menstrual Period (LMP)</label>
                      <p className="input-help">The first day of her last period, or your best estimate</p>
                      <input
                        type="date"
                        value={lmpDate}
                        onChange={(e) => setLmpDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="input-group">
                      <label>Average Cycle Length</label>
                      <p className="input-help">Typical is 28 days, but can range from 21-35 days</p>
                      <div className="cycle-input">
                        <input
                          type="number"
                          value={cycleLength}
                          onChange={(e) => setCycleLength(Number(e.target.value))}
                          min="21"
                          max="40"
                        />
                        <span>days</span>
                      </div>
                    </div>

                    <div className="privacy-note">
                      🔒 This information stays on your device and is never shared.
                    </div>
                  </div>
                )}
              </div>

              <div className="step-buttons">
                <button onClick={() => goTo(2)} className="secondary-btn">Back</button>
                <button
                  onClick={() => goTo(4)}
                  className="primary-btn"
                  disabled={trackPregnancy && !lmpDate}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Journal Docs */}
          {step === 4 && (
            <div className="step-content" key="step4">
              <div className="step-header">
                <h1>Just A Reminder</h1>
                <p>
                  Share your past journals or reflections, and we'll surface reminders of your gold — moments where your character shone through.
                </p>
              </div>

              <div className="glass-card">
                <div className="docs-intro">
                  <h3>Add Google Docs (Optional)</h3>
                  <p>
                    Paste links to Google Docs containing your journal entries, reflections, or notes.
                    We'll extract the moments you've been great, overcome challenges, or experienced gratitude.
                  </p>
                  <div className="privacy-note">
                    🔒 Your docs stay private. We only read them to uncover your reminders.
                  </div>
                </div>

                <div className="doc-inputs">
                  {[0, 1, 2, 3, 4].map(index => (
                    <div key={index} className="doc-input-row">
                      <span className="doc-number">{index + 1}</span>
                      <input
                        type="url"
                        placeholder="https://docs.google.com/document/d/..."
                        value={docUrls[index]}
                        onChange={(e) => handleDocUrlChange(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="step-buttons">
                <button onClick={() => goTo(3)} className="secondary-btn">Back</button>
                <button onClick={() => goTo(5)} className="primary-btn">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Your Why */}
          {step === 5 && (
            <div className="step-content" key="step5">
              <div className="step-header">
                <h1>One Last Thing — Your Why</h1>
                <p>
                  This is optional, but powerful. Understanding what drives you helps us show you the right words at the right time.
                </p>
              </div>

              <div className="glass-card">
                <div className="why-section">
                  <div className="why-group">
                    <label>What does being a dad mean to you?</label>
                    <textarea
                      placeholder="Being a dad means..."
                      value={dadMeaning}
                      onChange={(e) => setDadMeaning(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="why-group">
                    <label>What are you most afraid of on this journey?</label>
                    <textarea
                      placeholder="I'm afraid that..."
                      value={dadFears}
                      onChange={(e) => setDadFears(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="privacy-note">
                    🔒 This stays on your device. It's just for you — and for us to personalize your experience.
                  </div>
                </div>
              </div>

              <div className="step-buttons">
                <button onClick={() => goTo(4)} className="secondary-btn">Back</button>
                <button onClick={completeOnboarding} className="primary-btn">
                  {dadMeaning || dadFears ? "Start My Journey" : "Skip & Start"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .onboarding {
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
          top: 0;
          left: 0;
          right: 0;
          height: 60%;
          background: linear-gradient(180deg, rgba(102, 126, 234, 0.15) 0%, transparent 100%);
        }

        /* Stepper */
        .stepper {
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 32px 24px 0;
          max-width: 600px;
          margin: 0 auto;
          gap: 0;
        }

        .stepper-item {
          display: flex;
          align-items: center;
          gap: 8px;
          position: relative;
        }

        .stepper-dot {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: 2px solid rgba(255,255,255,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: rgba(255,255,255,0.4);
          transition: all 0.3s ease;
          flex-shrink: 0;
        }

        .stepper-item.active .stepper-dot {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-color: #667eea;
          color: #fff;
          box-shadow: 0 0 20px rgba(102, 126, 234, 0.4);
        }

        .stepper-item.complete .stepper-dot {
          background: #22c55e;
          border-color: #22c55e;
          color: #fff;
        }

        .stepper-label {
          font-size: 0.7rem;
          color: rgba(255,255,255,0.3);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          white-space: nowrap;
          transition: color 0.3s ease;
        }

        .stepper-item.active .stepper-label {
          color: rgba(255,255,255,0.8);
        }

        .stepper-item.complete .stepper-label {
          color: rgba(34, 197, 94, 0.8);
        }

        .stepper-line {
          width: 24px;
          height: 2px;
          background: rgba(255,255,255,0.15);
          margin: 0 4px;
          flex-shrink: 0;
        }

        .stepper-item.complete .stepper-line {
          background: rgba(34, 197, 94, 0.5);
        }

        @media (max-width: 600px) {
          .stepper-label { display: none; }
          .stepper-line { width: 20px; }
          .stepper { gap: 0; padding: 24px 16px 0; }
        }

        .content {
          max-width: 720px;
          margin: 0 auto;
          padding: 40px 24px 60px;
        }

        /* Step Content */
        .step-content {
          animation: fadeIn 0.4s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Welcome Header */
        .welcome-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .welcome-header h1 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 2.8rem;
          font-weight: 300;
          margin: 0 0 12px 0;
          background: linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .subtitle {
          color: rgba(255,255,255,0.6);
          font-size: 1.1rem;
          line-height: 1.6;
          max-width: 520px;
          margin: 0 auto;
        }

        /* Welcome Card */
        .welcome-card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 36px;
          margin-bottom: 32px;
        }

        .welcome-card h2 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 16px 0;
        }

        .welcome-card > p {
          color: rgba(255,255,255,0.75);
          line-height: 1.7;
          margin-bottom: 24px;
        }

        .welcome-card em {
          color: #a78bfa;
          font-style: italic;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-bottom: 28px;
        }

        @media (max-width: 600px) {
          .benefits-grid { grid-template-columns: 1fr; }
          .welcome-header h1 { font-size: 2.2rem; }
        }

        .benefit {
          display: flex;
          gap: 12px;
          padding: 14px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
        }

        .benefit > span { font-size: 1.4rem; }
        .benefit strong { display: block; margin-bottom: 2px; font-size: 0.9rem; }
        .benefit p { margin: 0; font-size: 0.8rem; color: rgba(255,255,255,0.5); }

        /* How it works */
        .how-it-works {
          border-top: 1px solid rgba(255,255,255,0.1);
          padding-top: 24px;
        }

        .how-it-works h3 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.15rem;
          font-weight: 400;
          margin: 0 0 16px 0;
          color: rgba(255,255,255,0.7);
        }

        .how-steps {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .how-step {
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .how-num {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.3), rgba(118, 75, 162, 0.3));
          border: 1px solid rgba(102, 126, 234, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.75rem;
          font-weight: 600;
          color: #a78bfa;
          flex-shrink: 0;
        }

        .how-step p {
          margin: 0;
          font-size: 0.95rem;
          color: rgba(255,255,255,0.7);
        }

        /* Step Header */
        .step-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .step-header h1 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 2rem;
          font-weight: 400;
          margin: 0 0 8px 0;
        }

        .step-header p {
          color: rgba(255,255,255,0.6);
          line-height: 1.6;
          max-width: 500px;
          margin: 0 auto;
        }

        /* Glass Card (shared for steps 3-5) */
        .glass-card {
          background: rgba(255,255,255,0.06);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 32px;
        }

        /* Habits Selection */
        .habits-selection {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin-bottom: 24px;
        }

        .habit-card {
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(255,255,255,0.08);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .habit-card:hover {
          background: rgba(255,255,255,0.08);
          border-color: rgba(255,255,255,0.15);
        }

        .habit-card.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.12);
        }

        .habit-header {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .habit-emoji { font-size: 2rem; }

        .habit-title-area { flex: 1; }
        .habit-title-area h3 { margin: 0 0 4px 0; font-size: 1.05rem; font-weight: 500; }
        .habit-title-area p { margin: 0; font-size: 0.88rem; color: rgba(255,255,255,0.55); }

        .habit-checkbox {
          width: 28px;
          height: 28px;
          border: 2px solid rgba(255,255,255,0.25);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          color: #fff;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .habit-checkbox.checked {
          background: #667eea;
          border-color: #667eea;
        }

        .habit-science {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.08);
          font-size: 0.82rem;
          color: rgba(255,255,255,0.45);
          display: flex;
          gap: 8px;
        }

        .mile-goal-section {
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 24px;
        }

        .mile-goal-section label {
          display: block;
          margin-bottom: 8px;
          color: rgba(255,255,255,0.7);
          font-size: 0.9rem;
        }

        .mile-goal-section input {
          width: 100px;
          padding: 12px;
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          color: #fff;
          font-size: 1.1rem;
          text-align: center;
        }

        /* Toggle */
        .toggle-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 20px;
        }

        .toggle-info h3 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.2rem;
          font-weight: 400;
          margin: 0 0 4px 0;
        }

        .toggle-info p {
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
          margin: 0;
        }

        .toggle-btn {
          width: 56px;
          height: 32px;
          background: rgba(255,255,255,0.2);
          border: none;
          border-radius: 16px;
          cursor: pointer;
          position: relative;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .toggle-btn.active { background: #667eea; }

        .toggle-knob {
          position: absolute;
          top: 4px;
          left: 4px;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          transition: all 0.2s;
        }

        .toggle-btn.active .toggle-knob { left: 28px; }

        /* Pregnancy inputs */
        .pregnancy-inputs {
          margin-top: 28px;
          padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .input-group { margin-bottom: 24px; }
        .input-group label { display: block; font-weight: 500; margin-bottom: 4px; }
        .input-group .input-help { color: rgba(255,255,255,0.5); font-size: 0.85rem; margin: 0 0 12px 0; }

        .input-group input[type="date"] {
          padding: 14px 18px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          color: #fff;
          font-size: 1rem;
          width: 100%;
          max-width: 250px;
        }

        .input-group input[type="date"]::-webkit-calendar-picker-indicator {
          filter: invert(1);
        }

        .cycle-input { display: flex; align-items: center; gap: 12px; }

        .cycle-input input {
          width: 100px;
          padding: 14px 18px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          color: #fff;
          font-size: 1rem;
          text-align: center;
        }

        .cycle-input span { color: rgba(255,255,255,0.6); }

        .privacy-note {
          font-size: 0.88rem;
          color: rgba(255,255,255,0.45);
          padding: 12px 16px;
          background: rgba(255,255,255,0.04);
          border-radius: 10px;
          margin-top: 8px;
        }

        /* Docs */
        .docs-intro h3 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.3rem;
          font-weight: 400;
          margin: 0 0 12px 0;
        }

        .docs-intro p {
          color: rgba(255,255,255,0.65);
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .doc-inputs {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .doc-input-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .doc-number {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.08);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: rgba(255,255,255,0.4);
          flex-shrink: 0;
        }

        .doc-input-row input {
          flex: 1;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          color: #fff;
          font-size: 0.9rem;
        }

        .doc-input-row input:focus {
          outline: none;
          border-color: #667eea;
          background: rgba(255,255,255,0.08);
        }

        .doc-input-row input::placeholder { color: rgba(255,255,255,0.25); }

        /* Your Why */
        .why-section {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .why-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 10px;
          font-size: 1rem;
          color: rgba(255,255,255,0.85);
        }

        .why-group textarea {
          width: 100%;
          padding: 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 14px;
          color: #fff;
          font-family: inherit;
          font-size: 0.95rem;
          line-height: 1.6;
          resize: none;
          transition: border-color 0.2s;
        }

        .why-group textarea:focus {
          outline: none;
          border-color: rgba(102, 126, 234, 0.5);
          background: rgba(255,255,255,0.07);
        }

        .why-group textarea::placeholder {
          color: rgba(255,255,255,0.25);
        }

        /* Buttons */
        .step-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .primary-btn {
          padding: 16px 36px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.25s ease;
          display: block;
          margin: 0 auto;
        }

        .step-buttons .primary-btn {
          margin: 0;
        }

        .primary-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(102, 126, 234, 0.4);
        }

        .primary-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .secondary-btn {
          padding: 16px 32px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 14px;
          color: rgba(255,255,255,0.7);
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-btn:hover {
          background: rgba(255,255,255,0.12);
          color: #fff;
        }
      `}</style>
    </>
  );
}
