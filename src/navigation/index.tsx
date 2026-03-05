import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAppStore } from '../store/routineStore';
import { colors, typography } from '../theme';
import { requestNotificationPermissions } from '../utils/notifications';

import OnboardingScreen from '../screens/parent/OnboardingScreen';
import HomeScreen from '../screens/parent/HomeScreen';
import CreateRoutineScreen from '../screens/parent/CreateRoutineScreen';
import AddChildScreen from '../screens/parent/AddChildScreen';
import RewardsScreen from '../screens/parent/RewardsScreen';
import ProgressScreen from '../screens/parent/ProgressScreen';
import RoutineDetailScreen from '../screens/parent/RoutineDetailScreen';
import RoutinesListScreen from '../screens/parent/RoutinesListScreen';
import SettingsScreen from '../screens/parent/SettingsScreen';
import ApprovalsScreen from '../screens/parent/ApprovalsScreen';
import MedicationScreen from '../screens/parent/MedicationScreen';
import MoodTrackerScreen from '../screens/parent/MoodTrackerScreen';
import TeacherLogScreen from '../screens/parent/TeacherLogScreen';
import PortalManagementScreen from '../screens/parent/PortalManagementScreen';
import PortalNotesInboxScreen from '../screens/parent/PortalNotesInboxScreen';
import InsightsScreen from '../screens/parent/InsightsScreen';
import QuestionnaireScreen from '../screens/parent/QuestionnaireScreen';
import ReportScreen from '../screens/parent/ReportScreen';
import PortalEntryScreen from '../screens/portal/PortalEntryScreen';
import PortalDashboardScreen from '../screens/portal/PortalDashboardScreen';
import ChildHomeScreen from '../screens/child/ChildHomeScreen';
import PinLock from '../components/shared/PinLock';
import type { ChildProfile, PortalAccess } from '../types';

const Stack = createStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: typography.fontWeightSemiBold as any,
    color: colors.textPrimary,
  },
  headerBackTitleVisible: false,
  cardStyle: { backgroundColor: colors.background },
};

export default function AppNavigator() {
  const { parentProfile, loadData } = useAppStore();
  const [loaded, setLoaded] = useState(false);
  const [childMode, setChildMode] = useState<ChildProfile | null>(null);
  const [showParentPin, setShowParentPin] = useState(false);
  const [portalMode, setPortalMode] = useState<PortalAccess | null>(null);
  const [showPortalEntry, setShowPortalEntry] = useState(false);

  useEffect(() => {
    loadData().then(() => setLoaded(true));
    requestNotificationPermissions();
  }, []);

  if (!loaded) return null;

  // Portal entry screen
  if (showPortalEntry) {
    return (
      <PortalEntryScreen
        onAccessGranted={(access) => {
          setShowPortalEntry(false);
          setPortalMode(access);
        }}
        onCancel={() => setShowPortalEntry(false)}
      />
    );
  }

  // Portal dashboard takes over full screen
  if (portalMode) {
    return (
      <PortalDashboardScreen
        access={portalMode}
        onExit={() => setPortalMode(null)}
      />
    );
  }

  // Child view takes over full screen
  if (childMode) {
    if (showParentPin && parentProfile) {
      return (
        <PinLock
          title="Parent Mode"
          subtitle="Enter your PIN to switch back"
          correctPin={parentProfile.pin}
          onSuccess={() => {
            setShowParentPin(false);
            setChildMode(null);
          }}
          onCancel={() => setShowParentPin(false)}
        />
      );
    }
    return (
      <ChildHomeScreen
        child={childMode}
        onExitToParent={() => setShowParentPin(true)}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={screenOptions}>
        {!parentProfile ? (
          <>
            <Stack.Screen name="Onboarding" options={{ headerShown: false }}>
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onEnterPortal={() => setShowPortalEntry(true)}
                />
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateRoutine" component={CreateRoutineScreen} options={{ title: 'New Routine' }} />
            <Stack.Screen name="AddChild" component={AddChildScreen} options={{ title: 'Add a Kid' }} />
            <Stack.Screen name="Rewards" component={RewardsScreen} options={{ title: 'Rewards' }} />
            <Stack.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
            <Stack.Screen name="Routines" component={RoutinesListScreen} options={{ title: 'Routines' }} />
            <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} options={{ title: 'Routine' }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
            <Stack.Screen name="Medication" component={MedicationScreen} options={{ title: 'Medication' }} />
            <Stack.Screen name="MoodTracker" component={MoodTrackerScreen} options={{ title: 'Mood & Behavior' }} />
            <Stack.Screen name="TeacherLog" component={TeacherLogScreen} options={{ title: 'Teacher Log' }} />
            <Stack.Screen name="Portal" component={PortalManagementScreen} options={{ title: 'Professional Portal' }} />
            <Stack.Screen name="PortalNotes" component={PortalNotesInboxScreen} options={{ title: 'Professional Notes' }} />
            <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'AI Insights' }} />
            <Stack.Screen name="Questionnaire" component={QuestionnaireScreen} options={{ title: 'Questionnaire' }} />
            <Stack.Screen name="Report" component={ReportScreen} options={{ title: 'Export Report' }} />
            <Stack.Screen name="Approvals" component={ApprovalsScreen} options={{ title: 'Reward Requests' }} />
            <Stack.Screen
              name="ChildView"
              options={{ headerShown: false }}
            >
              {(props) => {
                const childId = (props.route.params as any)?.childId;
                const child = parentProfile.childProfiles.find((c) => c.id === childId);
                if (!child) return null;

                if (child.pin) {
                  return (
                    <PinLock
                      title={`${child.name}'s View`}
                      subtitle="Enter PIN to switch"
                      correctPin={child.pin}
                      onSuccess={() => {
                        props.navigation.goBack();
                        setChildMode(child);
                      }}
                      onCancel={() => props.navigation.goBack()}
                    />
                  );
                }
                // No PIN — switch directly
                setTimeout(() => {
                  props.navigation.goBack();
                  setChildMode(child);
                }, 0);
                return null;
              }}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
