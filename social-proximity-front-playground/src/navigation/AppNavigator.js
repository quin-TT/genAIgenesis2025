// src/navigation/AppNavigator.js
import React, { useRef, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import socketService from "../services/WebSocketService";

// Import screens
import WelcomeScreen from "../screens/WelcomeScreen";
import LocationScreen from "../screens/LocationScreen";
import ProfileFormScreen from "../screens/ProfileFormScreen";
import CommonDataScreen from "../screens/CommonDataScreen";
import BestMatchScreen from "../screens/BestMatchScreen";
import ConnectionConfirmedScreen from "../screens/ConnectionConfirmedScreen"; // Додайте цей імпорт

const Stack = createNativeStackNavigator();

// This is a simple navigator that passes the startLocationTracking function to the welcome screen
const AppNavigator = ({ startLocationTracking, ...appProps }) => {
  // Create a navigation reference
  const navigationRef = useRef(null);

  // Set the navigation reference in the WebSocket service
  useEffect(() => {
    if (navigationRef.current) {
      socketService.setNavigationRef(navigationRef.current);
    }
  }, [navigationRef]);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} initialParams={{ startLocationTracking, ...appProps }} />
        <Stack.Screen name="Profile" component={ProfileFormScreen} initialParams={appProps} />
        <Stack.Screen name="Location" component={LocationScreen} initialParams={appProps} />
        <Stack.Screen name="CommonData" component={CommonDataScreen} initialParams={appProps} />
        <Stack.Screen name="BestMatch" component={BestMatchScreen} initialParams={appProps} />
        <Stack.Screen name="ConnectionConfirmed" component={ConnectionConfirmedScreen} initialParams={appProps} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
