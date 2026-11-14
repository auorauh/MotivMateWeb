import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from '../platform';
import TextFont from './TextFont';
import ExpandOverlay from './ExpandOverlay';

const POINTS = { Easy: 10, Medium: 25, Hard: 100 };

function createdDate(goal) {
  if (goal?.createdAt) {
    const fromField = new Date(goal.createdAt);
    if (!Number.isNaN(fromField.getTime())) return fromField;
  }
  const id = String(goal?._id || '');
  if (/^[a-fA-F0-9]{24}$/.test(id)) {
    return new Date(parseInt(id.slice(0, 8), 16) * 1000);
  }
  return null;
}

function formatCreated(goal) {
  const date = createdDate(goal);
  if (!date) return 'Unknown';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function goalPoints(difficulty) {
  return POINTS[difficulty] || 10;
}

function GoalDetail({ goal, theme, origin, onClose, onSave }) {
  const dark = theme.background === '#0e1111';
  const ink = dark ? '#fff9ef' : '#241f33';
  const muted = dark ? 'rgba(255,249,239,0.62)' : '#6d6578';
  const card = dark ? '#1a1d1d' : '#fff9ef';
  const line = dark ? 'rgba(255,249,239,0.14)' : 'rgba(36,31,51,0.08)';
  const field = dark ? 'rgba(255,249,239,0.08)' : '#fff';

  const [title, setTitle] = useState(goal.title || '');
  const [type, setType] = useState(goal.type || 'daily');
  const [difficulty, setDifficulty] = useState(goal.difficulty || 'Easy');
  const [comments, setComments] = useState(goal.comments || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(goal.title || '');
    setType(goal.type || 'daily');
    setDifficulty(goal.difficulty || 'Easy');
    setComments(goal.comments || '');
    setSaving(false);
  }, [goal._id, goal.title, goal.type, goal.difficulty, goal.comments]);

  const value = goalPoints(difficulty);
  const currentScore = goal.complete ? value : 0;

  function save() {
    const nextTitle = title.trim();
    if (!nextTitle || saving) return;
    setSaving(true);
    Promise.resolve(onSave({
      ...goal,
      title: nextTitle,
      type,
      difficulty,
      comments,
    })).finally(() => setSaving(false));
  }

  return (
    <ExpandOverlay
      origin={origin}
      fromColor={goal.complete ? '#0CCA4A' : theme.primary}
      toColor={card}
      borderColor={line}
      closeLabel="Close goal"
      onClose={onClose}
    >
      {(requestClose) => (
        <>
        <View style={[styles.head, { borderColor: line }]}>
          <TextFont style={[styles.headTitle, { color: ink }]}>Goal</TextFont>
          <Pressable aria-label="Close" onPress={requestClose} style={styles.close}>
            <TextFont style={[styles.closeText, { color: ink }]}>Close</TextFont>
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.stats}>
            <View style={[styles.stat, { borderColor: line }]}>
              <TextFont style={[styles.statLabel, { color: muted }]}>Created</TextFont>
              <TextFont style={[styles.statValue, { color: ink }]}>{formatCreated(goal)}</TextFont>
            </View>
            <View style={[styles.stat, { borderColor: line }]}>
              <TextFont style={[styles.statLabel, { color: muted }]}>Current score</TextFont>
              <TextFont style={[styles.statValue, { color: ink }]}>+ {currentScore}</TextFont>
            </View>
            <View style={[styles.stat, { borderColor: line }]}>
              <TextFont style={[styles.statLabel, { color: muted }]}>Times completed</TextFont>
              <TextFont style={[styles.statValue, { color: ink }]}>{goal.timesCompleted || 0}</TextFont>
            </View>
            <View style={[styles.stat, { borderColor: line }]}>
              <TextFont style={[styles.statLabel, { color: muted }]}>Streak</TextFont>
              <TextFont style={[styles.statValue, { color: ink }]}>{goal.streak || 0}</TextFont>
            </View>
          </View>

          <TextFont style={[styles.label, { color: muted }]}>Title</TextFont>
          <TextInput
            aria-label="Goal title"
            style={[styles.input, { color: ink, borderColor: line, backgroundColor: field }]}
            value={title}
            onChangeText={setTitle}
            placeholder="Goal title"
            placeholderTextColor={muted}
          />

          <TextFont style={[styles.label, { color: muted }]}>Type</TextFont>
          <View style={styles.row}>
            <Choice label="Daily" selected={type === 'daily'} onPress={() => setType('daily')} theme={theme} ink={ink} />
            <Choice label="To Do" selected={type === 'ToDo'} onPress={() => setType('ToDo')} theme={theme} ink={ink} />
          </View>

          <TextFont style={[styles.label, { color: muted }]}>Difficulty</TextFont>
          <View style={styles.row}>
            {['Easy', 'Medium', 'Hard'].map((level) => (
              <Choice
                key={level}
                label={level}
                caption={`+ ${goalPoints(level)}`}
                selected={difficulty === level}
                onPress={() => setDifficulty(level)}
                theme={theme}
                ink={ink}
              />
            ))}
          </View>

          <TextFont style={[styles.label, { color: muted }]}>Comments</TextFont>
          <TextInput
            aria-label="Goal comments"
            multiline
            numberOfLines={4}
            style={[styles.comments, { color: ink, borderColor: line, backgroundColor: field }]}
            value={comments}
            onChangeText={setComments}
            placeholder="Notes about this goal"
            placeholderTextColor={muted}
          />
        </View>

        <View style={styles.footer}>
          <Pressable onPress={requestClose} style={[styles.footerBtn, { borderColor: line }]}>
            <TextFont style={[styles.footerText, { color: muted }]}>Cancel</TextFont>
          </Pressable>
          <Pressable
            aria-label="Save goal"
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

function Choice({ label, caption, selected, onPress, theme, ink }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.choice, selected ? { borderColor: theme.primary, backgroundColor: theme.primary } : null]}
    >
      <TextFont style={[styles.choiceLabel, { color: ink }]}>{label}</TextFont>
      {caption ? <TextFont style={styles.choiceCaption}>{caption}</TextFont> : null}
    </Pressable>
  );
}

export default GoalDetail;

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
  choiceCaption: {
    color: 'gray',
    fontSize: 11,
    marginTop: 1,
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
