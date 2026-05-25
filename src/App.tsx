import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, MessageCircle, Heart, User } from 'lucide-react-native';
import { HomePage } from './pages/HomePage';
import { TranslatorPage } from './pages/TranslatorPage';
import { HealthPage } from './pages/HealthPage';
import { ProfilePage } from './pages/ProfilePage';

const Tab = createBottomTabNavigator();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconComponent;
            switch (route.name) {
              case 'Home':
                iconComponent = <Home size={size} />;
                break;
              case 'Translator':
                iconComponent = <MessageCircle size={size} />;
                break;
              case 'Health':
                iconComponent = <Heart size={size} />;
                break;
              case 'Profile':
                iconComponent = <User size={size} />;
                break;
            }
            return iconComponent;
          },
          tabBarActiveTintColor: '#f97316',
          tabBarInactiveTintColor: '#9ca3af',
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
          tabBarStyle: {
            backgroundColor: 'white',
            borderTopWidth: 1,
            borderTopColor: '#f3f4f6',
            paddingBottom: 10,
            paddingTop: 5,
          },
          headerStyle: {
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#f3f4f6',
          },
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
            color: '#1f2937',
          },
        })}
      >
        <Tab.Screen name="Home" component={HomePage} options={{ title: '首页' }} />
        <Tab.Screen name="Translator" component={TranslatorPage} options={{ title: '翻译' }} />
        <Tab.Screen name="Health" component={HealthPage} options={{ title: '健康' }} />
        <Tab.Screen name="Profile" component={ProfilePage} options={{ title: '我的' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
};

export default App;
