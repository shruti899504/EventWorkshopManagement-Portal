import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { X, LogIn, UserPlus, AlertCircle } from "lucide-react";

export default function AuthModal({ isOpen, onClose, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // 'login' or 'register'
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();

  if (!isOpen) return null;

  function handleChange(e) {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "login") {
        await login(formData.email, formData.password);
      } else {
        await register(formData.name, formData.email, formData.password);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Authentication error.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemoUser() {
    setFormData({ name: "John Doe", email: "user@eventora.com", password: "user123" });
  }

  function fillDemoAdmin() {
    setFormData({ name: "Admin Master", email: "admin@eventora.com", password: "admin123" });
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="auth-modal" role="dialog" aria-modal="true">
        <button className="close-button" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>

        <div className="auth-header">
          <span className="eyebrow">{mode === "login" ? "WELCOME BACK" : "JOIN EVENTORA"}</span>
          <h2>{mode === "login" ? "Sign In to Your Account" : "Create Attendee Account"}</h2>
          <p>
            {mode === "login"
              ? "Access your registrations, tickets, and review attended events."
              : "Register to manage tickets and explore college workshops seamlessly."}
          </p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Quick Demo Fill Buttons for Examiners/Teachers */}
        <div className="demo-credentials-helper">
          <span className="helper-title">Demo 1-Click Login:</span>
          <div className="helper-buttons">
            <button type="button" className="chip-button" onClick={fillDemoAdmin}>
              Admin (admin@eventora.com)
            </button>
            <button type="button" className="chip-button" onClick={fillDemoUser}>
              User (user@eventora.com)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === "register" && (
            <div className="form-group">
              <label htmlFor="auth_name">Full Name</label>
              <input
                id="auth_name"
                name="name"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="auth_email">Email Address</label>
            <input
              id="auth_email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="auth_password">Password</label>
            <input
              id="auth_password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button className="primary-button submit-button" type="submit" disabled={loading}>
            {loading ? "Processing..." : mode === "login" ? "Sign In →" : "Create Account →"}
          </button>
        </form>

        <div className="auth-footer-toggle">
          {mode === "login" ? (
            <p>
              Don't have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setMode("register");
                  setError("");
                }}
              >
                Sign up here
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="link-button"
                onClick={() => {
                  setMode("login");
                  setError("");
                }}
              >
                Sign in here
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
