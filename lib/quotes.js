export const quotes = [
  // Day 1 - Feb 1
  {
    text: "The moment you give up is the moment you let someone else win.",
    author: "Kobe Bryant"
  },
  // Day 2 - Feb 2
  {
    text: "A father's job isn't to teach his child how to survive the storm. It's to show them how to become the storm.",
    author: "Unknown"
  },
  // Day 3 - Feb 3
  {
    text: "I can't relate to lazy people. We don't speak the same language. I don't understand you. I don't want to understand you.",
    author: "Kobe Bryant"
  },
  // Day 4 - Feb 4
  {
    text: "The body achieves what the mind believes. Your child will inherit your discipline before your words.",
    author: "Dad Ready"
  },
  // Day 5 - Feb 5
  {
    text: "Everything negative – pressure, challenges – is all an opportunity for me to rise.",
    author: "Kobe Bryant"
  },
  // Day 6 - Feb 6
  {
    text: "Being a great father requires being great. Not perfect. Great. That takes daily work.",
    author: "Dad Ready"
  },
  // Day 7 - Feb 7
  {
    text: "I have self-doubt. I have insecurity. I have fear of failure... But I don't let it stop me.",
    author: "Kobe Bryant"
  },
  // Day 8 - Feb 8
  {
    text: "Your child won't remember your excuses. They'll remember your example.",
    author: "Dad Ready"
  },
  // Day 9 - Feb 9
  {
    text: "The most important thing is to try and inspire people so that they can be great in whatever they want to do.",
    author: "Kobe Bryant"
  },
  // Day 10 - Feb 10
  {
    text: "Discipline is choosing between what you want now and what you want most.",
    author: "Abraham Lincoln"
  },
  // Day 11 - Feb 11
  {
    text: "I never tried to be better than anyone else. I just tried to be better than myself.",
    author: "Kobe Bryant"
  },
  // Day 12 - Feb 12
  {
    text: "A father who shows up for himself teaches his child that they're worth showing up for.",
    author: "Dad Ready"
  },
  // Day 13 - Feb 13
  {
    text: "Rest at the end, not in the middle.",
    author: "Kobe Bryant"
  },
  // Day 14 - Feb 14
  {
    text: "Love isn't just felt. It's demonstrated. Every rep, every mile, every choice—that's love in action.",
    author: "Dad Ready"
  },
  // Day 15 - Feb 15
  {
    text: "I don't want to be the next Michael Jordan, I only want to be Kobe Bryant.",
    author: "Kobe Bryant"
  },
  // Day 16 - Feb 16
  {
    text: "Your child doesn't need a perfect father. They need a present one. Presence requires energy. Energy requires health.",
    author: "Dad Ready"
  },
  // Day 17 - Feb 17
  {
    text: "Once you know what failure feels like, determination chases success.",
    author: "Kobe Bryant"
  },
  // Day 18 - Feb 18
  {
    text: "The discipline you build now becomes the foundation your family stands on.",
    author: "Dad Ready"
  },
  // Day 19 - Feb 19
  {
    text: "I'll do whatever it takes to win games, whether it's sitting on a bench waving a towel or hitting the releasing shot.",
    author: "Kobe Bryant"
  },
  // Day 20 - Feb 20
  {
    text: "Strong fathers aren't born. They're built—one decision, one workout, one day at a time.",
    author: "Dad Ready"
  },
  // Day 21 - Feb 21
  {
    text: "If you're afraid to fail, then you're probably going to fail.",
    author: "Kobe Bryant"
  },
  // Day 22 - Feb 22
  {
    text: "Mental fitness is physical fitness. The mind that can push through a hard run can push through a hard night.",
    author: "Dad Ready"
  },
  // Day 23 - Feb 23
  {
    text: "The beauty in being blessed with talent is rising above doubters to create something beautiful.",
    author: "Kobe Bryant"
  },
  // Day 24 - Feb 24
  {
    text: "Mamba Mentality is about 4 a.m. workouts, trying to be better, obsessing over it. It's about not worrying about what other people say.",
    author: "Kobe Bryant"
  },
  // Day 25 - Feb 25
  {
    text: "You're not just getting ready for fatherhood. You're getting ready for the most important role of your life.",
    author: "Dad Ready"
  },
  // Day 26 - Feb 26
  {
    text: "These young guys are playing checkers. I'm out there playing chess.",
    author: "Kobe Bryant"
  },
  // Day 27 - Feb 27
  {
    text: "The last 3 days. Finish what you started. Your future self—your future child—is watching.",
    author: "Dad Ready"
  },
  // Day 28 - Feb 28
  {
    text: "Heroes come and go, but legends are forever.",
    author: "Kobe Bryant"
  }
];

export function getTodayQuote() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const monthIndex = today.getMonth(); // 0 = Jan, 1 = Feb
  
  // Only return quotes for February
  if (monthIndex === 1 && dayOfMonth >= 1 && dayOfMonth <= 28) {
    return quotes[dayOfMonth - 1];
  }
  
  // Fallback for other months (or extend later)
  return quotes[0];
}

export function getQuoteByDay(day) {
  if (day >= 1 && day <= 28) {
    return quotes[day - 1];
  }
  return quotes[0];
}
