import React, { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase-client';
import './LogIn.css';
import LibLogo from './images/LibLogo.png';
import YGALogo from './images/YGALogo.png';

function ResetPassword() {
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // Password validation: at least 8 chars, 1 uppercase, 1 number
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setMessage('Password must be at least 8 characters, include 1 uppercase letter and 1 number.');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    try {
      // ✅ Use Supabase to update password for current session
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;

      setMessage('Password reset successfully! You can now log in.');
      setForm({ password: '', confirmPassword: '' });

      // Redirect to login after 2 seconds
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      console.error(err);
      setMessage(err.message || 'Failed to reset password.');
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
          <h2>Reset Password</h2>
          <form onSubmit={handleSubmit}>
            <label>New Password</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <label>Confirm Password</label>
            <div className="password-wrapper">
              <input
                type={showConfirm ? 'text' : 'password'}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            {message && <p className="error-message">{message}</p>}

            <button type="submit" className="submit-btn">Reset Password</button>
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

export default ResetPassword;
