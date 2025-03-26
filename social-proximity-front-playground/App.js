// Replacement for App.js
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useState, useEffect, useRef } from "react";
import * as Location from "expo-location";
import AppNavigator from "./src/navigation/AppNavigator";
import { sendLocationToServer } from "./src/services/LocationService";
import socketService from "./src/services/WebSocketService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function App() {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const intervalRef = useRef(null);
  const [username, setUsername] = useState(null);

  // Get current username on load
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem("username");
        if (savedUsername) {
          setUsername(savedUsername);
        }
      } catch (error) {
        console.error("Error loading username:", error);
      }
    };

    loadUsername();
  }, []);

  // Set up WebSocket connection when username is available
  useEffect(() => {
    if (username) {
      // Initialize WebSocket connection with username
      socketService.connect(username);

      // Set up connection status listener
      socketService.addConnectionListener(setWsConnected);

      // Set up message listener
      socketService.addMessageListener((message) => {
        if (message.type === "proximity_alert") {
          Alert.alert("Proximity Alert", message.payload.message, [
            { text: "OK", onPress: () => console.log("OK Pressed") },
          ]);
        } else if (message.type === "notification") {
          Alert.alert(message.payload.title || "Notification", message.payload.body || message.payload.message, [
            { text: "OK", onPress: () => console.log("OK Pressed") },
          ]);
        }
      });

      console.log(`WebSocket initialized for user: ${username}`);
    }

    // Clean up WebSocket on unmount
    return () => {
      socketService.removeConnectionListener(setWsConnected);
      // Don't clean up the service completely as it's used across screens
      // socketService.cleanup();
    };
  }, [username]);

  // GET CURRENT LOCATION AND SEND TO SERVER
  async function getLocation() {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied. Sorry, go away!");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);
      setLastUpdated(new Date().toLocaleTimeString());

      // Send to server via HTTP as before
      await sendLocationToServer(location);

      // Also send via WebSocket if connected
      if (wsConnected && username) {
        socketService.sendMessage("location_update", {
          username: username,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.log("Error retrieving location: ", error);
      setErrorMsg(`Error retrieving location: ${error.message}`);
    }
  }

  // START LOCATION TRACKING
  function startLocationTracking() {
    if (!isTracking) {
      getLocation();
      intervalRef.current = setInterval(() => {
        getLocation();
      }, 10000);
      setIsTracking(true);
    }
  }

  // STOP LOCATION TRACKING
  function stopLocationTracking() {
    if (isTracking) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setIsTracking(false);
    }
  }

  // Clean up interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Update username when changed
  const updateUsername = async (newUsername) => {
    try {
      if (newUsername && newUsername !== username) {
        setUsername(newUsername);
        await AsyncStorage.setItem("username", newUsername);

        // Reconnect WebSocket with new username
        socketService.disconnect();
        socketService.connect(newUsername);

        console.log(`Username updated to: ${newUsername}`);
      }
    } catch (error) {
      console.error("Error updating username:", error);
    }
  };

  // Pass data and functions to the screens
  const appProps = {
    location,
    errorMsg,
    isTracking,
    lastUpdated,
    getLocation,
    startLocationTracking,
    stopLocationTracking,
    wsConnected,
    username,
    updateUsername,
  };

  return (
    <>
      <AppNavigator {...appProps} />
      <StatusBar style="auto" />
    </>
  );
}
