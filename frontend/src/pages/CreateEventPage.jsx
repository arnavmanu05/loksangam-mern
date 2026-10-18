import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreateEventPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialPlaceId = queryParams.get('place_id') || '';

  const [places, setPlaces] = useState([]);
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDatetime, setEventDatetime] = useState('');
  const [innerLocation, setInnerLocation] = useState('');
  const [image, setImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetch('/api/places')
      .then((res) => res.json())
      .then((data) => setPlaces(data))
      .catch((err) => console.error(err));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!placeId || !title.trim() || !description.trim() || !eventDatetime) {
      alert('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('place_id', placeId);
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('event_datetime', eventDatetime);
    if (innerLocation.trim()) formData.append('inner_location', innerLocation.trim());
    if (image) formData.append('image', image);

    try {
      const res = await fetch('/api/events', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        navigate('/events');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to create event');
      }
    } catch (err) {
      alert('Error creating event: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-7">
        <div
          className="card shadow-lg border-0"
          style={{
            borderRadius: '20px',
            background: 'rgba(22, 22, 30, 0.8)',
            backdropFilter: 'blur(15px)'
          }}
        >
          <div
            className="card-header text-white text-center py-4 border-0"
            style={{
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px'
            }}
          >
            <h3 className="mb-0 fw-bold">Host an Event</h3>
            <p className="mb-0 small" style={{ color: '#11998e' }}>
              Schedule something amazing for the world to see
            </p>
          </div>

          <div className="card-body p-5">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-bold text-white mb-2">Select the Location</label>
                <select
                  className="form-select"
                  value={placeId}
                  onChange={(e) => setPlaceId(e.target.value)}
                  required
                >
                  <option value="">---------</option>
                  {places.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-white mb-2">Event Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Summer Night DJ Set"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-white mb-2">What is this event about?</label>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Event details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-white mb-2">Date & Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={eventDatetime}
                  onChange={(e) => setEventDatetime(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-white mb-2">Specific Spot (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Near the main fountain"
                  value={innerLocation}
                  onChange={(e) => setInnerLocation(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-white mb-2">Event Poster (Optional)</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                />
              </div>

              <div className="d-grid gap-2 mt-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-success btn-lg fw-bold rounded-pill shadow-sm"
                  style={{
                    background: 'linear-gradient(135deg, #FF9933, #FF512F)',
                    border: 'none'
                  }}
                >
                  {submitting ? 'Publishing...' : 'Publish Event'}
                </button>
                <Link to="/" className="btn btn-link text-muted text-decoration-none mt-2 text-center">
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
