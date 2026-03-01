import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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
import ResourcesScreen      from '../screens/classes/ResourcesScreen';
import AddResourceScreen    from '../screens/classes/AddResourceScreen';
import AttendanceScreen     from '../screens/classes/AttendanceScreen';
import GradeListScreen      from '../screens/grades/GradeListScreen';
import GradeEntryScreen     from '../screens/grades/GradeEntryScreen';
import GradeHistoryScreen   from '../screens/grades/GradeHistoryScreen';
import MessageListScreen    from '../screens/messages/MessageListScreen';
import ChatScreen           from '../screens/messages/ChatScreen';
import SelectStudentScreen  from '../screens/messages/SelectStudentScreen';
import ProfileScreen        from '../screens/profile/ProfileScreen';

// ─── Stack param lists ────────────────────────────────────────────────────────
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
  ResourcesScreen: { classId: string };
  AddResourceScreen: { classId: string };
  AttendanceScreen: { classId: string };
};

export type GradesStackParamList = {
  GradeListScreen: undefined;
  GradeEntryScreen: { sessionId: string };
  GradeHistoryScreen: { classId: string };
};

export type MessagesStackParamList = {
  MessageListScreen: undefined;
  ChatScreen: { roomId: string };
  SelectStudentScreen: undefined;
};

// ─── Stack navigators ────────────────────────────────────────────────────────
const HomeStack    = createNativeStackNavigator<HomeStackParamList>();
const ClassesStack = createNativeStackNavigator<ClassesStackParamList>();
const GradesStack  = createNativeStackNavigator<GradesStackParamList>();
const MessagesStack = createNativeStackNavigator<MessagesStackParamList>();

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
      <ClassesStack.Screen name="ResourcesScreen"      component={ResourcesScreen} />
      <ClassesStack.Screen name="AddResourceScreen"    component={AddResourceScreen} />
      <ClassesStack.Screen name="AttendanceScreen"     component={AttendanceScreen} />
    </ClassesStack.Navigator>
  );
}

function GradesNavigator() {
  return (
    <GradesStack.Navigator screenOptions={NO_HEADER}>
      <GradesStack.Screen name="GradeListScreen"    component={GradeListScreen} />
      <GradesStack.Screen name="GradeEntryScreen"   component={GradeEntryScreen} />
      <GradesStack.Screen name="GradeHistoryScreen" component={GradeHistoryScreen} />
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

// ─── Custom tab bar icon ──────────────────────────────────────────────────────
interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
  badge?: number;
}

const TabIcon: React.FC<TabIconProps> = ({ emoji, label, focused, badge }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 6 }}>
    {/* Active indicator dot */}
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

    {/* Icon + badge wrapper */}
    <View>
      <Text style={{ fontSize: 22 }}>{emoji}</Text>
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
          <Text
            style={{
              fontSize: 9,
              color: Colors.white,
              fontFamily: Fonts.bold,
            }}
          >
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>

    {/* Label */}
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

// ─── Bottom tab navigator ────────────────────────────────────────────────────
const Tab = createBottomTabNavigator();

function TabNavigator() {
  const insets = useSafeAreaInsets();
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
            <TabIcon emoji="🏠" label="Accueil" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Classes"
        component={ClassesNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📚" label="Classes" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Notes"
        component={GradesNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Notes" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesNavigator}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              emoji="💬"
              label="Messages"
              focused={focused}
              badge={unreadMessageCount}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profil"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon
              emoji="👤"
              label="Profil"
              focused={focused}
              badge={unreadNotificationCount}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Root navigator ───────────────────────────────────────────────────────────
export default function Navigation() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
}
