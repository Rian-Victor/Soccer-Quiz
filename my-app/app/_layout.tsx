import { Stack } from "expo-router";
import {useFonts} from "expo-font";
import {View, StyleSheet} from "react-native";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PoppinsRegular: require('../assets/fonts/Poppins-Regular.ttf'),
    PoppinsMedium: require('../assets/fonts/Poppins-Medium.ttf'),
    PoppinsLight: require('../assets/fonts/Poppins-Light.ttf'),
    Rubik: require('../assets/fonts/Rubik.ttf'),
    RubikLight: require('../assets/fonts/Rubik-Light.ttf'),
    RubikBold: require('../assets/fonts/Rubik-Bold.ttf'),
  });

  return (
 
      <Stack screenOptions={{headerShown: false}}/>
    
  );
}
