import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLightbox } from '../components/LightboxModal';

export default function PublicProfilePage() {
  const { username } = useParams();
  const { user, token } = useAuth();
  const { openLightbox } = useLightbox();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/users/${username}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username, token]);

  const handleFollowToggle = async () => {
    if (!token) return navigate('/login');
    try {
      const res = await fetch(`/api/users/${username}/follow`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProfileData((prev) => ({
        ...prev,
        is_following: data.is_following,
        total_followers: data.total_followers
      }));
    } catch (err) {}
  };

  const handleLikePost = async (postId) => {
    if (!token) return navigate('/login');
    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProfileData((prev) => ({
        ...prev,
        user_posts: prev.user_posts.map((p) =>
          p.id === postId ? { ...p, is_liked: data.liked, likes_count: data.count } : p
        )
      }));
    } catch (err) {}
  };

  const handleViewInMap = (post) => {
    sessionStorage.setItem(
      'mapFocus',
      JSON.stringify({
        lat: post.place.latitude,
        lng: post.place.longitude,
        id: post.place.id,
        name: post.place.name
      })
    );
    navigate('/');
  };

  if (loading) {
    return <div className="text-center py-5 text-white">Loading profile...</div>;
  }

  if (!profileData) {
    return (
      <div className="text-center py-5 text-white">
        <h4>User not found</h4>
        <Link to="/" className="btn btn-primary rounded-pill mt-3">Back to Feed</Link>
      </div>
    );
  }

  const { target_user, user_posts, total_memories, total_followers, total_likes, is_following } =
    profileData;

  return (
    <div className="row justify-content-center">
      <div className="col-md-9">
        {/* Profile Hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
            borderRadius: '20px',
            padding: '40px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 20px rgba(0,0,0,0.15)',
            marginBottom: '2rem',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{ zIndex: 2, position: 'relative' }}>
            <h1 className="fw-bold mb-1">@{target_user.username}</h1>
            <p className="mb-4 opacity-75">
              Joined{' '}
              {new Date(target_user.date_joined).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
              })}
            </p>

            {user && user.username !== target_user.username && (
              <button
                type="button"
                onClick={handleFollowToggle}
                className={`btn ${is_following ? 'btn-light text-primary' : 'btn-primary border-white'} shadow-sm`}
                style={{
                  borderRadius: '30px',
                  padding: '10px 30px',
                  fontWeight: 'bold',
                  transition: '0.3s'
                }}
              >
                {is_following ? 'Unfollow' : 'Follow'}
              </button>
            )}
          </div>

          <div
            className="stats-box shadow-sm"
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '15px',
              padding: '20px',
              border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex',
              gap: '30px',
              textAlign: 'center',
              zIndex: 2,
              position: 'relative'
            }}
          >
            <div className="stat-item">
              <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.8rem' }}>{total_likes}</h3>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Likes Built
              </p>
            </div>
            <div className="stat-item">
              <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.8rem' }}>{total_followers}</h3>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Followers
              </p>
            </div>
            <div className="stat-item">
              <h3 style={{ margin: 0, fontWeight: 'bold', fontSize: '1.8rem' }}>{total_memories}</h3>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Memories
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <h4 className="mb-4 fw-bold text-white">Timeline</h4>
        {user_posts.length > 0 ? (
          user_posts.map((post) => (
            <div
              key={post.id}
              className="card mb-4 border-0 shadow-sm"
              style={{
                borderRadius: '20px',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                background: 'rgba(22, 22, 30, 0.4)'
              }}
              onClick={() => navigate(`/memory/${post.id}`)}
            >
              <div className="card-body p-4">
                <h5 className="card-title text-white fw-bold">
                  {post.title}{' '}
                  <span
                    className="badge text-white float-end"
                    style={{
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '20px'
                    }}
                  >
                    {post.place?.name}
                  </span>
                </h5>
                <p className="small mb-3" style={{ color: '#888' }}>
                  Published on{' '}
                  {new Date(post.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: '2-digit',
                    year: 'numeric'
                  })}
                </p>

                {post.images?.length === 1 && (
                  <div
                    className="elegant-img-container mb-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      openLightbox(post.images[0]);
                    }}
                  >
                    <img src={post.images[0]} className="elegant-img-bg" alt="" />
                    <img src={post.images[0]} className="elegant-img-fg" alt="Memory" />
                  </div>
                )}

                {post.images?.length > 1 && (
                  <div className="position-relative mb-3">
                    <div
                      className="elegant-img-container"
                      onClick={(e) => {
                        e.stopPropagation();
                        openLightbox(post.images[0]);
                      }}
                    >
                      <img src={post.images[0]} className="elegant-img-bg" alt="" />
                      <img src={post.images[0]} className="elegant-img-fg" alt="Memory" />
                    </div>
                  </div>
                )}

                <div
                  className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                >
                  <div>
                    <button
                      className="btn btn-dark btn-sm rounded-pill px-3 shadow-none me-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLikePost(post.id);
                      }}
                      style={{ border: '1px solid #333' }}
                    >
                      <span className="me-1">{post.is_liked ? '❤️' : '🤍'}</span>
                      <span className="fw-bold">{post.likes_count}</span>
                    </button>
                    <Link
                      to={`/memory/${post.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="btn btn-outline-light btn-sm rounded-pill px-3 shadow-sm"
                      style={{ borderColor: '#333' }}
                    >
                      💬 Comments ({post.comments_count})
                    </Link>
                  </div>
                  <button
                    className="btn btn-primary fw-bold shadow-sm btn-sm rounded-pill px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewInMap(post);
                    }}
                  >
                    📍 View in Map
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-5">
            <div className="display-4 mb-3 text-muted">🏜️</div>
            <h5 className="text-muted">No memories shared yet.</h5>
          </div>
        )}
      </div>
    </div>
  );
}
