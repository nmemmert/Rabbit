// Pure alert logic: given the data and today's date, which notifications are due?
const DAY = 864e5;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const diffDays = (a, b) => Math.round((parse(a) - parse(b)) / DAY);

const DEFAULTS = { gestation: 31, nestBox: 28, palpate: 14, wean: 42 };

function dueAlerts(db, today) {
  const s = Object.assign({}, DEFAULTS, db.settings || {});
  const name = id => (db.rabbits.find(r => r.id === id) || { name: 'Unknown' }).name;
  const out = [];
  const add = (key, title, message, tags, priority) => out.push({ key, title, message, tags, priority });

  for (const b of db.breedings) {
    if (b.status !== 'pending') continue;
    const age = diffDays(today, b.date);
    const doe = name(b.doe), buck = name(b.buck);
    // Each rule fires once, on its day (or up to 2 days late if the server was down).
    const rules = [
      [s.palpate, 'palpate', `Palpate ${doe}`, `Day ${s.palpate}: check if ${doe} is pregnant (bred to ${buck}).`, 'rabbit,mag', 3, b.checked],
      [s.nestBox - 2, 'boxsoon', `Nest box in 2 days`, `${doe} is due to get a nest box on day ${s.nestBox}. Get one ready.`, 'package', 3, b.boxIn || age >= s.nestBox],
      [s.nestBox, 'box', `Put the nest box in for ${doe}`, `Day ${s.nestBox}: time for the nest box. Kindling is due in ${s.gestation - s.nestBox} days.`, 'package,rabbit', 4, b.boxIn],
      [s.gestation, 'due', `${doe} is due today`, `Day ${s.gestation}: kindling expected (bred to ${buck}).`, 'baby,rabbit', 4, age >= s.gestation + 2],
      [s.gestation + 2, 'late', `${doe} is overdue`, `2 days past due. No litter recorded yet — check on her.`, 'warning,rabbit', 5, false],
    ];
    for (const [day, id, title, msg, tags, prio, skip] of rules) {
      if (skip || age < day || age > day + 2) continue;
      add(`b:${b.id}:${id}`, title, msg, tags, prio);
    }
  }

  for (const l of db.litters) {
    const age = diffDays(today, l.date);
    if (age >= s.wean && age <= s.wean + 2) {
      const doe = name(l.doe);
      const live = l.males + l.females + l.unknown;
      add(`l:${l.id}:wean`, `Weaning time: ${doe}'s litter`, `Litter is ${s.wean / 7} weeks old (${live} kits, ${l.males} bucks / ${l.females} does). Time to wean and sex-separate.`, 'rabbit,tada', 3);
    }
  }
  return out;
}

module.exports = { dueAlerts, diffDays, DEFAULTS };
