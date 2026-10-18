import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // High-orbit Earth map background centered on India
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;
    const L = window.L;
    if (!L) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      maxBounds: [[180, -Infinity], [-180, Infinity]],
      maxBoundsViscosity: 1
    }).setView([20.5937, 78.9629], 4.5);

    leafletMap.current = map;

    if (L.maplibreGL) {
      L.maplibreGL({
        style: 'https://tiles.openfreemap.org/styles/positron',
        attribution: '&copy; OpenFreeMap'
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png').addTo(map);
    }

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', minHeight: '100vh', overflow: 'hidden' }}>
      {/* High Orbit Earth Leaflet Background */}
      <div
        id="earth-bg"
        ref={mapRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0
        }}
      />

      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(13, 13, 18, 0.4)',
          position: 'relative',
          zIndex: 1,
          padding: '20px'
        }}
      >
        <div
          style={{
            background: 'rgba(22, 22, 30, 0.6)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '30px',
            padding: '40px',
            width: '100%',
            maxWidth: '450px',
            boxShadow: '0 15px 50px rgba(0,0,0,0.5)',
            textAlign: 'center'
          }}
        >
          <h1
            style={{
              fontWeight: 800,
              letterSpacing: '1.5px',
              fontSize: '2.2rem',
              color: '#fff',
              marginBottom: '2rem'
            }}
          >
            Join L<span style={{ display: 'inline-block', fontSize: '2rem', transform: 'translateY(-3px)' }}>📍</span>KSANGAM
          </h1>

          {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <input
              type="password"
              className="form-control mb-3"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-100"
              style={{
                background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
                border: 'none',
                borderRadius: '25px',
                padding: '15px',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                boxShadow: '0 4px 15px rgba(221, 36, 118, 0.4)',
                marginTop: '10px'
              }}
            >
              {loading ? 'Starting...' : 'Start Journey'}
            </button>
          </form>

          <p className="mt-4 mb-0" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Already have an account?{' '}
            <Link to="/login" className="fw-bold text-decoration-none" style={{ color: '#FF512F' }}>
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
