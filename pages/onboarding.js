import { useState } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";

const HABITS_INFO = [
  {
    id: 'noCarbs',
    emoji: '🥗',
    title: 'No Processed Carbs',
    description: 'Stabilize blood sugar, reduce inflammation, and maintain steady energy throughout the day.',
    science: 'Eliminating processed carbs reduces insulin spikes by up to 50%, improving metabolic flexibility and mental clarity.'
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

  if (status === "loading") {
    return <div className="loading">Loading...</div>;
  }

  if (!session) {
    router.push("/login");
    return null;
  }

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
    const settings = {
      habits: selectedHabits,
      weeklyMileGoal: weeklyMileGoal,
      docUrls: docUrls.filter(url => url.trim() !== ''),
      trackPregnancy: trackPregnancy,
      lmpDate: lmpDate,
      cycleLength: cycleLength,
      onboardingComplete: true,
      createdAt: new Date().toISOString()
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
        
        {/* Progress indicator */}
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${(step / 4) * 100}%` }} />
        </div>

        <div className="content">
          {/* Step 1: Theory of Change */}
          {step === 1 && (
            <div className="step-content">
              <div className="welcome-header">
                <span className="welcome-emoji">🌅</span>
                <h1>Welcome, {firstName}</h1>
                <p className="subtitle">Let's build your foundation for metabolic flourishing</p>
              </div>

              <div className="theory-card">
                <h2>The Science of Metabolic Flourishing</h2>
                <p>
                  Your body is an incredible system. When you align your daily habits with your biology, 
                  something remarkable happens: you don't just survive — you <em>flourish</em>.
                </p>
                <p>
                  Metabolic flourishing isn't about perfection. It's about consistently showing up for 
                  the practices that compound over time. Each habit you choose unlocks a cascade of benefits:
                </p>
                
                <div className="benefits-grid">
                  <div className="benefit">
                    <span>🧠</span>
                    <div>
                      <strong>Mental Clarity</strong>
                      <p>Stable energy, focused thinking, emotional resilience</p>
                    </div>
                  </div>
                  <div className="benefit">
                    <span>⚡</span>
                    <div>
                      <strong>Sustained Energy</strong>
                      <p>No crashes, consistent output, ready for anything</p>
                    </div>
                  </div>
                  <div className="benefit">
                    <span>💪</span>
                    <div>
                      <strong>Physical Strength</strong>
                      <p>Functional fitness, injury prevention, longevity</p>
                    </div>
                  </div>
                  <div className="benefit">
                    <span>❤️</span>
                    <div>
                      <strong>Heart Health</strong>
                      <p>Cardiovascular fitness, lower inflammation, better sleep</p>
                    </div>
                  </div>
                </div>

                <p className="cta-text">
                  The best part? <strong>You choose what matters to you.</strong> There's no one-size-fits-all. 
                  Select the habits that resonate, and we'll help you track them.
                </p>
              </div>

              <button onClick={() => setStep(2)} className="primary-btn">
                Choose My Habits →
              </button>
            </div>
          )}

          {/* Step 2: Habit Selection */}
          {step === 2 && (
            <div className="step-content">
              <div className="step-header">
                <h1>Choose Your Habits</h1>
                <p>Select the practices you want to track. You can always change these later.</p>
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
                <button onClick={() => setStep(1)} className="secondary-btn">← Back</button>
                <button 
                  onClick={() => setStep(3)} 
                  className="primary-btn"
                  disabled={selectedHabits.length === 0}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Partner Support / Pregnancy Tracking */}
          {step === 3 && (
            <div className="step-content">
              <div className="step-header">
                <span className="step-emoji">👶</span>
                <h1>Partner Support</h1>
                <p>
                  Get daily insights on what your partner might be experiencing and how you can support her through pregnancy.
                </p>
              </div>

              <div className="pregnancy-card">
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
                <button onClick={() => setStep(2)} className="secondary-btn">← Back</button>
                <button 
                  onClick={() => setStep(4)} 
                  className="primary-btn"
                  disabled={trackPregnancy && !lmpDate}
                >
                  Continue →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Journal Docs */}
          {step === 4 && (
            <div className="step-content">
              <div className="step-header">
                <span className="step-emoji">✨</span>
                <h1>Your Wins Feed</h1>
                <p>
                  We believe in celebrating how far you've come. Share your past journals or reflections, 
                  and we'll surface your wins when you need them most.
                </p>
              </div>

              <div className="docs-card">
                <div className="docs-intro">
                  <h3>Add Google Docs (Optional)</h3>
                  <p>
                    Paste links to Google Docs containing your journal entries, reflections, or notes. 
                    We'll extract the beautiful moments — times you've been great, overcome challenges, 
                    or experienced gratitude.
                  </p>
                  <p className="privacy-note">
                    🔒 Your docs stay private. We only read them to find your wins.
                  </p>
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
                <button onClick={() => setStep(3)} className="secondary-btn">← Back</button>
                <button onClick={completeOnboarding} className="primary-btn">
                  {docUrls.some(url => url.trim()) ? "Let's Go! 🚀" : "Skip for Now →"}
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

        .progress-bar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: rgba(255,255,255,0.1);
          z-index: 100;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .content {
          max-width: 720px;
          margin: 0 auto;
          padding: 60px 24px;
        }

        .loading {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #1a1a2e;
          color: #fff;
        }

        /* Step Content */
        .step-content {
          animation: fadeIn 0.4s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Welcome Header */
        .welcome-header {
          text-align: center;
          margin-bottom: 40px;
        }

        .welcome-emoji {
          font-size: 4rem;
          display: block;
          margin-bottom: 16px;
        }

        .welcome-header h1 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 2.5rem;
          font-weight: 400;
          margin: 0 0 8px 0;
        }

        .subtitle {
          color: rgba(255,255,255,0.6);
          font-size: 1.1rem;
        }

        /* Theory Card */
        .theory-card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .theory-card h2 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.5rem;
          font-weight: 400;
          margin: 0 0 20px 0;
        }

        .theory-card p {
          color: rgba(255,255,255,0.8);
          line-height: 1.7;
          margin-bottom: 16px;
        }

        .theory-card em {
          color: #a78bfa;
          font-style: italic;
        }

        .benefits-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin: 24px 0;
        }

        @media (max-width: 600px) {
          .benefits-grid {
            grid-template-columns: 1fr;
          }
        }

        .benefit {
          display: flex;
          gap: 12px;
          padding: 16px;
          background: rgba(255,255,255,0.05);
          border-radius: 12px;
        }

        .benefit span {
          font-size: 1.5rem;
        }

        .benefit strong {
          display: block;
          margin-bottom: 4px;
        }

        .benefit p {
          margin: 0;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.6);
        }

        .cta-text {
          margin-top: 24px;
          padding-top: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
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
        }

        .step-emoji {
          font-size: 3rem;
          display: block;
          margin-bottom: 16px;
        }

        /* Habits Selection */
        .habits-selection {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }

        .habit-card {
          background: rgba(255,255,255,0.05);
          border: 2px solid rgba(255,255,255,0.1);
          border-radius: 16px;
          padding: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .habit-card:hover {
          background: rgba(255,255,255,0.08);
        }

        .habit-card.selected {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.15);
        }

        .habit-header {
          display: flex;
          gap: 16px;
          align-items: flex-start;
        }

        .habit-emoji {
          font-size: 2rem;
        }

        .habit-title-area {
          flex: 1;
        }

        .habit-title-area h3 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          font-weight: 500;
        }

        .habit-title-area p {
          margin: 0;
          font-size: 0.9rem;
          color: rgba(255,255,255,0.6);
        }

        .habit-checkbox {
          width: 28px;
          height: 28px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: #fff;
          transition: all 0.2s;
        }

        .habit-checkbox.checked {
          background: #667eea;
          border-color: #667eea;
        }

        .habit-science {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
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

        /* Docs Card */
        .docs-card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 32px;
        }

        .docs-intro h3 {
          font-family: 'Crimson Pro', Georgia, serif;
          font-size: 1.3rem;
          font-weight: 400;
          margin: 0 0 12px 0;
        }

        .docs-intro p {
          color: rgba(255,255,255,0.7);
          line-height: 1.6;
          margin-bottom: 12px;
        }

        .privacy-note {
          font-size: 0.9rem;
          color: rgba(255,255,255,0.5);
          padding: 12px;
          background: rgba(255,255,255,0.05);
          border-radius: 8px;
        }

        .doc-inputs {
          margin-top: 24px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .doc-input-row {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .doc-number {
          width: 28px;
          height: 28px;
          background: rgba(255,255,255,0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.5);
        }

        .doc-input-row input {
          flex: 1;
          padding: 14px 16px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 12px;
          color: #fff;
          font-size: 0.95rem;
        }

        .doc-input-row input:focus {
          outline: none;
          border-color: #667eea;
          background: rgba(255,255,255,0.08);
        }

        .doc-input-row input::placeholder {
          color: rgba(255,255,255,0.3);
        }

        /* Pregnancy Card */
        .pregnancy-card {
          background: rgba(255,255,255,0.08);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 24px;
          padding: 32px;
          margin-bottom: 32px;
        }

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

        .toggle-btn.active {
          background: #667eea;
        }

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

        .toggle-btn.active .toggle-knob {
          left: 28px;
        }

        .pregnancy-inputs {
          margin-top: 28px;
          padding-top: 28px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }

        .input-group {
          margin-bottom: 24px;
        }

        .input-group label {
          display: block;
          font-weight: 500;
          margin-bottom: 4px;
        }

        .input-group .input-help {
          color: rgba(255,255,255,0.5);
          font-size: 0.85rem;
          margin: 0 0 12px 0;
        }

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

        .cycle-input {
          display: flex;
          align-items: center;
          gap: 12px;
        }

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

        .cycle-input span {
          color: rgba(255,255,255,0.6);
        }

        /* Buttons */
        .step-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .primary-btn {
          padding: 16px 32px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 14px;
          color: #fff;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
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
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 14px;
          color: #fff;
          font-size: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .secondary-btn:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>
    </>
  );
}
