export const SLOTS = [
  { id: 'breakfast', label: 'Breakfast' },
  { id: 'lunch', label: 'Lunch' },
  { id: 'dinner', label: 'Dinner' },
  { id: 'snack', label: 'Snack' },
];

const PRODUCE = /\b(banana|apple|spinach|avocado|berry|berries|broccoli|lettuce|tomato|onion|pepper|carrot|kale|lemon|lime|cilantro|basil|cucumber|zucchini|potato|garlic|ginger|mango|orange|grape|celery|mushroom|cabbage|corn|pea|mint|parsley|strawberry|blueberry|raspberry|salad|greens|herb)\b/i;
const KEEP_DAYS = 60;

export function mealsKey(email) {
  return `mm-meals:${email || 'local'}`;
}

export function groceryQueueKey(email) {
  return `mm-grocery-queue:${email || 'local'}`;
}

export function dayKey(date = new Date()) {
  const stamp = atNoon(date);
  const month = String(stamp.getMonth() + 1).padStart(2, '0');
  const day = String(stamp.getDate()).padStart(2, '0');
  return `${stamp.getFullYear()}-${month}-${day}`;
}

export function atNoon(date) {
  const stamp = date instanceof Date ? date : new Date(date);
  return new Date(stamp.getFullYear(), stamp.getMonth(), stamp.getDate(), 12);
}

export function fromDayKey(key) {
  const [year, month, day] = String(key || '').split('-').map(Number);
  if (!year || !month || !day) return atNoon(new Date());
  return new Date(year, month - 1, day, 12);
}

export function weekSunday(date) {
  const stamp = atNoon(date);
  stamp.setDate(stamp.getDate() - stamp.getDay());
  return stamp;
}

export function weekDays(date) {
  const start = weekSunday(date);
  return Array.from({ length: 7 }, (_, index) => {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    return next;
  });
}

export function shiftDays(date, amount) {
  const next = atNoon(date);
  next.setDate(next.getDate() + amount);
  return next;
}

export function formatRange(days) {
  if (!days.length) return '';
  const start = days[0].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const end = days[6].toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${start} – ${end}`;
}

export function slotLabel(id) {
  return SLOTS.find((slot) => slot.id === id)?.label || 'Meal';
}

export function inferAisle(name) {
  return PRODUCE.test(name || '') ? 'Produce' : 'Aisle';
}

function cleanIngredient(item) {
  const name = String(item?.name || '').trim().slice(0, 40);
  if (!name) return null;
  return {
    id: String(item.id || `${name}-${Math.random().toString(36).slice(2, 8)}`),
    name,
    amount: String(item.amount || '').trim().slice(0, 24),
    aisle: item.aisle === 'Produce' || inferAisle(name) === 'Produce' ? 'Produce' : 'Aisle',
  };
}

function cleanMeal(item) {
  if (!item || !item.title) return null;
  const calories = Number(item.calories);
  return {
    id: String(item.id || `m${Date.now()}`),
    slot: SLOTS.some((slot) => slot.id === item.slot) ? item.slot : 'dinner',
    title: String(item.title).trim().slice(0, 48),
    calories: Number.isFinite(calories) && calories > 0 ? Math.round(calories) : 0,
    ingredients: Array.isArray(item.ingredients) ? item.ingredients.map(cleanIngredient).filter(Boolean) : [],
    notes: String(item.notes || '').slice(0, 280),
    cooked: Boolean(item.cooked),
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

function cleanRecipe(item) {
  const meal = cleanMeal(item);
  if (!meal) return null;
  return {
    id: meal.id,
    slot: meal.slot,
    title: meal.title,
    calories: meal.calories,
    ingredients: meal.ingredients,
    notes: meal.notes,
  };
}

function emptyBook() {
  return { days: {}, recipes: [] };
}

export function mealsOn(book, key) {
  const rows = book?.days?.[key];
  return Array.isArray(rows) ? rows.map(cleanMeal).filter(Boolean) : [];
}

export function mealsForSlot(meals, slot) {
  return (meals || []).filter((item) => item.slot === slot);
}

export function dayCalories(meals) {
  return (meals || []).reduce((sum, item) => sum + (Number(item.calories) > 0 ? Number(item.calories) : 0), 0);
}

export function nextOpenSlot(meals) {
  for (const slot of SLOTS) {
    if (!mealsForSlot(meals, slot.id).length) return slot.id;
  }
  return 'dinner';
}

function trimDays(days) {
  const cutoff = shiftDays(new Date(), -KEEP_DAYS);
  const keep = {};
  Object.keys(days || {}).forEach((key) => {
    const stamp = fromDayKey(key);
    if (stamp >= cutoff) keep[key] = days[key];
  });
  return keep;
}

export function normalizeMeals(data) {
  const days = {};
  const source = data?.days && typeof data.days === 'object' ? data.days : {};
  Object.keys(source).forEach((key) => {
    const rows = Array.isArray(source[key]) ? source[key].map(cleanMeal).filter(Boolean) : [];
    if (rows.length) days[key] = rows;
  });
  const recipes = Array.isArray(data?.recipes) ? data.recipes.map(cleanRecipe).filter(Boolean) : [];
  return { days, recipes };
}

function meal(id, slot, title, calories, ingredients, notes = '', cooked = false, daysFromToday = 0) {
  const created = shiftDays(new Date(), daysFromToday);
  return {
    id,
    slot,
    title,
    calories,
    ingredients: ingredients.map((row, index) => ({
      id: `${id}-i${index}`,
      name: row[0],
      amount: row[1],
      aisle: inferAisle(row[0]),
    })),
    notes,
    cooked,
    createdAt: created.toISOString(),
  };
}

function starterRecipes() {
  return [
    cleanRecipe(meal('r-oats', 'breakfast', 'Overnight oats', 420, [['Oats', '1 cup'], ['Oat milk', '1 cup'], ['Berries', '1/2 cup'], ['Peanut butter', '1 tbsp']], 'Stir overnight. Add honey if you want it sweeter.')),
    cleanRecipe(meal('r-eggs', 'breakfast', 'Eggs and toast', 380, [['Eggs', '2'], ['Bread', '2 slices'], ['Spinach', '1 handful']], 'Soft scramble, greens on the side.')),
    cleanRecipe(meal('r-bowl', 'lunch', 'Chicken rice bowl', 640, [['Chicken', '6 oz'], ['Rice', '1 cup'], ['Broccoli', '1 cup'], ['Olive oil', '1 tbsp']], 'Batch the rice on Sunday.')),
    cleanRecipe(meal('r-wrap', 'lunch', 'Turkey wrap', 490, [['Tortilla', '1'], ['Turkey', '4 oz'], ['Spinach', '1 handful'], ['Avocado', '1/2']], '')),
    cleanRecipe(meal('r-pasta', 'dinner', 'Garlic pasta', 720, [['Pasta', '6 oz'], ['Garlic', '3 cloves'], ['Olive oil', '2 tbsp'], ['Broccoli', '1 cup']], 'Salt the water well.')),
    cleanRecipe(meal('r-salmon', 'dinner', 'Salmon and greens', 610, [['Salmon', '6 oz'], ['Broccoli', '1 cup'], ['Rice', '3/4 cup'], ['Lemon', '1']], 'Sheet pan, 12 minutes at 425.')),
    cleanRecipe(meal('r-yogurt', 'snack', 'Greek yogurt cup', 220, [['Greek yogurt', '1 cup'], ['Berries', '1/2 cup']], '')),
  ];
}

function starterDays() {
  const recipes = starterRecipes();
  const pick = (id) => recipes.find((item) => item.id === id);
  const place = (recipe, id, cooked, offset) => ({
    ...recipe,
    id,
    cooked,
    createdAt: shiftDays(new Date(), offset).toISOString(),
  });
  const days = {};
  const today = atNoon(new Date());
  const sunday = weekSunday(today);
  const offsets = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);
    return Math.round((date - today) / 86400000);
  });
  const plan = [
    [0, [['r-oats', true], ['r-bowl', true], ['r-salmon', true]]],
    [1, [['r-eggs', true], ['r-wrap', false]]],
    [2, [['r-oats', true], ['r-bowl', true], ['r-pasta', false]]],
    [3, [['r-eggs', true], ['r-yogurt', true]]],
    [4, [['r-oats', false], ['r-bowl', false]]],
    [5, [['r-eggs', false], ['r-salmon', false]]],
    [6, [['r-oats', false]]],
  ];
  plan.forEach(([index, rows]) => {
    const offset = offsets[index];
    if (offset > 1) return;
    const key = dayKey(shiftDays(today, offset));
    days[key] = rows.map(([recipeId, cooked], mealIndex) => {
      const recipe = pick(recipeId);
      return recipe ? place(recipe, `seed-${index}-${mealIndex}`, cooked && offset < 0, offset) : null;
    }).filter((item) => item?.title);
  });
  return days;
}

export function seedBook() {
  return normalizeMeals({
    days: starterDays(),
    recipes: starterRecipes(),
  });
}

export function readMeals(userObj) {
  if (userObj?.meals && typeof userObj.meals === 'object') {
    const fromUser = normalizeMeals(userObj.meals);
    if (Object.keys(fromUser.days).length || fromUser.recipes.length) return fromUser;
  }
  try {
    const raw = localStorage.getItem(mealsKey(userObj?.email));
    if (raw) {
      const stored = normalizeMeals(JSON.parse(raw));
      if (Object.keys(stored.days).length || stored.recipes.length) return stored;
    }
  } catch {
    // fall through to seed
  }
  const seeded = seedBook();
  try {
    localStorage.setItem(mealsKey(userObj?.email), JSON.stringify(seeded));
  } catch {
    // keep the in-memory seed even if storage is blocked
  }
  return seeded;
}

export function storedMeals(book) {
  return {
    days: trimDays(book.days || {}),
    recipes: Array.isArray(book.recipes) ? book.recipes.map(cleanRecipe).filter(Boolean) : [],
  };
}

export function setDayMeals(book, key, meals) {
  const cleaned = meals.map(cleanMeal).filter(Boolean);
  const days = { ...book.days };
  if (cleaned.length) days[key] = cleaned;
  else delete days[key];
  return { ...book, days };
}

export function upsertRecipe(book, meal) {
  const recipe = cleanRecipe({ ...meal, id: meal.recipeId || meal.id || `r${Date.now()}` });
  if (!recipe) return book;
  const existing = book.recipes.find((item) => item.title.trim().toLowerCase() === recipe.title.trim().toLowerCase());
  if (existing) {
    return {
      ...book,
      recipes: book.recipes.map((item) => (item.id === existing.id ? { ...recipe, id: existing.id } : item)),
    };
  }
  return { ...book, recipes: [...book.recipes, recipe] };
}

export function copyWeek(book, fromDays, toDays) {
  let days = { ...book.days };
  let copied = 0;
  toDays.forEach((date, index) => {
    const targetKey = dayKey(date);
    if (mealsOn({ days }, targetKey).length) return;
    const source = mealsOn({ days }, dayKey(fromDays[index]));
    if (!source.length) return;
    days[targetKey] = source.map((item) => ({
      ...item,
      id: `m${Date.now()}-${index}-${item.id}`,
      cooked: false,
      createdAt: new Date().toISOString(),
    }));
    copied += 1;
  });
  return { book: { ...book, days }, copied };
}

export function ingredientsToGrocery(meals) {
  const rows = [];
  (meals || []).forEach((meal) => {
    (meal.ingredients || []).forEach((item) => {
      const name = String(item.name || '').trim();
      if (!name) return;
      rows.push({
        id: `q${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: name.slice(0, 40),
        amount: String(item.amount || '').trim(),
        aisle: item.aisle === 'Produce' || inferAisle(name) === 'Produce' ? 'Produce' : 'Aisle',
        complete: false,
        comments: meal.title ? `For ${meal.title}` : '',
        createdAt: new Date().toISOString(),
      });
    });
  });
  return rows;
}

export function queueGroceryItems(email, items) {
  if (!items?.length) return 0;
  const key = groceryQueueKey(email);
  let existing = [];
  try {
    const raw = localStorage.getItem(key);
    existing = raw ? JSON.parse(raw) : [];
  } catch {
    existing = [];
  }
  if (!Array.isArray(existing)) existing = [];
  localStorage.setItem(key, JSON.stringify([...existing, ...items]));
  return items.length;
}

export function peekGroceryQueue(email) {
  try {
    const raw = localStorage.getItem(groceryQueueKey(email));
    const rows = raw ? JSON.parse(raw) : [];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

export function takeGroceryQueue(email) {
  const key = groceryQueueKey(email);
  const rows = peekGroceryQueue(email);
  localStorage.removeItem(key);
  return rows;
}
