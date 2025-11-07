import { useEffect, useState } from 'react';
import {View, StyleSheet} from "react-native";
import SplashScree from "./splashScree";
import Login from './login';

export default function Index() {
  const [isShowSplash, setIsShowSplash] = useState(true);
  useEffect(() => {
    setTimeout(() => {
      setIsShowSplash(false);
    }, 3000);
  }, []);

  return (
    <>
      <View style={styles.container}>
          {isShowSplash ? <SplashScree /> : <Login/>}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor: "#24BF94",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: 'column',
  },

  logo:{
    width: 110,
    height: 110,
    marginBottom: 30,
    resizeMode: 'contain'
  },

  title:{
    fontSize: 35,
    color: 'white',
    fontWeight: 500,
    fontFamily: 'Rubik',
  },

  subtitle:{
    color: 'white',
    fontFamily: 'Rubik-Light',
    fontSize: 20,
    textAlign: 'center',
    maxWidth: 210,
    padding: 0,
    lineHeight: 20
  },

})