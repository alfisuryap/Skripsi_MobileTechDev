import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from './screens/Login.jsx';
import SplashScreen from './screens/SplashScreen.jsx';
import HomeScreen from './screens/Home.jsx';
import Icon from 'react-native-vector-icons/Feather';

console.log('SplashScreen:', SplashScreen);
console.log('LoginScreen:', LoginScreen);

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
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
      <Tab.Screen name="SHE" component={HomeScreen} />
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Profile" component={HomeScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="SplashScreen" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
