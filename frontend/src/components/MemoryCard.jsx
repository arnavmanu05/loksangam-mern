import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLightbox } from './LightboxModal';

export default function MemoryCard({ post, onLikeUpdated }) {
  const { user, token } = useAuth();
  const { openLightbox } = useLightbox();
  const navigate = useNavigate();

  const [activeSlide, setActiveSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [floatingHeart, setFloatingHeart] = useState(false);

  const images = post.images || [];

  const handleLike = async (e) => {
    e.stopPropagation();
    if (!token) return navigate('/login');

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (onLikeUpdated) {
        onLikeUpdated(post.id, data.liked, data.count);
      }
      if (data.liked) {
        setAnimating(true);
        setFloatingHeart(true);
        setTimeout(() => {
          setAnimating(false);
          setFloatingHeart(false);
        }, 1200);
      }
    } catch (err) {}
  };

  const handleViewInMap = (e) => {
    e.stopPropagation();
    if (window.focusPlaceOnMap && post.place) {
      window.focusPlaceOnMap(
        post.place.latitude,
        post.place.longitude,
        post.place.id,
        post.place.name
      );
    }
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev + 1) % images.length);
  };

  const prevSlide = (e) => {
    e.stopPropagation();
    setActiveSlide((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div
      className={`card mb-4 border-0 hover-lift ${animating ? 'liked-glare-active' : ''}`}
      style={{ cursor: 'pointer', position: 'relative' }}
      onClick={() => navigate(`/memory/${post.id}`)}
    >
      {floatingHeart && <div className="floating-heart">❤️</div>}

      <div className="card-body">
        <h5 className="card-title text-white fw-bold">
          {post.title}{' '}
          <span className="badge bg-dark border border-secondary text-light float-end rounded-pill">
            {post.place?.name}
          </span>
        </h5>
        <p className="small mb-3" style={{ color: '#DD2476', fontWeight: 'bold' }}>
          <Link
            to={`/profile/${post.author}`}
            onClick={(e) => e.stopPropagation()}
            style={{ color: '#DD2476', textDecoration: 'none' }}
          >
            @{post.author}
          </Link>
        </p>

        {images.length === 1 && (
          <div
            className="elegant-img-container mb-3"
            onClick={(e) => {
              e.stopPropagation();
              openLightbox(images[0]);
            }}
          >
            <img src={images[0]} className="elegant-img-bg" alt="" />
            <img src={images[0]} className="elegant-img-fg" alt="Memory" />
          </div>
        )}

        {images.length > 1 && (
          <div className="position-relative mb-3">
            <div
              className="elegant-img-container"
              style={{ borderRadius: '18px' }}
              onClick={(e) => {
                e.stopPropagation();
                openLightbox(images[activeSlide]);
              }}
            >
              <img src={images[activeSlide]} className="elegant-img-bg" alt="" />
              <img src={images[activeSlide]} className="elegant-img-fg" alt="Memory Slide" />
            </div>

            {/* Carousel navigation controls */}
            <button
              type="button"
              className="btn position-absolute top-50 start-0 translate-middle-y text-white p-2"
              style={{ zIndex: 10, background: 'rgba(0,0,0,0.4)', borderRadius: '50%' }}
              onClick={prevSlide}
            >
              ❮
            </button>
            <button
              type="button"
              className="btn position-absolute top-50 end-0 translate-middle-y text-white p-2"
              style={{ zIndex: 10, background: 'rgba(0,0,0,0.4)', borderRadius: '50%' }}
              onClick={nextSlide}
            >
              ❯
            </button>

            {/* Indicators */}
            <div
              className="d-flex justify-content-center gap-1 position-absolute bottom-0 start-50 translate-middle-x mb-2"
              style={{ zIndex: 10 }}
            >
              {images.map((_, idx) => (
                <span
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveSlide(idx);
                  }}
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

        <div className="d-flex justify-content-between align-items-center mt-3">
          <div>
            <button
              className="btn btn-outline-light btn-sm rounded-pill px-3 shadow-none me-2"
              onClick={handleLike}
              style={{ borderColor: '#2a2a36' }}
            >
              <span>{post.is_liked ? '❤️' : '🤍'}</span>{' '}
              <span className="fw-bold">{post.likes_count}</span>
            </button>
            <Link
              to={`/memory/${post.id}`}
              onClick={(e) => e.stopPropagation()}
              className="btn btn-dark btn-sm rounded-pill px-3"
            >
              💬 Comments ({post.comments_count})
            </Link>
          </div>

          <button
            className="btn btn-primary btn-sm rounded-pill px-3 text-white fw-bold"
            onClick={handleViewInMap}
          >
            📍 View in Map
          </button>
        </div>
      </div>
    </div>
  );
}
