import React, { useState, useEffect } from "react";
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SvgXml } from "react-native-svg";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getClosestUsers } from "../services/MatchService";
import socketService from "../services/WebSocketService";

const arrowBack = `
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.1" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" fill="#ffffff"></path> <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="#ffffff" stroke-width="2"></path> <path d="M8 12L16 12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M11 9L8.08704 11.913V11.913C8.03897 11.961 8.03897 12.039 8.08704 12.087V12.087L11 15" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
`;

export default function BestMatchScreen({ navigation, route }) {
  const [isLoading, setIsLoading] = useState(true); // Start with loading state
  const [username, setUsername] = useState(null);
  const [rankings, setRankings] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [wsConnected, setWsConnected] = useState(false);

  // For testing purposes - if we should use mock data
  const [useMockData, setUseMockData] = useState(false);

  // Load username and fetch matches automatically when component mounts
  useEffect(() => {
    const loadUserAndMatches = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem("username");
        if (savedUsername) {
          setUsername(savedUsername);

          // Set up WebSocket connection for realtime updates
          if (!socketService.isConnected) {
            await socketService.connect(savedUsername);
          }

          // Check if matches are already available in WebSocketService
          if (socketService.hasMatches()) {
            const matches = socketService.getMatches();
            setRankings(matches);
            setCurrentIndex(0);
            setIsLoading(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } else {
            // Fetch matches if not available
            fetchMatches(savedUsername);
          }
        } else {
          setIsLoading(false);
          Alert.alert("Profile Required", "You need to create a profile before finding matches.", [
            { text: "OK", onPress: () => navigation.navigate("Profile") },
          ]);
        }
      } catch (error) {
        console.error("Error loading username:", error);
        setIsLoading(false);
      }
    };

    loadUserAndMatches();

    // Set up WebSocket connection status listener
    socketService.addConnectionListener(setWsConnected);

    // Set up message listener for real-time match updates
    socketService.addMessageListener(handleWebSocketMessage);

    // Cleanup on unmount
    return () => {
      socketService.removeConnectionListener(setWsConnected);
      socketService.removeMessageListener(handleWebSocketMessage);
    };
  }, []);

  // Handle WebSocket messages related to matches
  const handleWebSocketMessage = (message) => {
    console.log("Processing message type:", message.type);

    // Handle the analysis_done message with nested JSON in text field
    if (message.type === "analysis_done" && message.data && message.data.text) {
      try {
        // Extract JSON from the markdown code block in the text field
        const jsonMatch = message.data.text.match(/```json\n([\s\S]*?)\n```/);

        if (jsonMatch && jsonMatch[1]) {
          // Parse the extracted JSON
          const rankingData = JSON.parse(jsonMatch[1]);

          if (rankingData.ranking && rankingData.ranking.length > 0) {
            console.log("Successfully parsed ranking data:", rankingData.ranking);

            // Update your state with the parsed rankings
            setRankings(rankingData.ranking);
            setCurrentIndex(0); // Reset to first match
            setIsLoading(false);

            // Also update the WebSocketService's match data
            socketService.matchesFound = true;
            socketService.matchData = rankingData.ranking;

            // Provide feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return;
          }
        }
      } catch (error) {
        console.error("Error parsing ranking data:", error);
      }
    }

    // Your existing handler code for other message types
    if (message.type === "match_update" && message.payload && message.payload.rankings) {
      setRankings(message.payload.rankings);
      setCurrentIndex(0);

      // Also update the WebSocketService's match data
      socketService.matchesFound = true;
      socketService.matchData = message.payload.rankings;

      setIsLoading(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  // Add test functionality for simulating a message
  const handleTestData = () => {
    // This is the exact message format from your console logs
    const testMessage = {
      type: "analysis_done",
      data: {
        chat_history: [{}, {}],
        finish_reason: "COMPLETE",
        generation_id: "228c5ca5-38c0-4c24-a56c-b9cf2feb9ffa",
        meta: {},
        response_id: "26bc8645-6cfb-4e24-a184-d9d334de0491",
        text: '```json\n{\n        "ranking": [\n                {\n                "name": "ducnguyen21",\n                "ranking_position": 1,\n                "skill_overlap": "React",\n                "complementary_strengths": "Golang, .Net, websocket",\n                "networking_potential": "High, due to shared React expertise and complementary backend skills",\n                "suggested_collaboration": "Full-stack development projects leveraging React and Golang/websocket integration",\n                "reason": "Strong skill overlap with React and highly complementary backend skills, offering great potential for full-stack collaboration.",\n                "match_score": 0.80\n                },\n                {\n                "name": "Integrate",\n                "ranking_position": 2,\n                "skill_overlap": "React",\n                "complementary_strengths": "Golang, websockets",\n                "networking_potential": "Moderate to High, due to shared React expertise and complementary backend skills",\n                "suggested_collaboration": "Real-time web application development using React and websockets",\n                "reason": "Good skill overlap with React and complementary backend skills, particularly in real-time communication technologies.",\n                "match_score": 0.75\n                }\n        ]\n}\n```',
      },
    };

    // Process the test message using the same handler
    handleWebSocketMessage(testMessage);
  };

  // Function to fetch matches
  const fetchMatches = async (user) => {
    setIsLoading(true);
    try {
      if (useMockData) {
        // Use mock data for testing with 3 users
        const mockRankings = [
          {
            username: "user1",
            name: "Alex Smith",
            match_score: 0.95,
            skill_overlap: "React Native, JavaScript, Node.js",
            complementary_strengths: "UI/UX Design, Backend Architecture",
            reason: "You both share strong frontend development skills",
          },
          {
            username: "user2",
            name: "Jordan Taylor",
            match_score: 0.87,
            skill_overlap: "JavaScript, Python, Data Analysis",
            complementary_strengths: "Machine Learning, Cloud Infrastructure",
            reason: "Your JavaScript skills complement their data science background",
          },
          {
            username: "user3",
            name: "Casey Morgan",
            match_score: 0.78,
            skill_overlap: "React, GraphQL, TypeScript",
            complementary_strengths: "Project Management, DevOps",
            reason: "Their project management skills complement your technical expertise",
          },
        ];

        setRankings(mockRankings);
        setCurrentIndex(0);

        // Update the WebSocketService's match data
        socketService.matchesFound = true;
        socketService.matchData = mockRankings;

        setIsLoading(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      // Otherwise fetch real data
      const data = await getClosestUsers(user || username);
      if (data.error) {
        Alert.alert("Error", data.error);
      } else if (data.rankings && data.rankings.length > 0) {
        setRankings(data.rankings);
        setCurrentIndex(0);

        // Update the WebSocketService's match data
        socketService.matchesFound = true;
        socketService.matchData = data.rankings;

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        // Also send request for matches via WebSocket for realtime updates
        if (socketService.isConnected) {
          socketService.sendMessage("request_matches", {
            username: user || username,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        // If no matches found, try with mock data for testing
        Alert.alert("No Matches Found", "Would you like to use test data instead?", [
          {
            text: "No",
            style: "cancel",
            onPress: () => {
              Alert.alert("No Matches", "No matches found at this time.");
            },
          },
          {
            text: "Yes",
            onPress: () => {
              setUseMockData(true);
              fetchMatches(user);
            },
          },
        ]);
      }
    } catch (error) {
      console.error("Error fetching matches:", error);
      Alert.alert("Error", "Failed to fetch matches. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Додайте функцію для переходу до екрану HI
  const handleShowHi = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("ConnectionConfirmed");
  };
  // Handle accepting a match
  const handleAcceptMatch = () => {
    if (!rankings.length) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Send match accept notification via WebSocket
    if (socketService.isConnected) {
      socketService.sendMessage("match_response", {
        from_username: username,
        to_username: rankings[currentIndex].username || rankings[currentIndex].name,
        response: "accept",
        timestamp: new Date().toISOString(),
      });
    }

    // Navigate to the CommonData screen with the current match data
    navigation.navigate("CommonData", {
      userData: rankings[currentIndex],
      allMatches: rankings,
      currentIndex: currentIndex,
    });
  };

  // Handle rejecting a match / going to next match
  const handleRejectMatch = () => {
    if (!rankings.length) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Send match reject notification via WebSocket
    if (socketService.isConnected) {
      socketService.sendMessage("match_response", {
        from_username: username,
        to_username: rankings[currentIndex].username || rankings[currentIndex].name,
        response: "reject",
        timestamp: new Date().toISOString(),
      });
    }

    if (currentIndex < rankings.length - 1) {
      // Go to next match if available
      setCurrentIndex(currentIndex + 1);
    } else {
      // No more matches, ask to refresh
      Alert.alert("End of Matches", "You've seen all available matches. Would you like to refresh?", [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: () => fetchMatches() },
      ]);
    }
  };

  const handleGoToWelcome = () => {
    navigation.navigate("Welcome");
  };

  // Toggle between real and mock data
  const toggleMockData = () => {
    setUseMockData(!useMockData);
    fetchMatches(username);
  };

  // Manual refresh matches
  const handleRefreshMatches = () => {
    if (!username) return;

    // Clear any existing matches
    setRankings([]);
    setCurrentIndex(0);

    // Send request for matches via WebSocket
    if (socketService.isConnected) {
      socketService.sendMessage("request_matches", {
        username: username,
        timestamp: new Date().toISOString(),
      });

      Alert.alert("Requesting Matches", "Looking for people with similar interests. This may take a moment...");
    }

    // Also try HTTP fetch for matches
    fetchMatches(username);
  };

  // Get current match
  const currentMatch = rankings.length > 0 ? rankings[currentIndex] : null;

  // Connection status indicator
  const renderConnectionStatus = () => (
    <View style={[styles.connectionStatus, wsConnected ? styles.connected : styles.disconnected]}>
      <Text style={styles.connectionText}>{wsConnected ? "Connected" : "Disconnected"}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Best Match</Text>
        <TouchableOpacity style={styles.arrowBack} activeOpacity={0.5} onPress={handleGoToWelcome}>
          <SvgXml xml={arrowBack} width={35} height={35} />
        </TouchableOpacity>
      </View>

      {/* Connection status indicator */}
      {renderConnectionStatus()}

      {/* Test data toggle button */}
      <TouchableOpacity style={styles.testDataToggle} onPress={toggleMockData}>
        <Text style={styles.testDataText}>{useMockData ? "Using Test Data" : "Using Real Data"}</Text>
      </TouchableOpacity>

      {/* Test button for WebSocket data */}
      <TouchableOpacity style={styles.testButton} onPress={handleTestData}>
        <Text style={styles.testButtonText}>Test WebSocket Data</Text>
      </TouchableOpacity>

      {/* Refresh Matches button */}
      <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshMatches} disabled={isLoading}>
        <Text style={styles.refreshButtonText}>{isLoading ? "Finding Matches..." : "Refresh Matches"}</Text>
      </TouchableOpacity>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#F5A623" />
          <Text style={styles.loadingText}>Finding your best matches...</Text>
        </View>
      ) : currentMatch ? (
        <View style={styles.matchContainer}>
          <View style={styles.matchCard}>
            <Text style={styles.matchName}>{currentMatch.username || currentMatch.name}</Text>

            {currentMatch.match_score && (
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Match Score:</Text>
                <Text style={styles.scoreValue}>{Math.round(currentMatch.match_score * 100)}%</Text>
              </View>
            )}

            {currentMatch.skill_overlap && (
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Skills:</Text>
                <Text style={styles.infoValue}>{currentMatch.skill_overlap}</Text>
              </View>
            )}

            {currentMatch.complementary_strengths && (
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Complementary Strengths:</Text>
                <Text style={styles.infoValue}>{currentMatch.complementary_strengths}</Text>
              </View>
            )}

            {currentMatch.reason && (
              <View style={styles.infoContainer}>
                <Text style={styles.infoLabel}>Why this match?</Text>
                <Text style={styles.infoValue}>{currentMatch.reason}</Text>
              </View>
            )}

            {/* Ranking position indicator */}
            <View style={styles.rankingInfo}>
              <Text style={styles.rankingText}>
                Match {currentIndex + 1} of {rankings.length}
              </Text>
            </View>
          </View>

          <View style={styles.actionContainer}>
            <TouchableOpacity style={[styles.actionButton, styles.rejectButton]} onPress={handleRejectMatch}>
              <Text style={styles.actionButtonText}>Skip</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.acceptButton]} onPress={handleAcceptMatch}>
              <Text style={styles.actionButtonText}>Connect</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.noMatchContainer}>
          <Text style={styles.noMatchText}>No matches available right now.</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchMatches()}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 20,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 40,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  arrowBack: {
    backgroundColor: "#0052CC",
    padding: 5,
    borderRadius: 13,
  },
  connectionStatus: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 15,
  },
  connected: {
    backgroundColor: "rgba(76, 175, 80, 0.2)",
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  disconnected: {
    backgroundColor: "rgba(244, 67, 54, 0.2)",
    borderWidth: 1,
    borderColor: "#F44336",
  },
  connectionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  testDataToggle: {
    backgroundColor: "rgba(255, 193, 7, 0.2)",
    borderWidth: 1,
    borderColor: "#FFC107",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 10,
  },
  testDataText: {
    color: "#FFC107",
    fontSize: 12,
    fontWeight: "bold",
  },
  testButton: {
    backgroundColor: "rgba(156, 39, 176, 0.2)",
    borderWidth: 1,
    borderColor: "#9C27B0",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 10,
  },
  testButtonText: {
    color: "#CE93D8",
    fontSize: 12,
    fontWeight: "bold",
  },
  refreshButton: {
    backgroundColor: "rgba(33, 150, 243, 0.2)",
    borderWidth: 1,
    borderColor: "#2196F3",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 15,
  },
  refreshButtonText: {
    color: "#2196F3",
    fontSize: 12,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "white",
    fontSize: 18,
    marginTop: 20,
  },
  matchContainer: {
    flex: 1,
    alignItems: "center",
  },
  matchCard: {
    backgroundColor: "#161B2B",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#4169E1",
    padding: 20,
    width: "100%",
    marginBottom: 30,
  },
  matchName: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    marginBottom: 15,
    textAlign: "center",
  },
  scoreContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "rgba(65, 105, 225, 0.2)",
    padding: 10,
    borderRadius: 10,
  },
  scoreLabel: {
    color: "white",
    fontSize: 16,
    marginRight: 10,
  },
  scoreValue: {
    color: "#F5A623",
    fontSize: 18,
    fontWeight: "bold",
  },
  infoContainer: {
    marginBottom: 15,
  },
  infoLabel: {
    color: "#aaa",
    fontSize: 14,
    marginBottom: 5,
  },
  infoValue: {
    color: "white",
    fontSize: 16,
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    margin: 5,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#757575",
  },
  actionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  noMatchContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noMatchText: {
    color: "white",
    fontSize: 18,
    marginBottom: 20,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: "#F5A623",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  retryButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  rankingInfo: {
    marginTop: 10,
    alignItems: "center",
  },
  rankingText: {
    color: "#aaa",
    fontSize: 14,
  },
  quickActions: {
    marginTop: 10,
    alignItems: "center",
  },
  hiButton: {
    backgroundColor: "#F5A623",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 5,
  },
  hiButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});
