import { StyleSheet, View } from '../platform';
import { useEffect, useState } from 'react';
import TextFont from './TextFont';
import HealthSection from './HealthSection';

function UserPage(props) {
  const [currentStreak, setStreak] = useState(0);
  const dark = props.theme.background === '#0e1111';
  const ink = dark ? '#fff9ef' : '#241f33';
  const muted = dark ? 'rgba(255,249,239,0.62)' : '#6d6578';
  const card = dark ? 'rgba(255,249,239,0.07)' : 'rgba(255,255,255,0.82)';
  const line = dark ? 'rgba(255,249,239,0.14)' : 'rgba(36,31,51,0.08)';

  useEffect(() => {
    const streak = (props.goals || []).reduce((max, current) => {
      return current.streak > max ? current.streak : max;
    }, 0);
    setStreak(streak);
  }, [props.goals]);

  const stats = [
    { label: 'Daily hi-score', value: props.userObj.hiScore ?? 0 },
    { label: 'Best score', value: props.userObj.perfectScore ?? 0 },
    { label: 'Total score', value: props.userObj.totalScore ?? 0 },
    { label: 'Goals done', value: props.userObj.goalsCompleted ?? 0 },
    { label: 'Current streak', value: currentStreak },
    { label: 'MotivRank', value: props.userObj.motivRank ?? 0 },
  ];

  return (
    <View style={styles.userPage}>
      <View style={styles.header}>
        <TextFont style={[styles.name, { color: ink }]}>{props.userObj.name}</TextFont>
        <TextFont style={[styles.email, { color: muted }]}>{props.userObj.email}</TextFont>
      </View>

      <TextFont style={[styles.sectionLabel, { color: muted }]}>Overview</TextFont>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={[styles.stat, { backgroundColor: card, borderColor: line }]}>
            <TextFont style={[styles.statValue, { color: ink }]}>{stat.value}</TextFont>
            <TextFont style={[styles.statLabel, { color: muted }]}>{stat.label}</TextFont>
          </View>
        ))}
      </View>

      <HealthSection
        userObj={props.userObj}
        theme={props.theme}
        ink={ink}
        muted={muted}
        card={card}
        line={line}
        onOpenCalories={props.onOpenCalories}
      />
    </View>
  );
}

export default UserPage;

const styles = StyleSheet.create({
  userPage: {
    width: '100%',
    paddingTop: 28,
    paddingBottom: 160,
    alignItems: 'center',
  },
  header: {
    width: '88%',
    alignItems: 'center',
    marginBottom: 28,
  },
  name: {
    fontSize: 34,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionLabel: {
    width: '88%',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  grid: {
    width: '88%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  stat: {
    width: '48%',
    borderWidth: 1,
    borderRadius: 16,
    paddingTop: 14,
    paddingBottom: 14,
    paddingLeft: 14,
    paddingRight: 14,
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 13,
    marginTop: 2,
  },
});
