import { peekGroceryQueue, takeGroceryQueue } from './meals';

export function groceriesKey(email) {
  return `mm-groceries:${email || 'local'}`;
}

export function groceryDraftKey(email) {
  return `mm-grocery-draft:${email || 'local'}`;
}

function cleanItem(item) {
  const title = String(item?.title || '').trim().slice(0, 40);
  if (!title) return null;
  return {
    id: String(item.id || `g${Date.now()}`),
    title,
    amount: String(item.amount || '').trim().slice(0, 24),
    aisle: item.aisle === 'Produce' ? 'Produce' : 'Aisle',
    complete: item.complete === true,
    comments: String(item.comments || '').trim().slice(0, 240),
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

function cleanList(list) {
  const id = String(list?.id || `list-${Date.now()}`);
  const name = String(list?.name || 'Grocery list').trim().slice(0, 32) || 'Grocery list';
  const items = Array.isArray(list?.items) ? list.items.map(cleanItem).filter(Boolean) : [];
  return { id, name, items };
}

export function emptyGroceries() {
  return {
    currentId: 'weekly',
    lists: [{ id: 'weekly', name: "This week's shop", items: [] }],
  };
}

export function normalizeGroceries(data) {
  const lists = Array.isArray(data?.lists) ? data.lists.map(cleanList).filter((list) => list.id) : [];
  if (!lists.length) return emptyGroceries();
  const currentId = lists.some((list) => list.id === data?.currentId) ? data.currentId : lists[0].id;
  return { currentId, lists };
}

export function readGroceries(userObj) {
  const fromUser = userObj?.groceries;
  if (fromUser && typeof fromUser === 'object' && Array.isArray(fromUser.lists) && fromUser.lists.length) {
    return normalizeGroceries(fromUser);
  }
  try {
    const raw = localStorage.getItem(groceriesKey(userObj?.email));
    if (raw) return normalizeGroceries(JSON.parse(raw));
  } catch {
    // fall through
  }
  return emptyGroceries();
}

function withQueuedItems(book, queued) {
  const current = normalizeGroceries(book);
  if (!queued.length) return current;
  const targetId = current.currentId;
  return {
    ...current,
    lists: current.lists.map((list) => (
      list.id === targetId
        ? { ...list, items: [...list.items, ...queued.map(cleanItem).filter(Boolean)] }
        : list
    )),
  };
}

export function previewGroceryQueue(book, email) {
  return withQueuedItems(book, peekGroceryQueue(email));
}

export function absorbGroceryQueue(book, email) {
  const queued = peekGroceryQueue(email);
  if (!queued.length) return { book: normalizeGroceries(book), merged: false };
  takeGroceryQueue(email);
  return { merged: true, book: withQueuedItems(book, queued) };
}

export function readGroceryDraft(email) {
  try {
    const raw = localStorage.getItem(groceryDraftKey(email));
    if (!raw) return { adding: false, title: '', amount: '', aisle: 'Aisle', comments: '' };
    const parsed = JSON.parse(raw);
    return {
      adding: parsed?.adding === true,
      title: typeof parsed?.title === 'string' ? parsed.title.slice(0, 40) : '',
      amount: typeof parsed?.amount === 'string' ? parsed.amount.slice(0, 24) : '',
      aisle: parsed?.aisle === 'Produce' ? 'Produce' : 'Aisle',
      comments: typeof parsed?.comments === 'string' ? parsed.comments.slice(0, 240) : '',
    };
  } catch {
    return { adding: false, title: '', amount: '', aisle: 'Aisle', comments: '' };
  }
}

export function writeGroceryDraft(email, draft) {
  const adding = Boolean(draft?.adding);
  const title = draft?.title || '';
  const amount = draft?.amount || '';
  const comments = draft?.comments || '';
  const aisle = draft?.aisle === 'Produce' ? 'Produce' : 'Aisle';
  if (!adding && !title.trim() && !amount.trim() && !comments.trim()) {
    localStorage.removeItem(groceryDraftKey(email));
    return;
  }
  localStorage.setItem(groceryDraftKey(email), JSON.stringify({ adding, title, amount, aisle, comments }));
}
