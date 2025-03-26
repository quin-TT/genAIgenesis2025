import React, { useState, useEffect } from "react";
import * as Haptics from "expo-haptics";
import AsyncStorage from "@react-native-async-storage/async-storage";
import socketService from "../services/WebSocketService";

import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SvgXml } from "react-native-svg";

const arrowBack = `
   <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path opacity="0.1" d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" fill="#ffffff"></path> <path d="M3 12C3 4.5885 4.5885 3 12 3C19.4115 3 21 4.5885 21 12C21 19.4115 19.4115 21 12 21C4.5885 21 3 19.4115 3 12Z" stroke="#ffffff" stroke-width="2"></path> <path d="M8 12L16 12" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> <path d="M11 9L8.08704 11.913V11.913C8.03897 11.961 8.03897 12.039 8.08704 12.087V12.087L11 15" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
`;

export default function ProfileFormScreen({ navigation, updateUsername }) {
  const [formData, setFormData] = useState({
    username: "", // Add this field
    name: "",
    email: "",
    age: "",
    degree: "",
    university: "",
    skills: "",
    certification: "",
    companyInterests: "",
    hobbies: "",
    jobTitle: "",
  });
  const [errors, setErrors] = useState({}); // Validation errors
  const [isSubmitting, setIsSubmitting] = useState(false); // Form submission state
  const [wsStatus, setWsStatus] = useState({ connected: false });

  // Load saved username if available
  useEffect(() => {
    const loadSavedUsername = async () => {
      try {
        const savedUsername = await AsyncStorage.getItem("username");
        if (savedUsername) {
          setFormData((prevData) => ({ ...prevData, username: savedUsername }));
        }
      } catch (error) {
        console.error("Error loading username:", error);
      }
    };

    loadSavedUsername();

    // Set up WebSocket status listener
    socketService.addConnectionListener((connected) => {
      setWsStatus({ connected });
    });

    return () => {
      socketService.removeConnectionListener(setWsStatus);
    };
  }, []);

  // FUNCTION TO HANDLE INPUT CHANGES
  function handleChange(field, value) {
    setFormData({ ...formData, [field]: value }); // Update form data
    if (errors[field]) {
      // Clear errors if there are any for user to correct the field
      setErrors({ ...errors, [field]: null });
    }
  }

  // FUNCTION TO VALIDATE FORM DATA
  function validateForm() {
    let newErrors = {};
    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.age.trim()) {
      newErrors.age = "Age is required";
    } else if (isNaN(formData.age) || parseInt(formData.age) < 18) {
      newErrors.age = "Age must be a number and at least 18";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  }

  // FUNCTION TO HANDLE FORM SUBMISSION
  async function handleSubmit() {
    if (isSubmitting) {
      return;
    }
    if (!validateForm()) {
      Alert.alert("Validation Error", "Please fix the errors before submitting");
      return;
    }
    setIsSubmitting(true);

    try {
      // Save username to AsyncStorage
      await AsyncStorage.setItem("username", formData.username);

      // Update username in parent component if provided
      if (updateUsername) {
        updateUsername(formData.username);
      }

      // Connect to WebSocket with username
      socketService.connect(formData.username);

      // Convert age to integer
      const formDataToSubmit = {
        ...formData,
        age: parseInt(formData.age, 10),
      };

      console.log("Submitting form:", JSON.stringify(formDataToSubmit));

      // Submit to server with HTTP
      const response = await fetch("http://54.210.56.10/user/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formDataToSubmit),
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Server response:", data);

        // Also announce via WebSocket that user has created profile
        if (socketService.isConnected) {
          socketService.sendMessage("profile_created", {
            username: formData.username,
            name: formData.name,
            skills: formData.skills,
            timestamp: new Date().toISOString(),
          });
        }

        Alert.alert(
          "Profile Created",
          "Your profile has been created successfully and you are now connected for real-time updates."
        );
        navigation.navigate("Location");
      } else {
        try {
          const errorData = await response.json();
          console.log("Server error:", errorData);
          Alert.alert("Error", errorData.error || "An error occurred. Please try again.");
        } catch (e) {
          console.log("Error parsing server response:", e);
          Alert.alert("Error", `Server returned status ${response.status}`);
        }
      }
    } catch (error) {
      console.log("Error submitting form:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const renderField = (label, field, placeholder, keyboardType = "default", multiline = false) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.multilineInput, errors[field] ? styles.inputError : null]}
        placeholder={placeholder}
        placeholderTextColor="#FFFFFFCC"
        value={formData[field]}
        onChangeText={(text) => handleChange(field, text)}
        keyboardType={keyboardType}
        multiline={multiline}
        color="#fff"
      />
      {errors[field] ? <Text style={styles.errorText}>{errors[field]}</Text> : null}
    </View>
  );

  const handleGoToWelcome = () => {
    navigation.navigate("Welcome");
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView>
          <View style={styles.formContainer}>
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Create Your Profile</Text>
              <TouchableOpacity
                style={styles.arrowBack}
                activeOpacity={0.5}
                onPress={() => {
                  handleGoToWelcome();
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                }}
              >
                <SvgXml xml={arrowBack} width={35} height={35} />
              </TouchableOpacity>
            </View>

            {/* WebSocket Status Indicator */}
            <View style={styles.statusContainer}>
              <View
                style={[
                  styles.statusIndicator,
                  wsStatus.connected ? styles.statusConnected : styles.statusDisconnected,
                ]}
              />
              <Text style={styles.statusText}>
                {wsStatus.connected ? "Real-time connection active" : "Real-time connection inactive"}
              </Text>
            </View>

            {renderField("Username (public)", "username", "Enter your username")}
            {renderField("Name", "name", "Enter your name")}
            {renderField("Email", "email", "Enter your email", "email-address")}
            {renderField("Age", "age", "Enter your age", "numeric")}
            {renderField("Degree", "degree", "Enter your degree")}
            {renderField("University", "university", "Enter your university")}
            {renderField("Skills", "skills", "Enter your skills (e.g., React, JavaScript)", "default", true)}
            {renderField("Certification", "certification", "Enter your certifications")}
            {renderField("Company Interests", "companyInterests", "Companies you are interested in")}
            {renderField("Hobbies (separate with commas)", "hobbies", "Reading, Swimming, Hiking", "default", true)}
            {renderField("Job Title", "jobTitle", "Enter your job title")}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
              onPress={() => {
                handleSubmit();
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              activeOpacity={0.5}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>{isSubmitting ? "Submitting..." : "Submit Profile"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.5}
              onPress={() => {
                handleGoToWelcome();
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
              }}
            >
              <Text style={styles.submitButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  headerContainer: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    backgroundColor: "#161B2B",
    padding: 10,
    borderRadius: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusConnected: {
    backgroundColor: "#4CAF50", // Green
  },
  statusDisconnected: {
    backgroundColor: "#F44336", // Red
  },
  statusText: {
    color: "#e6e6e6",
    fontSize: 14,
  },
  arrowBack: {
    backgroundColor: "#0052CC",
    padding: 5,
    borderRadius: 13,
  },
  formContainer: {
    padding: 20,
    marginTop: 60,
    marginBottom: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  fieldContainer: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "500",
    color: "#e6e6e6",
  },
  input: {
    fontSize: 16,
    backgroundColor: "#161B2B",
    borderRadius: 10,
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#4169E1",
    padding: 15,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  inputError: {
    borderColor: "#ff6b6b",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    marginTop: 5,
  },
  submitButton: {
    backgroundColor: "#F5A623",
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 20,
    alignItems: "center",
  },
  backButton: {
    backgroundColor: "#0052CC",
    paddingVertical: 15,
    borderRadius: 15,
    marginTop: 20,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#a5a5a5",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
