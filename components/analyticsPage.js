import { StyleSheet, View, ScrollView, Pressable } from '../platform';
import TextFont from './TextFont';
import { useState, useEffect } from 'react';
import ProgressRing from './ProgressRing';
import { caloriesOn, readCalorieBook } from './CaloriePage';

function RingWash({ theme }) {
  return (
    <svg className="mm-card-bg" viewBox="0 0 400 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="160" fill={theme.background} />
    </svg>
  );
}

function GraphWash({ theme }) {
  const ink = theme.primary;
  return (
    <svg viewBox="22 22 156 156" preserveAspectRatio="xMidYMid meet" aria-hidden="true" style={{ position: 'absolute', left: '50%', top: '50%', width: 180, height: 180, transform: 'translate(-50%, -50%)', pointerEvents: 'none' }}>
      <circle cx="100" cy="100" r="62" fill="none" stroke={ink} strokeOpacity="0.6" strokeWidth="22" />
      <circle cx="100" cy="100" r="38" fill="none" stroke={ink} strokeOpacity="0.48" strokeWidth="16" />
      <circle cx="100" cy="100" r="16" fill={ink} fillOpacity="0.24" />
    </svg>
  );
}

function ChartWash({ theme }) {
  const ink = theme.primary;
  return (
    <svg className="mm-card-bg" viewBox="0 0 400 200" preserveAspectRatio="none" aria-hidden="true">
      <rect width="400" height="200" fill={theme.background} />
      <path d="M0 118 C 70 78, 130 150, 210 108 S 330 62, 400 96 V 200 H 0 Z" fill={ink} fillOpacity="0.34" />
      <path d="M0 148 C 90 118, 150 176, 240 142 S 350 112, 400 132 V 200 H 0 Z" fill={ink} fillOpacity="0.22" />
    </svg>
  );
}

function dayKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function mixColor(from, to, amount) {
  const read = (hex) => [1, 3, 5].map((index) => parseInt(hex.slice(index, index + 2), 16));
  const start = read(from);
  const end = read(to);
  const mixed = start.map((value, index) => Math.round(value + (end[index] - value) * amount));
  return `rgb(${mixed[0]}, ${mixed[1]}, ${mixed[2]})`;
}

function calorieColor(amount, goal) {
  if (!amount || !goal) return null;
  const ratio = amount / goal;
  if (ratio < 1) return mixColor('#3c9a62', '#e2b340', Math.max(0, (ratio - 0.75) / 0.25));
  return mixColor('#e2b340', '#d64545', Math.min(1, (ratio - 1) / 0.4));
}

function calorieLabel(amount, goal) {
  if (!amount) return 'not logged';
  if (amount < goal) return 'under goal';
  if (amount === goal) return 'at goal';
  return 'over goal';
}

function compactCal(amount) {
  if (!amount) return '';
  if (amount >= 1000) {
    const tenths = Math.round(amount / 100) / 10;
    return `${tenths % 1 === 0 ? tenths.toFixed(0) : tenths.toFixed(1)}k`;
  }
  return String(Math.round(amount));
}

function scoreCaption(today, best) {
  const points = today ?? 0;
  const record = best ?? 0;
  if (record > 0 && points > record) return `${points} points today, a new best`;
  if (record > 0 && points === record) return `${points} points today, tied with your best`;
  if (record > 0) return `${points} today · best ${record} · ${record - points} short`;
  return `${points} points today`;
}

function weekCaption(scores) {
  if (scores.length < 14) return '';
  const lastWeek = scores.slice(0, 7).reduce((sum, value) => sum + Number(value || 0), 0);
  const thisWeek = scores.slice(7).reduce((sum, value) => sum + Number(value || 0), 0);
  const delta = thisWeek - lastWeek;
  if (delta === 0) return `This week ${thisWeek} · same as last week`;
  const direction = delta > 0 ? 'up' : 'down';
  return `This week ${thisWeek} · last week ${lastWeek} · ${direction} ${Math.abs(delta)}`;
}

function AnalyticsPage(props) {
  const [percent, setPercent] = useState(0);
  const [goalTitles, setTitles] = useState([]);
  const scores = Array.isArray(props.userObj.lastTwoWeeks) ? props.userObj.lastTwoWeeks : [];
  const maxDataValue = scores.reduce((max, value) => Math.max(max, Number(value) || 0), 0);
  const bestIndex = scores.reduce((found, value, index) => (
    Number(value) > 0 && Number(value) === maxDataValue ? index : found
  ), -1);
  const missedYesterday = scores.length > 0 && Number(scores[scores.length - 1]) === 0;
  const calorieBook = readCalorieBook(props.userObj);
  const today = new Date();
  const nightsClosed = Math.max(today.getDate() - 1, 1);
  const finishedGoals = goalTitles.filter((goal) => goal.timesCompleted > 0);
  const untouchedGoals = goalTitles.filter((goal) => goal.timesCompleted === 0);
  const sunday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay(), 12);
  const weekDays = Array.from({ length: 7 }, (_, index) => (
    new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + index, 12)
  ));
  const monthName = today.toLocaleDateString(undefined, { month: 'long' });
  const monthCells = [];
  const firstWeekday = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const daysLeft = daysInMonth - today.getDate() + 1;
  for (let pad = 0; pad < firstWeekday; pad += 1) monthCells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    monthCells.push(new Date(today.getFullYear(), today.getMonth(), day, 12));
  }
  const darkTheme = props.userObj.theme.background === '#0e1111';
  const emptySquare = darkTheme ? 'rgba(255,249,239,0.16)' : '#e6dfd4';
  const weekLetterColor = darkTheme ? '#fff9ef' : '#241f33';
  const dayMark = (date) => {
    const later = date && (
      date.getFullYear() > today.getFullYear()
      || (date.getFullYear() === today.getFullYear() && date.getMonth() > today.getMonth())
      || (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() > today.getDate())
    );
    if (!date || later) {
      return { color: emptySquare, label: 'ahead', amount: 0 };
    }
    const amount = caloriesOn(calorieBook, dayKey(date));
    return {
      color: calorieColor(amount, calorieBook.goal) || emptySquare,
      label: calorieLabel(amount, calorieBook.goal),
      amount,
    };
  };

  useEffect(() => {
    createReport();
    calcualteMaxGoal();
  }, []);
  function calcualteMaxGoal(){
    let maxGoal = 0;
    let complete = 0;
    for(let i=0;i<props.goals.length;i++){
      if(props.goals[i].type == 'daily'){
        maxGoal = maxGoal+1;
        if(props.goals[i].complete == true){
          complete = complete +1;
        }
      }
    }
  if(complete !=0 && maxGoal != 0){
    let calcProgress = (complete / maxGoal);
    let percent = Math.floor(calcProgress * 100);
      setPercent(percent);
  }
  }
  function createReport(){
    let dailyGoals = [];
    for(let i =0; i< props.goals.length;i++){
      if(props.goals[i].type == 'daily'){
        dailyGoals.push({
          title: props.goals[i].title,
          timesCompleted: props.goals[i].timesCompleted || 0,
          streak: props.goals[i].streak || 0,
        });
      }
    }
    dailyGoals.sort((a, b) => b.timesCompleted - a.timesCompleted || b.streak - a.streak);
    setTitles(dailyGoals);
  }


      return (
        <ScrollView>
      <View style={[styles.analyticsPage]}>
        
        <View style={[styles.ringContainer , {borderColor:props.userObj.theme.secondary}]}>
            <RingWash theme={props.userObj.theme} />
            <View style={styles.dailyCopy}>
            <TextFont style={[styles.dailyHeader, {color:props.theme.secondary}]} >You completed {percent}% of your daily goals.</TextFont>
            <TextFont style={[styles.scoreNote, {color:props.theme.secondary}]}>{scoreCaption(props.userObj.dailyScore, props.userObj.hiScore)}</TextFont>
            </View>
            <View style={styles.progressRing}>
                <GraphWash theme={props.userObj.theme} />
                <ProgressRing progress={percent} theme={props.userObj.theme} size={78} />
            </View>
          </View>
          <View style={styles.userData}>

<View style={[styles.container, {borderColor: props.userObj.theme.secondary}]}>
  <ChartWash theme={props.userObj.theme} />
  <TextFont style={[styles.graphHeader, {color:props.theme.secondary}]}>Daily Score last 14 days</TextFont>
  <View style={styles.graph}>
    {scores.map((value, index) => {
    const best = index === bestIndex;
    return (
    <View key={index} style={styles.barContainer}>
      <View style={[styles.bar, maxDataValue===0? {height: 100 , backgroundColor: 'none'} :{ height: (value / maxDataValue) * 100 ,backgroundColor: props.userObj.theme.primary}, value===0 ? {borderBottomWidth: 1}: {borderWidth: 1}, best ? styles.bestBar : null]} />
      <TextFont style={[styles.barValue, {color: props.userObj.theme.secondary}, best ? styles.bestValue : null]}>{value}</TextFont>
      {best ? <TextFont style={styles.bestTag}>Best</TextFont> : null}
    </View>
    );
    })}
  </View>
  <View style={styles.barLabels}>
    <TextFont style={{color:props.theme.secondary}}>^14 Days Ago</TextFont>
    <TextFont style={{color:props.theme.secondary}}>Yesterday^</TextFont>
  </View>
  <TextFont style={[styles.weekLine, {color:props.theme.secondary}]}>{weekCaption(scores)}</TextFont>
  {missedYesterday ? <TextFont style={styles.missed}>Missed yesterday</TextFont> : null}
</View>       
</View>
  <View style={[styles.monthReview, {borderColor: props.userObj.theme.secondary}]}>
    <View style={styles.calHead}>
      <TextFont style={[styles.headerText, {color: props.theme.secondary}]}>Calories</TextFont>
      <Pressable aria-label="Calorie tracker" onPress={props.onOpenCalories}>
        <TextFont style={[styles.calLink, {color: props.theme.secondary}]}>Tracker</TextFont>
      </Pressable>
    </View>
    <TextFont style={[styles.monthSub, {color: props.theme.secondary}]}>This week</TextFont>
    <View style={styles.weekRow}>
      {weekDays.map((date) => {
        const mark = dayMark(date);
        const letter = ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
        return (
          <View key={dayKey(date)} style={styles.weekDay} aria-label={`${letter}, ${compactCal(mark.amount) || mark.label}`}>
            <View style={[styles.weekSquare, { backgroundColor: mark.color }]}>
              <TextFont style={[styles.weekLetter, { color: weekLetterColor }]}>
                {letter}
              </TextFont>
            </View>
            <TextFont style={[styles.weekCal, { color: props.theme.secondary }]}>
              {compactCal(mark.amount) || ' '}
            </TextFont>
          </View>
        );
      })}
    </View>
    <TextFont style={[styles.monthSub, {color: props.theme.secondary}]}>{monthName}</TextFont>
    <View style={styles.monthGrid}>
      {monthCells.map((date, index) => {
        if (!date) return <View key={`pad-${index}`} style={styles.monthCell} />;
        const mark = dayMark(date);
        return (
          <View key={dayKey(date)} style={styles.monthCell} aria-label={`${date.getDate()}, ${mark.label}`}>
            <View style={[styles.monthSquare, { backgroundColor: mark.color }]} />
          </View>
        );
      })}
    </View>
  </View>
  <View style={[styles.monthReview, {borderColor: props.userObj.theme.secondary}]}>
    <TextFont style={[styles.headerText, {color: props.theme.secondary}]}>Month in Review</TextFont>
    <TextFont style={[styles.monthSub, {color: props.theme.secondary}]}>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</TextFont>
    {goalTitles.length > 0 ? (
      <View style={styles.goalList}>
        {finishedGoals.map((item, index) => {
          const width = `${Math.min(100, Math.round((item.timesCompleted / nightsClosed) * 100))}%`;
          return (
            <View key={`goal_${index}`} style={styles.goalRow}>
              <View style={styles.goalName}>
                <TextFont style={[styles.goalTitle, {color: props.theme.secondary}]}>{item.title}</TextFont>
                {item.streak > 0 ? <TextFont style={styles.streakNote}>Streak {item.streak}</TextFont> : null}
              </View>
              <View style={[styles.goalTrack, {backgroundColor: emptySquare}]}>
                <View style={[styles.goalFill, {width, backgroundColor: props.userObj.theme.primary}]} />
              </View>
              <TextFont style={[styles.goalCount, {color: props.theme.secondary}]}>{item.timesCompleted}</TextFont>
            </View>
          );
        })}
        {untouchedGoals.length > 0 ? (
          <TextFont style={styles.streakNote}>Not yet · {untouchedGoals.map((goal) => goal.title).join(', ')}</TextFont>
        ) : null}
      </View>
    ) : (
      <TextFont style={[{color: props.theme.secondary}]}>You have no Daily Goals</TextFont>
    )}
  </View>
      </View>
      </ScrollView>
      );
};

export default AnalyticsPage;

const styles = StyleSheet.create({
  analyticsPage: {
    alignItems: 'center',
    gap: 16,
    padding: 16,
    paddingBottom: 120,
  },
  monthReview: {
    borderWidth: 1,
    width: '100%',
    paddingTop: 8,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 8,
    borderRadius: 15,
    overflow: 'hidden',
  },
  calHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  calLink: {
    fontSize: 14,
    textDecoration: 'underline',
    textUnderlineOffset: 3,
  },
  monthSub: {
    fontSize: 13,
    marginTop: 1,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekSquare: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLetter: {
    fontSize: 13,
    fontWeight: '700',
  },
  weekCal: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.2,
    marginTop: 3,
    minHeight: 13,
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  monthCell: {
    width: '14.28%',
    alignItems: 'center',
    marginBottom: 4,
  },
  monthSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  goalList: {
    marginTop: 8,
    marginBottom: 6,
    gap: 8,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goalName: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  goalTitle: {
    fontSize: 14,
  },
  goalTrack: {
    width: 96,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  goalFill: {
    height: '100%',
    borderRadius: 4,
  },
  goalCount: {
    width: 22,
    fontSize: 14,
    textAlign: 'right',
  },
  streakNote: {
    fontSize: 11,
    color: 'gray',
  },
  headerText: {
    fontSize: 18,
    fontWeight: 500
  },
  userData: {
    width: '100%',
    justifyContent:  'space-between',
  },
  ringContainer: {
    position: 'relative',
    zIndex: 0,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 100,
    borderRadius: 15,
    overflow: 'hidden'
  },
  dailyHeader: { 
    textAlign: 'center',
    fontSize: 18,
    textShadowColor: 'rgba(255, 249, 239, 0.8)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 6
  },
  dailyCopy: {
    flex: 1,
    paddingLeft: 16,
    paddingRight: 8,
    justifyContent: 'center',
  },
  scoreNote: {
    textAlign: 'center',
    fontSize: 13,
    marginTop: 6,
  },
  progressRing: {
    position: 'relative',
    width: 100,
    height: 100,
    marginRight: 8,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center',
    borderWidth: 1,
    borderRadius: 15,
    paddingTop: 12,
    paddingBottom: 8,
    overflow: 'hidden'
  },
  graphHeader: {
    textAlign: 'center',
    fontSize: 20,
    marginBottom: 8,
  },
  graph: {
    flexDirection: 'row',
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
    alignSelf:'flex-end',
  },
  bar: {
    width: 25,
    backgroundColor: '#0080ff',
    justifyContent: 'flex-end',
  },
  bestBar: {
    borderWidth: 2,
    borderColor: '#241f33',
  },
  barValue: {
    fontSize: 11,
  },
  bestValue: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  bestTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#241f33',
  },
  weekLine: {
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  missed: {
    textAlign: 'center',
    fontSize: 13,
    color: '#8a5a32',
    marginTop: 4,
  },
  barLabels : {
    width: '95%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    marginTop: 4,
  },
})