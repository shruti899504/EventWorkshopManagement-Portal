import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
const API_URL = "http://localhost:5000/api";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem("eventora_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem("eventora_token") || null);

  useEffect(() => {
    if (token) {
      localStorage.setItem("eventora_token", token);
    } else {
      localStorage.removeItem("eventora_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("eventora_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("eventora_user");
    }
  }, [user]);

  async function login(email, password) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Login failed");
    }
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(name, email, password) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Registration failed");
    }
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem("eventora_token");
    localStorage.removeItem("eventora_user");
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isAdmin: user?.role === "admin" }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
