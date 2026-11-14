import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from '../platform';
import TextFont from './TextFont';
import ExpandOverlay from './ExpandOverlay';

function createdDate(item) {
  if (item?.createdAt) {
    const fromField = new Date(item.createdAt);
    if (!Number.isNaN(fromField.getTime())) return fromField;
  }
  const stamp = Number(String(item?.id || '').replace(/^[a-z-]+/i, ''));
  if (stamp > 1e12) return new Date(stamp);
  return null;
}

function formatCreated(item) {
  const date = createdDate(item);
  if (!date) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function GroceryDetail({ item, theme, origin, onClose, onSave }) {
  const dark = theme.background === '#0e1111';
  const ink = dark ? '#fff9ef' : '#241f33';
  const muted = dark ? 'rgba(255,249,239,0.62)' : '#6d6578';
  const card = dark ? '#1a1d1d' : '#fff9ef';
  const line = dark ? 'rgba(255,249,239,0.14)' : 'rgba(36,31,51,0.08)';
  const field = dark ? 'rgba(255,249,239,0.08)' : '#fff';

  const [title, setTitle] = useState(item.title || '');
  const [amount, setAmount] = useState(item.amount || '');
  const [aisle, setAisle] = useState(item.aisle === 'Produce' ? 'Produce' : 'Aisle');
  const [comments, setComments] = useState(item.comments || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(item.title || '');
    setAmount(item.amount || '');
    setAisle(item.aisle === 'Produce' ? 'Produce' : 'Aisle');
    setComments(item.comments || '');
    setSaving(false);
  }, [item.id, item.title, item.amount, item.aisle, item.comments]);

  function save() {
    const nextTitle = title.trim();
    if (!nextTitle || saving) return;
    setSaving(true);
    Promise.resolve(onSave({
      ...item,
      title: nextTitle.slice(0, 40),
      amount: amount.trim(),
      aisle,
      comments,
    })).finally(() => setSaving(false));
  }

  return (
    <ExpandOverlay
      origin={origin}
      fromColor={item.complete ? '#0CCA4A' : theme.primary}
      toColor={card}
      borderColor={line}
      closeLabel="Close item"
      onClose={onClose}
    >
      {(requestClose) => (
        <>
        <View style={[styles.head, { borderColor: line }]}>
          <TextFont style={[styles.headTitle, { color: ink }]}>Item</TextFont>
          <Pressable aria-label="Close" onPress={requestClose} style={styles.close}>
            <TextFont style={[styles.closeText, { color: ink }]}>Close</TextFont>
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.stats}>
            <View style={[styles.stat, { borderColor: line }]}>
              <TextFont style={[styles.statLabel, { color: muted }]}>Created</TextFont>
              <TextFont style={[styles.statValue, { color: ink }]}>{formatCreated(item)}</TextFont>
            </View>
            <View style={[styles.stat, { borderColor: line }]}>
              <TextFont style={[styles.statLabel, { color: muted }]}>Status</TextFont>
              <TextFont style={[styles.statValue, { color: ink }]}>{item.complete ? 'Checked' : 'On list'}</TextFont>
            </View>
          </View>

          <TextFont style={[styles.label, { color: muted }]}>Item</TextFont>
          <TextInput
            aria-label="Grocery item name"
            style={[styles.input, { color: ink, borderColor: line, backgroundColor: field }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Item"
            placeholderTextColor={muted}
          />

          <TextFont style={[styles.label, { color: muted }]}>Amount</TextFont>
          <TextInput
            aria-label="Grocery amount"
            style={[styles.input, { color: ink, borderColor: line, backgroundColor: field }]}
            value={amount}
            onChangeText={setAmount}
            placeholder="Qty"
            placeholderTextColor={muted}
          />

          <TextFont style={[styles.label, { color: muted }]}>Aisle</TextFont>
          <View style={styles.row}>
            <Choice label="Produce" selected={aisle === 'Produce'} onPress={() => setAisle('Produce')} theme={theme} ink={ink} />
            <Choice label="Aisle" selected={aisle === 'Aisle'} onPress={() => setAisle('Aisle')} theme={theme} ink={ink} />
          </View>

          <TextFont style={[styles.label, { color: muted }]}>Comments</TextFont>
          <TextInput
            aria-label="Grocery comments"
            multiline
            numberOfLines={4}
            style={[styles.comments, { color: ink, borderColor: line, backgroundColor: field }]}
            value={comments}
            onChangeText={setComments}
            placeholder="Notes about this item"
            placeholderTextColor={muted}
          />
        </View>

        <View style={styles.footer}>
          <Pressable onPress={requestClose} style={[styles.footerBtn, { borderColor: line }]}>
            <TextFont style={[styles.footerText, { color: muted }]}>Cancel</TextFont>
          </Pressable>
          <Pressable
            aria-label="Save item"
            onPress={save}
            disabled={!title.trim() || saving}
            style={[styles.footerBtn, styles.saveBtn, { backgroundColor: theme.primary }, !title.trim() || saving ? styles.disabled : null]}
          >
            <TextFont style={[styles.footerText, { color: dark ? ink : '#241f33' }]}>{saving ? 'Saving' : 'Save'}</TextFont>
          </Pressable>
        </View>
        </>
      )}
    </ExpandOverlay>
  );
}

function Choice({ label, selected, onPress, theme, ink }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected ? { borderColor: theme.primary, backgroundColor: theme.primary } : null]}
    >
      <TextFont style={[styles.choiceLabel, { color: ink }]}>{label}</TextFont>
    </Pressable>
  );
}

export default GroceryDetail;

const styles = StyleSheet.create({
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    paddingBottom: 12,
    paddingLeft: 16,
    paddingRight: 12,
    borderBottomWidth: 1,
  },
  headTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  close: {
    padding: 8,
  },
  closeText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  body: {
    padding: 16,
    gap: 8,
    overflow: 'auto',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  stat: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: 16,
  },
  comments: {
    width: '100%',
    minHeight: 88,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: 15,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  choice: {
    flex: 1,
    minHeight: 46,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 6,
    paddingBottom: 6,
  },
  choiceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    gap: 10,
    padding: 16,
    paddingTop: 8,
  },
  footerBtn: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    borderWidth: 0,
  },
  footerText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  disabled: {
    opacity: 0.45,
  },
});
