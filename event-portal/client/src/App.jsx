import React, { useEffect, useState, useMemo } from "react";
import { useAuth } from "./context/AuthContext";
import TicketModal from "./components/TicketModal";
import AuthModal from "./components/AuthModal";
import AdminDashboardModal from "./components/AdminDashboardModal";
import MyRegistrationsModal from "./components/MyRegistrationsModal";
import EventReviewsModal from "./components/EventReviewsModal";
import CalendarViewModal from "./components/CalendarViewModal";
import "./App.css";

import {
  Search,
  SlidersHorizontal,
  Calendar,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  User,
  LogIn,
  LogOut,
  Ticket,
  CalendarDays,
  Star,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  AlertCircle
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

function App() {
  const { user, token, logout, isAdmin } = useAuth();

  // Events list state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search, Filter & Sort state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("date_asc");

  // Registration Modal state
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    contact_number: ""
  });
  const [formMessage, setFormMessage] = useState("");
  const [formMessageType, setFormMessageType] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Success Ticket Modal
  const [ticketData, setTicketData] = useState(null);

  // Modals visibility state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [myRegsModalOpen, setMyRegsModalOpen] = useState(false);
  const [reviewsModalEvent, setReviewsModalEvent] = useState(null);
  const [calendarModalOpen, setCalendarModalOpen] = useState(false);

  // Available categories
  const categories = ["All", "Technology", "Design", "Business", "Cultural", "Science"];

  useEffect(() => {
    fetchEvents();
  }, [searchQuery, selectedCategory, sortBy]);

  // Pre-fill user details if logged in
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        full_name: user.name || "",
        email: user.email || ""
      }));
    }
  }, [user]);

  async function fetchEvents() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append("search", searchQuery);
      if (selectedCategory && selectedCategory !== "All") params.append("category", selectedCategory);
      if (sortBy) params.append("sort", sortBy);

      const response = await fetch(`${API_URL}/events?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Unable to load events.");
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function openRegistration(eventItem) {
    setSelectedEvent(eventItem);
    setFormMessage("");
    setFormMessageType("");
    setForm({
      full_name: user?.name || "",
      email: user?.email || "",
      contact_number: ""
    });
  }

  function closeRegistration() {
    setSelectedEvent(null);
    setFormMessage("");
    setFormMessageType("");
  }

  async function handleRegister(e) {
    e.preventDefault();
    setFormMessage("");
    setFormMessageType("");
    setSubmitting(true);

    try {
      const headers = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const response = await fetch(`${API_URL}/registrations`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ...form,
          event_id: selectedEvent.id
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Registration failed.");
      }

      // Success: close registration modal and open Digital Pass modal
      closeRegistration();
      setTicketData({
        registration_id: data.registration_id,
        ticket_number: data.ticket_number,
        attendee_name: form.full_name,
        attendee_email: form.email,
        event: data.event || selectedEvent
      });

      // Refresh events to show updated seats_left
      fetchEvents();
    } catch (error) {
      setFormMessage(error.message || "Could not complete registration.");
      setFormMessageType("error");
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateValue) {
    return new Date(dateValue).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    });
  }

  return (
    <div className="app">
      {/* Navigation Bar */}
      <header className="navbar">
        <a href="#home" className="brand">
          <span className="brand-icon">✦</span>
          <span className="brand-text">Eventora</span>
          <span className="brand-badge">PRO</span>
        </a>

        <nav className="nav-links">
          <a href="#home">Home</a>
          <a href="#events">Explore Workshops</a>
          <button className="nav-link-btn" onClick={() => setCalendarModalOpen(true)}>
            <CalendarDays size={16} /> Calendar
          </button>
        </nav>

        <div className="nav-actions">
          {user ? (
            <div className="user-nav-dropdown">
              {isAdmin && (
                <button
                  className="admin-dashboard-btn"
                  onClick={() => setAdminModalOpen(true)}
                  title="Open Admin Dashboard"
                >
                  <ShieldCheck size={16} /> Admin Panel
                </button>
              )}

              <button
                className="my-regs-btn"
                onClick={() => setMyRegsModalOpen(true)}
                title="View My Booked Passes"
              >
                <Ticket size={16} /> My Passes
              </button>

              <div className="user-pill">
                <span className="user-avatar">{user.name.charAt(0).toUpperCase()}</span>
                <span className="user-name">{user.name.split(" ")[0]}</span>
              </div>

              <button className="logout-btn" onClick={logout} title="Sign Out">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button className="nav-button" onClick={() => setAuthModalOpen(true)}>
              <LogIn size={16} /> Sign In / Admin
            </button>
          )}
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">✦ NEXT-GEN WORKSHOP & EVENT PLATFORM</span>

            <h1>
              Elevate your craft.
              <br />
              <span>Learn from pioneers.</span>
            </h1>

            <p>
              Discover hands-on university workshops, secure your verified digital entry pass with QR code,
              and experience seamless capacity-governed seat reservations.
            </p>

            <div className="hero-cta-group">
              <a className="primary-button" href="#events">
                Explore Available Events <span>→</span>
              </a>
              <button className="secondary-button" onClick={() => setCalendarModalOpen(true)}>
                <CalendarDays size={18} /> Schedule Calendar
              </button>
            </div>

            <div className="hero-stats">
              <div>
                <strong>{events.length}</strong>
                <span>Active Events</span>
              </div>
              <div>
                <strong>100%</strong>
                <span>Instant QR Passes</span>
              </div>
              <div>
                <strong>Zero</strong>
                <span>Overbooking Guaranteed</span>
              </div>
            </div>
          </div>

          <div className="hero-art">
            <div className="art-circle circle-one"></div>
            <div className="art-circle circle-two"></div>

            <div className="floating-card">
              <span className="floating-icon">✦</span>
              <div>
                <strong>Live Capacity Tracking</strong>
                <p>Real-time seat counter prevents full bookings.</p>
              </div>
            </div>

            <div className="floating-card card-bottom">
              <span className="floating-icon">🛡️</span>
              <div>
                <strong>Role-Based Access</strong>
                <p>Admin attendance check-in & CSV export.</p>
              </div>
            </div>

            <div className="art-note note-top">VERIFIED ENTRY ✦</div>
            <div className="art-note note-bottom">QR CODE PASS ↗</div>
          </div>
        </section>

        {/* Search, Filter & Events Showcase */}
        <section className="events-section" id="events">
          <div className="section-heading">
            <div>
              <span className="eyebrow">BROWSE & REGISTER</span>
              <h2>Explore Events & Workshops</h2>
              <p>Filter by domain, check live seat availability, and read participant feedback.</p>
            </div>

            <div className="events-header-meta">
              <span className="event-count-badge">
                <strong>{events.length}</strong> workshops found
              </span>
            </div>
          </div>

          {/* Interactive Filters Bar */}
          <div className="filter-controls-container">
            {/* Search Input */}
            <div className="search-bar-wrap">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="Search by topic, speaker, or auditorium..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search-btn" onClick={() => setSearchQuery("")}>
                  ×
                </button>
              )}
            </div>

            {/* Category Chips */}
            <div className="category-chips-row">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`category-chip ${selectedCategory === cat ? "active" : ""}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Sort Selector */}
            <div className="sort-dropdown-wrap">
              <SlidersHorizontal size={16} />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="date_asc">Date: Upcoming First</option>
                <option value="date_desc">Date: Latest First</option>
                <option value="seats_high">Seats: Most Available</option>
                <option value="seats_low">Seats: Filling Fast</option>
                <option value="rating">Rating: Highest Rated</option>
              </select>
            </div>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="status-message">
              <RefreshCw size={24} className="spin-icon" />
              <span>Fetching available workshop sessions...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="empty-state">
              <span>✦</span>
              <h3>No matching events found</h3>
              <p>Try adjusting your search keywords or category filters.</p>
              <button
                className="secondary-button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSortBy("date_asc");
                }}
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="events-grid">
              {events.map((item) => {
                const isFull = item.seats_left === 0;
                const isAlmostFull = item.seats_left > 0 && item.seats_left <= 5;
                const isCompleted = item.status === "Completed";

                return (
                  <article className={`event-card ${isFull ? "card-full" : ""}`} key={item.id}>
                    {/* Event Card Image */}
                    <div className="event-image">
                      <img
                        src={
                          item.image_url ||
                          "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80"
                        }
                        alt={item.title}
                        loading="lazy"
                      />
                      <div className="image-overlay"></div>
                      <span className="category-label">{item.category}</span>

                      {/* Seat Status Badge */}
                      <div className="seat-badge-container">
                        {isCompleted ? (
                          <span className="badge-status-completed">Completed</span>
                        ) : isFull ? (
                          <span className="badge-status-full">Sold Out / Full</span>
                        ) : isAlmostFull ? (
                          <span className="badge-status-warning">Only {item.seats_left} left!</span>
                        ) : (
                          <span className="badge-status-available">{item.seats_left} seats open</span>
                        )}
                      </div>
                    </div>

                    {/* Event Content */}
                    <div className="event-info">
                      <div className="event-meta-top">
                        <div className="event-date">
                          <Calendar size={14} />
                          <span>{formatDate(item.event_date)}</span>
                          {" · "}
                          <Clock size={14} />
                          <span>{String(item.event_time).slice(0, 5)}</span>
                        </div>

                        {/* Star Rating Badge */}
                        {item.avg_rating > 0 && (
                          <button
                            className="event-star-pill"
                            onClick={() => setReviewsModalEvent(item)}
                            title="View reviews"
                          >
                            <Star size={13} fill="#f59e0b" color="#f59e0b" />
                            <span>{item.avg_rating}</span>
                            <span className="star-count">({item.total_reviews})</span>
                          </button>
                        )}
                      </div>

                      <h3>{item.title}</h3>

                      {item.description && <p className="event-desc">{item.description}</p>}

                      <p className="venue">
                        <MapPin size={15} /> <span>{item.venue}</span>
                      </p>

                      {/* Capacity Progress Bar */}
                      <div className="capacity-bar-area">
                        <div className="capacity-labels">
                          <span>
                            Booked: <strong>{item.registered_count}</strong> / {item.capacity}
                          </span>
                          <span className="seats-remaining-note">
                            {isFull ? "No seats remaining" : `${item.seats_left} available`}
                          </span>
                        </div>
                        <div className="capacity-track">
                          <div
                            className={`capacity-fill ${isFull ? "fill-full" : isAlmostFull ? "fill-warning" : ""}`}
                            style={{
                              width: `${Math.min(
                                ((item.capacity - item.seats_left) / item.capacity) * 100,
                                100
                              )}%`
                            }}
                          ></div>
                        </div>
                      </div>

                      {/* Event Card Footer */}
                      <div className="event-footer">
                        {item.total_reviews > 0 && (
                          <button
                            className="reviews-link-btn"
                            onClick={() => setReviewsModalEvent(item)}
                          >
                            Read Reviews ({item.total_reviews})
                          </button>
                        )}

                        <button
                          className={`btn-register-action ${isFull || isCompleted ? "disabled" : ""}`}
                          disabled={isFull || isCompleted}
                          onClick={() => openRegistration(item)}
                        >
                          {isCompleted ? "Session Ended" : isFull ? "Capacity Full" : "Reserve Seat →"}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* About Section */}
        <section className="about-section" id="about">
          <span className="eyebrow">ENGINEERED FOR EXCELLENCE</span>
          <h2>Built for Colleges, Seminars & Workshops.</h2>
          <p>
            Eventora combines production-grade MySQL capacity locks, verifiable QR passes, and role-based
            access control into an intuitive full-stack experience.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer>
        <div className="footer-content">
          <a href="#home" className="brand">
            <span className="brand-icon">✦</span>
            Eventora
          </a>
          <p>Full-Stack MCA Project • React, Node.js, Express & MySQL</p>
          <div className="footer-meta">
            <span>Live Demonstration Ready</span>
          </div>
        </div>
      </footer>

      {/* Registration Modal */}
      {selectedEvent && (
        <div
          className="modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeRegistration();
          }}
        >
          <div className="registration-modal" role="dialog" aria-modal="true">
            <button className="close-button" onClick={closeRegistration} type="button">
              ✕
            </button>

            <span className="eyebrow">INSTANT PASS GENERATION</span>
            <h2 id="registration-title">Confirm Your Seat</h2>

            <div className="selected-event-brief">
              <strong>{selectedEvent.title}</strong>
              <div className="brief-details">
                <span>
                  <Calendar size={14} /> {formatDate(selectedEvent.event_date)}
                </span>
                <span>
                  <MapPin size={14} /> {selectedEvent.venue}
                </span>
                <span className="brief-seats-left">
                  {selectedEvent.seats_left} seats left out of {selectedEvent.capacity}
                </span>
              </div>
            </div>

            {formMessage && (
              <div className={`form-message ${formMessageType}`}>
                <AlertCircle size={18} />
                <span>{formMessage}</span>
              </div>
            )}

            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  value={form.full_name}
                  onChange={handleFormChange}
                  placeholder="e.g. Rahul Sharma"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFormChange}
                  placeholder="rahul@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="contact_number">Mobile / Contact Number</label>
                <input
                  id="contact_number"
                  name="contact_number"
                  type="tel"
                  value={form.contact_number}
                  onChange={handleFormChange}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>

              <button className="primary-button submit-button" type="submit" disabled={submitting}>
                {submitting ? "Reserving Seat..." : "Generate Digital Pass →"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Pass Modal */}
      {ticketData && <TicketModal ticketData={ticketData} onClose={() => setTicketData(null)} />}

      {/* Auth Modal (Login / Register) */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />

      {/* Admin Dashboard Modal */}
      <AdminDashboardModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        onRefreshEvents={fetchEvents}
      />

      {/* My Registrations Modal */}
      <MyRegistrationsModal
        isOpen={myRegsModalOpen}
        onClose={() => setMyRegsModalOpen(false)}
        onShowTicket={(passData) => setTicketData(passData)}
      />

      {/* Event Reviews Modal */}
      <EventReviewsModal
        isOpen={Boolean(reviewsModalEvent)}
        onClose={() => setReviewsModalEvent(null)}
        event={reviewsModalEvent}
      />

      {/* Calendar View Modal */}
      <CalendarViewModal
        isOpen={calendarModalOpen}
        onClose={() => setCalendarModalOpen(false)}
        events={events}
        onSelectEvent={(ev) => openRegistration(ev)}
      />
    </div>
  );
}

export default App;
