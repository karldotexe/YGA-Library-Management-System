import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase-client';
import './LogIn.css';
import LibLogo from './images/LibLogo.png';
import YGALogo from './images/YGALogo.png';

function LogIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Check for existing sessions on load
  useEffect(() => {
    const registrarSession = JSON.parse(localStorage.getItem('registrarSession'));
    const adminSession = JSON.parse(localStorage.getItem('adminSession'));
    // const libraryStaffSession = JSON.parse(localStorage.getItem('libraryStaffSession')); // --- REMOVED ---
    const studentSession = JSON.parse(localStorage.getItem('studentSession'));

    // Redirect if any session exists
    if (registrarSession) {
      navigate('/registrar/dashboard');
    } else if (adminSession) {
      navigate('/admin/dashboard');
    // --- REMOVED libraryStaffSession check ---
    } else if (studentSession) {
      navigate('/student/books');
    }
  }, [navigate]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // 1️⃣ Sign in using Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      const user = data?.user;

      if (authError || !user) {
        setError('Invalid email or password.');
        return;
      }

      // 2️⃣ Verify if email is confirmed
      if (!user.email_confirmed_at) {
        setError('Please verify your email before logging in.');
        await supabase.auth.signOut();
        return;
      }

      // 3️⃣ Identify user role from metadata
      const role = user.user_metadata?.role?.toLowerCase();
      
      // --- REMOVED 'library staff' from the list of valid roles ---
      if (!role || !['student', 'parent', 'librarian', 'registrar'].includes(role)) {
        setError('Access denied.');
        return;
      }

      // 4️⃣ Handle login by role
      if (role === 'librarian') {
        localStorage.setItem(
          'adminSession',
          JSON.stringify({
            email: user.email,
            role: 'admin',
            full_name: user.user_metadata?.full_name || 'Admin',
          })
        );
        navigate('/admin/dashboard');
      }
      
      else if (role === 'registrar') {
        localStorage.setItem(
          'registrarSession',
          JSON.stringify({
            email: user.email,
            role: 'registrar',
            full_name: user.user_metadata?.full_name || 'Registrar',
          })
        );
        navigate('/registrar/dashboard');
      }

      // --- REMOVED 'library staff' block ---

      else if (role === 'student' || role === 'parent') {
        // 5️⃣ Fetch student data
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('auth_user_id', user.id)
          .single();

        if (studentError || !student) {
          setError('Student record not found.');
          return;
        }

        // 6️⃣ Store session data locally
        localStorage.setItem(
          'studentSession',
          JSON.stringify({
            email: user.email,
            role,
            full_name: student.full_name,
            lrn: student.lrn,
            grade: student.grade,
            section: student.section,
            age: student.age,
            contact: student.contact,
            gender: student.gender,
            handled_by: student.handled_by,
          })
        );

        navigate('/student/books');
      }

    } catch (err) {
      console.error(err);
      setError('Error connecting to database.');
    }
  };

  const goToLanding = () => navigate('/landingpage');
  const goToForgotPassword = () => navigate('/forgot-password');

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
          <h2>Log In</h2>
          <form onSubmit={handleSubmit}>
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label>Password</label>
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

            {error && <p className="error-message-login">{error}</p>}

            <button type="submit" className="submit-btn">Log In</button>
          </form>

          <a className="forgot-password" onClick={goToForgotPassword}>
            Forgot Password?
          </a>
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
          <h1>Welcome to our<br />online school library.</h1>
        </div>
      </div>
    </div>
  );
}

export default LogIn;