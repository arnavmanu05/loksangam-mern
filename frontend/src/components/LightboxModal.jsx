import React, { createContext, useContext, useState } from 'react';

const LightboxContext = createContext();

export function LightboxProvider({ children }) {
  const [activeImage, setActiveImage] = useState(null);

  const openLightbox = (url) => {
    setActiveImage(url);
  };

  const closeLightbox = () => {
    setActiveImage(null);
  };

  return (
    <LightboxContext.Provider value={{ openLightbox, closeLightbox }}>
      {children}
      {activeImage && (
        <div
          onClick={closeLightbox}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.9)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'zoom-out'
          }}
        >
          <button
            type="button"
            className="btn-close btn-close-white"
            onClick={closeLightbox}
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              zIndex: 100000,
              filter: 'drop-shadow(0 0 5px rgba(0,0,0,0.8))',
              opacity: 1
            }}
          />
          <img
            src={activeImage}
            alt="Enlarged"
            style={{
              maxHeight: '90vh',
              maxWidth: '95vw',
              objectFit: 'contain',
              borderRadius: '8px'
            }}
          />
        </div>
      )}
    </LightboxContext.Provider>
  );
}

export function useLightbox() {
  return useContext(LightboxContext);
}
