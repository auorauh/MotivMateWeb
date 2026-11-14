import { useEffect, useState } from 'react';
import { StyleSheet, View, Pressable, FlatList, TextInput, Button } from '../platform';
import FontAwesome5 from '../platform/icons';
import TextFont from './TextFont';
import BackgroundSVG from '../assets/BackgroundSVG';
import DarkBackground from '../assets/DarkBackground';
import GroceryDetail from './GroceryDetail';
import GroceryItem from './GroceryItem';
import { peekGroceryQueue, takeGroceryQueue } from '../functions/meals';

function grocery(id, title, amount, aisle, complete, daysAgo, comments = '') {
  const created = new Date(Date.UTC(2026, 10, 13));
  created.setUTCDate(created.getUTCDate() - daysAgo);
  return { id, title, amount, aisle, complete, comments, createdAt: created.toISOString() };
}

const DUMMY_GROCERIES = [
  grocery('g1', 'Bananas', '6', 'Produce', false, 5),
  grocery('g2', 'Spinach', '1 bag', 'Produce', false, 4),
  grocery('g3', 'Avocados', '3', 'Produce', true, 6),
  grocery('g4', 'Strawberries', '1 lb', 'Produce', false, 3),
  grocery('g5', 'Broccoli', '2', 'Produce', false, 2),
  grocery('g6', 'Oat milk', '2', 'Aisle', false, 5),
  grocery('g7', 'Pasta', '1 lb', 'Aisle', false, 4),
  grocery('g8', 'Olive oil', '1', 'Aisle', true, 8),
  grocery('g9', 'Peanut butter', '1', 'Aisle', false, 3),
  grocery('g10', 'Coffee', '1 bag', 'Aisle', false, 1),
  grocery('g11', 'Eggs', '12', 'Aisle', false, 2),
  grocery('g12', 'Rice', '2 lb', 'Aisle', false, 7),
];

const TABS = [
  { id: 'All', label: 'All' },
  { id: 'Produce', label: 'Produce' },
  { id: 'Aisle', label: 'Aisle' },
];

const STARTER_LISTS = [
  {
    id: 'weekly',
    name: "This week's shop",
    items: DUMMY_GROCERIES,
  },
  {
    id: 'costco',
    name: 'Costco run',
    items: [
      grocery('c1', 'Paper towels', '12', 'Aisle', false, 4),
      grocery('c2', 'Rotisserie chicken', '1', 'Aisle', false, 2),
      grocery('c3', 'Frozen berries', '2', 'Produce', false, 3),
      grocery('c4', 'Almonds', '1', 'Aisle', true, 6),
    ],
  },
  {
    id: 'party',
    name: 'Party snacks',
    items: [
      grocery('p1', 'Chips', '2', 'Aisle', false, 2),
      grocery('p2', 'Salsa', '1', 'Aisle', false, 2),
      grocery('p3', 'Sparkling water', '12', 'Aisle', false, 1),
      grocery('p4', 'Cookies', '1', 'Aisle', false, 3),
    ],
  },
];

function withQueuedItems(lists, email) {
  const queued = peekGroceryQueue(email);
  if (!queued.length) return lists;
  return lists.map((list, index) => (
    index === 0 ? { ...list, items: [...list.items, ...queued] } : list
  ));
}

function GroceryPage({ theme, onBack, addRef, userObj }) {
  const dark = theme.background === '#0e1111';
  const ink = dark ? '#fff9ef' : '#241f33';
  const muted = dark ? 'rgba(255,249,239,0.62)' : '#6d6578';
  const card = dark ? 'rgba(255,249,239,0.07)' : 'rgba(255,255,255,0.82)';
  const line = dark ? 'rgba(255,249,239,0.14)' : 'rgba(36,31,51,0.08)';
  const [tab, setTab] = useState('All');
  const [lists, setLists] = useState(() => withQueuedItems(STARTER_LISTS, userObj?.email));
  const [currentId, setCurrentId] = useState(STARTER_LISTS[0].id);
  const [showCabinet, setShowCabinet] = useState(false);
  const [namingList, setNamingList] = useState(false);
  const [listName, setListName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [aisle, setAisle] = useState('Aisle');
  const [comments, setComments] = useState('');
  const [viewing, setViewing] = useState(null);
  const [viewOrigin, setViewOrigin] = useState(null);

  useEffect(() => {
    takeGroceryQueue(userObj?.email);
  }, [userObj?.email]);

  const current = lists.find((list) => list.id === currentId) || lists[0];
  const items = current?.items || [];
  const visible = tab === 'All' ? items : items.filter((item) => item.aisle === tab);

  function setCurrentItems(nextItems) {
    const id = current?.id;
    if (!id) return;
    setLists((all) => all.map((list) => (
      list.id === id ? { ...list, items: nextItems } : list
    )));
  }

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
    setLists((all) => [...all, { id, name: name.slice(0, 32), items: [] }]);
    setCurrentId(id);
    setTab('All');
    setNamingList(false);
    setListName('');
    setShowCabinet(false);
    setEditingName(false);
  }

  function openList(id) {
    setCurrentId(id);
    setTab('All');
    setShowCabinet(false);
    setNamingList(false);
    setEditingName(false);
  }

  function deleteList(id) {
    const next = lists.filter((list) => list.id !== id);
    setLists(next);
    if (currentId === id) {
      setCurrentId(next[0]?.id || '');
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

  function saveRename() {
    const name = nameDraft.trim();
    setEditingName(false);
    if (!current) return;
    if (!name) {
      setNameDraft(current.name);
      return;
    }
    setLists((all) => all.map((list) => (
      list.id === current.id ? { ...list, name: name.slice(0, 32) } : list
    )));
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
            onChangeText={setNameDraft}
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
