import React, { useState } from "react";
import { Calendar, Clock, MapPin, ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarViewModal({ isOpen, onClose, events, onSelectEvent }) {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function prevMonth() {
    setCurrentDate(new Date(year, month - 1, 1));
  }

  function nextMonth() {
    setCurrentDate(new Date(year, month + 1, 1));
  }

  // Group events by day in current displayed month
  const eventsByDay = {};
  events.forEach((ev) => {
    if (!ev.event_date) return;
    const d = new Date(ev.event_date);
    if (d.getUTCFullYear() === year && d.getUTCMonth() === month) {
      const dayNum = d.getUTCDate();
      if (!eventsByDay[dayNum]) eventsByDay[dayNum] = [];
      eventsByDay[dayNum].push(ev);
    }
  });

  const calendarCells = [];
  // Blank days before the 1st
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(<div key={`blank-${i}`} className="cal-cell empty"></div>);
  }

  // Actual month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayEvents = eventsByDay[day] || [];
    calendarCells.push(
      <div key={`day-${day}`} className={`cal-cell ${dayEvents.length > 0 ? "has-events" : ""}`}>
        <span className="cal-day-num">{day}</span>
        <div className="cal-events-list">
          {dayEvents.map((ev) => (
            <div
              key={ev.id}
              className="cal-event-chip"
              onClick={() => {
                onClose();
                onSelectEvent(ev);
              }}
              title={`${ev.title} (${ev.seats_left} seats left)`}
            >
              <span className="cal-dot"></span>
              <span className="cal-ev-title">{ev.title}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="calendar-modal" role="dialog" aria-modal="true">
        <div className="modal-header-row">
          <div>
            <span className="eyebrow">SCHEDULE PLANNER</span>
            <h2>Events Calendar</h2>
            <p>Visual overview of upcoming workshops and sessions scheduled across the semester.</p>
          </div>
          <button className="close-button" onClick={onClose}>✕</button>
        </div>

        {/* Month Navigation */}
        <div className="calendar-nav-bar">
          <button className="cal-nav-btn" onClick={prevMonth}>
            <ChevronLeft size={20} />
          </button>
          <h3>
            {monthNames[month]} {year}
          </h3>
          <button className="cal-nav-btn" onClick={nextMonth}>
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="calendar-grid">
          <div className="cal-weekday">Sun</div>
          <div className="cal-weekday">Mon</div>
          <div className="cal-weekday">Tue</div>
          <div className="cal-weekday">Wed</div>
          <div className="cal-weekday">Thu</div>
          <div className="cal-weekday">Fri</div>
          <div className="cal-weekday">Sat</div>
          {calendarCells}
        </div>

        <div className="calendar-footer-note">
          <span>Click any event chip on a date to open registration and details.</span>
          <button className="secondary-button" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
