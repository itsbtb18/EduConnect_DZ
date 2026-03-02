import 'react-native-gesture-handler';
import React from 'react';
import { View, Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors, Fonts } from '../theme';
import useStore from '../store/useStore';

// ─── Screens ─────────────────────────────────────────────────────────────────
import HomeScreen           from '../screens/home/HomeScreen';
import NotificationScreen   from '../screens/home/NotificationScreen';
import ClassListScreen      from '../screens/classes/ClassListScreen';
import ClassDetailScreen    from '../screens/classes/ClassDetailScreen';
import StudentDetailScreen  from '../screens/classes/StudentDetailScreen';
import HomeworkDetailScreen from '../screens/classes/HomeworkDetailScreen';
import AddHomeworkScreen    from '../screens/classes/AddHomeworkScreen';
import AddResourceScreen    from '../screens/classes/AddResourceScreen';
import AttendanceScreen     from '../screens/classes/AttendanceScreen';
import GradeListScreen      from '../screens/grades/GradeListScreen';
import GradeEntryScreen     from '../screens/grades/GradeEntryScreen';
import MessageListScreen    from '../screens/messages/MessageListScreen';
import ChatScreen           from '../screens/messages/ChatScreen';
import SelectStudentScreen  from '../screens/messages/SelectStudentScreen';
import ProfileScreen        from '../screens/profile/ProfileScreen';

// ─── Param lists ──────────────────────────────────────────────────────────────
export type HomeStackParamList = {
  HomeScreen: undefined;
  NotificationScreen: undefined;
};

export type ClassesStackParamList = {
  ClassListScreen: undefined;
  ClassDetailScreen: { classId: string };
  StudentDetailScreen: { studentId: string };
  HomeworkDetailScreen: { homeworkId: string };
  AddHomeworkScreen: { classId: string; homeworkId?: string };
  AddResourceScreen: { classId: string };
  AttendanceScreen: { classId: string };
};

export type GradesStackParamList = {
  GradeListScreen: undefined;
  GradeEntryScreen: { sessionId: string };
};

export type MessagesStackParamList = {
  MessageListScreen: undefined;
  ChatScreen: { roomId: string };
  SelectStudentScreen: undefined;
};

export type RootTabParamList = {
  Accueil: undefined;
  Classes: undefined;
  Notes: undefined;
  Messages: undefined;
  Profil: undefined;
};

// ─── Stack navigators ─────────────────────────────────────────────────────────
const HomeStack     = createStackNavigator<HomeStackParamList>();
const ClassesStack  = createStackNavigator<ClassesStackParamList>();
const GradesStack   = createStackNavigator<GradesStackParamList>();
const MessagesStack = createStackNavigator<MessagesStackParamList>();
const Tab           = createBottomTabNavigator<RootTabParamList>();

const NO_HEADER = { headerShown: false };

function HomeNavigator() {
  return (
    <HomeStack.Navigator screenOptions={NO_HEADER}>
      <HomeStack.Screen name="HomeScreen"         component={HomeScreen} />
      <HomeStack.Screen name="NotificationScreen" component={NotificationScreen} />
    </HomeStack.Navigator>
  );
}

function ClassesNavigator() {
  return (
    <ClassesStack.Navigator screenOptions={NO_HEADER}>
      <ClassesStack.Screen name="ClassListScreen"      component={ClassListScreen} />
      <ClassesStack.Screen name="ClassDetailScreen"    component={ClassDetailScreen} />
      <ClassesStack.Screen name="StudentDetailScreen"  component={StudentDetailScreen} />
      <ClassesStack.Screen name="HomeworkDetailScreen" component={HomeworkDetailScreen} />
      <ClassesStack.Screen name="AddHomeworkScreen"    component={AddHomeworkScreen} />
      <ClassesStack.Screen name="AddResourceScreen"    component={AddResourceScreen} />
      <ClassesStack.Screen name="AttendanceScreen"     component={AttendanceScreen} />
    </ClassesStack.Navigator>
  );
}

function GradesNavigator() {
  return (
    <GradesStack.Navigator screenOptions={NO_HEADER}>
      <GradesStack.Screen name="GradeListScreen"  component={GradeListScreen} />
      <GradesStack.Screen name="GradeEntryScreen" component={GradeEntryScreen} />
    </GradesStack.Navigator>
  );
}

function MessagesNavigator() {
  return (
    <MessagesStack.Navigator screenOptions={NO_HEADER}>
      <MessagesStack.Screen name="MessageListScreen"   component={MessageListScreen} />
      <MessagesStack.Screen name="ChatScreen"          component={ChatScreen} />
      <MessagesStack.Screen name="SelectStudentScreen" component={SelectStudentScreen} />
    </MessagesStack.Navigator>
  );
}

// ─── Tab icon ─────────────────────────────────────────────────────────────────
interface TabIconProps {
  name: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  focused: boolean;
  badge?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ name, label, focused, badge }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
    {focused && (
      <View
        style={{
          width: 18,
          height: 3,
          borderRadius: 2,
          backgroundColor: Colors.primary,
          marginBottom: 4,
        }}
      />
    )}
    {!focused && <View style={{ height: 7 }} />}

    <View>
      <Ionicons
        name={name}
        size={22}
        color={focused ? Colors.primary : 'rgba(255,255,255,0.45)'}
      />
      {!!badge && badge > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -4,
            right: -8,
            backgroundColor: Colors.danger,
            borderRadius: 99,
            minWidth: 16,
            height: 16,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: 3,
          }}
        >
          <Text style={{ fontSize: 9, color: Colors.white, fontFamily: Fonts.bold }}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>

    <Text
      style={{
        fontSize: 10,
        fontFamily: Fonts.semiBold,
        color: focused ? Colors.primary : 'rgba(255,255,255,0.45)',
        marginTop: 3,
      }}
    >
      {label}
    </Text>
  </View>
);

// ─── Tab navigator ────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const insets                  = useSafeAreaInsets();
  const unreadMessageCount      = useStore(s => s.unreadMessageCount);
  const unreadNotificationCount = useStore(s => s.unreadNotificationCount);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.navBg,
          borderTopWidth: 0,
          height: 68 + insets.bottom,
          paddingBottom: insets.bottom + 4,
        },
      }}
    >
      <Tab.Screen
        name="Accueil"
        component={HomeNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'home' : 'home-outline'} label="Accueil" focused={focused} badge={unreadNotificationCount} />
          ),
        }}
      />
      <Tab.Screen
        name="Classes"
        component={ClassesNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'book' : 'book-outline'} label="Classes" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={GradesNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} label="Notes" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'chatbubbles' : 'chatbubbles-outline'} label="Messages" focused={focused} badge={unreadMessageCount} />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon name={focused ? 'person' : 'person-outline'} label="Profil" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
