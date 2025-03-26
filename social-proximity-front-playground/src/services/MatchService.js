// src/services/MatchService.js
export async function getClosestUsers(username) {
  try {
    console.log(`Fetching closest users for ${username}`);
    const response = await fetch(`http://54.210.56.10/location/get-closest?username=${encodeURIComponent(username)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log(`Response status: ${response.status}`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Closest users data:", data);
    return data;
  } catch (error) {
    console.error("Error fetching closest users:", error);
    return { error: error.message };
  }
}
