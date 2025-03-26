import * as Location from "expo-location";
import { fetch } from "expo/fetch";
import AsyncStorage from "@react-native-async-storage/async-storage";

export async function sendLocationToServer(location) {
  const username = await AsyncStorage.getItem("username");
  // Using string format of coordinates as shown in successful debug output
  const data = {
    username: username,
    latitude: String(location.coords.latitude),
    longitude: String(location.coords.longitude), //longitude
  };
  console.log("Sending location data:", JSON.stringify(data));
  try {
    const response = await fetch("http://54.210.56.10/location/save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    // console.log("Response status:", response.status);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! Status: ${response.status}, Body: ${errorText}`);
    }
    // console.log("Location data sent to server!");
    const responseData = await response.json();
    console.log("Server response:", responseData.result);
    return responseData;
  } catch (error) {
    console.error("Error sending location data to server:", error);
    return { error: error.message };
  }
}
