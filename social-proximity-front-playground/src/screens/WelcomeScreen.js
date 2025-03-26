// src/screens/WelcomeScreen.js
import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { SvgXml } from "react-native-svg";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, { useAnimatedStyle, useAnimatedSensor, SensorType, withSpring } from "react-native-reanimated";
import * as Location from "expo-location";
import socketService from "../services/WebSocketService";
import { getClosestUsers } from "../services/MatchService";
import { useIsFocused } from "@react-navigation/native";

const compassSvg = `
<svg height="200px" width="200px" version="1.1" id="Capa_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 496 496" xml:space="preserve" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <g> <path style="fill:#D8DCE1;" d="M189.656,178.344c-3.125-3.125-8.188-3.125-11.312,0s-3.125,8.188,0,11.312l128,128 c1.562,1.562,3.609,2.344,5.656,2.344s4.094-0.781,5.656-2.344c3.125-3.125,3.125-8.188,0-11.312L189.656,178.344z"></path> </g> <g> <path style="fill:#D8DCE1;" d="M368,240h-84.703c-4.422,0-8,3.582-8,8s3.578,8,8,8H368c4.422,0,8-3.582,8-8S372.422,240,368,240z "></path> </g> <g> <path style="fill:#D8DCE1;" d="M212.703,240H128c-4.422,0-8,3.582-8,8s3.578,8,8,8h84.703c4.422,0,8-3.582,8-8 S217.125,240,212.703,240z"></path> </g> <g> <path style="fill:#D8DCE1;" d="M248,220.707c4.422,0,8-3.582,8-8V128c0-4.418-3.578-8-8-8s-8,3.582-8,8v84.707 C240,217.125,243.578,220.707,248,220.707z"></path> </g> <g> <path style="fill:#D8DCE1;" d="M248,275.297c-4.422,0-8,3.582-8,8V368c0,4.418,3.578,8,8,8s8-3.582,8-8v-84.703 C256,278.879,252.422,275.297,248,275.297z"></path> </g> </g> <g> <path style="fill:#0052CC;" d="M212.267,230.01l-61.352,109.634c-1.971,3.522,1.921,7.414,5.443,5.444L267.2,283.092"></path> </g> <g> <path style="fill:#F5A623;" d="M283.784,265.891l61.296-109.527c1.971-3.522-1.922-7.415-5.444-5.444l-112.871,63.178"></path> </g> <g> <path style="fill:#D8DCE1;" d="M248,48C137.719,48,48,137.719,48,248s89.719,200,200,200s200-89.719,200-200S358.281,48,248,48z M248,400c-83.814,0-152-68.186-152-152c0-83.814,68.186-152,152-152s152,68.186,152,152C400,331.813,331.814,400,248,400z"></path> </g> <g> <circle style="fill:#5C546A;" cx="248" cy="248" r="40"></circle> </g> <g> <g> <path style="fill:#8B8996;" d="M248,264c-8.82,0-16-7.176-16-16s7.18-16,16-16s16,7.176,16,16S256.82,264,248,264z"></path> </g> </g> <g> <g> <path style="fill:#8B8996;" d="M64,256H40c-4.422,0-8-3.582-8-8s3.578-8,8-8h24c4.422,0,8,3.582,8,8S68.422,256,64,256z"></path> </g> </g> <g> <g> <path style="fill:#8B8996;" d="M456,256h-24c-4.422,0-8-3.582-8-8s3.578-8,8-8h24c4.422,0,8,3.582,8,8S460.422,256,456,256z"></path> </g> </g> <g> <g> <path style="fill:#8B8996;" d="M248,72c-4.422,0-8-3.582-8-8V40c0-4.418,3.578-8,8-8s8,3.582,8,8v24 C256,68.418,252.422,72,248,72z"></path> </g> </g> <g> <g> <path style="fill:#8B8996;" d="M248,464c-4.422,0-8-3.582-8-8v-24c0-4.418,3.578-8,8-8s8,3.582,8,8v24 C256,460.418,252.422,464,248,464z"></path> </g> </g> <g> <path style="fill:#8B8996;" d="M248,0C111.25,0,0,111.254,0,248s111.25,248,248,248s248-111.254,248-248S384.75,0,248,0z M248,448 c-110.281,0-200-89.719-200-200S137.719,48,248,48s200,89.719,200,200S358.281,448,248,448z"></path> </g> <g> <path style="fill:#5C546A;" d="M48,248c0-110.281,89.719-200,200-200V0C111.25,0,0,111.254,0,248s111.25,248,248,248v-48 C137.719,448,48,358.281,48,248z"></path> </g> </g> </g></svg>
`;

const WelcomeScreen = ({ navigation, route }) => {
  // Get the startLocationTracking function from route params
  const { startLocationTracking } = route.params;

  // Add state for username and loading state
  const [username, setUsername] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [matchesAvailable, setMatchesAvailable] = useState(false);
  const isFocused = useIsFocused();

  // Load username from AsyncStorage when component mounts
  useEffect(() => {
    const loadUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem("username");
        if (savedUsername) {
          setUsername(savedUsername);

          // Check if matches are already available
          if (isFocused && socketService.hasMatches()) {
            setMatchesAvailable(true);
          }
        }
      } catch (error) {
        console.error("Error loading username:", error);
      }
    };

    loadUsername();

    // Add a WebSocket message listener to detect matches
    const handleMessage = (message) => {
      if (
        message.type === "match_update" ||
        (message.type === "analysis_done" && message.data && message.data.text) ||
        message.type === "match_found"
      ) {
        setMatchesAvailable(true);
      }
    };

    socketService.addMessageListener(handleMessage);

    return () => {
      socketService.removeMessageListener(handleMessage);
    };
  }, [isFocused]);

  // Function to remove username
  const handleRemoveUsername = () => {
    Alert.alert("Remove Profile", "Are you sure you want to remove your profile data? This cannot be undone.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            // Clear username from AsyncStorage
            await AsyncStorage.removeItem("username");

            // Also clear related data
            await AsyncStorage.removeItem("currentUser");

            // Disconnect WebSocket if imported
            if (global.socketService) {
              global.socketService.disconnect();
            }

            // Update state to reflect change
            setUsername(null);
            setMatchesAvailable(false);

            // Notify user
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert("Profile Removed", "Your profile has been removed successfully.");
          } catch (error) {
            console.error("Error removing username:", error);
            Alert.alert("Error", "Failed to remove profile data.");
          }
        },
      },
    ]);
  };

  // Enhanced start app function
  const handleEnhancedStartApp = async () => {
    if (!username) {
      Alert.alert("Profile Required", "Please create a profile first to use the app.", [
        { text: "OK", onPress: () => navigation.navigate("Profile") },
      ]);
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // 1. Start location tracking
      if (startLocationTracking) {
        startLocationTracking();
      }

      // 2. Ensure WebSocket connection is active
      if (!socketService.isConnected) {
        await socketService.connect(username);
      }

      // 3. Get current location
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Location permission denied");
      }

      let location = await Location.getCurrentPositionAsync({});

      // 4. Send location update via WebSocket
      socketService.sendMessage("location_update", {
        username: username,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      });

      // 5. Request matches via WebSocket
      socketService.sendMessage("request_matches", {
        username: username,
        timestamp: new Date().toISOString(),
      });

      // 6. NEW: Also directly call the API to get matches right away
      try {
        const matchData = await getClosestUsers(username);
        if (matchData.rankings && matchData.rankings.length > 0) {
          // Store matches in the WebSocketService
          socketService.matchesFound = true;
          socketService.matchData = matchData.rankings;
        }
      } catch (err) {
        console.error("Error fetching initial matches:", err);
        // Continue even if this fails - not critical
      }

      // 7. Navigate to LocationScreen
      navigation.navigate("Location");

      // Success feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error starting app with matches:", error);
      Alert.alert("Error", `Failed to start app: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  const handleGoToProfile = () => {
    navigation.navigate("Profile");
  };

  const handleTestCommonData = () => {
    // Simple navigation to CommonDataScreen
    navigation.navigate("CommonData");
  };

  const handleFindBestMatch = () => {
    if (!username) {
      Alert.alert("Profile Required", "Please create a profile first to find your best matches.", [
        { text: "OK", onPress: () => navigation.navigate("Profile") },
      ]);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("BestMatch");
  };

  //_____ANIMATION_____
  const gravity = useAnimatedSensor(SensorType.GRAVITY);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: withSpring(gravity.sensor.value.x * 15) },
        { translateY: withSpring(gravity.sensor.value.y * -15) },
      ],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.imageContainer, animatedStyle]}>
        <SvgXml xml={compassSvg} width="50%" height="50%" />
      </Animated.View>
      <Text style={styles.heading}>Social Proximity</Text>

      {/* Conditional welcome message based on username */}
      {username ? (
        <View style={styles.usernameContainer}>
          <Text style={styles.welcomeText}>
            Welcome back, <Text style={styles.usernameText}>{username}</Text>!
          </Text>
          {matchesAvailable && <Text style={styles.matchesAvailableText}>You have potential matches waiting!</Text>}
        </View>
      ) : (
        <Text style={styles.welcomeText}>Welcome to Social Proximity</Text>
      )}

      <View style={styles.optionsContainer}>
        <Text style={styles.choiceText}>What would you like to do?</Text>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#F5A623" />
            <Text style={styles.loadingText}>Starting app and finding matches...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              activeOpacity={0.5}
              onPress={handleEnhancedStartApp}
            >
              <Text style={styles.buttonText}>Start App</Text>
            </TouchableOpacity>

            {/* Find best match button - highlighted when matches are available */}
            <TouchableOpacity
              style={[styles.button, styles.matchButton, matchesAvailable ? styles.matchButtonHighlight : null]}
              activeOpacity={0.5}
              onPress={handleFindBestMatch}
            >
              <Text style={styles.buttonText}>{matchesAvailable ? "🎯 View Your Matches" : "Find Best Match"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.profileButton]}
              activeOpacity={0.5}
              onPress={handleGoToProfile}
            >
              <Text style={styles.buttonText}>{username ? "Update Your Profile" : "Create Your Profile"}</Text>
            </TouchableOpacity>

            {/* TEST COMMON DATA BUTTON */}
            {/* <TouchableOpacity
              style={[styles.button, styles.testButton]}
              activeOpacity={0.5}
              onPress={handleTestCommonData}
            >
              <Text style={styles.buttonText}>Test Common Data</Text>
            </TouchableOpacity> */}

            {/* Only show remove button if username exists */}
            {username && (
              <TouchableOpacity
                style={[styles.button, styles.removeButton]}
                activeOpacity={0.5}
                onPress={handleRemoveUsername}
              >
                <Text style={styles.buttonText}>Clear Profile Data</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#FFF",
  },
  welcomeText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 20,
    color: "#FFF",
  },
  usernameContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  usernameText: {
    color: "#F5A623",
    fontWeight: "bold",
    fontSize: 18,
  },
  matchesAvailableText: {
    color: "#4CAF50",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  optionsContainer: {
    width: "100%",
    alignItems: "center",
  },
  choiceText: {
    fontSize: 18,
    marginBottom: 20,
    color: "#FFF",
    fontWeight: "500",
  },
  button: {
    width: "80%",
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 15,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#F5A623", // Yellow color
  },
  matchButton: {
    backgroundColor: "#4CAF50", // Green color for match finding
  },
  matchButtonHighlight: {
    backgroundColor: "#8BC34A", // Light green to indicate matches are available

    borderColor: "#FFFFFF",
  },
  profileButton: {
    backgroundColor: "#0052CC", // Blue color
  },
  removeButton: {
    backgroundColor: "#D32F2F", // Red color for destructive action
    marginBottom: 40,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  imageContainer: {
    height: "40%",
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    marginTop: 10,
    fontSize: 16,
  },
  testButton: {
    backgroundColor: "#9C27B0", // Purple color
  },
});

export default WelcomeScreen;
