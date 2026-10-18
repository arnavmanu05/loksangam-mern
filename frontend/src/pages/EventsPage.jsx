import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLightbox } from '../components/LightboxModal';

export default function EventsPage() {
  const { user, token } = useAuth();
  const { openLightbox } = useLightbox();
  const navigate = useNavigate();
  const location = useLocation();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch('/api/events', { headers });
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [token]);

  // Handle hash anchor scroll (e.g. #event-123)
  useEffect(() => {
    if (location.hash && events.length > 0) {
      const elem = document.querySelector(location.hash);
      if (elem) {
        elem.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.hash, events]);

  const handleLikeEvent = async (eventId) => {
    if (!token) return navigate('/login');
    try {
      const res = await fetch(`/api/events/${eventId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, is_liked: data.liked, likes_count: data.count } : e
        )
      );
    } catch (err) {}
  };

  const handleViewInMap = (ev) => {
    sessionStorage.setItem(
      'mapFocus',
      JSON.stringify({
        lat: ev.place.latitude,
        lng: ev.place.longitude,
        id: ev.place.id,
        name: ev.place.name
      })
    );
    navigate('/');
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-9">
        <div
          className="d-flex justify-content-between align-items-center mb-5 border-bottom pb-4"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
        >
          <div>
            <h2 className="fw-bold text-white m-0">All Events</h2>
            <p className="text-muted small m-0 mt-1">Discover what's happening around you</p>
          </div>
          <Link to="/" className="btn btn-outline-light rounded-pill px-4">
            Back to Map
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-5 text-white">Loading events...</div>
        ) : events.length > 0 ? (
          events.map((event) => (
            <div
              key={event.id}
              id={`event-${event.id}`}
              className="card mb-4 border-0 shadow-sm"
              style={{
                borderRadius: '20px',
                background: 'rgba(22, 22, 30, 0.6)',
                backdropFilter: 'blur(10px)',
                scrollMarginTop: '120px'
              }}
            >
              <div className="card-body p-4">
                <div className="d-flex justify-content-between align-items-start mb-3">
                  <div>
                    <h4 className="card-title text-white fw-bold mb-1">{event.title}</h4>
                    <p className="mb-0 fw-bold" style={{ color: '#11998e' }}>
                      📅{' '}
                      {new Date(event.event_datetime).toLocaleString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </p>
                  </div>
                  <span
                    className="badge text-white px-3 py-2"
                    style={{
                      background: 'rgba(255,81,47,0.2)',
                      border: '1px solid #FF512F',
                      borderRadius: '20px',
                      fontSize: '0.9rem'
                    }}
                  >
                    📍 {event.place?.name}
                  </span>
                </div>

                <p className="small mb-4" style={{ color: '#888' }}>
                  Hosted by{' '}
                  <Link
                    to={`/profile/${event.creator}`}
                    style={{ color: '#DD2476', textDecoration: 'none', fontWeight: 'bold' }}
                  >
                    @{event.creator}
                  </Link>
                </p>

                {event.inner_location && (
                  <p className="small text-white opacity-75 mb-3 bg-dark d-inline-block px-3 py-1 rounded-pill">
                    📌 Specific Spot: {event.inner_location}
                  </p>
                )}

                {event.image && (
                  <div
                    className="elegant-img-container mb-4"
                    style={{ height: '400px', cursor: 'zoom-in' }}
                    onClick={() => openLightbox(event.image)}
                  >
                    <img src={event.image} className="elegant-img-bg" alt="" />
                    <img src={event.image} className="elegant-img-fg" alt="Event Cover" />
                  </div>
                )}

                <p className="card-text fs-5" style={{ lineHeight: 1.6, color: '#d1d1d1' }}>
                  {event.description}
                </p>

                <div
                  className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top"
                  style={{ borderColor: 'rgba(255,255,255,0.05)' }}
                >
                  <button
                    className="btn btn-dark btn-sm rounded-pill px-4 shadow-none"
                    onClick={() => handleLikeEvent(event.id)}
                    style={{ border: '1px solid #333' }}
                  >
                    <span className="me-2">{event.is_liked ? '❤️' : '🤍'}</span>
                    <span className="like-count fw-bold text-white">{event.likes_count}</span>{' '}
                    <span style={{ color: '#888' }}>Likes</span>
                  </button>

                  <button
                    className="btn btn-primary fw-bold shadow-sm btn-sm rounded-pill px-4"
                    onClick={() => handleViewInMap(event)}
                  >
                    📍 View in Map
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5">
            <div className="display-3 mb-3 text-muted">🗓️</div>
            <h4 className="text-white fw-bold">The calendar is empty</h4>
            <p className="text-muted">No events have been scheduled yet on LokSangam.</p>
          </div>
        )}
      </div>
    </div>
  );
}
