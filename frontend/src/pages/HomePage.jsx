import React, { useEffect, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MapSection from '../components/MapSection';
import MemoryCard from '../components/MemoryCard';

export default function HomePage() {
  const { user, token } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get('q') || '';

  const [places, setPlaces] = useState([]);
  const [feedData, setFeedData] = useState({
    followed_posts: [],
    discovery_posts: [],
    discovery_users: [],
    all_users: [],
    top_events: []
  });
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);

  // First time login splash
  useEffect(() => {
    if (sessionStorage.getItem('firstTimeLogin')) {
      sessionStorage.removeItem('firstTimeLogin');
      setShowSplash(true);
      setTimeout(() => setShowSplash(false), 2000);
    }
  }, []);

  // Fetch places
  const fetchPlaces = () => {
    fetch('/api/places')
      .then((res) => res.json())
      .then((data) => setPlaces(data))
      .catch((err) => console.error(err));
  };

  // Fetch feed
  const fetchFeed = () => {
    setLoading(true);
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const url = query ? `/api/posts/feed?q=${encodeURIComponent(query)}` : '/api/posts/feed';

    fetch(url, { headers })
      .then((res) => res.json())
      .then((data) => {
        setFeedData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  useEffect(() => {
    fetchFeed();
  }, [query, token]);

  const handleLikeUpdated = (postId, liked, count) => {
    setFeedData((prev) => ({
      ...prev,
      followed_posts: prev.followed_posts.map((p) =>
        p.id === postId ? { ...p, is_liked: liked, likes_count: count } : p
      ),
      discovery_posts: prev.discovery_posts.map((p) =>
        p.id === postId ? { ...p, is_liked: liked, likes_count: count } : p
      )
    }));
  };

  const handlePlaceDiscovered = (newPlace) => {
    setPlaces((prev) => [...prev, newPlace]);
  };

  return (
    <>
      {/* Full-Screen Logo Overlay on first login */}
      {showSplash && (
        <div
          id="login-flyin-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: '#0d0d12',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: 'opacity 1.5s ease'
          }}
        >
          <h1
            className="logo-title"
            style={{ fontWeight: 800, letterSpacing: '2px', fontSize: '5rem', color: '#fff' }}
          >
            L
            <span
              style={{
                fontSize: '4.5rem',
                transform: 'translateY(-5px)',
                display: 'inline-block'
              }}
            >
              📍
            </span>
            KSANGAM
          </h1>
        </div>
      )}

      {query && (
        <div className="alert alert-light border shadow-sm d-flex justify-content-between align-items-center mb-4">
          <span>
            Showing results for <strong>"{query}"</strong>
          </span>
          <Link to="/" className="btn btn-sm btn-outline-secondary">
            Clear Search
          </Link>
        </div>
      )}

      <div className="row justify-content-center">
        <div className="col-md-9">
          {!query && user && (
            <>
              <h4 className="mb-3 fw-bold" style={{ color: '#fff' }}>
                Map of Memories
              </h4>
              <MapSection places={places} onPlaceDiscovered={handlePlaceDiscovered} />

              {/* HAPPENING AROUND YOU CAROUSEL */}
              <div className="d-flex justify-content-between align-items-center mb-3 mt-5">
                <Link to="/events" className="text-decoration-none hover-glow">
                  <h4 className="fw-bold m-0" style={{ color: '#11998e' }}>
                    🎯 Happening Around You
                  </h4>
                </Link>
                <Link
                  to="/events"
                  className="btn btn-sm text-white rounded-pill"
                  style={{ border: '1px solid rgba(255,255,255,0.2)' }}
                >
                  View All Events
                </Link>
              </div>

              <div
                className="row mb-5 flex-nowrap"
                style={{ overflowX: 'auto', paddingBottom: '10px', scrollbarWidth: 'none' }}
              >
                {feedData.top_events?.length > 0 ? (
                  feedData.top_events.map((ev, idx) => (
                    <div key={ev.id} className="col-8 col-md-4">
                      <div
                        className={`card h-100 border-0 shadow-sm ${idx === 0 ? 'glare-card' : ''}`}
                        style={{
                          cursor: 'pointer',
                          background: 'rgba(20, 20, 28, 0.8)',
                          borderRadius: '18px',
                          border:
                            idx === 0
                              ? '1px solid rgba(255, 215, 0, 0.5)'
                              : '1px solid rgba(255,255,255,0.05)',
                          flexDirection: 'column',
                          overflow: 'hidden'
                        }}
                        onClick={() => navigate(`/events#event-${ev.id}`)}
                      >
                        {idx === 0 && <div className="tinkling-star">✨</div>}
                        {ev.image ? (
                          <img
                            src={ev.image}
                            style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                            alt=""
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '120px',
                              background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <span
                              style={{
                                fontSize: '3rem',
                                filter: 'drop-shadow(0 5px 10px rgba(0,0,0,0.3))'
                              }}
                            >
                              ✨
                            </span>
                          </div>
                        )}
                        <div className="card-body p-3">
                          <h6 className="fw-bold text-white text-truncate mb-1">{ev.title}</h6>
                          <p className="small mb-2" style={{ color: '#FF512F' }}>
                            📍 {ev.place?.name}
                          </p>
                          <div className="d-flex justify-content-between align-items-center mb-0 mt-2">
                            <p className="small text-muted mb-0 fw-bold">
                              {new Date(ev.event_datetime).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </p>
                            <span
                              className="badge rounded-pill"
                              style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                            >
                              {ev.num_likes} ❤️
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-12">
                    <div
                      className="p-4 text-center rounded"
                      style={{
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px dashed rgba(255,255,255,0.1)',
                        borderRadius: '18px'
                      }}
                    >
                      <p className="text-muted small mb-0">
                        No events happening right now. Host something amazing!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* FROM PEOPLE YOU FOLLOW */}
              <h4 className="mb-4 fw-bold mt-5" style={{ color: '#FF512F' }}>
                From People You Follow
              </h4>
              {feedData.followed_posts?.length > 0 ? (
                feedData.followed_posts.map((post) => (
                  <MemoryCard key={post.id} post={post} onLikeUpdated={handleLikeUpdated} />
                ))
              ) : (
                <p className="text-muted small italic">Your feed is empty. Start following people!</p>
              )}
              <hr className="my-5" />
            </>
          )}

          {/* MATCHED ACCOUNTS */}
          {feedData.discovery_users?.length > 0 && (
            <>
              <h4 className="mb-4 fw-bold" style={{ color: '#ececec' }}>
                Matched Accounts
              </h4>
              <div className="row mb-5">
                {feedData.discovery_users.map((match) => (
                  <div key={match.id} className="col-6 col-md-4 mb-3">
                    <Link to={`/profile/${match.username}`} className="text-decoration-none">
                      <div
                        className="card h-100 bg-transparent border shadow-sm p-3 d-flex flex-row align-items-center mb-0 transition-hover"
                        style={{
                          borderRadius: '15px',
                          borderColor: 'rgba(255,255,255,0.1)',
                          background: 'rgba(22, 22, 30, 0.4)'
                        }}
                      >
                        <div
                          className="text-white rounded-circle d-flex align-items-center justify-content-center fw-bold me-3 flex-shrink-0"
                          style={{
                            width: '45px',
                            height: '45px',
                            fontSize: '1.2rem',
                            background: 'linear-gradient(135deg, #FF512F, #DD2476)'
                          }}
                        >
                          {match.username.charAt(0).toUpperCase()}
                        </div>
                        <h6 className="fw-bold mb-0 text-white text-truncate">@{match.username}</h6>
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
              <hr className="my-5" style={{ borderColor: '#2a2a36' }} />
            </>
          )}

          {/* GLOBAL DISCOVERY */}
          <h4 className="mb-4 fw-bold" style={{ color: '#ececec' }}>
            {query ? 'Matching Memories' : 'Global Discovery'}
          </h4>
          {feedData.discovery_posts?.length > 0 ? (
            feedData.discovery_posts.map((post) => (
              <MemoryCard key={post.id} post={post} onLikeUpdated={handleLikeUpdated} />
            ))
          ) : (
            <div className="text-center py-5">
              <p className="text-muted">
                No memories matching your search right now. Be the first to discover!
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
