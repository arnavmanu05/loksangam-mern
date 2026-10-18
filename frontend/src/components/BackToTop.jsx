import React, { useState, useEffect } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!visible) return null;

  return (
    <a
      href="#"
      onClick={scrollToTop}
      className="btn text-white rounded-circle shadow-lg"
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '55px',
        height: '55px',
        display: 'block',
        zIndex: 1000,
        background: 'linear-gradient(135deg, #11998e, #38ef7d)',
        border: '1px solid rgba(255,255,255,0.2)',
        backdropFilter: 'blur(5px)',
        fontSize: '1.5rem',
        lineHeight: '40px',
        textAlign: 'center',
        filter: 'drop-shadow(0 0 10px rgba(56, 239, 125, 0.4))'
      }}
    >
      <i
        className="bi bi-arrow-up text-white"
        style={{ fontWeight: 900, filter: 'drop-shadow(0px 2px 2px rgba(0,0,0,0.5))' }}
      ></i>
    </a>
  );
}
