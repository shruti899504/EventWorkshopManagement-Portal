import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  CheckCircle,
  Plus,
  Trash2,
  Edit3,
  Download,
  Filter,
  RefreshCw,
  Search,
  Check,
  X,
  Building,
  BarChart3,
  ShieldCheck
} from "lucide-react";

export default function AdminDashboardModal({ isOpen, onClose, onRefreshEvents }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState("overview"); // 'overview', 'events', 'registrations'
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState([]);
  const [selectedEventFilter, setSelectedEventFilter] = useState("");
  const [regSearch, setRegSearch] = useState("");

  // Event Add/Edit Modal state
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    category: "Technology",
    event_date: "",
    event_time: "10:00:00",
    venue: "",
    capacity: 50,
    image_url: "",
    status: "Upcoming"
  });
  const [formOpen, setFormOpen] = useState(false);
  const [formMsg, setFormMsg] = useState("");

  const API_URL = "http://localhost:5000/api";

  useEffect(() => {
    if (isOpen && token) {
      loadDashboardData();
    }
  }, [isOpen, token]);

  async function loadDashboardData() {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not load metrics");
      const data = await res.json();
      setMetrics(data);

      // Load all registrations
      fetchRegistrations();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRegistrations(eventId = "") {
    try {
      const url = eventId ? `${API_URL}/registrations?event_id=${eventId}` : `${API_URL}/registrations`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (err) {
      console.error(err);
    }
  }

  function handleEventFilterChange(e) {
    const val = e.target.value;
    setSelectedEventFilter(val);
    fetchRegistrations(val);
  }

  async function toggleAttendance(regId, currentAttended) {
    try {
      const res = await fetch(`${API_URL}/registrations/${regId}/attendance`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ attended: !currentAttended })
      });
      if (res.ok) {
        setRegistrations((prev) =>
          prev.map((r) => (r.id === regId ? { ...r, attended: !currentAttended ? 1 : 0 } : r))
        );
      }
    } catch (e) {
      console.error(e);
    }
  }

  function openCreateForm() {
    setEditingEvent(null);
    setEventForm({
      title: "",
      description: "",
      category: "Technology",
      event_date: "",
      event_time: "10:00:00",
      venue: "",
      capacity: 50,
      image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80",
      status: "Upcoming"
    });
    setFormMsg("");
    setFormOpen(true);
  }

  function openEditForm(event) {
    setEditingEvent(event);
    setEventForm({
      title: event.title,
      description: event.description || "",
      category: event.category,
      event_date: event.event_date ? event.event_date.split("T")[0] : "",
      event_time: String(event.event_time).slice(0, 8),
      venue: event.venue,
      capacity: event.capacity,
      image_url: event.image_url || "",
      status: event.status || "Upcoming"
    });
    setFormMsg("");
    setFormOpen(true);
  }

  async function handleEventFormSubmit(e) {
    e.preventDefault();
    setFormMsg("Saving event...");

    try {
      const method = editingEvent ? "PUT" : "POST";
      const url = editingEvent ? `${API_URL}/events/${editingEvent.id}` : `${API_URL}/events`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(eventForm)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Operation failed");

      setFormMsg("Success!");
      setFormOpen(false);
      loadDashboardData();
      if (onRefreshEvents) onRefreshEvents();
    } catch (err) {
      setFormMsg(err.message);
    }
  }

  async function handleDeleteEvent(id) {
    if (!window.confirm("Are you sure you want to delete this event? All associated registrations will also be removed.")) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/events/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        loadDashboardData();
        if (onRefreshEvents) onRefreshEvents();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function downloadCsv() {
    const url = selectedEventFilter
      ? `${API_URL}/admin/export/registrations?event_id=${selectedEventFilter}`
      : `${API_URL}/admin/export/registrations`;

    window.open(url, "_blank");
  }

  if (!isOpen) return null;

  const filteredRegistrations = registrations.filter((r) => {
    if (!regSearch) return true;
    const term = regSearch.toLowerCase();
    return (
      r.full_name?.toLowerCase().includes(term) ||
      r.email?.toLowerCase().includes(term) ||
      r.ticket_number?.toLowerCase().includes(term) ||
      r.event_title?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="modal-backdrop admin-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-dashboard-card" role="dialog" aria-modal="true">
        {/* Top Header */}
        <div className="admin-header">
          <div className="admin-header-title">
            <span className="badge-admin">
              <ShieldCheck size={14} /> ADMIN CONSOLE
            </span>
            <h2>Eventora Management Dashboard</h2>
            <p>Monitor registrations, control event capacity, export attendance reports & configure sessions.</p>
          </div>

          <div className="admin-header-actions">
            <button className="secondary-button" onClick={loadDashboardData} title="Refresh metrics">
              <RefreshCw size={16} /> Refresh
            </button>
            <button className="close-button" onClick={onClose} aria-label="Close dashboard">
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <BarChart3 size={16} /> Overview & Metrics
          </button>
          <button
            className={`admin-tab ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            <CalendarDays size={16} /> Manage Events ({metrics?.eventBreakdown?.length || 0})
          </button>
          <button
            className={`admin-tab ${activeTab === "registrations" ? "active" : ""}`}
            onClick={() => setActiveTab("registrations")}
          >
            <Users size={16} /> Attendee Registrations ({registrations.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="admin-body">
          {loading ? (
            <div className="admin-loading">Loading administrative analytics...</div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && metrics && (
                <div className="admin-overview-view">
                  {/* KPI Cards */}
                  <div className="kpi-grid">
                    <div className="kpi-card">
                      <div className="kpi-icon-box bg-purple">
                        <CalendarDays size={24} />
                      </div>
                      <div className="kpi-text">
                        <span className="kpi-label">TOTAL EVENTS</span>
                        <strong className="kpi-value">{metrics.totals.total_events}</strong>
                        <span className="kpi-sub">Across all categories</span>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-icon-box bg-blue">
                        <Users size={24} />
                      </div>
                      <div className="kpi-text">
                        <span className="kpi-label">CONFIRMED SEATS</span>
                        <strong className="kpi-value">{metrics.totals.total_registrations}</strong>
                        <span className="kpi-sub">Active attendee bookings</span>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-icon-box bg-emerald">
                        <CheckCircle size={24} />
                      </div>
                      <div className="kpi-text">
                        <span className="kpi-label">TOTAL CAPACITY</span>
                        <strong className="kpi-value">{metrics.totals.total_capacity}</strong>
                        <span className="kpi-sub">Max seats allocated</span>
                      </div>
                    </div>

                    <div className="kpi-card">
                      <div className="kpi-icon-box bg-amber">
                        <BarChart3 size={24} />
                      </div>
                      <div className="kpi-text">
                        <span className="kpi-label">OVERALL OCCUPANCY</span>
                        <strong className="kpi-value">
                          {metrics.totals.total_capacity > 0
                            ? Math.round((metrics.totals.total_registrations / metrics.totals.total_capacity) * 100)
                            : 0}
                          %
                        </strong>
                        <span className="kpi-sub">Average seat fill rate</span>
                      </div>
                    </div>
                  </div>

                  {/* Capacity Utilization Table */}
                  <div className="admin-section-box">
                    <div className="section-box-header">
                      <h3>Live Event Capacity Breakdown</h3>
                      <button className="primary-button-sm" onClick={openCreateForm}>
                        <Plus size={14} /> Add Event
                      </button>
                    </div>

                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Event Title</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Capacity</th>
                            <th>Registered</th>
                            <th>Seats Remaining</th>
                            <th>Occupancy Bar</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {metrics.eventBreakdown.map((ev) => (
                            <tr key={ev.id}>
                              <td className="bold-cell">{ev.title}</td>
                              <td>
                                <span className="category-chip">{ev.category}</span>
                              </td>
                              <td>{new Date(ev.event_date).toLocaleDateString()}</td>
                              <td>{ev.capacity}</td>
                              <td>
                                <strong>{ev.confirmed_count}</strong>
                              </td>
                              <td>
                                <span
                                  className={`seats-indicator ${ev.seats_left === 0 ? "full" : ev.seats_left <= 5 ? "warning" : "ok"}`}
                                >
                                  {ev.seats_left === 0 ? "FULL" : `${ev.seats_left} seats`}
                                </span>
                              </td>
                              <td style={{ minWidth: "130px" }}>
                                <div className="occupancy-bar-track">
                                  <div
                                    className={`occupancy-bar-fill ${ev.occupancy_percent >= 100 ? "full" : ""}`}
                                    style={{ width: `${Math.min(ev.occupancy_percent, 100)}%` }}
                                  ></div>
                                </div>
                                <span className="occupancy-label">{ev.occupancy_percent}%</span>
                              </td>
                              <td>
                                <span className={`status-pill ${ev.status.toLowerCase()}`}>{ev.status}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: MANAGE EVENTS */}
              {activeTab === "events" && (
                <div className="admin-events-view">
                  <div className="section-toolbar">
                    <button className="primary-button" onClick={openCreateForm}>
                      <Plus size={16} /> Create New Event
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>Event Name</th>
                          <th>Category</th>
                          <th>Date & Time</th>
                          <th>Venue</th>
                          <th>Capacity</th>
                          <th>Booked</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics?.eventBreakdown?.map((ev) => (
                          <tr key={ev.id}>
                            <td>#{ev.id}</td>
                            <td className="bold-cell">{ev.title}</td>
                            <td>
                              <span className="category-chip">{ev.category}</span>
                            </td>
                            <td>
                              {new Date(ev.event_date).toLocaleDateString()} {String(ev.event_time).slice(0, 5)}
                            </td>
                            <td>{ev.venue}</td>
                            <td>{ev.capacity}</td>
                            <td>
                              {ev.confirmed_count} / {ev.capacity}
                            </td>
                            <td>
                              <div className="action-buttons-cell">
                                <button
                                  className="btn-edit"
                                  onClick={() => openEditForm(ev)}
                                  title="Edit Event"
                                >
                                  <Edit3 size={15} />
                                </button>
                                <button
                                  className="btn-delete"
                                  onClick={() => handleDeleteEvent(ev.id)}
                                  title="Delete Event"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 3: REGISTRATIONS & ATTENDANCE */}
              {activeTab === "registrations" && (
                <div className="admin-regs-view">
                  <div className="regs-toolbar">
                    <div className="search-input-box">
                      <Search size={16} />
                      <input
                        type="text"
                        placeholder="Search by attendee name, email or ticket ID..."
                        value={regSearch}
                        onChange={(e) => setRegSearch(e.target.value)}
                      />
                    </div>

                    <div className="filter-select-box">
                      <Filter size={16} />
                      <select value={selectedEventFilter} onChange={handleEventFilterChange}>
                        <option value="">All Events</option>
                        {metrics?.eventBreakdown?.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button className="secondary-button" onClick={downloadCsv} title="Download Excel/CSV Report">
                      <Download size={16} /> Export CSV
                    </button>
                  </div>

                  <div className="admin-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Ticket ID</th>
                          <th>Attendee</th>
                          <th>Email & Contact</th>
                          <th>Event</th>
                          <th>Booking Date</th>
                          <th>Status</th>
                          <th>Attendance Check</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrations.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="empty-table-msg">
                              No registrations match your search.
                            </td>
                          </tr>
                        ) : (
                          filteredRegistrations.map((reg) => (
                            <tr key={reg.id}>
                              <td className="mono-cell">
                                <strong>{reg.ticket_number}</strong>
                              </td>
                              <td className="bold-cell">{reg.full_name}</td>
                              <td>
                                <div>{reg.email}</div>
                                <span className="sub-contact">{reg.contact_number}</span>
                              </td>
                              <td>{reg.event_title}</td>
                              <td>{new Date(reg.registered_at).toLocaleDateString()}</td>
                              <td>
                                <span
                                  className={`reg-status-badge ${reg.status === "confirmed" ? "confirmed" : "cancelled"}`}
                                >
                                  {reg.status}
                                </span>
                              </td>
                              <td>
                                <button
                                  className={`btn-attendance-toggle ${reg.attended ? "attended" : "absent"}`}
                                  onClick={() => toggleAttendance(reg.id, reg.attended)}
                                >
                                  {reg.attended ? (
                                    <>
                                      <Check size={14} /> Attended
                                    </>
                                  ) : (
                                    <>Mark Present</>
                                  )}
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal for Creating / Editing Event */}
        {formOpen && (
          <div className="sub-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setFormOpen(false)}>
            <div className="event-form-modal">
              <div className="sub-modal-header">
                <h3>{editingEvent ? "Edit Workshop / Event" : "Create New Event"}</h3>
                <button onClick={() => setFormOpen(false)}>✕</button>
              </div>

              <form onSubmit={handleEventFormSubmit} className="admin-event-form">
                <div className="form-group">
                  <label>Event Title</label>
                  <input
                    type="text"
                    required
                    value={eventForm.title}
                    onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                    placeholder="e.g. Next.js 15 Full Stack Workshop"
                  />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={eventForm.category}
                      onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                    >
                      <option value="Technology">Technology</option>
                      <option value="Design">Design</option>
                      <option value="Business">Business</option>
                      <option value="Cultural">Cultural</option>
                      <option value="Science">Science</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={eventForm.status}
                      onChange={(e) => setEventForm({ ...eventForm, status: e.target.value })}
                    >
                      <option value="Upcoming">Upcoming</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={eventForm.description}
                    onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                    placeholder="Briefly describe what attendees will learn..."
                  />
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label>Event Date</label>
                    <input
                      type="date"
                      required
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Time</label>
                    <input
                      type="time"
                      required
                      value={eventForm.event_time}
                      onChange={(e) => setEventForm({ ...eventForm, event_time: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Seat Capacity</label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={eventForm.capacity}
                      onChange={(e) => setEventForm({ ...eventForm, capacity: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Venue / Location</label>
                  <input
                    type="text"
                    required
                    value={eventForm.venue}
                    onChange={(e) => setEventForm({ ...eventForm, venue: e.target.value })}
                    placeholder="e.g. Lab 4, Computer Science Block"
                  />
                </div>

                <div className="form-group">
                  <label>Banner Image URL</label>
                  <input
                    type="url"
                    value={eventForm.image_url}
                    onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                {formMsg && <p className="form-status-note">{formMsg}</p>}

                <div className="form-actions-row">
                  <button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="primary-button">
                    {editingEvent ? "Save Changes" : "Create Event"}
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
