import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView, Dimensions } from "react-native";
import { SvgXml } from "react-native-svg";
import * as Haptics from "expo-haptics";

const arrowBack = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.1" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" fill="#ffffff"></path> <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="#ffffff" stroke-width="2"></path> <path d="M8 12L16 12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M11 9L8.08704 11.913V11.913C8.03897 11.961 8.03897 12.039 8.08704 12.087V12.087L11 15" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
`;

const { width, height } = Dimensions.get("window");

export default function ConnectionConfirmedScreen({ navigation }) {
  const handleGoBack = () => {
    navigation.navigate("Welcome");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity style={styles.backButton} activeOpacity={0.7} onPress={handleGoBack}>
        <SvgXml xml={arrowBack} width={35} height={35} />
      </TouchableOpacity>

      <View style={styles.container}>
        <Text style={styles.hiText}>HI!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  hiText: {
    fontSize: Math.min(width, height) * 0.35, // Dynamic font size based on screen size
    fontWeight: "bold",
    color: "#F5A623",
    textAlign: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    backgroundColor: "#0052CC",
    padding: 5,
    borderRadius: 13,
    zIndex: 10,
  },
});
