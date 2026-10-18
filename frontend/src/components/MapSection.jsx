import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function MapSection({ places = [], onPlaceDiscovered }) {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef({});
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('memories');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [placeMemories, setPlaceMemories] = useState([]);
  const [placeEvents, setPlaceEvents] = useState([]);
  const [coverPhoto, setCoverPhoto] = useState(null);
  const [sidebarLoading, setSidebarLoading] = useState(false);

  // Discovery Modal state
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [discoveryCoords, setDiscoveryCoords] = useState(null);
  const [newPlaceName, setNewPlaceName] = useState('');

  // Custom SVG Bulb Needle Marker
  const customPinSvg = `
    <svg width="24" height="42" viewBox="0 0 24 42" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 8px 4px rgba(0,0,0,0.4));">
      <defs>
        <linearGradient id="pinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FF512F" />
          <stop offset="100%" stop-color="#DD2476" />
        </linearGradient>
      </defs>
      <path d="M12 28 L12 40" stroke="#DD2476" stroke-width="2" stroke-linecap="round" />
      <circle cx="12" cy="12" r="10" fill="url(#pinGrad)" stroke="#fff" stroke-width="2" />
      <circle cx="9" cy="9" r="3" fill="rgba(255,255,255,0.4)" />
    </svg>
  `;

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    const L = window.L;
    if (!L) return;

    // Default centered at MIT Manipal
    const map = L.map(mapRef.current, {
      maxBounds: [[180, -Infinity], [-180, Infinity]],
      maxBoundsViscosity: 1
    }).setView([13.3476, 74.7921], 14);

    leafletMap.current = map;

    // Positron vector tiles via MapLibre GL
    if (L.maplibreGL) {
      L.maplibreGL({
        style: 'https://tiles.openfreemap.org/styles/positron',
        attribution: '&copy; <a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/" target="_blank">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(map);
    }

    // Live Geolocation Tracker
    let userMarker = null;
    let isFirstLocation = true;
    map.locate({ setView: false, watch: true, enableHighAccuracy: true });

    map.on('locationfound', (e) => {
      if (isFirstLocation) {
        map.flyTo(e.latlng, 14, { duration: 1.5 });
        isFirstLocation = false;
      }
      if (!userMarker) {
        userMarker = L.circleMarker(e.latlng, {
          radius: 8,
          fillColor: '#FF512F',
          color: '#fff',
          weight: 2,
          opacity: 1,
          fillOpacity: 1
        }).addTo(map).bindTooltip('📍 You are here', {
          direction: 'top',
          opacity: 1,
          className: 'custom-map-tooltip',
          offset: [0, -5]
        });
      } else {
        userMarker.setLatLng(e.latlng);
      }
    });

    // Map click for Discovery
    map.on('click', (e) => {
      setDiscoveryCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      setShowDiscoveryModal(true);
    });

    // Register global flyover function
    window.focusPlaceOnMap = (lat, lng, placeId, placeName) => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setIsFullscreen(true);

      // Force immediate resize recalculation so new viewport is registered
      if (leafletMap.current) {
        leafletMap.current.invalidateSize({ pan: false });
      }

      // Allow container layout to apply, then invalidate and fly smoothly
      setTimeout(() => {
        if (leafletMap.current) {
          leafletMap.current.invalidateSize({ pan: false });
          leafletMap.current.flyTo([parseFloat(lat), parseFloat(lng)], 18, { duration: 1.5 });
        }
      }, 100);

      // Ensure tiles keep filling newly exposed dimensions during flight
      setTimeout(() => {
        if (leafletMap.current) {
          leafletMap.current.invalidateSize({ pan: false });
        }
      }, 350);

      setTimeout(() => {
        openSidebar(placeId, placeName);
      }, 1700);
    };


    // Check for sessionStorage mapFocus
    const mapFocusRaw = sessionStorage.getItem('mapFocus');
    if (mapFocusRaw) {
      sessionStorage.removeItem('mapFocus');
      try {
        const f = JSON.parse(mapFocusRaw);
        setTimeout(() => {
          window.focusPlaceOnMap(f.lat, f.lng, f.id, f.name);
        }, 800);
      } catch (err) {}
    }

    return () => {
      map.remove();
      leafletMap.current = null;
    };
  }, []);

  // Update Markers when places change
  useEffect(() => {
    const map = leafletMap.current;
    const L = window.L;
    if (!map || !L) return;

    const customIcon = L.divIcon({
      className: 'custom-bulb-marker bg-transparent border-0',
      html: customPinSvg,
      iconSize: [24, 42],
      iconAnchor: [12, 42],
      tooltipAnchor: [0, -38]
    });

    places.forEach((place) => {
      if (!markersRef.current[place.id]) {
        const marker = L.marker([place.latitude, place.longitude], { icon: customIcon }).addTo(map);

        marker.bindTooltip(`✨ ${place.name}`, {
          direction: 'top',
          opacity: 1,
          className: 'custom-map-tooltip',
          offset: [0, -10]
        });

        marker.on('click', () => {
          openSidebar(place.id, place.name, place.num_memories);
        });

        markersRef.current[place.id] = marker;
      }
    });
  }, [places]);

  const openSidebar = async (placeId, placeName, count = 0) => {
    setSelectedPlace({ id: placeId, name: placeName, count });
    setSidebarOpen(true);
    setActiveTab('memories');
    setSidebarLoading(true);

    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/places/${placeId}/memories`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPlaceMemories(data.memories || []);
        setCoverPhoto(data.cover_photo || null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSidebarLoading(false);
    }
  };

  const loadEvents = async (placeId) => {
    setSidebarLoading(true);
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`/api/places/${placeId}/events`, { headers });
      if (res.ok) {
        const data = await res.json();
        setPlaceEvents(data.events || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSidebarLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'events' && selectedPlace) {
      loadEvents(selectedPlace.id);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (leafletMap.current) {
      leafletMap.current.invalidateSize({ pan: false });
    }
    setTimeout(() => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize({ pan: false });
      }
    }, 100);
    setTimeout(() => {
      if (leafletMap.current) {
        leafletMap.current.invalidateSize({ pan: false });
      }
    }, 350);
  };


  // Like Memory in Sidebar
  const handleLikeMemory = async (e, memId) => {
    e.stopPropagation();
    if (!token) return navigate('/login');

    try {
      const res = await fetch(`/api/posts/${memId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPlaceMemories((prev) =>
        prev.map((m) =>
          m.id === memId ? { ...m, likes: data.count, is_liked: data.liked } : m
        )
      );
    } catch (err) {}
  };

  // Like Event in Sidebar
  const handleLikeEvent = async (e, eventId) => {
    e.stopPropagation();
    if (!token) return navigate('/login');

    try {
      const res = await fetch(`/api/events/${eventId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setPlaceEvents((prev) =>
        prev.map((ev) =>
          ev.id === eventId ? { ...ev, likes: data.count, is_liked: data.liked } : ev
        )
      );
    } catch (err) {}
  };

  // Save New Discovery
  const handleSaveDiscovery = async () => {
    if (!newPlaceName.trim()) {
      alert('Every discovery needs a name!');
      return;
    }
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const res = await fetch('/api/places/discover', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newPlaceName.trim(),
          latitude: discoveryCoords.lat,
          longitude: discoveryCoords.lng
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        const newPlaceObj = {
          id: data.id,
          name: data.name,
          latitude: discoveryCoords.lat,
          longitude: discoveryCoords.lng,
          num_memories: 0,
          avg_rating: 0
        };
        setShowDiscoveryModal(false);
        setNewPlaceName('');
        if (onPlaceDiscovered) onPlaceDiscovered(newPlaceObj);
        openSidebar(data.id, data.name, 0);
      }
    } catch (err) {
      alert('Failed to save place: ' + err.message);
    }
  };

  return (
    <>
      {isFullscreen && (
        <div
          id="map-backdrop"
          className="active"
          onClick={toggleFullscreen}
        />
      )}

      <div id="map-outer" className={isFullscreen ? 'fullscreen' : ''}>
        <div id="map" ref={mapRef} />

        <button id="btn-expand-map" onClick={toggleFullscreen}>
          {isFullscreen ? '⛶ Minimize Map' : '⛶ Expand Map'}
        </button>

        {/* Sliding Memory & Event Sidebar */}
        <div id="memory-sidebar" className={sidebarOpen ? 'active' : ''}>
          <button
            onClick={() => setSidebarOpen(false)}
            className="btn-close-sidebar"
          >
            &times;
          </button>

          {coverPhoto && (
            <div
              className="elegant-img-container mb-3"
              style={{
                height: '120px',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
              }}
            >
              <img src={coverPhoto} className="elegant-img-bg" alt="" />
              <img src={coverPhoto} className="elegant-img-fg" alt="Cover" />
            </div>
          )}

          <div className="mt-3">
            <h3 className="fw-bold text-white mb-0">
              {selectedPlace ? selectedPlace.name : 'Place Name'}
            </h3>
            <p className="text-muted small mb-3" style={{ color: '#aaa' }}>
              {selectedPlace
                ? `${placeMemories.length} memories shared here`
                : 'Finding memories...'}
            </p>

            {/* Memories / Events Tab Toggle */}
            <div className="btn-group w-100 mb-3" role="group">
              <input
                type="radio"
                className="btn-check"
                name="sidebarToggle"
                id="toggleMemories"
                checked={activeTab === 'memories'}
                onChange={() => handleTabChange('memories')}
              />
              <label
                className={`btn btn-sm ${activeTab === 'memories' ? 'btn-light text-dark fw-bold' : 'btn-outline-light'}`}
                htmlFor="toggleMemories"
                onClick={() => handleTabChange('memories')}
              >
                Memories
              </label>

              <input
                type="radio"
                className="btn-check"
                name="sidebarToggle"
                id="toggleEvents"
                checked={activeTab === 'events'}
                onChange={() => handleTabChange('events')}
              />
              <label
                className={`btn btn-sm ${activeTab === 'events' ? 'btn-light text-dark fw-bold' : 'btn-outline-light'}`}
                htmlFor="toggleEvents"
                onClick={() => handleTabChange('events')}
              >
                Events
              </label>
            </div>

            {/* MEMORIES SECTION */}
            {activeTab === 'memories' && (
              <div id="memories-section">
                <div className="d-grid mb-3">
                  <button
                    onClick={() =>
                      navigate(
                        selectedPlace ? `/create?place_id=${selectedPlace.id}` : '/create'
                      )
                    }
                    className="btn btn-primary btn-sm shadow-sm fw-bold rounded-pill"
                  >
                    ✨ Share a Memory
                  </button>
                </div>

                <div id="memories-list">
                  {sidebarLoading ? (
                    <p className="text-center text-muted py-4 small">Loading memories...</p>
                  ) : placeMemories.length > 0 ? (
                    placeMemories.map((m) => (
                      <div
                        key={m.id}
                        className="memory-card"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/memory/${m.id}`)}
                      >
                        {m.image_url && (
                          <div
                            className="elegant-img-container"
                            style={{
                              height: '120px',
                              borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}
                          >
                            <img src={m.image_url} className="elegant-img-bg" alt="" />
                            <img src={m.image_url} className="elegant-img-fg" alt="" />
                          </div>
                        )}
                        <div className="memory-card-body p-3">
                          <h5 className="fw-bold mb-1 text-white">{m.title}</h5>
                          <p className="small mb-2" style={{ color: '#FF512F' }}>
                            @{m.author} • {m.date}
                          </p>
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <span className="small text-muted">Tap to view</span>
                            <button
                              className="btn btn-sm shadow-none"
                              onClick={(e) => handleLikeMemory(e, m.id)}
                              style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                borderRadius: '20px'
                              }}
                            >
                              <span>{m.is_liked ? '❤️' : '🤍'}</span>{' '}
                              <span className="fw-bold">{m.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted py-5 small">
                      Be the first to share a memory of this spot!
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* EVENTS SECTION */}
            {activeTab === 'events' && (
              <div id="events-section">
                <div className="d-grid mb-3">
                  <button
                    onClick={() =>
                      navigate(
                        selectedPlace
                          ? `/event/create?place_id=${selectedPlace.id}`
                          : '/event/create'
                      )
                    }
                    className="btn btn-success btn-sm shadow-sm fw-bold rounded-pill"
                    style={{
                      background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                      border: 'none'
                    }}
                  >
                    🗓️ Host an Event
                  </button>
                </div>

                <div id="events-list">
                  {sidebarLoading ? (
                    <p className="text-center text-muted py-4 small">Loading events...</p>
                  ) : placeEvents.length > 0 ? (
                    placeEvents.map((ev) => (
                      <div
                        key={ev.id}
                        className="memory-card mb-2"
                        style={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/events#event-${ev.id}`)}
                      >
                        {ev.image_url && (
                          <div
                            className="elegant-img-container"
                            style={{
                              height: '120px',
                              borderBottom: '1px solid rgba(255,255,255,0.05)'
                            }}
                          >
                            <img src={ev.image_url} className="elegant-img-bg" alt="" />
                            <img src={ev.image_url} className="elegant-img-fg" alt="" />
                          </div>
                        )}
                        <div className="memory-card-body p-3">
                          <h5 className="fw-bold mb-1 text-white">{ev.title}</h5>
                          <p className="small mb-2" style={{ color: '#11998e' }}>
                            📅 {ev.date}
                          </p>
                          {ev.inner_location && (
                            <p className="small mb-2" style={{ color: '#FF512F' }}>
                              📍 {ev.inner_location}
                            </p>
                          )}
                          <div className="d-flex justify-content-between align-items-center mt-2">
                            <p
                              className="mb-0 small text-truncate"
                              style={{ color: '#ccc', maxWidth: '65%' }}
                            >
                              {ev.description}
                            </p>
                            <button
                              className="btn btn-sm shadow-none"
                              onClick={(e) => handleLikeEvent(e, ev.id)}
                              style={{
                                background: 'rgba(255,255,255,0.1)',
                                color: 'white',
                                borderRadius: '20px'
                              }}
                            >
                              <span>{ev.is_liked ? '❤️' : '🤍'}</span>{' '}
                              <span className="fw-bold">{ev.likes}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-muted py-5 small">
                      No events scheduled. Host the first one!
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DISCOVERY MODAL */}
      {showDiscoveryModal && (
        <div
          className="modal fade show"
          style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.7)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '20px' }}>
              <div className="modal-body p-4 text-center">
                <div className="display-4 mb-3">📍</div>
                <h4 className="fw-bold mb-2">New Discovery!</h4>
                <p className="text-muted small mb-4">
                  Give this spot a name to pin it to LokSangam forever.
                </p>
                <input
                  type="text"
                  className="form-control form-control-lg mb-3 text-center"
                  placeholder="e.g., Hidden Garden Bench"
                  value={newPlaceName}
                  onChange={(e) => setNewPlaceName(e.target.value)}
                  autoFocus
                />
                <div className="d-grid gap-2">
                  <button
                    onClick={handleSaveDiscovery}
                    className="btn btn-success btn-lg rounded-pill shadow-sm"
                  >
                    Confirm Discovery
                  </button>
                  <button
                    className="btn btn-link text-muted"
                    onClick={() => {
                      setShowDiscoveryModal(false);
                      setNewPlaceName('');
                    }}
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
