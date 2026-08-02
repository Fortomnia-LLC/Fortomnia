import { Tabs } from "expo-router";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#F97316",
        tabBarHideOnKeyboard: true,
        tabBarInactiveTintColor: "#6B7280",
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
        tabBarStyle: {
          backgroundColor: "#111111",
          borderTopColor: "#262626",
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
        }}
      />

      <Tabs.Screen
        name="training"
        options={{
          title: "Training",
        }}
      />

      <Tabs.Screen
        name="nutrition"
        options={{
          title: "Nutrition",
        }}
      />

      <Tabs.Screen
        name="supplements"
        options={{
          title: "Supps",
        }}
      />

      <Tabs.Screen
        name="new-workout"
        options={{
          href: null,
        }}
      />
        <Tabs.Screen
          name="new-template"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="new-nutrition-entry"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="nutrition-goals"
          options={{
            href: null,
          }}
        />
      <Tabs.Screen
        name="workout"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="exercise"
        options={{
          href: null,
        }}
      />
        <Tabs.Screen
          name="template"
          options={{
            href: null,
          }}
        />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
        }}
      />
    </Tabs>
  );
}
