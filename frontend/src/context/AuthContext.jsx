import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Check local storage for an existing session when the app loads
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user_data");

    if (storedToken && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (err) {
        console.error("Failed to parse stored user profile", err);
      }
    }
    setIsLoading(false);
  }, []);

  // 2. THE NEW REGISTRATION FUNCTION
  const register = async (userData) => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // We pass the raw JSON data matching your UserCreate schema!
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || "Failed to create account.",
        };
      }

      // If registration works, they can now log in!
      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return {
        success: false,
        error: "Network error connecting to the server.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 3. THE REAL SECURE LOGIN FUNCTION
  const login = async (credentials) => {
    setIsLoading(true);
    try {
      // Step A: Translate the data into standard web-form format for FastAPI
      const formData = new URLSearchParams();
      formData.append("username", credentials.email);
      formData.append("password", credentials.password);

      // Step B: Ask the REAL Python backend if the password is correct
      const response = await fetch("http://localhost:8000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      // Step C: THE VAULT DOOR! If the backend says the password is wrong, WE STOP HERE.
      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: errorData.detail || "Invalid email or password.",
        };
      }

      // Step D: The backend approved the password! Save the secure token.
      const data = await response.json();
      const token = data.access_token;
      localStorage.setItem("token", token);

      // Step E: Crack open the Golden Ticket (JWT) to read the REAL role!
      // A JWT has 3 parts separated by dots. The middle part (index 1) holds the data.
      const payloadBase64 = token.split('.')[1];
      const decodedJson = atob(payloadBase64); // Decode Base64 to text
      const tokenData = JSON.parse(decodedJson); // Parse text to JSON object

      // Create the final user profile using the exact data from the backend
      const finalUserData = {
        id: tokenData.sub,             // The user's ID
        role: tokenData.role.toLowerCase(), // e.g., "citizen", "worker", "admin"
        email: credentials.email,
        name: credentials.email.split("@")[0].toUpperCase(), // Fallback name display
      };

      // Save user profile and update state
      localStorage.setItem("user_data", JSON.stringify(finalUserData));
      setUser(finalUserData);

      return { success: true, role: finalUserData.role };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        error: "Network error connecting to the server.",
      };
    } finally {
      setIsLoading(false);
    }
  };

  // 4. SECURE LOGOUT
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_data");
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};