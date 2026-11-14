import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Pressable} from '../platform';
import GoalList from './GoalList';
import GoalInput from './GoalInput';
import AddGoalButton from './AddGoalButton';
import UserPage from './UserPage';
import CaloriePage from './CaloriePage';
import GroceryPage from './GroceryPage';
import MealPlanPage from './MealPlanPage';
import Settings from './settings';
import AnalyticsPage from './analyticsPage';
import FontAwesome5 from '../platform/icons';
import TabSlide from './TabSlide';

export default function Nav(props) {
  const [groceryOpen, setGroceryOpen] = useState(false);
  const [mealOpen, setMealOpen] = useState(false);
  const groceryAdd = useRef(null);
  const mealAdd = useRef(null);
  const tabIndex = useRef(0);

  function showTab(index, node) {
    leaveLists();
    const from = tabIndex.current;
    const dir = index === from ? 0 : index > from ? 1 : -1;
    tabIndex.current = index;
    props.setMainComponent(
      dir
        ? (
          <TabSlide key={`nav-${index}-${Date.now()}`} dir={dir} style={{ height: '100%', minHeight: 0 }}>
            {node}
          </TabSlide>
        )
        : node
    );
  }

  useEffect(() => {
    props.setMainComponent(props.goalList);
},[])

  useEffect(() => {
    if (!props.tourTarget) return;
    if (props.tourTarget === 'goals' || props.tourTarget === 'score' || props.tourTarget === 'add') {
      goalList();
      return;
    }
    if (props.tourTarget === 'progress') {
      analyticsButton();
      return;
    }
    if (props.tourTarget === 'you') {
      userButton();
      return;
    }
    if (props.tourTarget === 'settings') {
      settingsButton();
    }
  }, [props.tourTarget])

  function leaveLists() {
    setGroceryOpen(false);
    setMealOpen(false);
  }

  function goalList(){
    showTab(0, props.goalList);
  }
  function openCalories() {
    leaveLists();
    props.setMainComponent(
      <CaloriePage userObj={props.userObj} theme={props.theme} onBack={userButton} />
    );
  }
  function openGroceries() {
    setMealOpen(false);
    setGroceryOpen(true);
    props.setMainComponent(
      <GroceryPage userObj={props.userObj} theme={props.theme} onBack={userButton} addRef={groceryAdd} />
    );
  }
  function openMeals() {
    setGroceryOpen(false);
    setMealOpen(true);
    props.setMainComponent(
      <MealPlanPage userObj={props.userObj} theme={props.theme} onBack={userButton} addRef={mealAdd} />
    );
  }
  function userButton(){
    showTab(2, (
      <UserPage
        goals={props.goals}
        userObj={props.userObj}
        theme={props.theme}
        cancel={userButton}
        onOpenCalories={openCalories}
        onOpenGroceries={openGroceries}
        onOpenMeals={openMeals}
      />
    ));
  }
  function openCaloriesFromAnalytics() {
    leaveLists();
    props.setMainComponent(
      <CaloriePage userObj={props.userObj} theme={props.theme} onBack={analyticsButton} />
    );
  }
  function analyticsButton(){
    showTab(1, (
      <AnalyticsPage
        goals={props.goals}
        userObj={props.userObj}
        theme={props.theme}
        cancel={analyticsButton}
        onOpenCalories={openCaloriesFromAnalytics}
      />
    ));
  }
  function settingsButton(){
    showTab(3, <Settings API_URL={props.API_URL} setTheme={props.setTheme} theme={props.theme} userObj={props.userObj} cancel={settingsButton} onStartGuide={props.onStartGuide}/>);
  }

  function handleAdd() {
    if (groceryOpen) {
      groceryAdd.current?.();
      return;
    }
    if (mealOpen) {
      mealAdd.current?.();
      return;
    }
    props.addGoal();
  }

    return (
        <View style={[styles.nav, {backgroundColor: props.theme.background, borderTopColor: props.theme.background}]}>
        {props.goalInput && !groceryOpen && !mealOpen ? <GoalInput API_URL={props.API_URL} userObj={props.userObj} onAddGoal={props.onAddGoal} cancel={props.cancel}/> : null}
                
        <Pressable style={[styles.navItem]} onPress={goalList}>
          <View data-tour="goals" style={styles.tourSpot}>
            <FontAwesome5 style={[styles.navIcon, props.theme.background == '#0e1111' ? {color: 'white'}:null]} name={'plus-square'} />
          </View>
        </Pressable>

        <Pressable style={styles.navItem} onPress={analyticsButton}> 
          <View data-tour="progress" style={styles.tourSpot}>
            <FontAwesome5 style={[styles.navIcon, styles.rotate, props.theme.background == '#0e1111' ? {color: 'white'}:null]} name={'align-right'} />
          </View>
        </Pressable>

        <Pressable style={styles.goalBtn}>
          <AddGoalButton theme={props.theme} passed={handleAdd}/>
        </Pressable>

        <Pressable style={styles.navItem} onPress={userButton}>
          <View data-tour="you" style={styles.tourSpot}>
            <FontAwesome5 style={[styles.navIcon, props.theme.background == '#0e1111' ? {color: 'white'}:null]} name={'user'} />
          </View>
        </Pressable>

        <Pressable style={styles.navItem} onPress={settingsButton}>
          <View data-tour="settings" style={styles.tourSpot}>
            <FontAwesome5 style={[styles.navIcon, props.theme.background == '#0e1111' ? {color: 'white'}:null]} name={'cog'} />
          </View>
        </Pressable>
      </View>
    );
}
const styles = StyleSheet.create({
    nav: {
        height: 'calc(88px + env(safe-area-inset-bottom, 0px))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        marginTop: -1,
        flexShrink: 0,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        zIndex: 0,
        borderTopWidth: 1,
        borderColor: 'lightgray'
      },
      navItem: {
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
      },
      tourSpot: {
        padding: 10,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
      },
      navIcon: {
        fontSize: 25,
        fontWeight: 100,
      },
      rotate: {
        transform: [{rotate: '90deg'}],
      },
      goalBtn: {
        transform: [{translateY: -50}],
      },
      selected: {
        backgroundColor: '#706860',
        borderRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 1, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 1,
        transform: [{translateY: 0}],
      },
})