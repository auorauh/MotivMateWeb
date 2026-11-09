import { View, TextInput, Button, StyleSheet, Modal, Pressable,TouchableWithoutFeedback, Keyboard, Animated, ActivityIndicator} from '../platform';
import { useState, useRef, useEffect } from 'react'
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
    const [isExpanded, setIsExpanded] = useState(false);
    const [goalWizard, setGoalWizard] = useState();


    const slideAnim = useRef(new Animated.Value(80)).current;
    const wideAnim = useRef(new Animated.Value(185)).current;
    const topAnim = useRef(new Animated.Value(645)).current;
    const leftAnim = useRef(new Animated.Value(215)).current;
    const bottomAnim = useRef(new Animated.Value(0)).current;
    const rightAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
    }, []); 
    //button is 645,215
    function goalInputHandler(enteredText) {
        setGoalText(enteredText);
      }
      const toggleExpand = () => {
        setIsExpanded(!isExpanded);
        const topCenter = Animated.timing(topAnim, {
          toValue: 375, 
          duration: 600,
          useNativeDriver: false, 
        });
        const leftCenter= Animated.timing(leftAnim, {
          toValue: 115, 
          duration: 600,
          useNativeDriver: false, 
        });
        const firstAnimation = Animated.parallel([topCenter, leftCenter]);
        const height = Animated.timing(slideAnim, {
          toValue: 900, 
          duration: 600,
          useNativeDriver: false, 
        });
        const width= Animated.timing(wideAnim, {
          toValue: 450, 
          duration: 600,
          useNativeDriver: false, 
        });
        const top = Animated.timing(topAnim, {
          toValue: -50, 
          duration: 600,
          useNativeDriver: false, 
        });
        const left = Animated.timing(leftAnim, {
          toValue: -50, 
          duration: 600,
          useNativeDriver: false, 
        });
        const secondAnimation = Animated.parallel([height,width,top,left])
        const finalAnimation = Animated.sequence([firstAnimation,secondAnimation])
        finalAnimation.start();
      };
    function addGoalHandler() {
        toggleExpand();
        setTimeout(() => {
          postGoal();
          setGoalText('');
          setIsExpanded(!isExpanded);
         }, 1200);
    }
    function postGoal(){
      let goal = {owner: props.userObj._id, title: goalTitle, complete: false, type: goalType, difficulty: level, timesCompleted: 0};
      axios.post(`${props.API_URL}/api/goals`, goal, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(res => props.onAddGoal(res.data))
      .catch(err => console.log(err));
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
      <Modal animationType="slide">
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
                  <View style={[styles.button, {backgroundColor: '#00bcd4'}, isExpanded ? {opacity: 0} : null]}>
                        <Pressable onPress={addGoalHandler} style={styles.addBtn}>
                        <FontAwesome5 style={[styles.newGoalText, {fontSize: 20}]} name={'paper-plane'} />
                        </Pressable>
                    </View>
                </View>
            </View>
                {isExpanded ? 
                <Animated.View style={[styles.animatedBtn, {backgroundColor: '#00bcd4'},{  height: slideAnim, width: wideAnim}, {top: topAnim, left:leftAnim, right: rightAnim, bottom: bottomAnim}  ] } >
                    <Pressable onPress={addGoalHandler} style={styles.addBtn}>
                    <FontAwesome5 style={[styles.newGoalText, {fontSize: 20, paddingBottom: 15}]} name={'paper-plane'} />
                    <ActivityIndicator color="black" />
                    </Pressable>
                </Animated.View>
                : null}
                </View>
          }
            </View>
            
              }
            </TouchableWithoutFeedback>
      </Modal>
      );
};

export default GoalInput;

const styles = StyleSheet.create({
      inputContainer: {
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
      addBtn: {
        height: '100%',
        width: '100%',
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
      animatedBtn: {
        position: 'absolute', 
        borderWidth: 2,
        borderColor: 'gray',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
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