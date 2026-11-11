export const HEALTH_RECORDS = [
  { id: 'fastest-mile', title: 'Fastest mile', unit: 'min', better: 'lower' },
  { id: 'pushups', title: 'Most pushups in a day', unit: 'reps', better: 'higher' },
  { id: 'pullups', title: 'Most pull-ups in a day', unit: 'reps', better: 'higher' },
  { id: 'plank', title: 'Longest plank', unit: 'sec', better: 'higher' },
  { id: 'furthest-run', title: 'Furthest run', unit: 'mi', better: 'higher' },
  { id: 'steps', title: 'Most steps in a day', unit: 'steps', better: 'higher' },
];

export function mergeHealth(saved) {
  const byId = new Map((saved || []).map((item) => [item.id, item]));
  return HEALTH_RECORDS.map((record) => {
    const saved = byId.get(record.id);
    return {
      ...record,
      value: saved?.value ?? null,
      previous: saved?.previous ?? null,
    };
  });
}

export function isBetter(record, next, current) {
  if (current == null) return true;
  return record.better === 'lower' ? next < current : next > current;
}

export function formatValue(value, unit) {
  const shown = Number.isInteger(value) ? value.toLocaleString() : value;
  return `${shown} ${unit}`;
}

export function formatRecord(record) {
  if (record.value == null) return 'No record yet';
  return formatValue(record.value, record.unit);
}
