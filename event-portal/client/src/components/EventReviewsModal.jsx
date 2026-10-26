import React, { useState } from "react";
import { Star, MessageSquare } from "lucide-react";

export default function EventReviewsModal({ isOpen, onClose, event, onOpenFeedbackSubmit }) {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ avg_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);

  const API_URL = "http://localhost:5000/api";

  React.useEffect(() => {
    if (isOpen && event) {
      setLoading(true);
      fetch(`${API_URL}/feedback/event/${event.id}`)
        .then((res) => res.json())
        .then((data) => {
          setReviews(data.reviews || []);
          setStats(data.stats || { avg_rating: 0, total_reviews: 0 });
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isOpen, event]);

  if (!isOpen || !event) return null;

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="reviews-modal" role="dialog" aria-modal="true">
        <div className="modal-header-row">
          <div>
            <span className="eyebrow">ATTENDEE EXPERIENCES</span>
            <h2>Reviews & Ratings</h2>
            <p className="sub-event-name">{event.title}</p>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Aggregate Score Card */}
        <div className="reviews-aggregate-card">
          <div className="big-rating-number">
            <span>{stats.avg_rating > 0 ? stats.avg_rating : "N/A"}</span>
            <div className="stars-row-gold">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  fill={s <= Math.round(stats.avg_rating) ? "#f59e0b" : "none"}
                  color="#f59e0b"
                />
              ))}
            </div>
          </div>
          <div className="aggregate-meta">
            <strong>{stats.total_reviews} verified attendee reviews</strong>
            <p>Feedback submitted by participants who completed this workshop or event.</p>
          </div>
        </div>

        {/* Reviews List */}
        <div className="reviews-list-container">
          {loading ? (
            <div className="loading-spinner-area">Loading feedback...</div>
          ) : reviews.length === 0 ? (
            <div className="empty-reviews-box">
              <MessageSquare size={36} className="empty-icon" />
              <p>No written reviews yet for this event.</p>
            </div>
          ) : (
            reviews.map((rev) => (
              <div key={rev.id} className="review-card">
                <div className="review-top">
                  <div className="reviewer-name-badge">
                    <span className="avatar-circle">{rev.user_name.charAt(0).toUpperCase()}</span>
                    <strong>{rev.user_name}</strong>
                  </div>
                  <div className="stars-row-gold mini">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        fill={s <= rev.rating ? "#f59e0b" : "none"}
                        color="#f59e0b"
                      />
                    ))}
                  </div>
                </div>
                {rev.comment && <p className="review-text">"{rev.comment}"</p>}
                <span className="review-date">{new Date(rev.created_at).toLocaleDateString()}</span>
              </div>
            ))
          )}
        </div>

        <div className="modal-footer-action">
          <button className="secondary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
