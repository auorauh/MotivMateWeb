import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from '../platform';
import FontAwesome5 from '../platform/icons';
import TextFont from './TextFont';
import ExpandOverlay from './ExpandOverlay';
import { SLOTS, inferAisle, slotLabel } from '../functions/meals';

function MealDetail({
  meal,
  theme,
  origin,
  weekDays,
  onClose,
  onSave,
  onDuplicate,
  onGrocery,
  onSaveRecipe,
}) {
  const dark = theme.background === '#0e1111';
  const ink = dark ? '#fff9ef' : '#241f33';
  const muted = dark ? 'rgba(255,249,239,0.62)' : '#6d6578';
  const card = dark ? '#1a1d1d' : '#fff9ef';
  const line = dark ? 'rgba(255,249,239,0.14)' : 'rgba(36,31,51,0.08)';
  const field = dark ? 'rgba(255,249,239,0.08)' : '#fff';

  const [title, setTitle] = useState(meal.title || '');
  const [slot, setSlot] = useState(meal.slot || 'dinner');
  const [calories, setCalories] = useState(meal.calories ? String(meal.calories) : '');
  const [notes, setNotes] = useState(meal.notes || '');
  const [ingredients, setIngredients] = useState(meal.ingredients || []);
  const [ingName, setIngName] = useState('');
  const [ingAmount, setIngAmount] = useState('');
  const [cooked, setCooked] = useState(Boolean(meal.cooked));
  const [saving, setSaving] = useState(false);
  const [note, setNote] = useState('');

  useEffect(() => {
    setTitle(meal.title || '');
    setSlot(meal.slot || 'dinner');
    setCalories(meal.calories ? String(meal.calories) : '');
    setNotes(meal.notes || '');
    setIngredients(meal.ingredients || []);
    setCooked(Boolean(meal.cooked));
    setSaving(false);
    setNote('');
  }, [meal.id]);

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

  function payload() {
    const nextTitle = title.trim();
    const nextCal = Number(calories);
    return {
      ...meal,
      title: nextTitle.slice(0, 48),
      slot,
      calories: Number.isFinite(nextCal) && nextCal > 0 ? Math.round(nextCal) : 0,
      notes: notes.trim(),
      ingredients,
      cooked,
    };
  }

  function save() {
    if (!title.trim() || saving) return;
    setSaving(true);
    Promise.resolve(onSave(payload())).finally(() => setSaving(false));
  }

  return (
    <ExpandOverlay
      origin={origin}
      fromColor={cooked ? '#0CCA4A' : theme.primary}
      toColor={card}
      borderColor={line}
      closeLabel="Close meal"
      onClose={onClose}
    >
      {(requestClose) => (
        <>
          <View style={[styles.head, { borderColor: line }]}>
            <TextFont style={[styles.headTitle, { color: ink }]}>{slotLabel(slot)}</TextFont>
            <Pressable aria-label="Close" onPress={requestClose} style={styles.close}>
              <TextFont style={[styles.closeText, { color: ink }]}>Close</TextFont>
            </Pressable>
          </View>

          <View style={styles.body}>
            <View style={styles.stats}>
              <Pressable
                aria-label={cooked ? 'Mark not cooked' : 'Mark cooked'}
                onPress={() => setCooked((value) => !value)}
                style={[styles.stat, { borderColor: cooked ? theme.primary : line }]}
              >
                <TextFont style={[styles.statLabel, { color: muted }]}>Status</TextFont>
                <TextFont style={[styles.statValue, { color: ink }]}>{cooked ? 'Cooked' : 'Planned'}</TextFont>
              </Pressable>
              <View style={[styles.stat, { borderColor: line }]}>
                <TextFont style={[styles.statLabel, { color: muted }]}>Ingredients</TextFont>
                <TextFont style={[styles.statValue, { color: ink }]}>{ingredients.length}</TextFont>
              </View>
            </View>

            <TextFont style={[styles.label, { color: muted }]}>Meal</TextFont>
            <TextInput
              aria-label="Meal name"
              style={[styles.input, { color: ink, borderColor: line, backgroundColor: field }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Meal name"
              placeholderTextColor={muted}
            />

            <TextFont style={[styles.label, { color: muted }]}>When</TextFont>
            <View style={styles.row}>
              {SLOTS.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => setSlot(item.id)}
                  style={[
                    styles.choice,
                    slot === item.id ? { borderColor: theme.primary, backgroundColor: theme.primary } : null,
                  ]}
                >
                  <TextFont style={[styles.choiceLabel, { color: ink }]}>{item.label}</TextFont>
                </Pressable>
              ))}
            </View>

            <TextFont style={[styles.label, { color: muted }]}>Calories</TextFont>
            <TextInput
              aria-label="Meal calories"
              inputMode="numeric"
              type="number"
              style={[styles.input, { color: ink, borderColor: line, backgroundColor: field }]}
              value={calories}
              onChangeText={setCalories}
              placeholder="Optional"
              placeholderTextColor={muted}
            />

            <TextFont style={[styles.label, { color: muted }]}>Ingredients</TextFont>
            <View style={styles.ingRow}>
              <TextInput
                aria-label="Ingredient name"
                style={[styles.input, styles.ingName, { color: ink, borderColor: line, backgroundColor: field }]}
                value={ingName}
                onChangeText={setIngName}
                onSubmitEditing={addIngredient}
                placeholder="Chicken"
                placeholderTextColor={muted}
              />
              <TextInput
                aria-label="Ingredient amount"
                style={[styles.input, styles.ingAmt, { color: ink, borderColor: line, backgroundColor: field }]}
                value={ingAmount}
                onChangeText={setIngAmount}
                onSubmitEditing={addIngredient}
                placeholder="6 oz"
                placeholderTextColor={muted}
              />
              <Pressable aria-label="Add ingredient" onPress={addIngredient} style={[styles.ingAdd, { backgroundColor: theme.primary }]}>
                <FontAwesome5 name="plus" style={{ fontSize: 14, color: dark ? ink : '#241f33' }} />
              </Pressable>
            </View>
            {ingredients.length ? (
              <View style={styles.chips}>
                {ingredients.map((item) => (
                  <Pressable
                    key={item.id}
                    aria-label={`Remove ${item.name}`}
                    onPress={() => setIngredients((rows) => rows.filter((row) => row.id !== item.id))}
                    style={[styles.chip, { borderColor: line, backgroundColor: field }]}
                  >
                    <TextFont style={[styles.chipText, { color: ink }]}>
                      {item.name}{item.amount ? ` · ${item.amount}` : ''}
                    </TextFont>
                  </Pressable>
                ))}
              </View>
            ) : null}

            <TextFont style={[styles.label, { color: muted }]}>Notes</TextFont>
            <TextInput
              aria-label="Meal notes"
              multiline
              numberOfLines={3}
              style={[styles.comments, { color: ink, borderColor: line, backgroundColor: field }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Prep notes, leftovers, sides..."
              placeholderTextColor={muted}
            />

            <TextFont style={[styles.label, { color: muted }]}>Copy to</TextFont>
            <View style={styles.row}>
              {weekDays.map((date) => {
                const label = date.toLocaleDateString(undefined, { weekday: 'narrow' });
                return (
                  <Pressable
                    key={date.toISOString()}
                    aria-label={`Copy to ${date.toLocaleDateString()}`}
                    onPress={() => {
                      if (!title.trim()) return;
                      onDuplicate(payload(), date);
                      setNote(`Copied to ${date.toLocaleDateString(undefined, { weekday: 'short' })}.`);
                    }}
                    style={[styles.dayCopy, { borderColor: line }]}
                  >
                    <TextFont style={[styles.dayCopyText, { color: ink }]}>{label}</TextFont>
                  </Pressable>
                );
              })}
            </View>
            {note ? <TextFont style={[styles.flash, { color: muted }]}>{note}</TextFont> : null}
          </View>

          <View style={styles.footer}>
            <Pressable
              aria-label="Save as recipe"
              onPress={() => {
                if (!title.trim()) return;
                onSaveRecipe(payload());
                setNote('Saved to recipes.');
              }}
              style={[styles.footerBtn, { borderColor: line }]}
            >
              <TextFont style={[styles.footerText, { color: muted }]}>Recipe</TextFont>
            </Pressable>
            <Pressable
              aria-label="Add ingredients to grocery"
              onPress={() => {
                const count = onGrocery(payload());
                setNote(count ? `Queued ${count} grocery item${count === 1 ? '' : 's'}.` : 'Add ingredients first.');
              }}
              style={[styles.footerBtn, { borderColor: line }]}
            >
              <TextFont style={[styles.footerText, { color: muted }]}>Grocery</TextFont>
            </Pressable>
            <Pressable
              aria-label="Save meal"
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

export default MealDetail;

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
    gap: 8,
    marginBottom: 8,
  },
  stat: {
    flex: 1,
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
    minHeight: 72,
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    fontSize: 15,
    textAlign: 'left',
  },
  row: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
  },
  choice: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    paddingRight: 4,
  },
  choiceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  ingRow: {
    flexDirection: 'row',
    gap: 6,
    width: '100%',
    alignItems: 'center',
  },
  ingName: {
    flex: 1,
  },
  ingAmt: {
    width: 84,
    flexGrow: 0,
  },
  ingAdd: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingTop: 4,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 10,
  },
  chipText: {
    fontSize: 12,
  },
  dayCopy: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCopyText: {
    fontSize: 13,
    fontWeight: '700',
  },
  flash: {
    fontSize: 13,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  footerBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    borderWidth: 0,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  },
});
