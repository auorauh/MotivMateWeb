import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { StyleSheet, View, Pressable, FlatList, TextInput, Button } from '../platform';
import FontAwesome5 from '../platform/icons';
import TextFont from './TextFont';
import BackgroundSVG from '../assets/BackgroundSVG';
import DarkBackground from '../assets/DarkBackground';
import GroceryDetail from './GroceryDetail';
import GroceryItem from './GroceryItem';
import { API_URL } from '../platform/env';
import {
  absorbGroceryQueue,
  emptyGroceries,
  groceriesKey,
  normalizeGroceries,
  previewGroceryQueue,
  readGroceries,
  readGroceryDraft,
  writeGroceryDraft,
} from '../functions/groceries';

const TABS = [
  { id: 'All', label: 'All' },
  { id: 'Produce', label: 'Produce' },
  { id: 'Aisle', label: 'Aisle' },
];

function GroceryPage({ theme, onBack, addRef, userObj }) {
  const dark = theme.background === '#0e1111';
  const ink = dark ? '#fff9ef' : '#241f33';
  const muted = dark ? 'rgba(255,249,239,0.62)' : '#6d6578';
  const card = dark ? 'rgba(255,249,239,0.07)' : 'rgba(255,255,255,0.82)';
  const line = dark ? 'rgba(255,249,239,0.14)' : 'rgba(36,31,51,0.08)';
  const [tab, setTab] = useState('All');
  const [book, setBook] = useState(() => previewGroceryQueue(readGroceries(userObj), userObj?.email));
  const [showCabinet, setShowCabinet] = useState(false);
  const [namingList, setNamingList] = useState(false);
  const [listName, setListName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [adding, setAdding] = useState(() => readGroceryDraft(userObj?.email).adding);
  const [title, setTitle] = useState(() => readGroceryDraft(userObj?.email).title);
  const [amount, setAmount] = useState(() => readGroceryDraft(userObj?.email).amount);
  const [aisle, setAisle] = useState(() => readGroceryDraft(userObj?.email).aisle);
  const [comments, setComments] = useState(() => readGroceryDraft(userObj?.email).comments);
  const [viewing, setViewing] = useState(null);
  const [viewOrigin, setViewOrigin] = useState(null);
  const bookRef = useRef(book);
  const saveTimer = useRef(0);
  bookRef.current = book;

  const lists = book.lists;
  const currentId = book.currentId;
  const current = lists.find((list) => list.id === currentId) || lists[0];
  const items = current?.items || [];
  const visible = tab === 'All' ? items : items.filter((item) => item.aisle === tab);

  function persist(next) {
    const stored = normalizeGroceries(next);
    userObj.groceries = stored;
    localStorage.setItem(groceriesKey(userObj?.email), JSON.stringify(stored));
    setBook(stored);
    bookRef.current = stored;
    if (!userObj?.email) return stored;
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      axios.put(`${API_URL}/api/users/${userObj.email}`, { ...userObj, groceries: stored }).catch((error) => {
        console.log('grocery save', error);
      });
    }, 280);
    return stored;
  }

  function setCurrentItems(nextItems) {
    const id = current?.id;
    if (!id) return;
    persist({
      ...book,
      lists: book.lists.map((list) => (
        list.id === id ? { ...list, items: nextItems } : list
      )),
    });
  }

  useEffect(() => {
    const merged = absorbGroceryQueue(readGroceries(userObj), userObj?.email);
    if (merged.merged) persist(merged.book);
  }, [userObj?.email]);

  useEffect(() => {
    writeGroceryDraft(userObj?.email, { adding, title, amount, aisle, comments });
  }, [adding, title, amount, aisle, comments, userObj?.email]);

  useEffect(() => {
    function flush() {
      const stored = normalizeGroceries(bookRef.current);
      localStorage.setItem(groceriesKey(userObj?.email), JSON.stringify(stored));
      if (!userObj?.email) return;
      axios.put(`${API_URL}/api/users/${userObj.email}`, { ...userObj, groceries: stored }).catch((error) => {
        console.log('grocery save', error);
      });
    }
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      document.removeEventListener('visibilitychange', flush);
      window.clearTimeout(saveTimer.current);
    };
  }, [userObj?.email]);

  useEffect(() => {
    if (!addRef) return undefined;
    addRef.current = () => {
      setTitle('');
      setAmount('');
      setComments('');
      setAisle(tab === 'Produce' ? 'Produce' : 'Aisle');
      setAdding(true);
    };
    return () => {
      addRef.current = null;
    };
  }, [addRef, tab]);

  function toggleItem(id) {
    setCurrentItems(items.map((item) => (
      item.id === id ? { ...item, complete: !item.complete } : item
    )));
  }

  function addItem() {
    const name = title.trim();
    if (!name) return;
    const nextAisle = aisle === 'Produce' ? 'Produce' : 'Aisle';
    setCurrentItems([
      ...items,
      {
        id: `g${Date.now()}`,
        title: name.slice(0, 40),
        amount: amount.trim(),
        aisle: nextAisle,
        complete: false,
        comments: comments.trim(),
        createdAt: new Date().toISOString(),
      },
    ]);
    if (tab !== 'All' && tab !== nextAisle) setTab(nextAisle);
    setAdding(false);
    setTitle('');
    setAmount('');
    setComments('');
    writeGroceryDraft(userObj?.email, { adding: false, title: '', amount: '', aisle: nextAisle, comments: '' });
  }

  function saveItem(next) {
    setCurrentItems(items.map((item) => (item.id === next.id ? { ...item, ...next } : item)));
    setViewing({ ...next });
  }

  function deleteItem(id) {
    setCurrentItems(items.filter((item) => item.id !== id));
    setViewing((open) => (open?.id === id ? null : open));
  }

  function openNewList() {
    setListName('');
    setNamingList(true);
    setShowCabinet(true);
  }

  function closeCabinet() {
    setShowCabinet(false);
    setNamingList(false);
    setListName('');
  }

  function createList() {
    const name = listName.trim();
    if (!name) return;
    const id = `list-${Date.now()}`;
    persist({
      currentId: id,
      lists: [...book.lists, { id, name: name.slice(0, 32), items: [] }],
    });
    setTab('All');
    setNamingList(false);
    setListName('');
    setShowCabinet(false);
    setEditingName(false);
  }

  function openList(id) {
    persist({ ...book, currentId: id });
    setTab('All');
    setShowCabinet(false);
    setNamingList(false);
    setEditingName(false);
  }

  function deleteList(id) {
    let next = book.lists.filter((list) => list.id !== id);
    if (!next.length) next = emptyGroceries().lists;
    persist({
      currentId: currentId === id ? next[0].id : currentId,
      lists: next,
    });
    if (currentId === id) {
      setTab('All');
      setEditingName(false);
      setViewing(null);
      setViewOrigin(null);
    }
  }

  function startRename() {
    setNameDraft(current?.name || '');
    setEditingName(true);
  }

  function applyRename(value) {
    if (!current) return;
    const name = value.trim().slice(0, 32);
    if (!name) return;
    persist({
      ...book,
      lists: book.lists.map((list) => (
        list.id === current.id ? { ...list, name } : list
      )),
    });
  }

  function saveRename() {
    const name = nameDraft.trim();
    setEditingName(false);
    if (!current) return;
    if (!name) {
      setNameDraft(current.name);
      return;
    }
    applyRename(name);
  }

  return (
    <View style={styles.page}>
      <View style={styles.topBar}>
        <Pressable aria-label="Back" onPress={onBack} style={styles.back}>
          <TextFont style={[styles.backText, { color: ink }]}>Back</TextFont>
        </Pressable>
        {editingName ? (
          <TextInput
            aria-label="List name"
            autoFocus
            style={[styles.listNameInput, { color: ink, borderColor: line }]}
            value={nameDraft}
            onChangeText={(value) => {
              setNameDraft(value);
              applyRename(value);
            }}
            onFocus={(event) => event.target.select()}
            onBlur={saveRename}
            onSubmitEditing={saveRename}
            placeholder="List name"
          />
        ) : (
          <Pressable aria-label="Edit list name" onPress={startRename} style={styles.listNameHit}>
            <TextFont style={[styles.listName, { color: ink }]}>{current?.name || 'Grocery list'}</TextFont>
          </Pressable>
        )}
        <Pressable aria-label="Other lists" onPress={() => setShowCabinet(true)} style={styles.cabinet}>
          <FontAwesome5 name="archive" style={{ fontSize: 22, color: ink }} />
        </Pressable>
      </View>
      <View style={styles.listType}>
        {TABS.map((type) => (
          <Pressable
            key={type.id}
            aria-label={type.label}
            style={[styles.listTypeItem, tab === type.id ? styles.selected : null]}
            onPress={() => setTab(type.id)}
          >
            <TextFont style={styles.listTypeText}>{type.label}</TextFont>
          </Pressable>
        ))}
      </View>
      {visible.length === 0 ? (
        <TextFont style={[styles.empty, { color: muted }]}>Nothing on this list yet.</TextFont>
      ) : null}
      <FlatList
        style={styles.list}
        data={visible}
        keyExtractor={(item) => item.id}
        ItemSeparatorComponent={() => <View style={styles.gap} />}
        renderItem={({ item }) => (
          <GroceryItem
            item={item}
            theme={theme}
            onToggle={toggleItem}
            onView={(payload) => {
              if (payload?.item) {
                setViewing({ ...payload.item });
                setViewOrigin(payload.origin || null);
                return;
              }
              setViewing({ ...payload });
              setViewOrigin(payload.origin || null);
            }}
            onDelete={deleteItem}
          />
        )}
      />
      {showCabinet ? (
        <View style={styles.overlay}>
          <Pressable aria-label="Close lists" style={styles.scrim} onPress={closeCabinet} />
          <View style={[styles.sheet, { backgroundColor: dark ? '#1a1d1d' : '#fff9ef', borderColor: line }]}>
            <View style={[styles.sheetHead, { borderColor: line }]}>
              <TextFont style={[styles.sheetTitle, { color: ink }]}>Lists</TextFont>
              <View style={styles.sheetActions}>
                <Pressable aria-label="New list" onPress={openNewList} style={styles.newList}>
                  <FontAwesome5 name="plus" style={{ fontSize: 18, color: ink }} />
                </Pressable>
                <Pressable aria-label="Close" onPress={closeCabinet} style={styles.sheetClose}>
                  <TextFont style={[styles.sheetCloseText, { color: ink }]}>Close</TextFont>
                </Pressable>
              </View>
            </View>
            {namingList ? (
              <View style={styles.nameWrap}>
                <TextInput
                  aria-label="New list name"
                  autoFocus
                  style={[styles.searchInput, { color: ink, borderColor: line }]}
                  value={listName}
                  onChangeText={setListName}
                  onSubmitEditing={createList}
                  placeholder="List name"
                />
                <Pressable aria-label="Create list" onPress={createList} style={[styles.create, { backgroundColor: theme.primary }]}>
                  <TextFont style={styles.createText}>Create</TextFont>
                </Pressable>
              </View>
            ) : null}
            {lists.map((list) => (
              <Pressable
                key={list.id}
                aria-label={list.name}
                onPress={() => openList(list.id)}
                style={[
                  styles.cabinetRow,
                  { backgroundColor: card, borderColor: line },
                  list.id === current?.id ? { borderColor: theme.primary } : null,
                ]}
              >
                <TextFont style={[styles.cabinetName, { color: ink }]}>{list.name}</TextFont>
                <TextFont style={[styles.cabinetCount, { color: muted }]}>{list.items.length}</TextFont>
                <View
                  aria-label={`Delete ${list.name}`}
                  role="button"
                  style={styles.cabinetDelete}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteList(list.id);
                  }}
                >
                  <FontAwesome5 name="trash" style={{ fontSize: 14, color: muted }} />
                </View>
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {adding ? (
        <View style={[styles.addOverlay, { backgroundColor: theme.background }]}>
            {dark ? <DarkBackground /> : <BackgroundSVG />}
            <View style={styles.goalContainer}>
              <View style={styles.goalSection}>
                <TextFont style={styles.subText}>Item</TextFont>
                <TextInput
                  aria-label="Grocery item"
                  autoFocus
                  style={styles.textInput}
                  placeholder="Milk, apples..."
                  placeholderTextColor="gray"
                  value={title}
                  onChangeText={setTitle}
                  onSubmitEditing={addItem}
                />
              </View>
              <View style={styles.goalSection}>
                <TextFont style={styles.subText}>Amount</TextFont>
                <TextInput
                  aria-label="Amount"
                  style={styles.textInput}
                  placeholder="Qty"
                  placeholderTextColor="gray"
                  value={amount}
                  onChangeText={setAmount}
                  onSubmitEditing={addItem}
                />
              </View>
              <View style={styles.goalSection}>
                <TextFont style={styles.subText}>Aisle</TextFont>
                <View style={styles.types}>
                  <Pressable
                    style={[styles.typeChoice, aisle === 'Produce' ? styles.typeHighlight : null]}
                    onPress={() => setAisle('Produce')}
                  >
                    <TextFont style={[styles.typeText, aisle === 'Produce' ? styles.typeSelected : null]}>Produce</TextFont>
                  </Pressable>
                  <Pressable
                    style={[styles.typeChoice, aisle === 'Aisle' ? styles.typeHighlight : null]}
                    onPress={() => setAisle('Aisle')}
                  >
                    <TextFont style={[styles.typeText, aisle === 'Aisle' ? styles.typeSelected : null]}>Aisle</TextFont>
                  </Pressable>
                </View>
              </View>
              <View style={styles.goalSection}>
                <TextFont style={styles.subText}>Comments</TextFont>
                <TextInput
                  aria-label="Grocery comments"
                  style={[styles.textInput, styles.commentsInput]}
                  placeholder="Notes about this item"
                  placeholderTextColor="gray"
                  multiline
                  numberOfLines={3}
                  value={comments}
                  onChangeText={setComments}
                />
              </View>
              <View style={styles.goalSection}>
                <View style={styles.buttonContainer}>
                  <View style={styles.button}>
                    <Button title="Cancel" onPress={() => setAdding(false)} color="gray" />
                  </View>
                  <Pressable aria-label="Add grocery item" onPress={addItem} style={[styles.button, { backgroundColor: '#00bcd4' }]}>
                    <FontAwesome5 style={{ fontSize: 20 }} name="paper-plane" />
                  </Pressable>
                </View>
              </View>
            </View>
        </View>
      ) : null}
      {viewing ? (
        <GroceryDetail
          item={viewing}
          origin={viewOrigin}
          theme={theme}
          onClose={() => {
            setViewing(null);
            setViewOrigin(null);
          }}
          onSave={saveItem}
        />
      ) : null}
    </View>
  );
}

export default GroceryPage;

const styles = StyleSheet.create({
  page: {
    width: '100%',
    paddingTop: 20,
    paddingBottom: 120,
  },
  topBar: {
    width: '88%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  listNameHit: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    paddingRight: 8,
  },
  listName: {
    fontSize: 28,
    fontWeight: '600',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  listNameInput: {
    flex: 1,
    minWidth: 0,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 22,
    fontWeight: '600',
    marginRight: 8,
  },
  cabinet: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newList: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  empty: {
    width: '88%',
    alignSelf: 'center',
    fontSize: 14,
    marginTop: 16,
  },
  listType: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    marginTop: 4,
  },
  listTypeItem: {
    flex: 1,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listTypeText: {
    fontSize: 20,
    textAlign: 'center',
    color: 'gray',
  },
  selected: {
    borderBottomWidth: 2,
    borderColor: 'gray',
  },
  list: {
    padding: 10,
  },
  gap: {
    height: 10,
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
  },
  goalContainer: {
    width: '100%',
    gap: 20,
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
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  typeChoice: {
    borderWidth: 2,
    borderColor: 'gray',
    flex: 1,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  typeText: {
    color: 'gray',
    fontSize: 16,
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
  cabinetRow: {
    minHeight: 52,
    marginTop: 8,
    marginLeft: 12,
    marginRight: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingLeft: 14,
    paddingRight: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cabinetName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  cabinetCount: {
    fontSize: 14,
    marginRight: 8,
  },
  cabinetDelete: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  nameWrap: {
    paddingTop: 12,
    paddingLeft: 12,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'transparent',
    paddingLeft: 12,
    paddingRight: 12,
    fontSize: 16,
  },
  create: {
    marginLeft: 8,
    height: 40,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createText: {
    color: '#241f33',
    fontSize: 14,
    fontWeight: '600',
  },
});
