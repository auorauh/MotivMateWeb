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
  return HEALTH_RECORDS.map((record) => ({
    ...record,
    value: byId.get(record.id)?.value ?? null,
  }));
}

export function isBetter(record, next, current) {
  if (current == null) return true;
  return record.better === 'lower' ? next < current : next > current;
}

export function formatRecord(record) {
  if (record.value == null) return 'No record yet';
  const shown = Number.isInteger(record.value)
    ? record.value.toLocaleString()
    : record.value;
  return `${shown} ${record.unit}`;
}
