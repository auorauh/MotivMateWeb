import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Button, Pressable, ScrollView, StyleSheet, TextInput, View } from '../platform';
import FontAwesome5 from '../platform/icons';
import TextFont from './TextFont';
import BackgroundSVG from '../assets/BackgroundSVG';
import DarkBackground from '../assets/DarkBackground';
import MealCard from './MealCard';
import MealDetail from './MealDetail';
import { API_URL } from '../platform/env';
import { readCalorieBook } from './CaloriePage';
import {
  SLOTS,
  copyWeek,
  dayCalories,
  dayKey,
  formatRange,
  inferAisle,
  ingredientsToGrocery,
  mealsForSlot,
  mealsOn,
  nextOpenSlot,
  queueGroceryItems,
  readMeals,
  setDayMeals,
  shiftDays,
  storedMeals,
  upsertRecipe,
  weekDays,
  weekSunday,
  fromDayKey,
} from '../functions/meals';

function MealPlanPage({ userObj, theme, onBack, addRef }) {
  const dark = theme.background === '#0e1111';
  const ink = dark ? '#fff9ef' : '#241f33';
  const muted = dark ? 'rgba(255,249,239,0.62)' : '#6d6578';
  const card = dark ? 'rgba(255,249,239,0.07)' : 'rgba(255,255,255,0.82)';
  const line = dark ? 'rgba(255,249,239,0.14)' : 'rgba(36,31,51,0.08)';
  const today = useMemo(() => {
    const stamp = new Date();
    return new Date(stamp.getFullYear(), stamp.getMonth(), stamp.getDate(), 12);
  }, []);

  const [book, setBook] = useState(() => readMeals(userObj));
  const [cursor, setCursor] = useState(today);
  const [selectedKey, setSelectedKey] = useState(dayKey(today));
  const [adding, setAdding] = useState(false);
  const [addingToBook, setAddingToBook] = useState(false);
  const [addSlot, setAddSlot] = useState('dinner');
  const [title, setTitle] = useState('');
  const [calories, setCalories] = useState('');
  const [notes, setNotes] = useState('');
  const [ingName, setIngName] = useState('');
  const [ingAmount, setIngAmount] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [saveRecipe, setSaveRecipe] = useState(false);
  const [showRecipes, setShowRecipes] = useState(false);
  const [recipeQuery, setRecipeQuery] = useState('');
  const [recipeSlot, setRecipeSlot] = useState('all');
  const [viewing, setViewing] = useState(null);
  const [viewOrigin, setViewOrigin] = useState(null);
  const [flash, setFlash] = useState('');

  const days = weekDays(cursor);
  const selected = days.find((date) => dayKey(date) === selectedKey) || days[Math.min(today.getDay(), 6)];
  const selectedDate = selected || today;
  const key = dayKey(selectedDate);
  const dayMeals = mealsOn(book, key);
  const planned = dayCalories(dayMeals);
  const cookedCount = dayMeals.filter((item) => item.cooked).length;
  const calorieGoal = readCalorieBook(userObj).goal;
  const isToday = key === dayKey(today);
  const isFuture = selectedDate > today;
  const rangeLabel = formatRange(days);
  const recipeSearch = recipeQuery.trim().toLowerCase();
  const visibleRecipes = book.recipes.filter((item) => {
    if (recipeSlot !== 'all' && item.slot !== recipeSlot) return false;
    if (!recipeSearch) return true;
    return item.title.toLowerCase().includes(recipeSearch)
      || (item.ingredients || []).some((row) => row.name.toLowerCase().includes(recipeSearch));
  });

  function persist(next) {
    const stored = storedMeals(next);
    userObj.meals = stored;
    localStorage.setItem(`mm-meals:${userObj?.email || 'local'}`, JSON.stringify(stored));
    setBook(stored);
    axios.put(`${API_URL}/api/users/${userObj.email}`, { ...userObj, meals: stored }).catch((error) => {
      console.log('meal save', error);
    });
  }

  function updateDay(nextMeals) {
    persist(setDayMeals(book, key, nextMeals));
  }

  function ping(message) {
    setFlash(message);
  }

  useEffect(() => {
    if (!flash) return undefined;
    const id = window.setTimeout(() => setFlash(''), 2400);
    return () => window.clearTimeout(id);
  }, [flash]);

  function resetComposer(slot, toBook) {
    setAddSlot(slot || nextOpenSlot(dayMeals));
    setTitle('');
    setCalories('');
    setNotes('');
    setIngredients([]);
    setIngName('');
    setIngAmount('');
    setSaveRecipe(Boolean(toBook));
    setAddingToBook(Boolean(toBook));
    setAdding(true);
  }

  function openAdd(slot) {
    resetComposer(slot, false);
  }

  function openAddToBook() {
    const slot = recipeSlot !== 'all' ? recipeSlot : 'dinner';
    setShowRecipes(false);
    resetComposer(slot, true);
  }

  function closeComposer() {
    setAdding(false);
    setAddingToBook(false);
  }

  useEffect(() => {
    if (!addRef) return undefined;
    addRef.current = () => openAdd(nextOpenSlot(mealsOn(book, selectedKey)));
    return () => {
      addRef.current = null;
    };
  }, [addRef, book, selectedKey]);

  function addIngredient() {
    const name = ingName.trim();
    if (!name) return;
    setIngredients((rows) => [
      ...rows,
      {
        id: `i${Date.now()}`,
        name: name.slice(0, 40),
        amount: ingAmount.trim().slice(0, 24),
        aisle: inferAisle(name),
      },
    ]);
    setIngName('');
    setIngAmount('');
  }

  function addMeal() {
    const name = title.trim();
    if (!name) return;
    const nextCal = Number(calories);
    const entry = {
      id: `m${Date.now()}`,
      slot: addSlot,
      title: name.slice(0, 48),
      calories: Number.isFinite(nextCal) && nextCal > 0 ? Math.round(nextCal) : 0,
      ingredients,
      notes: notes.trim(),
      cooked: false,
      createdAt: new Date().toISOString(),
    };
    if (addingToBook) {
      persist(upsertRecipe(book, { ...entry, id: `r${Date.now()}` }));
      closeComposer();
      setShowRecipes(true);
      ping('Saved to the recipe book.');
      return;
    }
    let next = setDayMeals(book, key, [...dayMeals, entry]);
    if (saveRecipe) next = upsertRecipe(next, entry);
    persist(next);
    closeComposer();
    ping(saveRecipe ? 'Meal saved and added to recipes.' : 'Meal added.');
  }

  function toggleMeal(id) {
    updateDay(dayMeals.map((item) => (
      item.id === id ? { ...item, cooked: !item.cooked } : item
    )));
  }

  function saveMeal(next) {
    updateDay(dayMeals.map((item) => (item.id === next.id ? next : item)));
    setViewing(next);
  }

  function deleteMeal(id) {
    updateDay(dayMeals.filter((item) => item.id !== id));
    setViewing((open) => (open?.id === id ? null : open));
  }

  function duplicateMeal(meal, date) {
    const target = dayKey(date);
    const rows = mealsOn(book, target);
    persist(setDayMeals(book, target, [
      ...rows,
      { ...meal, id: `m${Date.now()}`, cooked: false, createdAt: new Date().toISOString() },
    ]));
  }

  function groceryFrom(meals, label) {
    const items = ingredientsToGrocery(Array.isArray(meals) ? meals : [meals]);
    const count = queueGroceryItems(userObj.email, items);
    ping(count ? `${count} item${count === 1 ? '' : 's'} queued for Grocery lists.` : `Add ingredients to ${label} first.`);
    return count;
  }

  function addRecipeToDay(recipe) {
    const entry = {
      ...recipe,
      id: `m${Date.now()}`,
      cooked: false,
      createdAt: new Date().toISOString(),
    };
    persist(setDayMeals(book, key, [...dayMeals, entry]));
    setShowRecipes(false);
    ping(`Added ${recipe.title}.`);
  }

  function removeRecipe(id) {
    persist({ ...book, recipes: book.recipes.filter((item) => item.id !== id) });
  }

  function jumpToday() {
    setCursor(today);
    setSelectedKey(dayKey(today));
  }

  function shiftWeek(amount) {
    const next = shiftDays(weekSunday(cursor), amount * 7);
    const weekday = fromDayKey(selectedKey).getDay();
    setCursor(next);
    setSelectedKey(dayKey(weekDays(next)[weekday]));
  }

  function copyPrevious() {
    const start = weekSunday(cursor);
    const previous = weekDays(shiftDays(start, -1));
    const result = copyWeek(book, previous, days);
    persist(result.book);
    ping(result.copied
      ? `Copied ${result.copied} day${result.copied === 1 ? '' : 's'} from last week.`
      : 'Nothing empty to fill from last week.');
  }

  const selectedLabel = selectedDate.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });
  const fill = calorieGoal > 0 ? Math.min(100, Math.round((planned / calorieGoal) * 100)) : 0;

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable aria-label="Back" onPress={onBack} style={styles.back}>
          <TextFont style={[styles.backText, { color: ink }]}>Back</TextFont>
        </Pressable>
        <TextFont style={[styles.pageTitle, { color: ink }]}>Meal plan</TextFont>
        <Pressable aria-label="Recipes" onPress={() => { setRecipeQuery(''); setShowRecipes(true); }} style={styles.iconBtn}>
          <FontAwesome5 name="book" style={{ fontSize: 18, color: ink }} />
        </Pressable>
      </View>

      <View style={styles.weekHead}>
        <Pressable aria-label="Previous week" onPress={() => shiftWeek(-1)} style={styles.iconBtn}>
          <FontAwesome5 name="chevron-left" style={{ fontSize: 16, color: ink }} />
        </Pressable>
        <Pressable aria-label="This week" onPress={jumpToday} style={styles.rangeHit}>
          <TextFont style={[styles.range, { color: ink }]}>{rangeLabel}</TextFont>
          <TextFont style={[styles.rangeHint, { color: muted }]}>{isToday ? 'This week' : 'Jump to today'}</TextFont>
        </Pressable>
        <Pressable aria-label="Next week" onPress={() => shiftWeek(1)} style={styles.iconBtn}>
          <FontAwesome5 name="chevron-right" style={{ fontSize: 16, color: ink }} />
        </Pressable>
      </View>

      <View style={styles.weekRow}>
        {days.map((date) => {
          const id = dayKey(date);
          const count = mealsOn(book, id).length;
          const active = id === key;
          const todayMark = id === dayKey(today);
          return (
            <Pressable
              key={id}
              aria-label={date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
              onPress={() => setSelectedKey(id)}
              style={[
                styles.dayChip,
                { borderColor: active ? theme.primary : line, backgroundColor: active ? theme.primary : card },
              ]}
            >
              <TextFont style={[styles.dayLetter, { color: active ? '#241f33' : ink }]}>
                {date.toLocaleDateString(undefined, { weekday: 'narrow' })}
              </TextFont>
              <TextFont style={[styles.dayNum, { color: active ? '#241f33' : ink }]}>{date.getDate()}</TextFont>
              <View style={styles.dots}>
                {Array.from({ length: Math.min(count, 4) }).map((_, index) => (
                  <View key={index} style={[styles.dot, { backgroundColor: active ? '#241f33' : theme.primary }]} />
                ))}
                {!count ? <View style={[styles.dot, { backgroundColor: todayMark && !active ? theme.primary : 'transparent' }]} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <ScrollView style={styles.scroll}>
        {flash ? <TextFont style={[styles.flash, { color: muted }]}>{flash}</TextFont> : null}
        <View style={[styles.summary, { backgroundColor: card, borderColor: line }]}>
          <TextFont style={[styles.dayTitle, { color: ink }]}>{selectedLabel}</TextFont>
          <View style={styles.summaryRow}>
            <View>
              <TextFont style={[styles.big, { color: ink }]}>{planned ? planned.toLocaleString() : '—'}</TextFont>
              <TextFont style={[styles.caption, { color: muted }]}>planned</TextFont>
            </View>
            <View style={styles.rightStat}>
              <TextFont style={[styles.big, { color: ink }]}>{cookedCount}/{dayMeals.length || 0}</TextFont>
              <TextFont style={[styles.caption, { color: muted }]}>{isFuture ? 'set' : 'cooked'}</TextFont>
            </View>
          </View>
          {calorieGoal > 0 ? (
            <View style={[styles.track, { backgroundColor: line }]}>
              <View style={[styles.fill, { width: `${fill}%`, backgroundColor: theme.primary }]} />
            </View>
          ) : null}
          <TextFont style={[styles.goalHint, { color: muted }]}>
            {calorieGoal > 0 ? `${calorieGoal.toLocaleString()} calorie goal` : 'Set a calorie goal in Tracker'}
          </TextFont>
        </View>

        {SLOTS.map((slot) => {
          const rows = mealsForSlot(dayMeals, slot.id);
          return (
            <View key={slot.id} style={styles.slotBlock}>
              <View style={styles.slotHead}>
                <TextFont style={[styles.slotTitle, { color: ink }]}>{slot.label}</TextFont>
                <Pressable aria-label={`Add ${slot.label}`} onPress={() => openAdd(slot.id)} style={styles.slotAdd}>
                  <TextFont style={[styles.slotAddText, { color: muted }]}>+ Add</TextFont>
                </Pressable>
              </View>
              {rows.length ? rows.map((meal) => (
                <View key={meal.id} style={styles.cardWrap}>
                  <MealCard
                    meal={meal}
                    theme={theme}
                    onToggle={toggleMeal}
                    onDelete={deleteMeal}
                    onView={(payload) => {
                      setViewing(payload.meal);
                      setViewOrigin(payload.origin || null);
                    }}
                  />
                </View>
              )) : (
                <Pressable
                  aria-label={`Plan ${slot.label}`}
                  onPress={() => openAdd(slot.id)}
                  style={[styles.emptySlot, { borderColor: line }]}
                >
                  <TextFont style={[styles.emptyText, { color: muted }]}>Nothing planned</TextFont>
                </Pressable>
              )}
            </View>
          );
        })}

        <View style={styles.actions}>
          <Pressable aria-label="Copy last week" onPress={copyPrevious} style={[styles.action, { borderColor: line, backgroundColor: card }]}>
            <FontAwesome5 name="redo" style={{ fontSize: 14, color: ink, marginRight: 8 }} />
            <TextFont style={[styles.actionText, { color: ink }]}>Copy last week</TextFont>
          </Pressable>
          <Pressable
            aria-label="Send day to grocery"
            onPress={() => groceryFrom(dayMeals, 'this day')}
            style={[styles.action, { borderColor: line, backgroundColor: card }]}
          >
            <FontAwesome5 name="shopping-cart" style={{ fontSize: 14, color: ink, marginRight: 8 }} />
            <TextFont style={[styles.actionText, { color: ink }]}>Day to grocery</TextFont>
          </Pressable>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {showRecipes ? (
        <View style={styles.overlay}>
          <Pressable aria-label="Close recipes" style={styles.scrim} onPress={() => setShowRecipes(false)} />
          <View style={[styles.sheet, { backgroundColor: dark ? '#1a1d1d' : '#fff9ef', borderColor: line }]}>
            <View style={[styles.sheetHead, { borderColor: line }]}>
              <TextFont style={[styles.sheetTitle, { color: ink }]}>Recipes</TextFont>
              <View style={styles.sheetActions}>
                <Pressable aria-label="Add saved meal" onPress={openAddToBook} style={styles.newRecipe}>
                  <FontAwesome5 name="plus" style={{ fontSize: 18, color: ink }} />
                </Pressable>
                <Pressable aria-label="Close" onPress={() => setShowRecipes(false)} style={styles.sheetClose}>
                  <TextFont style={[styles.sheetCloseText, { color: ink }]}>Close</TextFont>
                </Pressable>
              </View>
            </View>
            <TextInput
              aria-label="Search recipes"
              style={[styles.searchInput, { color: ink, borderColor: line }]}
              value={recipeQuery}
              onChangeText={setRecipeQuery}
              placeholder="Search meals"
              placeholderTextColor={muted}
            />
            <View style={styles.filterRow}>
              <Pressable onPress={() => setRecipeSlot('all')} style={[styles.filter, recipeSlot === 'all' ? { borderColor: theme.primary } : { borderColor: line }]}>
                <TextFont style={[styles.filterText, { color: ink }]}>All</TextFont>
              </Pressable>
              {SLOTS.map((slot) => (
                <Pressable
                  key={slot.id}
                  onPress={() => setRecipeSlot(slot.id)}
                  style={[styles.filter, recipeSlot === slot.id ? { borderColor: theme.primary } : { borderColor: line }]}
                >
                  <TextFont style={[styles.filterText, { color: ink }]}>{slot.label}</TextFont>
                </Pressable>
              ))}
            </View>
            <ScrollView style={styles.sheetList}>
              {visibleRecipes.length === 0 ? (
                <TextFont style={[styles.sheetEmpty, { color: muted }]}>
                  {book.recipes.length ? 'No matches.' : 'Tap + to add a saved meal.'}
                </TextFont>
              ) : visibleRecipes.map((item) => (
                <View key={item.id} style={[styles.recipeRow, { backgroundColor: card, borderColor: line }]}>
                  <Pressable aria-label={`Add ${item.title}`} onPress={() => addRecipeToDay(item)} style={styles.recipeHit}>
                    <TextFont style={[styles.recipeTitle, { color: ink }]}>{item.title}</TextFont>
                    <TextFont style={[styles.recipeMeta, { color: muted }]}>
                      {item.slot}
                      {item.calories ? ` · ${item.calories}` : ''}
                      {item.ingredients.length ? ` · ${item.ingredients.length} ingredients` : ''}
                    </TextFont>
                  </Pressable>
                  <View
                    aria-label={`Delete ${item.title}`}
                    role="button"
                    style={styles.recipeTrash}
                    onClick={(event) => {
                      event.stopPropagation();
                      removeRecipe(item.id);
                    }}
                  >
                    <FontAwesome5 name="trash" style={{ fontSize: 14, color: muted }} />
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      ) : null}

      {adding ? (
        <View style={[styles.addOverlay, { backgroundColor: theme.background }]}>
          {dark ? <DarkBackground /> : <BackgroundSVG />}
          <View style={styles.goalContainer}>
            <View style={styles.goalSection}>
              <TextFont style={styles.subText}>Meal</TextFont>
              <TextInput
                aria-label="New meal name"
                autoFocus
                style={styles.textInput}
                placeholder="Overnight oats..."
                placeholderTextColor="gray"
                value={title}
                onChangeText={setTitle}
                onSubmitEditing={addMeal}
              />
            </View>
            <View style={styles.goalSection}>
              <TextFont style={styles.subText}>When</TextFont>
              <View style={styles.types}>
                {SLOTS.map((slot) => (
                  <Pressable
                    key={slot.id}
                    style={[styles.typeChoice, addSlot === slot.id ? styles.typeHighlight : null]}
                    onPress={() => setAddSlot(slot.id)}
                  >
                    <TextFont style={[styles.typeText, addSlot === slot.id ? styles.typeSelected : null]}>{slot.label}</TextFont>
                  </Pressable>
                ))}
              </View>
            </View>
            <View style={styles.goalSection}>
              <TextFont style={styles.subText}>Calories</TextFont>
              <TextInput
                aria-label="New meal calories"
                inputMode="numeric"
                type="number"
                style={styles.textInput}
                placeholder="Optional"
                placeholderTextColor="gray"
                value={calories}
                onChangeText={setCalories}
                onSubmitEditing={addMeal}
              />
            </View>
            <View style={styles.goalSection}>
              <TextFont style={styles.subText}>Ingredients</TextFont>
              <View style={styles.ingComposer}>
                <TextInput
                  aria-label="New ingredient"
                  style={[styles.textInput, styles.ingField]}
                  placeholder="Chicken"
                  placeholderTextColor="gray"
                  value={ingName}
                  onChangeText={setIngName}
                  onSubmitEditing={addIngredient}
                />
                <TextInput
                  aria-label="New ingredient amount"
                  style={[styles.textInput, styles.amtField]}
                  placeholder="6 oz"
                  placeholderTextColor="gray"
                  value={ingAmount}
                  onChangeText={setIngAmount}
                  onSubmitEditing={addIngredient}
                />
              </View>
              {ingredients.length ? (
                <TextFont style={styles.ingPreview}>
                  {ingredients.map((item) => item.name).join(', ')}
                </TextFont>
              ) : null}
            </View>
            <View style={styles.goalSection}>
              <TextFont style={styles.subText}>Notes</TextFont>
              <TextInput
                aria-label="New meal notes"
                style={[styles.textInput, styles.commentsInput]}
                placeholder="Prep notes"
                placeholderTextColor="gray"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
            {addingToBook ? (
              <TextFont style={[styles.bookmarkText, { color: muted }]}>This goes in the recipe book, not the day.</TextFont>
            ) : (
              <Pressable
                aria-label="Save as recipe"
                onPress={() => setSaveRecipe((value) => !value)}
                style={styles.bookmarkRow}
              >
                <FontAwesome5
                  name={saveRecipe ? 'bookmark' : 'bookmark-o'}
                  style={{ fontSize: 18, color: saveRecipe ? ink : 'gray' }}
                />
                <TextFont style={[styles.bookmarkText, { color: saveRecipe ? ink : 'gray' }]}>Also save to recipe book</TextFont>
              </Pressable>
            )}
            <View style={styles.goalSection}>
              <View style={styles.buttonContainer}>
                <View style={styles.button}>
                  <Button title="Cancel" onPress={closeComposer} color="gray" />
                </View>
                <Pressable aria-label={addingToBook ? 'Save to recipe book' : 'Add meal'} onPress={addMeal} style={[styles.button, { backgroundColor: '#00bcd4' }]}>
                  <FontAwesome5 style={{ fontSize: 20 }} name="paper-plane" />
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {viewing ? (
        <MealDetail
          meal={viewing}
          origin={viewOrigin}
          theme={theme}
          weekDays={days}
          onClose={() => {
            setViewing(null);
            setViewOrigin(null);
          }}
          onSave={saveMeal}
          onDuplicate={duplicateMeal}
          onGrocery={(meal) => groceryFrom(meal, meal.title)}
          onSaveRecipe={(meal) => {
            persist(upsertRecipe(book, meal));
            ping('Saved to the recipe book.');
          }}
        />
      ) : null}
    </View>
  );
}

export default MealPlanPage;

const styles = StyleSheet.create({
  page: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    paddingTop: 20,
  },
  topBar: {
    width: '88%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  back: {
    paddingTop: 4,
    paddingBottom: 4,
    paddingRight: 10,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
  pageTitle: {
    flex: 1,
    fontSize: 28,
    fontWeight: '600',
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekHead: {
    width: '88%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  rangeHit: {
    flex: 1,
    alignItems: 'center',
  },
  range: {
    fontSize: 16,
    fontWeight: '600',
  },
  rangeHint: {
    fontSize: 12,
    marginTop: 1,
  },
  weekRow: {
    width: '88%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayChip: {
    width: 42,
    height: 62,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
  },
  dayLetter: {
    fontSize: 11,
    fontWeight: '700',
  },
  dayNum: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 2,
  },
  dots: {
    flexDirection: 'row',
    height: 6,
    marginTop: 4,
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
    minHeight: 0,
    paddingBottom: 120,
  },
  summary: {
    width: '88%',
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  dayTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  rightStat: {
    alignItems: 'flex-end',
  },
  big: {
    fontSize: 28,
    fontWeight: '700',
  },
  caption: {
    fontSize: 13,
    marginTop: 2,
  },
  track: {
    height: 8,
    borderRadius: 4,
    marginTop: 12,
    overflow: 'hidden',
  },
  fill: {
    height: 8,
    borderRadius: 4,
  },
  goalHint: {
    fontSize: 12,
    marginTop: 8,
  },
  slotBlock: {
    width: '88%',
    alignSelf: 'center',
    marginBottom: 16,
  },
  slotHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  slotTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  slotAdd: {
    padding: 4,
  },
  slotAddText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardWrap: {
    marginBottom: 8,
  },
  emptySlot: {
    height: 48,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  actions: {
    width: '88%',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  action: {
    flex: 1,
    minHeight: 46,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 8,
    paddingRight: 8,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  flash: {
    width: '88%',
    alignSelf: 'center',
    fontSize: 13,
    marginTop: 10,
    textAlign: 'center',
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
    maxHeight: '76vh',
    borderWidth: 1,
    borderRadius: 16,
    overflow: 'hidden',
    zIndex: 1,
    paddingBottom: 12,
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
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newRecipe: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetClose: {
    padding: 8,
  },
  sheetCloseText: {
    fontSize: 15,
    fontWeight: '600',
  },
  searchInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
    marginTop: 12,
    marginLeft: 12,
    marginRight: 12,
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 10,
    paddingLeft: 12,
    paddingRight: 12,
  },
  filter: {
    borderWidth: 1,
    borderRadius: 999,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 10,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  sheetList: {
    maxHeight: 360,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 8,
  },
  sheetEmpty: {
    fontSize: 14,
    padding: 16,
    textAlign: 'center',
  },
  recipeRow: {
    minHeight: 56,
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeHit: {
    flex: 1,
    minWidth: 0,
    paddingTop: 8,
    paddingBottom: 8,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  recipeMeta: {
    fontSize: 12,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  recipeTrash: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  addOverlay: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 480,
    maxWidth: '100%',
    transform: [{ translateX: '-50%' }],
    zIndex: 90,
    justifyContent: 'center',
    padding: 24,
    overflowY: 'auto',
  },
  goalContainer: {
    width: '100%',
    gap: 16,
  },
  goalSection: {
    width: '100%',
    alignItems: 'center',
  },
  textInput: {
    borderBottomWidth: 2,
    borderBottomColor: 'gray',
    backgroundColor: '#DDD',
    borderRadius: 15,
    width: '100%',
    padding: 12,
    color: '#666',
    fontSize: 18,
  },
  commentsInput: {
    minHeight: 72,
    textAlign: 'left',
    fontSize: 16,
  },
  types: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
  },
  typeChoice: {
    borderWidth: 2,
    borderColor: 'gray',
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 2,
    paddingRight: 2,
  },
  typeText: {
    color: 'gray',
    fontSize: 12,
    fontWeight: '600',
  },
  typeSelected: {
    color: '#00bcd4',
  },
  typeHighlight: {
    borderColor: '#00bcd4',
    boxShadow: '0 0 10px #00bcd4',
    borderWidth: 2,
  },
  subText: {
    fontSize: 22,
    fontWeight: 900,
    color: 'gray',
    marginBottom: 10,
  },
  ingComposer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  ingField: {
    flex: 1,
  },
  amtField: {
    width: 90,
  },
  ingPreview: {
    width: '100%',
    fontSize: 13,
    color: 'gray',
    marginTop: 8,
    textAlign: 'left',
  },
  bookmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  bookmarkText: {
    fontSize: 15,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    borderWidth: 2,
    borderColor: 'gray',
    flex: 1,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
