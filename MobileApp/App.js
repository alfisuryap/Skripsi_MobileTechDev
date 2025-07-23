import 'react-native-gesture-handler';
import 'structured-clone';
import structuredClone from 'structured-clone';
import { Buffer } from 'buffer';
import process from 'process';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import LoginScreen from './screens/Login.jsx';
import SplashScreen from './screens/SplashScreen.jsx';
import HomeScreen from './screens/Home.jsx';
import ClockInSuccess from './screens/ClockInSuccess.jsx';
import ClockOutSuccess from './screens/ClockOutSuccess.jsx';
import SHEScreen from './screens/SHE.jsx';
import ProfileScreen from './screens/Profile.jsx';
import EditProfileScreen from './screens/EditProfile.jsx';
import JobSurvey from './screens/JobSurvey.jsx';
import HealthRiskAssessmentScreen from './screens/HealthRiskAssesment.jsx';
import HRADetailScreen from './screens/HRADetail.jsx';
import ManajemenOperasiScreen from './screens/ManajemenOperasi.jsx';
import DetailScreen from './screens/Detail.jsx';

import Icon from 'react-native-vector-icons/Feather';

if (typeof global.structuredClone !== 'function') {
  global.structuredClone = structuredClone;
}

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer;
}

if (typeof global.process === 'undefined') {
  global.process = process;
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const PERSISTENCE_KEY = 'Home';

function MainTabs() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;

          if (route.name === 'Home') iconName = 'home';
          else if (route.name === 'Profile') iconName = 'user';
          else if (route.name === 'SHE') iconName = 'shield';

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3478F6',
        tabBarInactiveTintColor: '#aaa',
        headerShown: false,
      })}
    >
      <Tab.Screen name="SHE" component={SHEScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {

  const [isReady, setIsReady] = useState(false);
  const [initialState, setInitialState] = useState();

  useEffect(() => {
    const restoreState = async () => {
      console.log("Restoring state...");
      try {
        const savedState = await AsyncStorage.getItem(PERSISTENCE_KEY);
        if (savedState) {
          try {
            setInitialState(JSON.parse(savedState));
          } catch (e) {
            console.warn("Gagal parse initialState, reset ke null");
            setInitialState(undefined);
            await AsyncStorage.removeItem(PERSISTENCE_KEY);
          }
        } else {
          setInitialState(undefined);
        }
      } catch (err) {
        console.error("Error restoreState:", err);
        setInitialState(undefined);
      } finally {
        setIsReady(true);
      }
    };
    restoreState();
  }, []);

  if (!isReady) return null;

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) =>
        AsyncStorage.setItem('Home', JSON.stringify(state))
      }>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="SHEScreen" component={SHEScreen} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="ClockInSuccess" component={ClockInSuccess} />
        <Stack.Screen name="ClockOutSuccess" component={ClockOutSuccess} />
        <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
        <Stack.Screen name="JobSurvey" component={JobSurvey} />
        <Stack.Screen name="HealthRiskAssesmentScreen" component={HealthRiskAssessmentScreen} />
        <Stack.Screen name="HRADetailScreen" component={HRADetailScreen} />
        <Stack.Screen name="ManajemenOperasiScreen" component={ManajemenOperasiScreen} />
        <Stack.Screen name="DetailScreen" component={DetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
