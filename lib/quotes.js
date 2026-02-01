export const quotes = [
  { text: "The moment you give up is the moment you let someone else win.", author: "Kobe Bryant" },
  { text: "A father's job isn't to teach his child how to survive the storm. It's to show them how to become the storm.", author: "Unknown" },
  { text: "I can't relate to lazy people. We don't speak the same language. I don't understand you. I don't want to understand you.", author: "Kobe Bryant" },
  { text: "The body achieves what the mind believes. Your child will inherit your discipline before your words.", author: "Dad Ready" },
  { text: "Everything negative – pressure, challenges – is all an opportunity for me to rise.", author: "Kobe Bryant" },
  { text: "Being a great father requires being great. Not perfect. Great. That takes daily work.", author: "Dad Ready" },
  { text: "I have self-doubt. I have insecurity. I have fear of failure... But I don't let it stop me.", author: "Kobe Bryant" },
  { text: "Your child won't remember your excuses. They'll remember your example.", author: "Dad Ready" },
  { text: "The most important thing is to try and inspire people so that they can be great in whatever they want to do.", author: "Kobe Bryant" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "I never tried to be better than anyone else. I just tried to be better than myself.", author: "Kobe Bryant" },
  { text: "A father who shows up for himself teaches his child that they're worth showing up for.", author: "Dad Ready" },
  { text: "Rest at the end, not in the middle.", author: "Kobe Bryant" },
  { text: "Love isn't just felt. It's demonstrated. Every rep, every mile, every choice—that's love in action.", author: "Dad Ready" },
  { text: "I don't want to be the next Michael Jordan, I only want to be Kobe Bryant.", author: "Kobe Bryant" },
  { text: "Your child doesn't need a perfect father. They need a present one. Presence requires energy. Energy requires health.", author: "Dad Ready" },
  { text: "Once you know what failure feels like, determination chases success.", author: "Kobe Bryant" },
  { text: "The discipline you build now becomes the foundation your family stands on.", author: "Dad Ready" },
  { text: "I'll do whatever it takes to win games, whether it's sitting on a bench waving a towel or hitting the releasing shot.", author: "Kobe Bryant" },
  { text: "Strong fathers aren't born. They're built—one decision, one workout, one day at a time.", author: "Dad Ready" },
  { text: "If you're afraid to fail, then you're probably going to fail.", author: "Kobe Bryant" },
  { text: "Mental fitness is physical fitness. The mind that can push through a hard run can push through a hard night.", author: "Dad Ready" },
  { text: "The beauty in being blessed with talent is rising above doubters to create something beautiful.", author: "Kobe Bryant" },
  { text: "Mamba Mentality is about 4 a.m. workouts, trying to be better, obsessing over it. It's about not worrying about what other people say.", author: "Kobe Bryant" },
  { text: "You're not just getting ready for fatherhood. You're getting ready for the most important role of your life.", author: "Dad Ready" },
  { text: "These young guys are playing checkers. I'm out there playing chess.", author: "Kobe Bryant" },
  { text: "The last 3 days. Finish what you started. Your future self—your future child—is watching.", author: "Dad Ready" },
  { text: "Heroes come and go, but legends are forever.", author: "Kobe Bryant" }
];

export function getTodayQuote() {
  const today = new Date();
  const dayOfMonth = today.getDate();
  const monthIndex = today.getMonth();
  if (monthIndex === 1 && dayOfMonth >= 1 && dayOfMonth <= 28) {
    return quotes[dayOfMonth - 1];
  }
  return quotes[0];
}

export function getQuoteByDay(day) {
  if (day >= 1 && day <= 28) {
    return quotes[day - 1];
  }
  return quotes[0];
}
