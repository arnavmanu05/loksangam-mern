import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function CreatePostPage() {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialPlaceId = queryParams.get('place_id') || '';

  const [places, setPlaces] = useState([]);
  const [placeId, setPlaceId] = useState(initialPlaceId);
  const [title, setTitle] = useState('');
  const [images, setImages] = useState([]);
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
    if (!placeId || !title.trim()) {
      alert('Please select a place and enter a title for your memory.');
      return;
    }

    setSubmitting(true);
    const formData = new FormData();
    formData.append('place_id', placeId);
    formData.append('title', title.trim());
    for (let i = 0; i < images.length; i++) {
      formData.append('images', images[i]);
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        navigate('/');
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to publish memory');
      }
    } catch (err) {
      alert('Error creating memory: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div
          className="card shadow-lg border-0 mt-4 mb-5"
          style={{
            borderRadius: '25px',
            background: 'rgba(22, 22, 30, 0.6)',
            backdropFilter: 'blur(15px)',
            border: '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <div
            className="card-header border-0 text-center p-5"
            style={{
              borderRadius: '25px 25px 0 0',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                background:
                  'radial-gradient(circle, rgba(221, 36, 118, 0.2) 0%, transparent 50%)',
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />
            <h2 className="mb-0 fw-bold text-white" style={{ position: 'relative', zIndex: 1 }}>
              ✨ Share a Memory
            </h2>
            <p className="mb-0 mt-2" style={{ color: '#bbb', position: 'relative', zIndex: 1 }}>
              Immortalize your perspective on the map.
            </p>
          </div>

          <div className="card-body p-5 pt-2">
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-bold text-white">
                  Which place are you remembering?
                </label>
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
                <div className="form-text text-muted small">Choose the place you visited.</div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-white">Your Memory</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Unforgettable night!"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label fw-bold text-white">Upload Photos</label>
                <input
                  type="file"
                  multiple
                  className="form-control"
                  accept="image/*"
                  onChange={(e) => setImages(Array.from(e.target.files))}
                />
                <div className="form-text text-muted small">You can select multiple photos.</div>
              </div>

              <div className="d-grid gap-3 mt-5">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary btn-lg rounded-pill shadow-sm fw-bold"
                >
                  {submitting ? 'Publishing...' : 'Publish Memory'}
                </button>
                <Link
                  to="/"
                  className="btn btn-outline-light btn-lg rounded-pill"
                  style={{ borderColor: '#333', color: '#ececec' }}
                >
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
