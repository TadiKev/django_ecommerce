import React, { useContext, useState } from 'react';
import axios from 'axios';
import './LogginPage.css';
import { useLocation, useNavigate } from 'react-router-dom';
import Error from '../ui/Error';
import { AuthContext } from '../../context/AuthContext';

const LoginPage = () => {
  const { setIsAuthenticated, get_username } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    try {
      if (isSignup) {
        if (password !== confirmPassword) {
          setErrorMessage('Passwords do not match.');
        } else {
          await axios.post(
            'http://127.0.0.1:8000/signup/',
            { username, email, password },
            { headers: { 'Content-Type': 'application/json' } }
          );
          setIsSignup(false);
          setUsername('');
          setEmail('');
          setPassword('');
          setConfirmPassword('');
        }
      } else {
        const res = await axios.post(
          'http://127.0.0.1:8000/token/',
          { username, password },
          { headers: { 'Content-Type': 'application/json' } }
        );

        localStorage.setItem('access', res.data.access);
        localStorage.setItem('refresh', res.data.refresh);

        setUsername('');
        setPassword('');
        setIsAuthenticated(true);
        await get_username();

        const from = location.state?.from?.pathname || '/';
        navigate(from, { replace: true });
      }
    } catch (err) {
      if (isSignup) {
        setErrorMessage('Signup failed. Try another username or email.');
      } else {
        setErrorMessage('Invalid username or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup((prev) => !prev);
    setErrorMessage('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="login-container my-5">
      <div className="login-card shadow">
        {errorMessage && <Error error={errorMessage} />}

        <h2 className="login-title">
          {isSignup ? 'Create an Account' : 'Welcome back'}
        </h2>
        <p className="login-subtitle">
          {isSignup
            ? 'Please fill the form to create an account'
            : 'Please login to your account'}
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="username" className="form-label">
              Username
            </label>
            <input
              type="text"
              id="username"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          {isSignup && (
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>
          )}

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          {isSignup && (
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading
              ? isSignup
                ? 'Signing up...'
                : 'Logging in...'
              : isSignup
              ? 'Sign Up'
              : 'Login'}
          </button>
        </form>

        <div className="login-footer mt-3">
          {!isSignup && (
            <p>
              <a href="/" onClick={(e) => e.preventDefault()}>
                Forgot Password?
              </a>
            </p>
          )}
          <p>
            {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button className="btn btn-link" onClick={toggleMode}>
              {isSignup ? 'Login' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
