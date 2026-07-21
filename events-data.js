// ============================================================
// Beyond Borders — shared events data
// ============================================================
// Single source of truth for the society calendar. Used by both
// events.html (renders the full event cards) and
// beyond-borders-passport.html (renders the "Upcoming Trips"
// calendar and lets members link a stamp to the event they went to).
//
// month is 1-12 (calendar month number), used for date math.
// ============================================================

const EVENTS = [
  {
    id: 'meet-greet',
    year: 2026, month: 10, day: 5, monthLabel: 'Oct',
    tag: 'Social',
    title: 'Meet & Greet',
    meta: ['🕕 6:00 – 8:30 PM (approx.)', '📍 Big classroom (room TBC)'],
    desc: "Kick off the semester with speed-networking bingo, quick introductions, a murder mystery / mafia game, and informal networking over snacks and drinks. Exact room to be confirmed."
  },
  {
    id: 'family-intro',
    year: 2026, month: 10, day: 13, monthLabel: 'Oct',
    tag: 'Social',
    title: 'Family Introduction Event',
    meta: ['🕕 Time TBC', '📍 Room TBC (depends on turnout)'],
    desc: "Meet your BBSOC family through icebreakers and team challenges. Time and room will be confirmed closer to the date."
  },
  {
    id: 'recruitment-workshop',
    year: 2026, month: 10, day: 19, monthLabel: 'Oct',
    tag: 'Careers',
    title: 'Application & Recruitment Workshop',
    meta: ['🕕 Time TBC', '📍 Room TBC'],
    desc: "An HR / recruiter-led session covering CV tips, cover letters, online assessments, and virtual and in-person interviews. Speaker to be confirmed."
  },
  {
    id: 'panel-failure',
    year: 2026, month: 10, day: 26, monthLabel: 'Oct',
    tag: 'Careers',
    title: 'Panel: Learning from Failure',
    meta: ['🕕 Time TBC', '📍 Room TBC'],
    desc: "Speakers who changed career direction, recent graduates and young professionals talk rejections, career mistakes, and the parts of the journey that don't make it onto LinkedIn. Panellists to be confirmed."
  },
  {
    id: 'wellbeing-event',
    year: 2026, month: 11, day: 2, monthLabel: 'Nov',
    tag: 'Wellbeing',
    title: 'Wellbeing Event',
    meta: ['🕕 Time TBC', '📍 Room TBC'],
    desc: "A mid-career-month pause to check in and recharge. Full details coming soon."
  },
  {
    id: 'networking-roundtables',
    year: 2026, month: 11, day: 9, monthLabel: 'Nov',
    tag: 'Careers',
    title: 'Networking Event: Industry Roundtables',
    meta: ['🕕 Time TBC', '📍 Room TBC', '👔 Smart casual'],
    desc: "Rotate between roundtables on consulting, law, finance, healthcare, tech and marketing, spending 10–15 minutes at each table with industry guests. Guests to be confirmed."
  },
  {
    id: 'formal-dinner',
    year: 2026, month: 11, day: 28, monthLabel: 'Nov',
    tag: 'Formal',
    title: 'Celebration Formal Dinner',
    meta: ['🕡 6:30 PM – Late', '👥 ~60–70 attending', '🎩 Black tie'],
    desc: "Round off the semester in style with a president's speech, awards (including Most Active Member), a raffle, and a photo / red carpet moment. Exact date, venue and alcohol availability (budget-dependent) to be confirmed."
  },
];
