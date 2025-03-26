import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert, ScrollView, Animated, Easing, FlatList } from "react-native";
import * as Location from "expo-location";
import { fetch } from "expo/fetch";
import { SvgXml } from "react-native-svg";
import * as Haptics from "expo-haptics";
import socketService from "../services/WebSocketService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused } from "@react-navigation/native";
import { getClosestUsers } from "../services/MatchService";

const sandTimer = `<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <rect x="255.467" y="248.533" style="fill:#F5A623;" width="1.067" height="16"></rect> <path style="fill:#7f7ebe;" d="M372.267,194.133H139.733c-8.836,0-16-7.164-16-16v-108.8c0-8.836,7.164-16,16-16h232.533 c8.836,0,16,7.164,16,16v108.8C388.267,186.97,381.103,194.133,372.267,194.133z"></path> <path style="fill:#0052CC;" d="M372.267,53.333H256v140.8h116.267c8.836,0,16-7.164,16-16v-108.8 C388.267,60.497,381.103,53.333,372.267,53.333z"></path> <path style="fill:#A7A9AC;" d="M393.6,85.333H118.4c-8.836,0-16-7.164-16-16V16c0-8.836,7.164-16,16-16h275.2 c8.836,0,16,7.164,16,16v53.333C409.6,78.17,402.436,85.333,393.6,85.333z"></path> <path style="fill:#F5A623;" d="M123.733,162.133c0,15.069-2.09,25.287,8.507,30.905l116.267,61.632 c2.343,1.243,4.918,1.863,7.493,1.863c2.575,0,5.15-0.621,7.493-1.863l116.267-61.632c5.233-2.774,8.507-8.212,8.507-14.137v-0.768 v-16C381.102,162.133,130.495,162.133,123.733,162.133z"></path> <path style="fill:#FF9900;" d="M256,162.133v94.4c2.575,0,5.15-0.621,7.493-1.863l116.267-61.632 c5.233-2.774,8.507-8.212,8.507-14.137v-0.768v-16C384.687,162.133,320.342,162.133,256,162.133z"></path> <path style="fill:#7f7ebe;" d="M372.267,391.467H139.733c-8.836,0-16-7.164-16-16v-41.301c0-5.924,3.273-11.362,8.507-14.137 l116.267-61.632c4.688-2.485,10.3-2.485,14.988,0l116.267,61.632c5.233,2.774,8.507,8.212,8.507,14.137v41.301 C388.267,384.304,381.103,391.467,372.267,391.467z"></path> <path style="fill:#0052CC;" d="M379.761,320.03l-116.267-61.632c-2.343-1.243-4.918-1.865-7.493-1.865v134.933h116.267 c8.836,0,16-7.164,16-16v-41.301C388.267,328.242,384.994,322.803,379.761,320.03z"></path> <path style="fill:#F5A623;" d="M372.267,459.733H139.733c-8.836,0-16-7.164-16-16v-84.267h264.533v84.267 C388.267,452.571,381.104,459.733,372.267,459.733z"></path> <path style="fill:#FF9900;" d="M256,359.467v100.267h116.267c8.836,0,16-7.164,16-16v-84.267H256z"></path> <path style="fill:#A7A9AC;" d="M393.6,512H118.4c-8.836,0-16-7.164-16-16v-53.333c0-8.836,7.164-16,16-16h275.2 c8.836,0,16,7.164,16,16V496C409.6,504.837,402.436,512,393.6,512z"></path> <g> <path style="fill:#808285;" d="M393.6,0H256v85.333h137.6c8.836,0,16-7.164,16-16V16C409.6,7.164,402.436,0,393.6,0z"></path> <path style="fill:#808285;" d="M393.6,426.667H256V512h137.6c8.836,0,16-7.164,16-16v-53.333 C409.6,433.83,402.436,426.667,393.6,426.667z"></path> </g> </g></svg>`;

// Signal/Network Icon for WebSocket Connection
const wifiIcon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 19.5C12.5523 19.5 13 19.0523 13 18.5C13 17.9477 12.5523 17.5 12 17.5C11.4477 17.5 11 17.9477 11 18.5C11 19.0523 11.4477 19.5 12 19.5Z" fill="currentColor"/><path d="M8.5 15C8.83333 14.6667 9.7 14 12 14C14.3 14 15.1667 14.6667 15.5 15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M5.5 11C6.16667 10.3333 8 9 12 9C16 9 17.8333 10.3333 18.5 11" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 7C3.5 6 6.4 4 12 4C17.6 4 20.5 6 21.5 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

const LocationScreen = ({ navigation, route }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [pingResult, setPingResult] = useState(null);
  const [wsStatus, setWsStatus] = useState({ connected: false });
  const [username, setUsername] = useState("Anonymous");
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [realtimeMessages, setRealtimeMessages] = useState([]);
  const [matchFound, setMatchFound] = useState(false);
  const isFocused = useIsFocused();

  // Animation related values
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(1)).current;
  const wsSignalOpacity = useRef(new Animated.Value(wsStatus.connected ? 1 : 0.3)).current;

  // Check if matches are already available when screen comes into focus
  useEffect(() => {
    if (isFocused) {
      // Check if matches are already available in WebSocketService
      if (socketService.hasMatches()) {
        setMatchFound(true);
      }
    }
  }, [isFocused]);

  const checkForMatches = async () => {
    // First check if matches already exist in the WebSocketService
    if (socketService.hasMatches()) {
      setMatchFound(true);
      return;
    }

    // If no matches found, try to fetch them directly
    try {
      if (username) {
        // Send request for matches via WebSocket
        if (socketService.isConnected) {
          socketService.sendMessage("request_matches", {
            username: username,
            timestamp: new Date().toISOString(),
          });
        }

        // Also directly call the API (same as BestMatchScreen does)
        const data = await getClosestUsers(username);
        if (data.rankings && data.rankings.length > 0) {
          // Store matches in the WebSocketService
          socketService.matchesFound = true;
          socketService.matchData = data.rankings;
          setMatchFound(true);
        }
      }
    } catch (error) {
      console.error("Error checking for matches:", error);
    }
  };

  useEffect(() => {
    // Load username
    AsyncStorage.getItem("username").then((savedUsername) => {
      if (savedUsername) {
        setUsername(savedUsername);
        // Call our new function to check for matches once username is loaded
        checkForMatches();
      }
    });

    // Set up WebSocket connection status listener
    socketService.addConnectionListener((connected) => {
      setWsStatus({ connected });

      // Animate WebSocket indicator
      Animated.timing(wsSignalOpacity, {
        toValue: connected ? 1 : 0.3,
        duration: 300,
        useNativeDriver: true,
      }).start();

      if (connected) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    });

    // Set up message listener for WebSocket
    socketService.addMessageListener((message) => {
      // Keep a log of recent messages
      setRealtimeMessages((prev) => {
        const newMessages = [...prev, message].slice(-10);
        return newMessages;
      });

      // Handle nearby users updates
      if (message.type === "nearby_users") {
        setNearbyUsers(message.payload.users || []);
        if (message.payload.users && message.payload.users.length > 0) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      }

      // Check for match-related messages
      if (
        message.type === "match_update" ||
        (message.type === "analysis_done" && message.data && message.data.text) ||
        message.type === "match_found"
      ) {
        setMatchFound(true);
      }
    });

    // Get initial location
    const getInitialLocation = async () => {
      try {
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);
        setLastUpdated(new Date().toLocaleTimeString());
      } catch (error) {
        console.log("Error getting initial location:", error);
      }
    };

    getInitialLocation();

    // Set up interval to update display
    const displayInterval = setInterval(() => {
      Location.getCurrentPositionAsync({})
        .then((location) => {
          setLocation(location);
          setLastUpdated(new Date().toLocaleTimeString());

          // Send location update via WebSocket if connected
          if (wsStatus.connected && username) {
            socketService.sendMessage("location_update", {
              username: username,
              latitude: location.coords.latitude,
              longitude: location.coords.longitude, //longitude
              timestamp: new Date().toISOString(),
            });
          }
        })
        .catch((error) => {
          console.log("Error updating display:", error);
        });
    }, 5000);

    // Clean up on unmount
    return () => {
      clearInterval(displayInterval);
      socketService.removeConnectionListener(setWsStatus);
      socketService.removeMessageListener();
    };
  }, [username]);

  // Animation effect
  useEffect(() => {
    const startAnimation = () => {
      Animated.sequence([
        Animated.delay(1000),
        Animated.timing(spinValue, {
          toValue: 0.5,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(1000),
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(fadeValue, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start((finished) => {
        if (finished) {
          spinValue.setValue(0);
          Animated.timing(fadeValue, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            startAnimation();
          });
        }
      });
    };

    startAnimation();

    return () => {
      spinValue.stopAnimation();
      fadeValue.stopAnimation();
    };
  }, [spinValue, fadeValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Test ping endpoint
  async function testPingEndpoint() {
    try {
      const response = await fetch("http://54.210.56.10/ping");

      console.log("Ping status:", response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Ping response:", data);
      setPingResult(`Success: ${JSON.stringify(data)}`);
      return data;
    } catch (error) {
      console.error("Error testing ping endpoint:", error);
      setPingResult(`Error: ${error.message}`);
      return { error: error.message };
    }
  }

  // Handle reconnect WebSocket
  const handleReconnectWebSocket = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    socketService.reconnect();
  };

  // Handle ping test
  const handlePingTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const result = await testPingEndpoint();
    if (result.error) {
      Alert.alert("Ping Failed", result.error);
    } else {
      Alert.alert("Ping Successful", JSON.stringify(result));
    }
  };

  // Handle "Find Nearby" action
  const handleFindNearby = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!wsStatus.connected) {
      Alert.alert(
        "Connection Required",
        "Real-time connection is required to find nearby users. Would you like to connect now?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: handleReconnectWebSocket },
        ]
      );
      return;
    }

    socketService.sendMessage("find_nearby", {
      username: username,
      latitude: location?.coords?.latitude,
      longitude: location?.coords?.longitude,
      radius: 1000, // 1km radius
      timestamp: new Date().toISOString(),
    });

    Alert.alert("Finding Nearby Users", "Looking for users in your proximity...");
  };

  // Handle view matches button
  const handleViewMatches = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("BestMatch");
  };

  // Handle request matches
  const handleRequestMatches = () => {
    if (!wsStatus.connected) {
      Alert.alert(
        "Connection Required",
        "Real-time connection is required to find matches. Would you like to connect now?",
        [
          { text: "No", style: "cancel" },
          { text: "Yes", onPress: handleReconnectWebSocket },
        ]
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    socketService.sendMessage("request_matches", {
      username: username,
      timestamp: new Date().toISOString(),
    });

    Alert.alert("Finding Matches", "Looking for people with similar interests. This may take a moment...", [
      { text: "OK" },
    ]);
  };

  let locationText = "Waiting for location...";

  if (errorMsg) {
    locationText = errorMsg;
  } else if (location) {
    locationText = `Username: ${username}\nLatitude: ${location.coords.latitude}\nlongitude: ${location.coords.longitude}`;
  }

  const handleBackToWelcome = () => {
    navigation.navigate("Welcome");
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        {/* Header with WebSocket Status */}
        <View style={styles.header}>
          <Text style={styles.heading}>Location Data</Text>
          <Animated.View style={[styles.connectionIndicator, { opacity: wsSignalOpacity }]}>
            <SvgXml xml={wifiIcon} width={24} height={24} color={wsStatus.connected ? "#4CAF50" : "#F44336"} />
            <Text style={[styles.connectionText, { color: wsStatus.connected ? "#4CAF50" : "#F44336" }]}>
              {wsStatus.connected ? "Connected" : "Disconnected"}
            </Text>
          </Animated.View>
        </View>

        <Text style={styles.locationText}>{locationText}</Text>
        {lastUpdated && <Text style={{ color: "#fff" }}>Last updated: {lastUpdated}</Text>}

        {/* Animated Sand Timer */}
        <View style={styles.sandTimerContainer}>
          <Animated.View style={{ transform: [{ rotate: spin }], opacity: fadeValue }}>
            <SvgXml xml={sandTimer} width={100} height={100} />
          </Animated.View>
        </View>

        {/* Match Found Indicator */}
        {matchFound && (
          <View style={styles.matchFoundContainer}>
            <Text style={styles.matchFoundText}>✨ Matches Found! ✨</Text>
          </View>
        )}

        {/* Nearby Users Section */}
        {nearbyUsers.length > 0 && (
          <View style={styles.nearbyContainer}>
            <Text style={styles.sectionTitle}>Nearby Users</Text>
            <FlatList
              data={nearbyUsers}
              keyExtractor={(item, index) => `nearby-${item.username || index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.nearbyUserItem}
                  onPress={() => {
                    navigation.navigate("CommonData", { userId: item.username });
                  }}
                >
                  <Text style={styles.nearbyUserName}>{item.username}</Text>
                  <Text style={styles.nearbyUserDistance}>
                    {item.distance ? `${Math.round(item.distance)}m away` : "Nearby"}
                  </Text>
                </TouchableOpacity>
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.nearbyUsersList}
            />
          </View>
        )}

        <View style={styles.buttonContainer}>
          {/* WebSocket Actions */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.actionButton, !wsStatus.connected && styles.actionButtonDisabled]}
              onPress={handleFindNearby}
              disabled={!wsStatus.connected}
            >
              <Text style={styles.actionButtonText}>Find Nearby</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                wsStatus.connected ? styles.reconnectButtonConnected : styles.reconnectButton,
              ]}
              onPress={handleReconnectWebSocket}
            >
              <Text style={styles.actionButtonText}>{wsStatus.connected ? "Reconnect" : "Connect Now"}</Text>
            </TouchableOpacity>
          </View>

          {/* Request Matches Button */}
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.requestMatchesButton,
              !wsStatus.connected && styles.actionButtonDisabled,
            ]}
            onPress={handleRequestMatches}
            disabled={!wsStatus.connected}
          >
            <Text style={styles.actionButtonText}>Request Matches</Text>
          </TouchableOpacity>

          {/* View Matches Button (only shows when matches are found) */}
          {matchFound && (
            <TouchableOpacity style={[styles.actionButton, styles.matchFoundButton]} onPress={handleViewMatches}>
              <Text style={styles.actionButtonText}>View Your Matches</Text>
            </TouchableOpacity>
          )}

          {/* Ping Test Button and Result */}
          <TouchableOpacity style={styles.testButton} activeOpacity={0.5} onPress={handlePingTest}>
            <Text style={styles.buttonText}>Test Ping Endpoint</Text>
          </TouchableOpacity>

          {pingResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultText}>Test Result:</Text>
              <Text style={{ color: "white" }}>{pingResult}</Text>
            </View>
          )}

          <TouchableOpacity
            style={styles.exitButton}
            activeOpacity={0.5}
            onPress={() => {
              handleBackToWelcome();
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
            }}
          >
            <Text style={styles.buttonText}>Back to Welcome</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
  },
  connectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#161B2B",
    padding: 8,
    borderRadius: 8,
  },
  connectionText: {
    fontSize: 14,
    marginLeft: 6,
  },
  locationText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: "center",
    color: "#fff",
  },
  matchFoundContainer: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderWidth: 1,
    borderColor: "#4CAF50",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginVertical: 15,
    alignSelf: "center",
  },
  matchFoundText: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 16,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#fff",
    alignSelf: "flex-start",
  },
  nearbyContainer: {
    width: "100%",
    marginVertical: 15,
  },
  nearbyUsersList: {
    paddingVertical: 5,
  },
  nearbyUserItem: {
    backgroundColor: "#161B2B",
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    minWidth: 120,
    borderWidth: 1,
    borderColor: "#4169E1",
  },
  nearbyUserName: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 5,
  },
  nearbyUserDistance: {
    color: "#aaa",
    fontSize: 12,
  },
  resultContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "#161B2B",
    borderRadius: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "#4169E1",
  },
  resultText: {
    fontWeight: "bold",
    marginBottom: 5,
    color: "white",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 10,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#0052CC",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 10,
    marginHorizontal: 5,
    alignItems: "center",
  },
  actionButtonDisabled: {
    backgroundColor: "#444",
    opacity: 0.7,
  },
  reconnectButton: {
    backgroundColor: "#FF9800",
  },
  reconnectButtonConnected: {
    backgroundColor: "#4CAF50",
  },
  requestMatchesButton: {
    backgroundColor: "#9C27B0", // Purple
    marginBottom: 10,
    width: "100%",
  },
  matchFoundButton: {
    backgroundColor: "#4CAF50", // Green
    marginBottom: 10,
    width: "100%",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  exitButton: {
    backgroundColor: "#0052CC",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  testButton: {
    backgroundColor: "#0052CC",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginTop: 20,
    width: "100%",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  sandTimerContainer: {
    marginVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    height: 100,
  },
});

export default LocationScreen;
