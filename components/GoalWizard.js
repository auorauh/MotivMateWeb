import { View, TextInput, StyleSheet, Pressable, Keyboard } from '../platform';
import { useState } from 'react';
import TextFont from './TextFont';
import { Health, Finance, Education, Work, Social, Personal } from '../functions/wizardHelper';

const AREAS = ['Health', 'Finance', 'Education', 'Work', 'Personal', 'Social'];
const ACTIONS = { Health, Finance, Education, Work, Personal, Social };
const POINTS = { Easy: '+ 10', Medium: '+ 25', Hard: '+ 100' };
const EXAMPLES = {
  Diet: 'more vegetables',
  Exercise: '3 miles',
  'Nightly Routine': 'stretch and read',
  'Mental Time': '10 minutes',
  'Spiritual Time': 'evening prayer',
  Sleep: 'by 11pm',
  Save: '$50',
  Payoff: 'the credit card',
  Earn: '$200',
  Invest: '$25',
  Give: '$10',
  Collect: 'loose change',
  Practice: '30 minutes',
  Study: 'one chapter',
  Enroll: 'in the class',
  Complete: 'the assignment',
  Learn: '10 words',
  Research: 'one topic',
  Apply: 'to one job',
  Finish: 'the report',
  Review: 'today\'s notes',
  Investigate: 'the bug',
  Contact: 'a coworker',
  Collaborate: 'on the project',
  Journal: 'one page',
  Chores: 'the kitchen',
  Read: '20 pages',
  Quit: 'smoking today',
  Limit: 'one hour of scrolling',
  Plan: 'tomorrow tonight',
  'Reach out': 'to a friend',
  Schedule: 'coffee',
  Positivity: 'one compliment',
  Volunteer: 'an hour',
  'Get out the house': 'for a walk',
  Celebrate: 'a win',
};

const STEPS = [
  { title: 'What is this goal about?', hint: 'Pick the area it belongs to.' },
  { title: 'What do you want to do?', hint: 'Pick the action. The next step adds the detail.' },
  { title: 'Add the detail', hint: 'This is the specific part of the title.' },
  { title: 'How should it count?', hint: 'Daily goals reset every day. To-dos stay until they are finished.' },
  { title: 'Does this look right?', hint: 'Edit the title if you want, then add it.' },
];

function GoalWizard(props) {
  const theme = props.userObj.theme;
  const [step, setStep] = useState(0);
  const [area, setArea] = useState('');
  const [action, setAction] = useState('');
  const [detail, setDetail] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [type, setType] = useState('');
  const [title, setTitle] = useState('');
  const [comments, setComments] = useState('');
  const [saving, setSaving] = useState(false);

  const actions = area && ACTIONS[area] ? ACTIONS[area].content : [];
  const builtTitle = `${action} ${detail.trim()}`.replace(/\s+/g, ' ').trim();
  const ready = [
    !!area,
    !!action,
    detail.trim().length > 0,
    !!difficulty && !!type,
    title.trim().length > 0 && !saving,
  ][step];

  function chooseArea(value) {
    if (value !== area) {
      setAction('');
      setDetail('');
    }
    setArea(value);
  }

  function goNext() {
    if (!ready) return;
    Keyboard.dismiss();
    if (step === 2) setTitle(builtTitle);
    if (step === STEPS.length - 1) {
      setSaving(true);
      Promise.resolve(props.onCreate({
        title: title.trim(),
        diff: difficulty,
        type,
        comments: comments.trim(),
      })).catch(() => setSaving(false));
      return;
    }
    setStep(step + 1);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <Pressable onPress={props.onExit} style={styles.exitButton}>
          <TextFont style={[styles.exitText, { color: theme.secondary }]}>Exit</TextFont>
        </Pressable>
        <TextFont style={[styles.stepCount, { color: theme.secondary }]}>{step + 1} of {STEPS.length}</TextFont>
      </View>
      <View style={styles.progress}>
        {STEPS.map((item, index) => (
          <View
            key={item.title}
            style={[styles.progressTick, { backgroundColor: index <= step ? theme.primary : '#e4ddd2' }]}
          />
        ))}
      </View>
      <TextFont style={[styles.title, { color: theme.secondary }]}>{STEPS[step].title}</TextFont>
      <TextFont style={styles.hint}>{STEPS[step].hint}</TextFont>

      <View style={styles.body}>
        {step === 0 ? (
          <ChoiceList options={AREAS} selected={area} onSelect={chooseArea} theme={theme} />
        ) : null}
        {step === 1 ? (
          <ChoiceList options={actions} selected={action} onSelect={setAction} theme={theme} />
        ) : null}
        {step === 2 ? (
          <View style={styles.detailBlock}>
            <TextFont style={[styles.preview, { color: theme.secondary }]}>{action}</TextFont>
            <TextInput
              style={[styles.input, { color: theme.secondary, borderColor: theme.secondary }]}
              value={detail}
              onChangeText={setDetail}
              placeholder={EXAMPLES[action] || 'the specific target'}
              placeholderTextColor={'gray'}
            />
          </View>
        ) : null}
        {step === 3 ? (
          <View style={styles.schedule}>
            <TextFont style={styles.groupLabel}>Repeats</TextFont>
            <View style={styles.row}>
              <ChoicePill label="Daily" selected={type === 'daily'} onPress={() => setType('daily')} theme={theme} />
              <ChoicePill label="To Do" selected={type === 'ToDo'} onPress={() => setType('ToDo')} theme={theme} />
            </View>
            <TextFont style={styles.groupLabel}>Difficulty</TextFont>
            <View style={styles.row}>
              {['Easy', 'Medium', 'Hard'].map((level) => (
                <ChoicePill
                  key={level}
                  label={level}
                  caption={POINTS[level]}
                  selected={difficulty === level}
                  onPress={() => setDifficulty(level)}
                  theme={theme}
                />
              ))}
            </View>
          </View>
        ) : null}
        {step === 4 ? (
          <View style={styles.detailBlock}>
            <TextInput
              style={[styles.input, { color: theme.secondary, borderColor: theme.secondary }]}
              value={title}
              onChangeText={setTitle}
            />
            <TextFont style={styles.summary}>
              {type === 'daily' ? 'Daily' : 'To Do'} · {difficulty} · {POINTS[difficulty]}
            </TextFont>
            <TextInput
              style={[styles.input, styles.commentsInput, { color: theme.secondary, borderColor: theme.secondary }]}
              value={comments}
              onChangeText={setComments}
              multiline
              numberOfLines={3}
              placeholder="Comments (optional)"
              placeholderTextColor={'gray'}
            />
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        {step > 0 ? (
          <Pressable style={styles.backButton} onPress={() => setStep(step - 1)}>
            <TextFont style={styles.backText}>Back</TextFont>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.nextButton, { backgroundColor: theme.primary }, ready ? null : styles.nextDisabled]}
          onPress={goNext}
          disabled={!ready}
        >
          <TextFont style={[styles.nextText, { color: theme.secondary }]}>{step === STEPS.length - 1 ? 'Add goal' : 'Continue'}</TextFont>
        </Pressable>
      </View>
    </View>
  );
}

function ChoiceList({ options, selected, onSelect, theme }) {
  return (
    <View style={styles.choices}>
      {options.map((option) => (
        <Pressable
          key={option}
          style={[styles.choice, selected === option ? { borderColor: theme.primary, backgroundColor: theme.primary } : null]}
          onPress={() => onSelect(option)}
        >
          <TextFont style={[styles.choiceText, { color: theme.secondary }]}>{option}</TextFont>
        </Pressable>
      ))}
    </View>
  );
}

function ChoicePill({ label, caption, selected, onPress, theme }) {
  return (
    <Pressable
      style={[styles.pill, selected ? { borderColor: theme.primary, backgroundColor: theme.primary } : null]}
      onPress={onPress}
    >
      <TextFont style={[styles.choiceText, { color: theme.secondary }]}>{label}</TextFont>
      {caption ? <TextFont style={styles.caption}>{caption}</TextFont> : null}
    </Pressable>
  );
}

export default GoalWizard;

const styles = StyleSheet.create({
  screen: {
    height: '100%',
    width: '100%',
    justifyContent: 'flex-start',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  exitButton: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 12,
  },
  exitText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepCount: {
    fontSize: 14,
  },
  progress: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 18,
  },
  progressTick: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hint: {
    color: 'gray',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },
  body: {
    flex: 1,
    width: '100%',
    overflow: 'auto',
  },
  choices: {
    width: '100%',
    gap: 10,
  },
  choice: {
    width: '100%',
    minHeight: 48,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  choiceText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailBlock: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  preview: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    borderWidth: 2,
    borderRadius: 14,
    padding: 12,
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: '#fff',
  },
  schedule: {
    width: '100%',
    gap: 10,
  },
  groupLabel: {
    color: 'gray',
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 6,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  pill: {
    flex: 1,
    minHeight: 52,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 8,
  },
  caption: {
    color: 'gray',
    fontSize: 12,
    marginTop: 2,
  },
  summary: {
    color: 'gray',
    fontSize: 16,
  },
  commentsInput: {
    minHeight: 72,
    textAlign: 'left',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 12,
  },
  backButton: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: 'gray',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: 'gray',
    fontSize: 16,
    fontWeight: 'bold',
  },
  nextButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextDisabled: {
    opacity: 0.45,
  },
  nextText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});
