import { useState } from 'react';
import axios from 'axios';
import { StyleSheet, View, Pressable, TextInput } from '../platform';
import TextFont from './TextFont';
import { API_URL } from '../platform/env';
import { formatRecord, isBetter, mergeHealth } from '../functions/healthRecords';

function storageKey(email) {
  return `mm-health:${email}`;
}

function readSaved(userObj) {
  if (Array.isArray(userObj.health) && userObj.health.length) return userObj.health;
  try {
    const raw = localStorage.getItem(storageKey(userObj.email));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function HealthSection({ userObj, theme, ink, muted, card, line }) {
  const [records, setRecords] = useState(() => mergeHealth(readSaved(userObj)));
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState('');
  const [note, setNote] = useState('');

  async function save(record) {
    const nextValue = Number(draft);
    if (!Number.isFinite(nextValue) || nextValue <= 0) {
      setNote('Enter a number greater than 0.');
      return;
    }
    if (!isBetter(record, nextValue, record.value)) {
      setNote(record.better === 'lower'
        ? 'That does not beat your fastest time.'
        : 'That does not beat your current record.');
      return;
    }
    const next = records.map((item) => (
      item.id === record.id ? { ...item, value: nextValue } : item
    ));
    const stored = next.map(({ id, value }) => ({ id, value }));
    userObj.health = stored;
    localStorage.setItem(storageKey(userObj.email), JSON.stringify(stored));
    setRecords(next);
    setEditing(null);
    setDraft('');
    setNote('Record saved.');
    try {
      await axios.put(`${API_URL}/api/users/${userObj.email}`, { ...userObj, health: stored });
    } catch (error) {
      console.log('health save', error);
    }
  }

  return (
    <View style={styles.section}>
      <TextFont style={[styles.heading, { color: muted }]}>Health</TextFont>
      {records.map((record) => {
        const open = editing === record.id;
        return (
          <View key={record.id} style={[styles.card, { backgroundColor: card, borderColor: line }]}>
            <View style={[styles.accent, { backgroundColor: theme.primary }]} />
            <Pressable
              onPress={() => {
                setEditing(open ? null : record.id);
                setDraft(record.value == null ? '' : String(record.value));
                setNote('');
              }}
            >
              <View style={styles.cardRow}>
                <View style={styles.copy}>
                  <TextFont style={[styles.title, { color: ink }]}>{record.title}</TextFont>
                  <TextFont style={[styles.hint, { color: muted }]}>
                    {record.better === 'lower' ? 'Lower time wins' : 'Higher number wins'}
                  </TextFont>
                </View>
                <TextFont style={[styles.value, { color: record.value == null ? muted : ink }]}>
                  {formatRecord(record)}
                </TextFont>
              </View>
            </Pressable>
            {open && (
              <View style={styles.editor}>
                <TextInput
                  style={[styles.input, { color: ink, borderColor: line }]}
                  value={draft}
                  onChangeText={setDraft}
                  placeholder={record.unit}
                />
                <Pressable style={[styles.save, { backgroundColor: theme.primary }]} onPress={() => save(record)}>
                  <TextFont style={styles.saveText}>Save</TextFont>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}
      {note ? <TextFont style={[styles.note, { color: muted }]}>{note}</TextFont> : null}
    </View>
  );
}

export default HealthSection;

const styles = StyleSheet.create({
  section: {
    width: '88%',
    marginTop: 18,
  },
  heading: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  card: {
    position: 'relative',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
  },
  cardRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 18,
    paddingRight: 14,
    paddingTop: 12,
    paddingBottom: 12,
  },
  copy: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    marginTop: 2,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
  },
  editor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 18,
    paddingRight: 14,
    paddingBottom: 12,
  },
  input: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingLeft: 10,
    paddingRight: 10,
    fontSize: 16,
  },
  save: {
    marginLeft: 8,
    height: 38,
    paddingLeft: 14,
    paddingRight: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#241f33',
    fontSize: 14,
    fontWeight: '600',
  },
  note: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 13,
  },
});
