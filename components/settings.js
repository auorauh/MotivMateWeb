import { StyleSheet, View, Text, Pressable, Modal, Switch, Button, Animated, Vibration} from '../platform';
import { useEffect, useState, useRef } from 'react'
import FontAwesome5 from '../platform/icons';
import { currentPushSubscription, disablePush, enablePush } from '../platform/push';
import axios from 'axios';
import { useNavigation } from '../platform/navigation';
import { deleteLocalData } from '../functions/localDataUtility';
import { red, yellow, blue, lavender, dark, mint, peach, coral, sky, sage} from '../functions/colors';
import TextFont from './TextFont';

function Settings(props) {
  const poppyPattern = [0, 50];
  const startVibrate = () => {
    Vibration.vibrate(poppyPattern, true);
  };
  const endVibrate = () => {
    Vibration.cancel();
  };
  const fillAnim = useRef(new Animated.Value(0)).current;
  const boxWidth = 250;

  const startReset = () => {
    Animated.timing(fillAnim, {
      toValue: boxWidth,
      duration: 2000, 
      useNativeDriver: false, 
    }).start(() => {
      if(fillAnim => 149 ){
        startVibrate();
        resetScore();
        endVibrate();
      }
    });
  };
  const cancelReset = () => {
    endVibrate();
    Animated.timing(fillAnim, {
      toValue: 0,
      duration: 500, 
      useNativeDriver: false,
    }).start();
    
  };

  const [userColor, setUserColor] = useState('#00bcd4');
  const [newTheme, setNewTheme] = useState(blue);
  const [userNotifications, setUserNotifications] = useState(false);

  useEffect(() => {
    setNewTheme(props.userObj.theme);
    setUserColor(props.userObj.theme.primary);
    checkForLocalNoties();
  }, []);


  async function changeColor(color){
    let theme = props.userObj.theme;
    switch (color) {
      case red:
        setNewTheme(red);
        theme = red;
        break;
      case yellow:
        setNewTheme(yellow);
        theme = yellow;
        break;
      case blue:
        setNewTheme(blue);
        theme = blue;
        break;
      case lavender:
        setNewTheme(lavender);
        theme = lavender;
        break;
      case dark:
        setNewTheme(dark);
        theme = dark;
        break;
      case coral:
        setNewTheme(coral);
        theme = coral;
        break;
      case peach:
        setNewTheme(peach);
        theme = peach;
        break;
      case sage:
        setNewTheme(sage);
        theme = sage;
        break;
      case sky:
        setNewTheme(sky);
        theme = sky;
        break;
      case mint:
        setNewTheme(mint);
        theme = mint;
        break
      default:
        break;
    }
    setUserColor(color);
    saveTheme(theme);
  }
  const setTheme = (newValue) => {
    props.setTheme(newValue);
  };
  async function saveTheme(theme){
    const next = { ...props.userObj, theme };
    setTheme(theme);
    try {
      const response = await axios.put(`${props.API_URL}/api/users/${next.email}`, next);
      return response.data;
    } catch (error) {
    }
  }
  async function toggleNotifications(){
    if (userNotifications) {
      await disablePush(props.userObj.email);
      setUserNotifications(false);
      return;
    }
    const result = await enablePush(props.userObj.email);
    if (!result.ok) {
      window.alert(result.message);
      setUserNotifications(false);
      return;
    }
    setUserNotifications(true);
  }
  async function checkForLocalNoties(){
    try {
      const subscription = await currentPushSubscription();
      setUserNotifications(Boolean(subscription));
    } catch {
      setUserNotifications(false);
    }
  }
  const navigation = useNavigation();
  function logout(){
  deleteLocalData('email');
  props.cancel();
  navigation.navigate('LoginPage');
  }
  async function resetScore(){
    let user = props.userObj;
    user.dailyScore= 0;
    try {
      const response = await axios.put(`${props.API_URL}/api/users/${props.userObj.email}`, user);
      return response.data;
    } catch (error) {
    }
  }

    const isDark = newTheme.background === '#0e1111';
    const ink = isDark ? '#fff9ef' : '#241f33';
    const muted = isDark ? 'rgba(255,249,239,0.62)' : '#6d6578';
    const line = isDark ? 'rgba(255,249,239,0.45)' : 'rgba(36,31,51,0.28)';
    const card = isDark ? 'rgba(255,249,239,0.07)' : 'transparent';
    const swatchBorder = isDark ? 'rgba(255,249,239,0.55)' : 'rgba(36,31,51,0.22)';

    return (
          <View style={[styles.settingPage]}>
            <View style={styles.header}>
            </View>
            <View style={styles.userData}>
            <TextFont style={[styles.title, {color:newTheme.secondary}]}>Choose your color</TextFont>
              <View style={styles.colorTray}>
                <Pressable style={[styles.red, styles.color, { borderColor: swatchBorder }]} onPress={() =>changeColor( red )}></Pressable>
                <Pressable style={[styles.yellow, styles.color, { borderColor: swatchBorder }]} onPress={() =>changeColor( yellow )}></Pressable>
                <Pressable style={[styles.blue, styles.color, { borderColor: swatchBorder }]} onPress={() =>changeColor( blue )}></Pressable>
                <Pressable style={[styles.lavender, styles.color, { borderColor: swatchBorder }]} onPress={() =>changeColor( lavender )}></Pressable>
                <Pressable style={[styles.dark, styles.color, { borderColor: '#fff9ef' }]} onPress={() =>changeColor( dark )}></Pressable>
                <Pressable style={[styles.coral, styles.color, { borderColor: swatchBorder }]} onPress={() =>changeColor( coral )}></Pressable>
                <Pressable style={[styles.peach, styles.color, { borderColor: swatchBorder }]} onPress={() =>changeColor( peach )}></Pressable>
                <Pressable style={[styles.sage, styles.color, { borderColor: swatchBorder }]} onPress={() =>changeColor( sage )}></Pressable>
                <Pressable style={[styles.sky, styles.color, { borderColor: swatchBorder }]} onPress={() =>changeColor( sky )}></Pressable>
                <Pressable style={[styles.mint, styles.color, { borderColor: swatchBorder }]} onPress={() =>changeColor( mint )}></Pressable>
              </View>
              <View style={styles.settingSection}>
                <TextFont style={{ color: muted }}>Tap to complete a goal</TextFont>
                <TextFont style={{ color: muted }}>Slide left to delete</TextFont>
              </View>
              <View style={styles.settingSection}>
                <Pressable
                  aria-label="How to use the app"
                  onPress={() => props.onStartGuide?.()}
                  style={[styles.reset, { borderColor: line, backgroundColor: card }]}
                >
                  <TextFont style={[styles.resetText, { color: ink }]}>How to use</TextFont>
                </Pressable>
              </View>
              <View style={styles.settingSection}>
                <View style={styles.toggleSection}>
                  <View style={[styles.notifications, { borderColor: line, backgroundColor: card }]}>
                  <TextFont style={[{fontSize: 16}, {color:newTheme.secondary}]}>Push reminders</TextFont>
                  <Switch
                  ios_backgroundColor="#3e3e3e"
                  onValueChange={toggleNotifications}
                  value={userNotifications}
                  />
                  </View>
                  </View>
              </View>
              <View style={styles.settingSection}>
                <Pressable style={[styles.reset, { borderColor: line, backgroundColor: card }]}
                onPressIn={startReset}
                onPressOut={cancelReset}>
                  <TextFont style={[styles.resetText, { color: ink }]}>Reset Score (Hold)</TextFont>
                      <Animated.View
                      style={[
                        styles.box,
                        {width: fillAnim},
                            ]}
                        />
                  </Pressable>
              </View>
              <View style={styles.settingSection}></View>
              <View style={[styles.logout, { backgroundColor: card }]}>
              <Button color="red" title="Log Out" onPress={logout}></Button>
              </View>
            </View>
          </View>
      );
};

export default Settings;

const styles = StyleSheet.create({
  settingPage: {
    height: '100%',
    alignItems: 'center',
    padding: 16,
  },
  userIcon: {
    fontSize: 100,
    alignSelf: 'center'
  },
  userData: {
    width: '100%',
    flex: 1,
  },
  title: {
    fontSize: 20,
  },
  colorTray: {
    flexDirection: 'row',
    flexWrap: 'wrap', 
    justifyContent: 'space-between', 
    width: '100%',
    paddingTop: '3%'
  },
  settingSection: {
    marginBottom: '4%',
    alignItems: 'center'
  },
  color: {
    height: 55,
    width: 55,
    borderRadius: 15,
    borderWidth: 3,
    aspectRatio: 1,
    margin: '1%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '3%'
  },
  red: {
    backgroundColor: red.primary,
  },
  yellow: {
    backgroundColor: yellow.primary,
  },
  blue: {
    backgroundColor: blue.primary,
  },
  lavender: {
    backgroundColor: lavender.primary,
  },
  dark: {
    backgroundColor: dark.background,
  },
  mint: {
    backgroundColor: mint.primary,
  },
  peach: {
    backgroundColor: peach.primary,
  },
  sky: {
    backgroundColor: sky.primary
  },
  coral :{
    backgroundColor: coral.primary
  },
  sage: {
    backgroundColor: sage.primary
  },
  notifications: {
    borderRadius: 15,
    borderWidth: 2,
    height: 55,
    width: 250,
    justifyContent: 'space-evenly',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: '5%'
  },
  reset: {
    borderRadius: 15,
    borderWidth: 2,
    width: 250,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  resetText: {
    fontSize: 16
  },
  logout: {
    borderWidth: 2,
    borderRadius: 15,
    borderColor: 'red',
    height: 55,
    width: 250,
    justifyContent: 'center',
    alignSelf: 'center'
  },
  boxContainer: {
    width: 150,
    height: 100, 
    overflow: 'hidden',
    marginBottom: 20,
    borderRadius: 15,
    borderColor: 'black',
    borderWidth: 1,
    position: 'absolute'
  },
  box: {
    borderRadius: 15,
    height: '100%',
    backgroundColor: 'lightblue',
    overflow: 'hidden',
    position: 'absolute'
  },
})