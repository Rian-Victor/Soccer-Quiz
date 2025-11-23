import { Slot, useRouter, useSegments } from "expo-router";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Ionicons } from "@expo/vector-icons";


export default function TabsLayout() {
  const router = useRouter();
  const segments = useSegments();

  const current = "/" + segments.join("/");

  const tabs = [
    { icon: ["home-outline", "home"], route: "home" },
    { icon: ["stats-chart-outline", "stats-chart"], route: "stats" },
    { icon: ["menu-outline", "menu"], route: "quizzes" },
    { icon: ["newspaper-outline", "newspaper"], route: "noticias" },
    { icon: ["person-outline", "person"], route: "perfil" },
  ] as const;


  return (
    <View style={{ flex: 1 }}>
      <Slot />

      <View style={styles.navbar}>
        {tabs.map((t) => {
          const focused = current === `/tabs/${t.route}`;

          return (
            <TouchableOpacity
              key={t.route}
              onPress={() => router.push(t.route)}
              style={styles.iconBtn}
            >
              <Ionicons
                name={focused ? t.icon[1] as any: t.icon[0] as any}
                size={focused ? 28 : 24}
                color={focused ? "#ffffff" : "#D6D6D6"} 
              />

            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 72,
    backgroundColor: "#24BF94",     // → COR SÓLIDA (sem gradiente)
    marginHorizontal: 0,
    paddingHorizontal: 5,
    marginBottom: 0,
    paddingBottom: 20,
    elevation: 0,                   // sombra Android
    shadowColor: "#000",            // sombra iOS
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },

  iconBtn: {
    padding: 10,
  },
});
