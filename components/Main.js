import { useEffect, useState, useRef} from 'react';
import { StyleSheet, View, Image, Text, AppState, Keyboard,} from '../platform';
import { StatusBar } from '../platform/status-bar';
import { useNavigation } from '../platform/navigation';
import Nav from './Nav';
import GoalList from './GoalList';
import TextFont from './TextFont'
import FontAwesome5 from '../platform/icons';
import axios from 'axios';
import * as Notifications from '../platform/notifications';
import storage from "../platform/storage";
import {API_URL} from '../platform/env';
import { blue } from '../functions/colors'
import BackgroundSVG from '../assets/BackgroundSVG';
import DarkBackground from '../assets/DarkBackground';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true
  })
});

export default function App( {route} ) {
  const [component, setComponent] = useState(null)
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();
  const [userObj, setuserObj] = useState(route.params);
  const [theme, setTheme] = useState(blue);
  const [goalModal, setGoalModal] = useState(false);
  const [userGoals, setUserGoals] = useState([]);
  const [allGoals, setAllGoals] = useState([]);
  const [dailyGoals, setDailyGoals] = useState([]);
  const [groupGoals, setGroupGoals] = useState([]);
  const [toDoGoals, setToDoGoals] = useState([]);
  const [score, setScore] = useState();
  const [refreshing, setRefreshing] = useState(false);
  const [lastOpenDate, setLastOpenDate] = useState(null);
  const [childKey, setChildKey] = useState(1);
  const childRef = useRef(null);
  const goalList = <GoalList API_URL={API_URL} ref={childRef} userObj={userObj} theme={theme} refresh={refresh} refreshing={refreshing} userGoals={userGoals} completeGoal={completeGoal} deleteGoal={deleteGoal} setListType={setListType} onReorder={reorderGoals}/>;

  const updateKey = () => {
    // Generate a new unique key for the child component to re-render on change
    const newKey = Date.now();
    setChildKey(newKey);
  };
  useEffect(() => {
    const refreshOnOpen = (nextAppState) => {
      if (nextAppState == 'active') {
        resetUser();
      } else {
      }
    };
    const resetUser = () => {
      setRefreshing(true)
      setAllGoals([]);
      setUserGoals([]);
      setScore('-');
      updateKey();
      refresh();
    };
    // Event listeners for touch and key press events
    AppState.addEventListener('change', refreshOnOpen);
    
    if(userObj._id != undefined && userObj._id != null){
      setTheme(userObj.theme);
      getGoals(userObj._id);
      sortGoals(userGoals);
      setScore(userObj.dailyScore);
    }
    const getPermission = async () => {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            alert('Enable push notifications to use the app!');
            await storage.setItem('expopushtoken', "");
            return;
          }
          const token = (await Notifications.getExpoPushTokenAsync()).data;
          await storage.setItem('expopushtoken', token);
        // if (Platform.OS === 'android') {
        //   Notifications.setNotificationChannelAsync('default', {
        //     name: 'default',
        //     importance: Notifications.AndroidImportance.MAX,
        //     vibrationPattern: [0, 250, 250, 250],
        //     lightColor: '#FF231F7C',
        //   });
        // }
    }
    getPermission();
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {});
    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
      try{
        AppState.removeEventListener('active', refreshOnOpen);
      } catch {}
      
    };
  }, []);

function refresh(){
  setRefreshing(true);
  getUser(userObj.email);
  getGoals(userObj._id);
  sortGoals(userGoals);
  setRefreshing(false);
}
async function getUser(email){
    fetch(`${API_URL}/api/users/${email}`)
    .then(response => response.json())
    .then(user => {getUserHelper(user)})
    .catch(err => console.log(err));
}
  function getUserHelper(user) {
    setScore(user.dailyScore);
    setuserObj(user);
}
async function getGoals(_id) {
    axios.get(`${API_URL}/api/users/goals/${_id}`, {
      params: {
        _id: userObj._id
      }
    })
      .then(function (response) {
        if(response.data){
          const ordered = sortByOrder(response.data);
          setUserGoals(ordered);
          sortGoals(ordered);
          updateKey();
        }
      })
      .catch(function (error) {
        console.log('.get /goals/_id ERROR',error);
      });
      setTimeout(() => {
      }, 0);
}
function applyTheme(nextTheme) {
  setTheme(nextTheme);
  setuserObj((current) => ({ ...current, theme: nextTheme }));
}
function startAddGoal(){
  setGoalModal(true);
}
function cancelGoal(){
  setGoalModal(false);
}
function addGoalHandler(goalObject) {
  let newGoal = goalObject
  if(newGoal.complete){
    switch(newGoal.difficulty){
      case 'Easy':
        setScore(score + 10);
        break;
      case 'Medium':
        setScore(score + 25);
        break;
      case 'Hard':
        setScore(score + 100);
        break;
      default:
        break;

    }
  }
  setUserGoals((currentGoals) => [...currentGoals,newGoal]);
  resetList();
  refresh();
  updateKey();
  cancelGoal();
}
function setMainComponent(component){
setComponent(component);
}
function completeGoal(_id) {
  const goal = userGoals.find((goal) => goal._id === _id);
  if (!goal) return;
  goal.complete = !goal.complete;
  let tempScore =0;
  for(let i=0;i<userGoals.length;i++){
    if(userGoals[i].complete == true){
      switch(userGoals[i].difficulty){
        case 'Easy':
          tempScore = tempScore + 10;
          break;
        case 'Medium':
          tempScore = tempScore + 25;
          break;
        case 'Hard':
          tempScore = tempScore + 100;
          break;
      }
    }
  }
  userObj.dailyScore = tempScore;
  setScore(tempScore);

  try {
    axios.put(`${API_URL}/api/users/goals/${_id}`, goal);
    axios.put(`${API_URL}/api/users/${userObj.email}`, userObj);
  } catch (err) {
    console.log('.put /goals/_id or .put /users/_id ERROR', err);
  }

  updateKey();
}


  async function deleteGoal(_id) {
    const goal = userGoals.find((item) => item._id === _id);
    if (!goal) return;
    const wasComplete = goal.complete === true;
    const remaining = userGoals.filter((item) => item._id !== _id);
    if (wasComplete) {
      let nextScore = 0;
      remaining.forEach((item) => {
        if (item.complete === true) {
          switch (item.difficulty) {
            case 'Easy':
              nextScore += 10;
              break;
            case 'Medium':
              nextScore += 25;
              break;
            case 'Hard':
              nextScore += 100;
              break;
          }
        }
      });
      userObj.dailyScore = nextScore;
      setScore(nextScore);
    }
    try {
      await axios.delete(`${API_URL}/api/users/goals/${goal._id}`);
      if (wasComplete) {
        await axios.put(`${API_URL}/api/users/${userObj.email}`, userObj);
      }
    } catch (error) {
      console.error('.delete /deletegoals/_id ERROR', error);
    }
    setUserGoals(() => remaining);
    updateKey();
  }
  function sortByOrder(goals) {
  return [...goals].sort((a, b) => {
    const ao = a.order;
    const bo = b.order;
    if (ao == null && bo == null) return 0;
    if (ao == null) return 1;
    if (bo == null) return -1;
    return ao - bo;
  });
}
function reorderGoals(fromId, toId, before) {
  if (!fromId || !toId) return;
  const visibleIds = new Set(userGoals.map((goal) => goal._id));
  const full = allGoals.length ? [...allGoals] : [...userGoals];
  const visible = full.filter((goal) => visibleIds.has(goal._id));
  const from = visible.findIndex((goal) => goal._id === fromId);
  if (from < 0 || visible.findIndex((goal) => goal._id === toId) < 0) return;
  const [moved] = visible.splice(from, 1);
  let insertAt = visible.findIndex((goal) => goal._id === toId);
  if (!before) insertAt += 1;
  if (insertAt === from) return;
  visible.splice(insertAt, 0, moved);
  let nextVisible = 0;
  const next = full.map((goal) => (visibleIds.has(goal._id) ? visible[nextVisible++] : goal))
    .map((goal, index) => ({ ...goal, order: index }));
  sortGoals(next);
  setUserGoals(next.filter((goal) => visibleIds.has(goal._id)));
  updateKey();
  next.forEach((goal) => {
    axios.put(`${API_URL}/api/users/goals/${goal._id}`, goal).catch((error) => {
      console.log('.put /goals order ERROR', error);
    });
  });
}
function sortGoals(goals){
    setAllGoals(goals.filter(goal => goal));
    setDailyGoals(goals.filter(goal => goal.type === 'daily'));
    setGroupGoals(goals.filter(goal => goal.type === 'group'));
    setToDoGoals(goals.filter(goal => goal.type === 'ToDo'));
  }
  function setListType(type){
    switch(type.id) {
      case 'daily':
        setUserGoals(dailyGoals);
        break;
      case 'group':
        setUserGoals(groupGoals);
        break;
      case 'ToDo':
        setUserGoals(toDoGoals);
        break;
      default:
        setUserGoals(allGoals);
        break;
    }
    type.selected = true;
    updateKey();
    return type
  }
  function resetList() {
    childRef.current.resetGoalList();
  }
  const navigation = useNavigation();
  function logout(){
  props.cancel();
  navigation.navigate('LoginPage');
  }


  return (
    <>
    {userObj.theme.background != '#0e1111' ?  <BackgroundSVG/> : <DarkBackground/>}
    {theme.background != '#0e1111' ? <StatusBar style='dark'/> : <StatusBar style='light'/>}
    <View style={[styles.container]}>
      <View style={styles.logoContainer}>
        <FontAwesome5 style={[styles.userIcon, userObj == {} ? {color:'#00bcd4'} : {color:theme.primary}]} name={'user-circle'} />
        <TextFont style={styles.scoreText}>Score: {score}</TextFont>
      </View>
      <View style={styles.goalSection}>
        {component}
      </View>
    </View>
    <Nav style={styles.nav}
        API_URL={API_URL} 
        setMainComponent={setMainComponent} 
        goalList={goalList}
        setListType={setListType}
        refresh={refresh}
        key={childKey}
        goals={allGoals}
        userObj={userObj} 
        setTheme={applyTheme} 
        theme={theme} 
        goalInput={goalModal} 
        addGoal={startAddGoal}  
        onAddGoal={addGoalHandler} 
        cancel={cancelGoal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 0,
    paddingTop: 16,
    width: '100%'
  },
  nav: {
    zIndex: 100,
  },
  logoContainer: {
    width: '100%',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'lightgray',
    
  },
  userIcon: {
    marginTop: 8,
    fontSize: 34,
    color: '#00bcd4',
    borderWidth:1,
    borderColor: 'lightgray',
    borderRadius: 17
  },
  scoreText: {
    color: 'grey',
    marginBottom: 8,
    fontSize: 16,
  },
  goalSection: {
    flex: 1,
    minHeight: 0,
    overflowY: 'auto',
  },
  nav: {
    height: '10%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  navIcon: {
    fontSize: 15,
    borderColor: 'lightgray',
  },
});
