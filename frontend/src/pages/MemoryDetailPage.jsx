import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLightbox } from '../components/LightboxModal';

export default function MemoryDetailPage() {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { openLightbox } = useLightbox();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/posts/${id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPost(data.post);
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id, token]);

  const handleLike = async () => {
    if (!token) return navigate('/login');
    try {
      const res = await fetch(`/api/posts/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPost((prev) => ({
        ...prev,
        is_liked: data.liked,
        likes_count: data.count
      }));
    } catch (err) {}
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !token) return;

    try {
      const res = await fetch(`/api/posts/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newComment.trim() })
      });
      if (res.ok) {
        const commentData = await res.json();
        setComments((prev) => [commentData, ...prev]);
        setNewComment('');
      }
    } catch (err) {}
  };

  if (loading) {
    return <div className="text-center py-5 text-white">Loading memory...</div>;
  }

  if (!post) {
    return (
      <div className="text-center py-5 text-white">
        <h4>Memory not found</h4>
        <Link to="/" className="btn btn-primary rounded-pill mt-3">Back to Feed</Link>
      </div>
    );
  }

  const images = post.images || [];

  return (
    <div className="row justify-content-center">
      <div className="col-md-8">
        <div className="card border-0 shadow-sm mb-4">
          <div className="card-body p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="fw-bold mb-0 text-white">{post.title}</h2>
              <span
                className="badge rounded-pill fs-6 text-white"
                style={{
                  background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
                  border: '1px solid rgba(255,255,255,0.2)'
                }}
              >
                {post.place?.name}
              </span>
            </div>

            <p className="mb-4" style={{ color: '#aaa' }}>
              Shared by{' '}
              <Link
                to={`/profile/${post.author}`}
                className="fw-bold text-decoration-none"
                style={{ color: '#DD2476' }}
              >
                @{post.author}
              </Link>{' '}
              on{' '}
              {new Date(post.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: '2-digit',
                year: 'numeric'
              })}
            </p>

            {images.length === 1 && (
              <div
                className="elegant-img-container mb-3"
                style={{ height: '450px', cursor: 'zoom-in' }}
                onClick={() => openLightbox(images[0])}
              >
                <img src={images[0]} className="elegant-img-bg" alt="" />
                <img src={images[0]} className="elegant-img-fg" alt="Memory" />
              </div>
            )}

            {images.length > 1 && (
              <div className="position-relative mb-3">
                <div
                  className="elegant-img-container"
                  style={{ height: '450px', borderRadius: '18px', cursor: 'zoom-in' }}
                  onClick={() => openLightbox(images[activeSlide])}
                >
                  <img src={images[activeSlide]} className="elegant-img-bg" alt="" />
                  <img src={images[activeSlide]} className="elegant-img-fg" alt="Memory Slide" />
                </div>

                <button
                  type="button"
                  className="btn position-absolute top-50 start-0 translate-middle-y text-white p-2"
                  style={{ zIndex: 10, background: 'rgba(0,0,0,0.4)', borderRadius: '50%' }}
                  onClick={() => setActiveSlide((prev) => (prev - 1 + images.length) % images.length)}
                >
                  ❮
                </button>
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y text-white p-2"
                  style={{ zIndex: 10, background: 'rgba(0,0,0,0.4)', borderRadius: '50%' }}
                  onClick={() => setActiveSlide((prev) => (prev + 1) % images.length)}
                >
                  ❯
                </button>

                <div
                  className="d-flex justify-content-center gap-1 position-absolute bottom-0 start-50 translate-middle-x mb-2"
                  style={{ zIndex: 10 }}
                >
                  {images.map((_, idx) => (
                    <span
                      key={idx}
                      onClick={() => setActiveSlide(idx)}
                      style={{
                        width: idx === activeSlide ? '18px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        backgroundColor: idx === activeSlide ? '#FF512F' : 'rgba(255,255,255,0.5)',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <div
              className="d-flex justify-content-between align-items-center border-top pt-4"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
            >
              <button
                className="btn btn-dark rounded-pill px-4 shadow-none"
                onClick={handleLike}
                style={{ border: '1px solid #333' }}
              >
                <span className="fs-5 me-2">{post.is_liked ? '❤️' : '🤍'}</span>
                <span className="fw-bold">{post.likes_count}</span> Likes
              </button>
              <Link to="/" className="btn btn-outline-secondary">
                ⬅ Back to Feed
              </Link>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="card border-0 shadow-sm mt-2 mb-5">
          <div className="card-body p-4">
            <h4 className="fw-bold mb-4 text-white">Comments ({comments.length})</h4>

            {user ? (
              <form onSubmit={handleAddComment} className="mb-5">
                <div
                  className="input-group align-items-center border rounded-pill p-1"
                  style={{
                    borderColor: 'rgba(255,255,255,0.1)',
                    background: 'rgba(0,0,0,0.2)'
                  }}
                >
                  <input
                    type="text"
                    className="form-control border-0 bg-transparent text-white shadow-none px-4"
                    placeholder="Type your comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    required
                  />
                  <button
                    className="btn btn-primary rounded-pill px-4 fw-bold shadow-none ms-1"
                    type="submit"
                    style={{ padding: '10px 25px' }}
                  >
                    Post
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="alert text-center mb-4"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid #333',
                  color: '#fff'
                }}
              >
                <Link to="/login" style={{ color: '#FF512F', fontWeight: 'bold' }}>
                  Log in
                </Link>{' '}
                to leave a comment.
              </div>
            )}

            <div className="comments-list">
              {comments.length > 0 ? (
                comments.map((comment, idx) => (
                  <div key={comment.id || idx} className="d-flex mb-4">
                    <div className="flex-shrink-0">
                      <div
                        className="text-white rounded-circle d-flex align-items-center justify-content-center fw-bold shadow-sm"
                        style={{
                          width: '45px',
                          height: '45px',
                          fontSize: '1.2rem',
                          background: 'linear-gradient(135deg, #FF512F, #DD2476)'
                        }}
                      >
                        {comment.author?.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div
                      className="flex-grow-1 ms-3 p-3 rounded shadow-sm border"
                      style={{
                        background: '#1a1a24',
                        borderColor: '#2a2a36',
                        color: '#ececec'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-baseline mb-2">
                        <h6 className="fw-bold mb-0">
                          <Link
                            to={`/profile/${comment.author}`}
                            className="text-white text-decoration-none hover-glow"
                          >
                            @{comment.author}
                          </Link>
                        </h6>
                        <small style={{ color: '#888' }}>
                          {new Date(comment.created_at).toLocaleDateString()}
                        </small>
                      </div>
                      <p className="mb-0" style={{ color: '#bbb' }}>
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted text-center italic py-4">
                  No comments yet. Be the first to share your thoughts!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
