import React, { useEffect, useRef } from "react";
import QRCode from "qrcode";
import confetti from "canvas-confetti";
import { Download, CheckCircle2, Calendar, MapPin, Clock, X, Sparkles, User, Mail, Hash } from "lucide-react";

export default function TicketModal({ ticketData, onClose }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // Fire celebratory confetti on ticket creation
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // safe fallback
    }

    // Generate dynamic QR Code
    if (canvasRef.current && ticketData) {
      const qrPayload = JSON.stringify({
        portal: "Eventora",
        ticket_number: ticketData.ticket_number || `EVT-${ticketData.event.id}-${ticketData.registration_id}`,
        event: ticketData.event.title,
        attendee: ticketData.attendee_name,
        email: ticketData.attendee_email,
        timestamp: new Date().toISOString()
      });

      QRCode.toCanvas(canvasRef.current, qrPayload, {
        width: 170,
        margin: 1,
        color: {
          dark: "#0f172a",
          light: "#ffffff"
        }
      });
    }
  }, [ticketData]);

  if (!ticketData) return null;

  function handlePrint() {
    window.print();
  }

  const { event, registration_id, ticket_number, attendee_name, attendee_email } = ticketData;

  function formatDate(d) {
    return new Date(d).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  return (
    <div className="modal-backdrop print-modal-backdrop" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="ticket-modal-card print-ticket-area" role="dialog" aria-modal="true">
        <button className="close-button no-print" onClick={onClose} aria-label="Close ticket">
          <X size={20} />
        </button>

        <div className="ticket-success-header no-print">
          <div className="success-icon-badge">
            <CheckCircle2 size={32} />
          </div>
          <h3>Registration Confirmed!</h3>
          <p>Your pass is issued. Keep this digital ticket handy for entry check-in.</p>
        </div>

        {/* Printable Ticket Pass Body */}
        <div className="digital-ticket">
          <div className="ticket-header-strip">
            <div className="ticket-brand">
              <span className="brand-dot">✦</span>
              <strong>EVENTORA PASS</strong>
            </div>
            <span className="ticket-status-pill">OFFICIAL PASS</span>
          </div>

          <div className="ticket-main-body">
            <div className="ticket-event-info">
              <span className="ticket-category-tag">{event.category || "Workshop"}</span>
              <h2 className="ticket-title">{event.title}</h2>

              <div className="ticket-meta-grid">
                <div className="ticket-meta-item">
                  <Calendar size={16} />
                  <span>{formatDate(event.event_date)}</span>
                </div>
                <div className="ticket-meta-item">
                  <Clock size={16} />
                  <span>{String(event.event_time).slice(0, 5)}</span>
                </div>
                <div className="ticket-meta-item full-width">
                  <MapPin size={16} />
                  <span>{event.venue}</span>
                </div>
              </div>

              <div className="ticket-divider-line"></div>

              <div className="ticket-attendee-details">
                <div className="attendee-field">
                  <span className="label">ATTENDEE</span>
                  <strong className="value">{attendee_name}</strong>
                </div>
                <div className="attendee-field">
                  <span className="label">EMAIL</span>
                  <span className="value">{attendee_email}</span>
                </div>
                <div className="attendee-field">
                  <span className="label">TICKET ID</span>
                  <span className="value mono">{ticket_number || `EVT-${event.id}-${registration_id}`}</span>
                </div>
              </div>
            </div>

            <div className="ticket-qr-section">
              <div className="qr-wrapper">
                <canvas ref={canvasRef}></canvas>
              </div>
              <span className="qr-instruction">Scan at Venue Gate</span>
            </div>
          </div>

          <div className="ticket-stub-footer">
            <span>Powered by Eventora • MCA Project Demonstration</span>
            <span>Non-transferable</span>
          </div>
        </div>

        {/* Modal Action Controls */}
        <div className="ticket-actions no-print">
          <button className="primary-button" onClick={handlePrint}>
            <Download size={18} /> Print / Save Ticket (PDF)
          </button>
          <button className="secondary-button" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
