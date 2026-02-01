// Pregnancy information by week
// Covers weeks 4-12 (early pregnancy, most relevant for Feb 2026 based on late Dec/early Jan conception)

export const pregnancyWeeks = {
  4: {
    baby: "The embryo is implanting into the uterine wall. It's about the size of a poppy seed.",
    mom: "She might not know she's pregnant yet. Some women experience light spotting (implantation bleeding) or mild cramping. Fatigue may begin.",
    support: [
      "Be attentive to her energy levels without being overbearing",
      "Make sure there's plenty of water around the house",
      "Start taking on more household tasks quietly",
      "Be patient if she seems tired or emotional"
    ]
  },
  5: {
    baby: "The heart is beginning to form and will start beating this week. Baby is the size of a sesame seed.",
    mom: "Morning sickness may begin. Breast tenderness, fatigue, and frequent urination are common. Emotions may feel intense.",
    support: [
      "Keep crackers by the bedside for morning nausea",
      "Don't wear strong cologne or cook pungent foods",
      "Offer ginger tea or ginger candies",
      "Be emotionally present—just listen without trying to fix"
    ]
  },
  6: {
    baby: "The neural tube is closing. Tiny buds for arms and legs appear. Baby is the size of a lentil.",
    mom: "Nausea often peaks. She may have food aversions, heightened sense of smell, and extreme fatigue. Mood swings are common.",
    support: [
      "Ask what foods sound tolerable before cooking",
      "Take over meal planning if she can't think about food",
      "Let her rest without guilt—growing a human is exhausting",
      "Validate her feelings without minimizing them"
    ]
  },
  7: {
    baby: "Brain development is rapid. Hands and feet are forming. Baby is the size of a blueberry.",
    mom: "Nausea continues. She may experience bloating, constipation, and vivid dreams. First prenatal appointment often happens this week.",
    support: [
      "Offer to go to every appointment—your presence matters",
      "Stock up on high-fiber foods and prunes",
      "Create a calm bedtime routine together",
      "Start a shared journal or notes app for questions for the doctor"
    ]
  },
  8: {
    baby: "All major organs are beginning to develop. Baby is moving, though she can't feel it yet. Size of a kidney bean.",
    mom: "Nausea may be at its worst. Fatigue is intense. She might feel like she's on an emotional rollercoaster.",
    support: [
      "This is often the hardest week—be extra patient and loving",
      "Don't take mood swings personally",
      "Small gestures matter: bring her a cold cloth, rub her back",
      "Remind her this phase is temporary"
    ]
  },
  9: {
    baby: "Baby is starting to look more human. Tiny muscles are forming. Size of a grape.",
    mom: "Nausea may start to ease for some. Waistline may be thickening. She might feel anxious about the pregnancy.",
    support: [
      "Reassure her that anxiety is normal",
      "Start researching together—birth classes, hospitals, etc.",
      "Celebrate small wins: 'We made it through another week'",
      "Plan a low-key date that doesn't involve food smells"
    ]
  },
  10: {
    baby: "Vital organs are fully formed and beginning to function. Baby is the size of a kumquat.",
    mom: "Energy might slightly improve. Visible veins may appear on breasts and belly. Round ligament pain may start.",
    support: [
      "Encourage gentle movement—walks together are great",
      "Help her stay hydrated (dehydration worsens everything)",
      "Be flexible with plans—she may need to cancel last minute",
      "Start talking about your hopes and dreams for your family"
    ]
  },
  11: {
    baby: "Baby is now officially a fetus. Tooth buds and nail beds are forming. Size of a fig.",
    mom: "Nausea often improves. She may feel bloated and have skin changes (acne or 'glow'). Headaches are common.",
    support: [
      "Keep pain relievers she can safely take on hand (check with doctor)",
      "Offer head and neck massages",
      "Compliment her genuinely—she may not feel attractive",
      "Take photos if she's comfortable—you'll treasure these"
    ]
  },
  12: {
    baby: "Reflexes are developing—baby can open and close fingers. Size of a lime. Risk of miscarriage drops significantly.",
    mom: "Many women start feeling better! Energy often returns. She may start 'showing' slightly. This is often when couples share the news.",
    support: [
      "Celebrate reaching this milestone together",
      "Discuss when/how to share the news with family and friends",
      "Start thinking about nursery ideas if she's ready",
      "Plan something special—you've both made it through the hardest part"
    ]
  },
  13: {
    baby: "Vocal cords are forming. Fingerprints are developing. Size of a peapod.",
    mom: "Welcome to the second trimester! Energy typically improves. Libido may return. The 'pregnancy glow' often appears.",
    support: [
      "Reconnect intimately if she's interested—follow her lead",
      "Plan a babymoon if schedules allow",
      "Start reading about childbirth together",
      "Express gratitude for everything she's going through"
    ]
  },
  14: {
    baby: "Baby can make facial expressions. Body is growing faster than the head now. Size of a lemon.",
    mom: "Appetite often increases. She may feel more like herself. Some women experience nasal congestion ('pregnancy rhinitis').",
    support: [
      "Cook nutritious meals she's craving",
      "Get a humidifier for the bedroom if she's congested",
      "Enjoy this more stable phase together",
      "Keep up the habits you've built—she needs a healthy partner too"
    ]
  }
};

export function calculatePregnancyWeek(lmpDate, cycleLength = 28) {
  const today = new Date();
  const lmp = new Date(lmpDate);
  
  // Adjust for cycle length (standard calculation assumes 28-day cycle)
  const ovulationDay = cycleLength - 14;
  const adjustment = ovulationDay - 14; // Days to add/subtract from standard
  
  const daysSinceLMP = Math.floor((today - lmp) / (1000 * 60 * 60 * 24));
  const adjustedDays = daysSinceLMP - adjustment;
  
  const weeks = Math.floor(adjustedDays / 7);
  const days = adjustedDays % 7;
  
  return { weeks, days, totalDays: adjustedDays };
}

export function getPregnancyInfo(lmpDate, cycleLength = 28) {
  const { weeks, days } = calculatePregnancyWeek(lmpDate, cycleLength);
  
  // Get info for current week, default to week 4 or 14 if out of range
  let weekInfo;
  if (weeks < 4) {
    weekInfo = {
      baby: "It's very early! The fertilized egg is making its way to the uterus.",
      mom: "She likely doesn't know she's pregnant yet. No symptoms typically.",
      support: [
        "Continue being a supportive partner",
        "Focus on your own health and preparation",
        "Stay positive and present"
      ]
    };
  } else if (weeks > 14) {
    weekInfo = pregnancyWeeks[14];
  } else {
    weekInfo = pregnancyWeeks[weeks];
  }
  
  return {
    weeks,
    days,
    weekLabel: `${weeks} weeks, ${days} days`,
    trimester: weeks < 13 ? 1 : weeks < 27 ? 2 : 3,
    ...weekInfo
  };
}

export function getDailyTip(lmpDate, cycleLength = 28) {
  const info = getPregnancyInfo(lmpDate, cycleLength);
  const dayOfWeek = new Date().getDay();
  
  // Rotate through support tips based on day
  const tipIndex = dayOfWeek % info.support.length;
  
  return {
    ...info,
    todaysTip: info.support[tipIndex]
  };
}
