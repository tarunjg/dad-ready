export const quotes = [
  { text: "You have power over your mind, not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius" },
  { text: "The impediment to action advances action. What stands in the way becomes the way.", author: "Marcus Aurelius" },
  { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius" },
  { text: "I can't relate to lazy people. We don't speak the same language.", author: "Kobe Bryant" },
  { text: "The soul becomes dyed with the color of its thoughts.", author: "Marcus Aurelius" },
  { text: "Everything negative — pressure, challenges — is all an opportunity for me to rise.", author: "Kobe Bryant" },
  { text: "He who has a why to live can bear almost any how.", author: "Friedrich Nietzsche" },
  { text: "The mind is everything. What you think, you become.", author: "Buddha" },
  { text: "I have self-doubt. I have insecurity. I have fear of failure. But I don't let it stop me.", author: "Kobe Bryant" },
  { text: "Discipline is choosing between what you want now and what you want most.", author: "Abraham Lincoln" },
  { text: "No man is free who is not master of himself.", author: "Epictetus" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
  { text: "Rest at the end, not in the middle.", author: "Kobe Bryant" },
  { text: "Until you make the unconscious conscious, it will direct your life and you will call it fate.", author: "Carl Jung" },
  { text: "What we do now echoes in eternity.", author: "Marcus Aurelius" },
  { text: "A man who conquers himself is greater than one who conquers a thousand men in battle.", author: "Buddha" },
  { text: "When you arise in the morning, think of what a privilege it is to be alive, to think, to enjoy, to love.", author: "Marcus Aurelius" },
  { text: "Your children will become who you are. So be who you want them to be.", author: "David Bly" },
  { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle" },
  { text: "Between stimulus and response there is a space. In that space is our freedom.", author: "Viktor Frankl" },
  { text: "A father who shows up for himself teaches his child that they are worth showing up for.", author: "Dad Ready" },
  { text: "Strong fathers are not born. They are built — one decision, one workout, one day at a time.", author: "Dad Ready" },
  { text: "Mental fitness is physical fitness. The mind that can push through a hard run can push through a hard night.", author: "Dad Ready" },
  { text: "Love is not just felt. It is demonstrated. Every rep, every mile, every choice — that is love in action.", author: "Dad Ready" },
  { text: "The discipline you build now becomes the foundation your family stands on.", author: "Dad Ready" },
  { text: "It is not that we have a short time to live, but that we waste a great deal of it.", author: "Seneca" },
  { text: "The last three days. Finish what you started. Your future self — your future child — is watching.", author: "Dad Ready" },
  { text: "You are not just getting ready for fatherhood. You are getting ready for the most important role of your life.", author: "Dad Ready" }
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
