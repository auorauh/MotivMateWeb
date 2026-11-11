import { View, TextInput, Button, StyleSheet, Modal, Pressable,TouchableWithoutFeedback, Keyboard} from '../platform';
import { useState } from 'react'
import GoalWizard from './GoalWizard';
import FontAwesome5 from '../platform/icons';
import axios from 'axios';
import BackgroundSVG from '../assets/BackgroundSVG';
import DarkBackground from '../assets/DarkBackground';
import TextFont from './TextFont';


function GoalInput(props) {
    const [goalTitle, setGoalText] = useState('');
    const [goalType, setType] = useState('daily');
    const [level, setLevel] = useState('Easy');
    const [sending, setSending] = useState(false);
    const [goalWizard, setGoalWizard] = useState();

    function goalInputHandler(enteredText) {
        setGoalText(enteredText);
      }
    function addGoalHandler() {
        if (sending || !goalTitle.trim()) return;
        setSending(true);
        const goal = {owner: props.userObj._id, title: goalTitle.trim(), complete: false, type: goalType, difficulty: level, timesCompleted: 0};
        axios.post(`${props.API_URL}/api/goals`, goal, {
          headers: { 'Content-Type': 'application/json' },
        }).then((res) => {
          window.setTimeout(() => props.onAddGoal(res.data), 2200);
        }).catch((err) => {
          console.log(err);
          setSending(false);
        });
    }
    function toggleGoalWizard(toggleWizard){
      if(toggleWizard){
        setGoalWizard(true);
      }
      else {
        setGoalWizard(false);
        
      }
    }
    function saveWizardGoal(goal) {
      const payload = {
        owner: props.userObj._id,
        title: goal.title,
        complete: false,
        type: goal.type,
        difficulty: goal.diff,
        timesCompleted: 0,
      };
      return axios.post(`${props.API_URL}/api/goals`, payload, {
        headers: { 'Content-Type': 'application/json' },
      }).then((res) => {
        props.onAddGoal(res.data);
        props.cancel();
      });
    }

    return (
      <Modal animationType="slide" className={sending ? 'mm-goal-leaving' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          {goalWizard==undefined ?
          <View style={[styles.wizardContainer, {backgroundColor:props.userObj.theme.background}]}>
          {props.userObj.theme.background != '#0e1111' ?  <BackgroundSVG/> : <DarkBackground/>}
            <Pressable style={[styles.wizardButton,{backgroundColor:props.userObj.theme.primary}]} onPress={() => toggleGoalWizard(true)}>
              <FontAwesome5 style={styles.wizardIcon} name={'magic'} />
              <TextFont style={styles.wizardText}>Goal Wizard</TextFont>
            </Pressable>
            <Pressable style={[styles.wizardButton,{backgroundColor:props.userObj.theme.primary}]} onPress={() => toggleGoalWizard(false)}>
              <FontAwesome5 style={styles.wizardIcon} name={'list-alt'} />
              <TextFont style={styles.wizardText}>Custom goal</TextFont>
            </Pressable>
            <Pressable style={[styles.wizardButton, styles.cancelChoice]} onPress={props.cancel}>
              <TextFont style={styles.exitText}>Cancel</TextFont>
            </Pressable>
          </View>
          : 
            <View style={[styles.inputContainer, {backgroundColor:props.userObj.theme.background}]}>
              {props.userObj.theme.background != '#0e1111' ?  <BackgroundSVG/> : <DarkBackground/>}
                        {goalWizard==true ? <GoalWizard userObj={props.userObj} onExit={() => setGoalWizard(undefined)} onCreate={saveWizardGoal}/> :
  <View style={styles.goalContainer}>
            <View style={styles.goalSection}>
              <TextFont style={styles.subText}>Goal Title</TextFont>
                <TextInput style={styles.textInput} 
                  placeholder='Your goal title'
                  placeholderTextColor={'gray'}
                  onChangeText={goalInputHandler}
                  value={goalTitle} 
                  selectionColor={'#d4af37'}
                  required
                />
            </View>
            <View style={styles.goalSection}>
            <TextFont style={styles.subText}>Goal Type?</TextFont>
                <View style={styles.types}>
                  <Pressable style={[styles.typeChoice, goalType == 'daily' ? styles.typeHighlight : styles.typeChoice]} onPress={() => {setType('daily'), Keyboard.dismiss()}}>
                    <FontAwesome5 style={[styles.typeText, goalType == 'daily' ? styles.dailySelected : styles.typeText]} name={'history'} /> 
                    <TextFont style={[styles.typeText, goalType == 'daily' ? styles.dailySelected : styles.typeText]}>Daily</TextFont>
                  </Pressable>
                  <Pressable style={[styles.typeChoice, goalType == 'ToDo' ? styles.typeHighlight : styles.typeChoice]} onPress={() => {setType('ToDo'), Keyboard.dismiss()}}>
                    <FontAwesome5 style={[styles.typeText, goalType == 'ToDo' ? styles.dailySelected : styles.typeText]} name={'list-alt'} /> 
                    <TextFont style={[styles.typeText, goalType == 'ToDo' ? styles.dailySelected : styles.typeText]}>To Do</TextFont>
                  </Pressable>
                </View>
            </View>
            <View style={styles.goalSection}>
            <TextFont style={styles.subText}>Goal Difficulty?</TextFont>
                <View style={styles.types}>
                  <Pressable style={[styles.difficulty, level == 'Easy' ? styles.typeHighlight : styles.difficulty]} onPress={() => {setLevel('Easy'), Keyboard.dismiss()}}>
                    <TextFont style={[styles.typeText, level == 'Easy' ? styles.easy : styles.typeText]}>Easy</TextFont>
                  </Pressable>
                  <Pressable style={[styles.difficulty, level == 'Medium' ? styles.typeHighlight : styles.difficulty]} onPress={() => {setLevel('Medium'), Keyboard.dismiss()}}>
                    <TextFont style={[styles.typeText, level == 'Medium' ? styles.medium : styles.typeText]}>Medium</TextFont>
                  </Pressable>
                  <Pressable style={[styles.difficulty, level == 'Hard' ? styles.typeHighlight : styles.difficulty]} onPress={() => {setLevel('Hard'), Keyboard.dismiss()}}>
                    <TextFont style={[styles.typeText, level == 'Hard' ? styles.hard : styles.typeText]}>Hard</TextFont>
                  </Pressable>
                </View>
            </View>
            <View style={styles.goalSection}>
                <View style={styles.buttonContainer}>
                    <View style={styles.button}>
                        <Button title='Cancel' onPress={props.cancel} color={'gray'}/>
                    </View>
                  <Pressable onPress={addGoalHandler} style={[styles.button, {backgroundColor: '#00bcd4'}]} aria-label="Add goal">
                        <FontAwesome5 style={[styles.newGoalText, {fontSize: 20}]} name={'paper-plane'} />
                    </Pressable>
                </View>
            </View>
                </View>
          }
            </View>
            
              }
            </TouchableWithoutFeedback>
            {sending ? (
              <div className="mm-goal-send" aria-hidden="true">
                <div className="mm-goal-plane">
                  <FontAwesome5 style={{ fontSize: 36, color: '#241f33' }} name={'paper-plane'} />
                </div>
              </div>
            ) : null}
      </Modal>
      );
};

export default GoalInput;

const styles = StyleSheet.create({
      inputContainer: {
        position: 'relative',
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        padding: 24,
      },
      goalContainer: {
        width: '100%',
        gap: 28,
      },
      goalSection: {
        width: '100%',
        alignItems: 'center',
      },
      textInput: {
        borderBottomWidth: 2,
        borderBottomColor: 'gray',
        backgroundColor: '#DDD',
        borderRadius: 15,
        width: '100%',
        padding: 12,
        color: '#666',
        fontSize: 18,
      },
      types: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
        justifyContent: 'center',
      },
      typeChoice: {
        borderWidth: 2,
        borderColor: 'gray',
        flex: 1,
        height: 56,
        flexDirection: 'row',
        gap: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
      },
      typeText: {
        color: 'gray',
        fontSize: 16,
      },
      subText: {
        fontSize: 22,
        fontWeight: 900,
        color: 'gray',
        marginBottom: 10,
      },
      dailySelected: {
        //color: '#FFC107',
        color: '#00bcd4',
      },
      typeHighlight: {
        borderColor: '#00bcd4',
        boxShadow: '0 0 10px #00bcd4',
        borderWidth: 2,
      },
      difficulty: {
        borderWidth: 2,
        borderColor: 'gray',
        flex: 1,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
      },
      buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
      },
      button: {
        borderWidth: 2,
        borderColor: 'gray',
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
      },
      easy: {
        color: '#58cc02',
      },
      medium: {
        color: '#FFC107',
      },
      hard: {
        color: 'red',
      },
      newGoalText: {
        //transform: [{translateX: -7}],
        fontSize: 20
      },
      creationScreen: {
        //...StyleSheet.absoluteFill,
      },
      wizardContainer: {
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        padding: 24,
      },
      wizardButton: {
        borderWidth: 2,
        borderColor: 'gray',
        borderRadius: 16,
        width: '100%',
        flexDirection: 'row',
        gap: 12,
        paddingTop: 18,
        paddingBottom: 18,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
      },
      wizardText: {
        fontSize: 18,
        fontWeight: 'bold',
      },
      wizardIcon: {
        fontSize: 22,
      },
      cancelChoice: {
        backgroundColor: 'transparent',
      },
      exitText: {
        color: 'gray',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
      }
})