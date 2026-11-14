import { useState } from 'react';
import axios from 'axios';
import { StyleSheet, View, Pressable, TextInput, ScrollView } from '../platform';
import FontAwesome5 from '../platform/icons';
import TextFont from './TextFont';
import { API_URL } from '../platform/env';

const DEFAULT_GOAL = 2000;

function storageKey(email) {
  return `mm-calories:${email}`;
}

function todayKey(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function savedFoods(data) {
  const rows = Array.isArray(data?.saved) ? data.saved : [];
  return rows
    .filter((item) => item && item.name && Number(item.calories) > 0)
    .map((item) => ({
      id: String(item.id || item.name),
      name: String(item.name).slice(0, 40),
      calories: Math.round(Number(item.calories)),
    }));
}

function upsertSaved(saved, entry) {
  const key = entry.name.trim().toLowerCase();
  const existing = saved.find((item) => item.name.trim().toLowerCase() === key);
  if (existing) {
    return saved.map((item) => (
      item.id === existing.id ? { ...item, name: entry.name, calories: entry.calories } : item
    ));
  }
  return [...saved, { id: entry.id, name: entry.name, calories: entry.calories }];
}

function normalize(data) {
  const goal = Number(data?.goal);
  const log = data?.log && typeof data.log === 'object' && !Array.isArray(data.log) ? data.log : {};
  return {
    goal: Number.isFinite(goal) && goal > 0 ? Math.round(goal) : DEFAULT_GOAL,
    log,
    saved: savedFoods(data),
  };
}

function readCalories(userObj) {
  if (userObj.calories && typeof userObj.calories === 'object') return normalize(userObj.calories);
  try {
    const raw = localStorage.getItem(storageKey(userObj.email));
    return raw ? normalize(JSON.parse(raw)) : normalize({});
  } catch {
    return normalize({});
  }
}

export function readCalorieBook(userObj) {
  return readCalories(userObj);
}

export function caloriesOn(book, key) {
  const rows = book?.log?.[key];
  if (!Array.isArray(rows)) return 0;
  return rows.reduce((sum, item) => sum + (Number(item?.calories) > 0 ? Number(item.calories) : 0), 0);
}

function todayEntries(book) {
  const rows = book.log[todayKey()];
  if (!Array.isArray(rows)) return [];
  return rows.filter((item) => item && item.name && Number(item.calories) > 0);
}

function trimLog(log) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const keep = {};
  Object.keys(log).forEach((key) => {
    const parsed = new Date(`${key}T12:00:00`);
    if (Number.isNaN(parsed.getTime()) || parsed >= cutoff) keep[key] = log[key];
  });
  return keep;
}

function CaloriePage({ userObj, theme, onBack }) {
  const dark = theme.background === '#0e1111';
  const ink = dark ? '#fff9ef' : '#241f33';
  const muted = dark ? 'rgba(255,249,239,0.62)' : '#6d6578';
  const card = dark ? 'rgba(255,249,239,0.07)' : 'rgba(255,255,255,0.82)';
  const line = dark ? 'rgba(255,249,239,0.14)' : 'rgba(36,31,51,0.08)';
  const [book, setBook] = useState(() => readCalories(userObj));
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [saveFood, setSaveFood] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [savedQuery, setSavedQuery] = useState('');
  const [goalDraft, setGoalDraft] = useState(() => String(readCalories(userObj).goal));
  const [editingGoal, setEditingGoal] = useState(false);
  const [note, setNote] = useState('');

  const entries = todayEntries(book);
  const eaten = entries.reduce((sum, item) => sum + Number(item.calories), 0);
  const left = book.goal - eaten;
  const goalMet = book.goal > 0 ? Math.min(100, Math.round((Math.min(eaten, book.goal) / book.goal) * 100)) : 0;
  const overflow = book.goal > 0 && eaten > book.goal ? (eaten - book.goal) / book.goal : 0;
  const overflowFill = overflow === 0 ? 0 : (overflow % 1 === 0 ? 100 : Math.round((overflow % 1) * 100));
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const savedSearch = savedQuery.trim().toLowerCase();
  const visibleSaved = savedSearch
    ? book.saved.filter((item) => (
      item.name.toLowerCase().includes(savedSearch) || String(item.calories).includes(savedSearch)
    ))
    : book.saved;

  function openSaved() {
    setSavedQuery('');
    setShowSaved(true);
  }

  function closeSaved() {
    setShowSaved(false);
    setSavedQuery('');
  }

  function persist(next) {
    const stored = {
      goal: next.goal,
      log: trimLog(next.log),
      saved: savedFoods(next),
    };
    userObj.calories = stored;
    localStorage.setItem(storageKey(userObj.email), JSON.stringify(stored));
    setBook(stored);
    axios.put(`${API_URL}/api/users/${userObj.email}`, { ...userObj, calories: stored }).catch((error) => {
      console.log('calorie save', error);
    });
  }

  function addFood() {
    const calories = Number(amount);
    const title = name.trim();
    if (!title) {
      setNote('Name the food.');
      return;
    }
    if (!Number.isFinite(calories) || calories <= 0) {
      setNote('Enter calories greater than 0.');
      return;
    }
    const key = todayKey();
    const entry = { id: `${Date.now()}`, name: title.slice(0, 40), calories: Math.round(calories) };
    persist({
      ...book,
      log: { ...book.log, [key]: [...todayEntries(book), entry] },
      saved: saveFood ? upsertSaved(book.saved, entry) : book.saved,
    });
    setName('');
    setAmount('');
    setSaveFood(false);
    setNote('');
  }

  function addSavedToToday(item) {
    const key = todayKey();
    persist({
      ...book,
      log: {
        ...book.log,
        [key]: [...todayEntries(book), { id: `${Date.now()}`, name: item.name, calories: item.calories }],
      },
    });
    closeSaved();
    setNote('');
  }

  function unsaveFood(id) {
    persist({
      ...book,
      saved: book.saved.filter((item) => item.id !== id),
    });
  }

  function removeFood(id) {
    const key = todayKey();
    persist({
      ...book,
      log: { ...book.log, [key]: todayEntries(book).filter((item) => item.id !== id) },
    });
  }

  function startGoalEdit() {
    setGoalDraft(String(book.goal));
    setEditingGoal(true);
    setNote('');
  }

  function saveGoal() {
    const next = Number(goalDraft);
    if (!Number.isFinite(next) || next <= 0) {
      setGoalDraft(String(book.goal));
      setEditingGoal(false);
      setNote('Enter a daily goal greater than 0.');
      return;
    }
    const rounded = Math.round(next);
    setEditingGoal(false);
    setGoalDraft(String(rounded));
    if (rounded === book.goal) return;
    persist({ ...book, goal: rounded });
  }

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable aria-label="Back" onPress={onBack} style={styles.back}>
          <TextFont style={[styles.backText, { color: ink }]}>Back</TextFont>
        </Pressable>
        {editingGoal ? (
          <TextInput
            aria-label="Daily calorie goal"
            autoFocus
            inputMode="numeric"
            type="number"
            style={[styles.goalInput, { color: ink, borderColor: line, backgroundColor: card }]}
            value={goalDraft}
            onChangeText={setGoalDraft}
            onFocus={(event) => event.target.select()}
            onBlur={saveGoal}
            onSubmitEditing={saveGoal}
            placeholder="2000"
          />
        ) : (
          <Pressable aria-label="Edit daily calorie goal" onPress={startGoalEdit} style={styles.goalChip}>
            <TextFont style={[styles.goalLabel, { color: muted }]}>Goal</TextFont>
            <TextFont style={[styles.goalValue, { color: ink }]}>{book.goal.toLocaleString()}</TextFont>
            <FontAwesome5 name="pencil-alt" style={{ fontSize: 11, color: muted, marginLeft: 5 }} />
          </Pressable>
        )}
      </View>
      <TextFont style={[styles.title, { color: ink }]}>Calories</TextFont>
      <TextFont style={[styles.date, { color: muted }]}>{todayLabel}</TextFont>

      <View style={[styles.summary, { backgroundColor: card, borderColor: line }]}>
        <View style={styles.summaryRow}>
          <View>
            <TextFont style={[styles.big, { color: ink }]}>{eaten.toLocaleString()}</TextFont>
            <TextFont style={[styles.caption, { color: muted }]}>eaten</TextFont>
          </View>
          <View style={styles.rightStat}>
            <TextFont style={[styles.big, { color: ink }]}>{Math.abs(left).toLocaleString()}</TextFont>
            <TextFont style={[styles.caption, { color: muted }]}>{left >= 0 ? 'left' : 'over'}</TextFont>
          </View>
        </View>
        <View style={[styles.track, { backgroundColor: line }]}>
          <View style={[styles.fill, { width: `${goalMet}%`, backgroundColor: theme.primary }]} />
          {overflowFill > 0 ? (
            <View style={[styles.fill, styles.overfill, { width: `${overflowFill}%` }]} />
          ) : null}
        </View>
      </View>

      <View style={[styles.savedLinkCard, { backgroundColor: card, borderColor: line }]}>
        <Pressable aria-label="View saved foods" onPress={openSaved} style={styles.savedLinkHit}>
          <TextFont style={[styles.savedLink, { color: ink }]}>View Saved Foods</TextFont>
        </Pressable>
      </View>

      <View style={[styles.composer, { backgroundColor: card, borderColor: line }]}>
        <TextInput
          aria-label="Food name"
          style={[styles.titleInput, { color: ink, borderColor: line }]}
          value={name}
          onChangeText={setName}
          placeholder="New food"
        />
        <View style={styles.composerRow}>
          <TextInput
            aria-label="Calories"
            inputMode="numeric"
            type="number"
            style={[styles.input, styles.calorieInput, { color: ink, borderColor: line }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Cal"
          />
          <Pressable
            aria-label={saveFood ? 'Stop bookmarking this food' : 'Bookmark this food'}
            aria-pressed={saveFood}
            style={styles.bookmark}
            onPress={() => setSaveFood((on) => !on)}
          >
            <FontAwesome5
              name={saveFood ? 'bookmark' : 'bookmark-o'}
              style={{ fontSize: 18, color: saveFood ? ink : muted }}
            />
          </Pressable>
          <Pressable aria-label="Add food" style={[styles.add, { backgroundColor: theme.primary }]} onPress={addFood}>
            <TextFont style={styles.addText}>Add</TextFont>
          </Pressable>
        </View>
      </View>
      {note ? <TextFont style={[styles.note, { color: muted }]}>{note}</TextFont> : null}

      <TextFont style={[styles.section, { color: muted }]}>Today</TextFont>
      {entries.length === 0 ? (
        <TextFont style={[styles.empty, { color: muted }]}>Nothing logged yet.</TextFont>
      ) : (
        entries.map((item) => (
          <View key={item.id} style={[styles.entry, { backgroundColor: card, borderColor: line }]}>
            <TextFont style={[styles.food, { color: ink }]}>{item.name}</TextFont>
            <TextFont style={[styles.calories, { color: ink }]}>{item.calories}</TextFont>
            <Pressable aria-label={`Delete ${item.name}`} onPress={() => removeFood(item.id)} style={styles.trash}>
              <FontAwesome5 name="trash" style={{ fontSize: 14, color: muted }} />
            </Pressable>
          </View>
        ))
      )}

      {showSaved ? (
        <View style={styles.overlay}>
          <Pressable aria-label="Close saved foods" style={styles.scrim} onPress={closeSaved} />
          <View style={[styles.sheet, { backgroundColor: dark ? '#1a1d1d' : '#fff9ef', borderColor: line }]}>
            <View style={[styles.sheetHead, { borderColor: line }]}>
              <TextFont style={[styles.sheetTitle, { color: ink }]}>Saved foods</TextFont>
              <Pressable aria-label="Close" onPress={closeSaved} style={styles.sheetClose}>
                <TextFont style={[styles.sheetCloseText, { color: ink }]}>Close</TextFont>
              </Pressable>
            </View>
            <View style={[styles.searchWrap, { borderColor: line }]}>
              <TextInput
                aria-label="Search saved foods"
                autoFocus
                style={[styles.searchInput, { color: ink, borderColor: line }]}
                value={savedQuery}
                onChangeText={setSavedQuery}
                placeholder="Search"
              />
            </View>
            {book.saved.length === 0 ? (
              <TextFont style={[styles.sheetEmpty, { color: muted }]}>Bookmark a food when you add it.</TextFont>
            ) : visibleSaved.length === 0 ? (
              <TextFont style={[styles.sheetEmpty, { color: muted }]}>No matches.</TextFont>
            ) : (
              <ScrollView style={styles.sheetList}>
                {visibleSaved.map((item) => (
                  <View key={item.id} style={[styles.entry, styles.sheetEntry, { backgroundColor: card, borderColor: line }]}>
                    <Pressable
                      aria-label={`Add ${item.name}`}
                      onPress={() => addSavedToToday(item)}
                      style={styles.sheetFood}
                    >
                      <TextFont style={[styles.food, { color: ink }]}>{item.name}</TextFont>
                      <TextFont style={[styles.calories, { color: ink }]}>{item.calories}</TextFont>
                    </Pressable>
                    <Pressable aria-label={`Remove ${item.name} from saved`} onPress={() => unsaveFood(item.id)} style={styles.trash}>
                      <FontAwesome5 name="trash" style={{ fontSize: 14, color: muted }} />
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default CaloriePage;

const styles = StyleSheet.create({
  page: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 120,
    alignItems: 'center',
  },
  topBar: {
    width: '88%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  back: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingRight: 12,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    width: '88%',
    fontSize: 34,
    fontWeight: '600',
  },
  date: {
    width: '88%',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 18,
  },
  summary: {
    width: '88%',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rightStat: {
    alignItems: 'flex-end',
  },
  big: {
    fontSize: 28,
    fontWeight: '600',
  },
  caption: {
    fontSize: 13,
    marginTop: 2,
  },
  track: {
    position: 'relative',
    height: 8,
    borderRadius: 4,
    marginTop: 14,
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    height: 8,
    borderRadius: 4,
  },
  overfill: {
    backgroundColor: '#d64545',
    zIndex: 1,
  },
  goalChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 8,
  },
  goalLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginRight: 6,
  },
  goalValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalInput: {
    width: 88,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    paddingLeft: 8,
    paddingRight: 8,
    fontSize: 16,
    textAlign: 'right',
  },
  savedLinkCard: {
    width: '88%',
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 16,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedLinkHit: {
    width: '100%',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 16,
  },
  savedLink: {
    fontSize: 15,
    fontWeight: '600',
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  composer: {
    width: '88%',
    borderWidth: 1,
    borderRadius: 16,
    marginTop: 10,
    overflow: 'hidden',
  },
  titleInput: {
    height: 58,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
    paddingLeft: 16,
    paddingRight: 16,
    fontSize: 22,
    fontWeight: '600',
  },
  composerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 12,
    paddingRight: 12,
  },
  input: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 16,
  },
  calorieInput: {
    flex: 1,
  },
  bookmark: {
    width: 40,
    height: 40,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    marginLeft: 4,
    height: 40,
    paddingLeft: 18,
    paddingRight: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: '#241f33',
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    width: '88%',
    marginTop: 8,
    fontSize: 13,
  },
  section: {
    width: '88%',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 22,
    marginBottom: 10,
  },
  empty: {
    width: '88%',
    fontSize: 14,
  },
  entry: {
    width: '88%',
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 8,
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  food: {
    flex: 1,
    fontSize: 16,
  },
  calories: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  trash: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    width: '88%',
    maxWidth: 420,
    maxHeight: '70vh',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 10,
    borderBottomWidth: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sheetClose: {
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 8,
  },
  sheetCloseText: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchWrap: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    borderBottomWidth: 1,
  },
  searchInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
  },
  sheetEmpty: {
    padding: 16,
    fontSize: 14,
  },
  sheetList: {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
  },
  sheetEntry: {
    width: '100%',
  },
  sheetFood: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
  },
});
