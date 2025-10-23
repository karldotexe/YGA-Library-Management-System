import React, { useState } from 'react';
import { supabase } from '../supabase-client';
import { useNavigate } from 'react-router-dom';
import './LogIn.css';
import LibLogo from './images/LibLogo.png';
import YGALogo from './images/YGALogo.png';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (!email) {
      setMessage('Please enter your email.');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.toLowerCase())) {
      setMessage('Please enter a valid email address.');
      return;
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase(),
        {
          redirectTo: `${window.location.origin}/resetpassword`, 
        }
      );

      if (error) throw error;

      setMessage(
        'Password reset email sent! Please check your inbox and follow the instructions.'
      );
      setEmail('');
    } catch (err) {
      setMessage(`Error: ${err.message}`);
    }
  };

  const goToLanding = () => navigate('/landingpage');

  return (
    <div className="login-container">
      <div className="login-left">
        <img
          src={LibLogo}
          alt="Library Logo"
          className="lib-logo"
          onClick={goToLanding}
          style={{ cursor: 'pointer' }}
        />
        <div className="login-box">
          <h2>Forgot Password</h2>
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {message && <p className="error-message-fp">{message}</p>}

            <button type="submit" className="submit-btn">
              Send Reset Email
            </button>
          </form>
        </div>
      </div>

      <div className="login-right">
        <img
          src={YGALogo}
          alt="School Logo"
          className="school-logo"
          onClick={goToLanding}
          style={{ cursor: 'pointer' }}
        />
        <div className="welcome-text">
          <h1>Welcome to our online school library.</h1>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
