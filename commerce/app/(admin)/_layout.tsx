
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="history" />
      <Tabs.Screen name="ventes" />
      <Tabs.Screen name="users" />
      <Tabs.Screen name="index" />
    </Tabs>
  );
}
