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
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState(""); 
    const [loading, setLoading] = useState(false); 

    function handleSubmit(e) {
        e.preventDefault();
    
        setLoading(true);
        setErrorMessage(""); 
    
        const userInfo = { username, password };
    
        axios.post('http://127.0.0.1:8000/token/', userInfo, {
            headers: { 'Content-Type': 'application/json' }
        })
        .then(res => {
            console.log("Login successful:", res.data);
    
            // Store tokens in localStorage
            localStorage.setItem('access', res.data.access);
            localStorage.setItem('refresh', res.data.refresh);
    
            setUsername(""); 
            setPassword(""); 
    
            // Only update authentication state after successful login
            setIsAuthenticated(true); 
            get_username(); 
    
            const from = location.state?.from?.pathname || "/";
            navigate(from, { replace: true }); 
        })
        .catch(err => {
            console.log("Login error:", err.response ? err.response.data : err.message);
            setErrorMessage("Invalid username or password.");
        })
        .finally(() => {
            setLoading(false);
        });
    }
    
    return (
        <div className="login-container my-5">
            <div className="login-card shadow">
                {errorMessage && <Error error={errorMessage} />} 
                <h2 className="login-title">Welcome back</h2>
                <p className="login-subtitle">Please login to your account</p>
                {errorMessage && <p className="error-message text-danger">{errorMessage}</p>} 
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="form-control"
                            id="username"
                            placeholder="Enter your username"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-control"
                            id="password"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <button 
                        type="submit" 
                        className="btn btn-primary w-100" 
                        disabled={loading}
                    >
                        {loading ? "Logging in..." : "Login"}
                    </button>
                </form>
                <div className="login-footer">
                    <p><a href="/" onClick={(e) => e.preventDefault()}>Forgot Password?</a></p>
                    <p>Don't have an account? <a href="/">Sign up</a></p>
                </div>
            </div>
        </div>
    );
}

export default LoginPage;
