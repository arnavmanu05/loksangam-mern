import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const [search, setSearch] = useState(initialQuery);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/?q=${encodeURIComponent(search.trim())}`);
    } else {
      navigate('/');
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark navbar-custom mb-4 px-3 py-3">
      <div className="container border-0 mt-0">
        <Link className="navbar-brand d-flex gap-1" to="/">
          <span>L</span><span className="logo-pin">📍</span><span>KSANGAM</span>
        </Link>

        <form className="d-flex search-form me-auto" onSubmit={handleSearch}>
          <input
            className="form-control nav-search-input me-2"
            type="search"
            placeholder="Explore memories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="nav-search-btn rounded-pill fw-bold d-flex flex-column justify-content-center"
            type="submit"
          >
            <i className="bi bi-search m-0 p-0 text-center"></i>
          </button>
        </form>

        <div className="navbar-nav ms-auto align-items-center d-flex flex-row gap-3">
          {user ? (
            <>
              <Link
                className="nav-link fs-4 text-white hover-glow"
                to={`/profile/${user.username}`}
                title="My Profile"
              >
                <i className="bi bi-person-circle"></i>
              </Link>
              <button
                type="button"
                onClick={logout}
                className="btn btn-link nav-link fs-4 text-white hover-glow p-0 m-0 border-0"
                title="Logout"
              >
                <i className="bi bi-box-arrow-right"></i>
              </button>
            </>
          ) : (
            <>
              <Link className="nav-link fw-bold text-white" to="/login">
                Login
              </Link>
              <Link
                className="nav-link btn btn-primary text-white btn-sm ms-2 rounded-pill px-3 fw-bold"
                to="/signup"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
