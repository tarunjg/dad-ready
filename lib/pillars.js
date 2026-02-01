// Body, Mind, Soul — the three pillars of Dad Ready

export const PILLARS = {
  body: {
    label: 'Body',
    color: '#22c55e',
    colorAlpha: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    habits: [
      { id: 'running', label: 'Running', emoji: '🏃', hasInput: 'miles' },
      { id: 'strength', label: 'Strength Training (20 min)', emoji: '💪' },
      { id: 'noSugar', label: 'No processed sugar', emoji: '🍎' },
    ]
  },
  mind: {
    label: 'Mind',
    color: '#a78bfa',
    colorAlpha: 'rgba(167, 139, 250, 0.12)',
    borderColor: 'rgba(167, 139, 250, 0.3)',
    habits: [],
    sections: ['pregnancy', 'weeklyAction']
  },
  soul: {
    label: 'Soul',
    color: '#f59e0b',
    colorAlpha: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    habits: [
      { id: 'meditation', label: 'Meditation (20 min)', emoji: '🧘' },
      { id: 'gratitude', label: 'Gratitude (3 things)', emoji: '🙏', hasInput: 'gratitude' },
    ],
    sections: []
  }
};

// Get all habits as flat array across all pillars
export function getAllHabits() {
  return Object.values(PILLARS).flatMap(p => p.habits);
}

// Get which pillar a habit belongs to
export function getHabitPillar(habitId) {
  for (const [key, pillar] of Object.entries(PILLARS)) {
    if (pillar.habits.some(h => h.id === habitId)) return key;
  }
  return null;
}

// Get completion stats for a specific pillar on a given day
export function getPillarCompletion(pillarKey, dayHabits, selectedHabits) {
  const pillar = PILLARS[pillarKey];
  if (!pillar) return { completed: 0, total: 0 };
  const activeHabits = pillar.habits.filter(h => selectedHabits.includes(h.id));
  const completed = activeHabits.filter(h => dayHabits?.[h.id]).length;
  return { completed, total: activeHabits.length };
}

// Get total completion across all pillars
export function getTotalCompletion(dayHabits, selectedHabits) {
  let completed = 0;
  let total = 0;
  for (const pillarKey of Object.keys(PILLARS)) {
    const result = getPillarCompletion(pillarKey, dayHabits, selectedHabits);
    completed += result.completed;
    total += result.total;
  }
  return { completed, total };
}

// Migrate noCarbs -> noSugar in settings
export function migrateSettings(settings) {
  if (!settings) return settings;
  const migrated = { ...settings };
  if (migrated.habits && migrated.habits.includes('noCarbs')) {
    migrated.habits = migrated.habits.map(h => h === 'noCarbs' ? 'noSugar' : h);
  }
  return migrated;
}
