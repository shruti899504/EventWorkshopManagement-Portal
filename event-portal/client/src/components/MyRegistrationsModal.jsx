import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { 
  Ticket, 
  Calendar, 
  MapPin, 
  Clock, 
  XCircle, 
  Star, 
  QrCode, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Sparkles
} from "lucide-react";

export default function MyRegistrationsModal({ isOpen, onClose, onShowTicket }) {
  const { user, token } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  const [feedbackForm, setFeedbackForm] = useState({ rating: 5, comment: "" });
  const [feedbackStatus, setFeedbackStatus] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    if (isOpen && token) {
      fetchMyRegistrations();
    }
  }, [isOpen, token]);

  async function fetchMyRegistrations() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/registrations/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load registrations.");
      const data = await res.json();
      setRegistrations(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel(regId) {
    if (!window.confirm("Are you sure you want to cancel this registration? This will free your seat for others.")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/registrations/${regId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel");
      setActionMessage("Registration cancelled successfully. Seat has been freed.");
      fetchMyRegistrations();
    } catch (err) {
      setActionMessage(err.message);
    }
  }

  async function handleFeedbackSubmit(e) {
    e.preventDefault();
    setFeedbackStatus("Submitting...");
    try {
      const res = await fetch(`${API_URL}/feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          event_id: feedbackTarget.event_id,
          rating: feedbackForm.rating,
          comment: feedbackForm.comment,
          user_name: user?.name,
          user_email: user?.email
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit review");
      setFeedbackStatus("Thank you! Feedback saved.");
      setTimeout(() => {
        setFeedbackTarget(null);
        setFeedbackForm({ rating: 5, comment: "" });
        setFeedbackStatus("");
      }, 1500);
    } catch (err) {
      setFeedbackStatus(err.message);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="registrations-modal" role="dialog" aria-modal="true">
        <div className="modal-header-row">
          <div>
            <span className="eyebrow">YOUR EVENT PASSES</span>
            <h2>My Registrations</h2>
            <p>View your booked seats, display passes with QR codes, or cancel bookings.</p>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        {actionMessage && (
          <div className="status-notification-banner">
            <AlertCircle size={18} />
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage("")}>×</button>
          </div>
        )}

        {loading ? (
          <div className="loading-spinner-area">Loading your registrations...</div>
        ) : registrations.length === 0 ? (
          <div className="empty-registrations-state">
            <Ticket size={48} className="empty-icon" />
            <h3>No registrations yet</h3>
            <p>You haven't registered for any events. Browse the events list and reserve your seat!</p>
            <button className="primary-button" onClick={onClose}>
              Explore Events
            </button>
          </div>
        ) : (
          <div className="my-registrations-list">
            {registrations.map((reg) => (
              <div key={reg.registration_id} className={`my-reg-card ${reg.status}`}>
                <div className="my-reg-header">
                  <span className="my-reg-tag">{reg.category}</span>
                  <div className="my-reg-badges">
                    {reg.status === "cancelled" ? (
                      <span className="badge-cancelled">Cancelled</span>
                    ) : reg.attended ? (
                      <span className="badge-attended">Attended ✓</span>
                    ) : (
                      <span className="badge-confirmed">Seat Confirmed</span>
                    )}
                  </div>
                </div>

                <div className="my-reg-content">
                  <h3>{reg.event_title}</h3>
                  <div className="my-reg-details">
                    <span>
                      <Calendar size={14} /> {new Date(reg.event_date).toLocaleDateString()}
                    </span>
                    <span>
                      <Clock size={14} /> {String(reg.event_time).slice(0, 5)}
                    </span>
                    <span>
                      <MapPin size={14} /> {reg.venue}
                    </span>
                  </div>
                  <div className="my-reg-ticket-code">
                    Ticket ID: <strong>{reg.ticket_number}</strong>
                  </div>
                </div>

                <div className="my-reg-actions">
                  {reg.status === "confirmed" && (
                    <>
                      <button
                        className="btn-pass"
                        onClick={() =>
                          onShowTicket({
                            ticket_number: reg.ticket_number,
                            registration_id: reg.registration_id,
                            attendee_name: reg.full_name,
                            attendee_email: reg.email,
                            event: {
                              id: reg.event_id,
                              title: reg.event_title,
                              venue: reg.venue,
                              event_date: reg.event_date,
                              event_time: reg.event_time,
                              category: reg.category
                            }
                          })
                        }
                      >
                        <QrCode size={16} /> View Digital Pass
                      </button>

                      <button
                        className="btn-feedback"
                        onClick={() => setFeedbackTarget(reg)}
                        title="Rate & Review Event"
                      >
                        <Star size={16} /> Rate / Feedback
                      </button>

                      <button
                        className="btn-cancel"
                        onClick={() => handleCancel(reg.registration_id)}
                      >
                        <XCircle size={16} /> Cancel Seat
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Feedback Sub-Modal */}
        {feedbackTarget && (
          <div className="feedback-sub-modal-overlay">
            <div className="feedback-sub-modal">
              <div className="sub-modal-header">
                <h3>Share Your Experience</h3>
                <button onClick={() => setFeedbackTarget(null)}>✕</button>
              </div>
              <p className="sub-modal-subtitle">{feedbackTarget.event_title}</p>

              <form onSubmit={handleFeedbackSubmit}>
                <div className="star-rating-select">
                  <label>Rating (1 to 5 Stars):</label>
                  <div className="stars-row">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        className={`star-btn ${star <= feedbackForm.rating ? "active" : ""}`}
                        onClick={() => setFeedbackForm({ ...feedbackForm, rating: star })}
                      >
                        ★
                      </button>
                    ))}
                    <span className="rating-num-label">{feedbackForm.rating} / 5</span>
                  </div>
                </div>

                <div className="form-group">
                  <label>Comments / Review</label>
                  <textarea
                    rows={3}
                    placeholder="What did you learn? How was the speaker and overall arrangement?"
                    value={feedbackForm.comment}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, comment: e.target.value })}
                  ></textarea>
                </div>

                {feedbackStatus && <p className="feedback-status-msg">{feedbackStatus}</p>}

                <div className="sub-modal-buttons">
                  <button type="button" className="secondary-button" onClick={() => setFeedbackTarget(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    Submit Review
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
