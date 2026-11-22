import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';
import { FONT, colors } from '../../src/theme';

type IconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const icon =
  (name: IconName) =>
  ({ color }: { color: ColorValue }) => <MaterialCommunityIcons name={name} size={28} color={color as string} />; // tint colors below are strings

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: FONT.semibold, fontSize: 13 },
        tabBarStyle: { minHeight: 64 },
        headerTitleStyle: { fontFamily: FONT.bold, fontSize: 22 },
        headerStyle: { backgroundColor: colors.surface },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="tareas" options={{ title: 'Tareas', tabBarIcon: icon('format-list-checks') }} />
      <Tabs.Screen name="emociones" options={{ title: 'Emociones', tabBarIcon: icon('emoticon-outline') }} />
      <Tabs.Screen name="que-hacer" options={{ title: 'Qué hacer', tabBarIcon: icon('lightbulb-on-outline') }} />
    </Tabs>
  );
}
