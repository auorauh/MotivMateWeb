import { StyleSheet, View, Text, FlatList, ScrollView } from '../platform';
import TextFont from './TextFont';
import { useState, useEffect } from 'react';
import FontAwesome5 from '../platform/icons';
import ProgressRing from './ProgressRing';

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
    <svg className="mm-ring-target" viewBox="0 0 200 200" aria-hidden="true">
      <circle cx="100" cy="100" r="78" fill="none" stroke={ink} strokeOpacity="0.4" strokeWidth="16" />
      <circle cx="100" cy="100" r="54" fill="none" stroke={ink} strokeOpacity="0.28" strokeWidth="12" />
      <circle cx="100" cy="100" r="32" fill={ink} fillOpacity="0.14" />
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

function AnalyticsPage(props) {
  const [progress, setProgress] = useState(0);
  const [percent, setPercent] = useState(0);
  const [maxDataValue, setMaxDataValue] = useState(Math.max(...props.userObj.lastTwoWeeks));
  const [goals, setGoals] = useState('');
  const [goalTitles, setTitles] = useState([]);

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
    setProgress(calcProgress);
    let percent = Math.floor(calcProgress * 100);
      setPercent(percent);
  }
  }
  function createReport(){
    let dailyGoals = [];
    for(let i =0; i< props.goals.length;i++){
      if(props.goals[i].type == 'daily'){
        dailyGoals.push({title: props.goals[i].title, timesCompleted: props.goals[i].timesCompleted});
      }
    }
    setTitles(dailyGoals);
  }


      return (
        <ScrollView>
      <View style={[styles.analyticsPage]}>
        
        <View style={[styles.ringContainer , {borderColor:props.userObj.theme.secondary}]}>
            <RingWash theme={props.userObj.theme} />
            <TextFont style={[styles.dailyHeader, {color:props.theme.secondary}]} >You completed {percent}% of your daily goals.</TextFont>
            <View style={styles.progressRing}>
                <GraphWash theme={props.userObj.theme} />
                <ProgressRing progress={percent} theme={props.userObj.theme}/>
            </View>
          </View>
          <View style={styles.userData}>

<View style={styles.container}>
  <ChartWash theme={props.userObj.theme} />
  <TextFont style={[styles.graphHeader, {color:props.theme.secondary}]}>Daily Score last 14 days</TextFont>
  <View style={styles.graph}>
    {props.userObj.lastTwoWeeks.map((value, index) => (
    <View key={index} style={styles.barContainer}>
      <View style={[styles.bar, maxDataValue===0? {height: 100 , backgroundColor: 'none'} :{ height: (value / maxDataValue) * 100 ,backgroundColor: props.userObj.theme.primary}, value===0 ? {borderBottomWidth: 1}: {borderWidth: 1}]} />
      <TextFont style={[{color: props.userObj.theme.secondary}]}>{value}</TextFont>
    </View>
    ))}
  </View>
  <View style={styles.barLabels}>
    <TextFont style={{color:props.theme.secondary}}>^14 Days Ago</TextFont>
    <TextFont style={{color:props.theme.secondary}}>Yesterday^</TextFont>
  </View>
</View>       
</View>
  <View style={[styles.monthReview, {borderColor: props.userObj.theme.secondary}]}>
    <TextFont style={[styles.headerText, {color: props.theme.secondary}]}>Month in Review</TextFont>
    <TextFont style={[{color: props.theme.secondary}]}> (Daily Goals)</TextFont>
    {goalTitles.length > 0 ? (
      <>
        <View style={styles.lineItemBox}>
          <View style={[styles.lineItemTitle, {color: props.theme.secondary}, {borderColor: props.userObj.theme.secondary}]}><TextFont style={[styles.headerText,{textAlign:'center'}]}> Title</TextFont></View> 
          <View style={[styles.lineItemTitle, {color: props.theme.secondary}, {borderColor: props.userObj.theme.secondary}]}><TextFont style={[styles.headerText,{textAlign:'center'}]}> Completed</TextFont></View>
        </View>
        {goalTitles.map((item, index) => (
          <View style={styles.lineItem} key={`goal_${index}`}>
            <View style={[styles.reportLine, {color: props.theme.secondary}, {borderColor: props.userObj.theme.secondary}]}><TextFont style={styles.reportText}>{item.title}</TextFont></View>
            <View style={[styles.reportLine, {color: props.theme.secondary}, {borderColor: props.userObj.theme.secondary}]}><TextFont style={styles.reportText}>{item.timesCompleted}</TextFont></View>
          </View>
        ))}
      </>
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
    gap: '15%',
    padding: 10,
  },
  monthReview: {
    borderWidth: 1,
    width: '100%',
    padding: '3%',
    borderRadius: 15,
    minHeight: '33%',
    overflow: 'hidden',
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
    
  },
  lineItemBox: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    
  },
  lineItemTitle: {
    width: '50%'
  },
  reportLine: {
    borderTopWidth: 1,
    width: '50%',
    padding: 5
  },
  reportText: {
    fontSize: 16,
    textAlign: 'center',
  },
  headerText: {
    fontSize: 20,
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
    minHeight: 140,
    borderRadius: 15,
    overflow: 'hidden'
  },
  dailyHeader: { 
    textAlign: 'center',
    width: '60%',
    fontSize: 20,
    paddingLeft: '10%',
    textShadowColor: 'rgba(255, 249, 239, 0.8)',
    textShadowOffset: {width: 0, height: 0},
    textShadowRadius: 6
  },
  progressRing: {
    position: 'relative',
    transform: [{ rotate: '-90deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    position: 'relative',
    zIndex: 0,
    textAlign: 'center',
    borderRadius: 15,
    justifyContent: 'space-evenly',
    overflow: 'hidden'
  },
  graphHeader: {
    textAlign: 'center',
    fontSize: 20,
    marginBottom: '10%',
    marginTop: '5%',
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
  barLabels : {
    width: '95%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'center',
    marginBottom: '5%',
  },
})