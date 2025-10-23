import React, { useState } from "react";
import { supabase } from "../../../supabase-client";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Accounts.css";

// --- Define validation constants outside the component ---
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedDomains = [
  "@school.edu",
  "@gmail.com",
  "@yahoo.com",
  "@hotmail.com",
  "@outlook.com",
  "@outlook.ph",
  "@icloud.com",
  "@aol.com",
  "@proton.me",
  "@protonmail.com",
  "@zoho.com",
  "@gmx.com",
  "@mail.com",
];
const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

function Accounts() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    role: "Librarian", // Default role
    full_name: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
  });

  // State for field-specific errors
  const [errors, setErrors] = useState({});
  // State for general success/submit messages
  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- Validation function for on-change logic ---
  const validateField = (name, value, currentForm) => {
    // We pass in currentForm because the `form` state isn't updated yet
    const newErrors = { ...errors };

    switch (name) {
      case "email":
        if (!value) {
          delete newErrors.email; // Don't validate empty field
        } else if (!emailRegex.test(value)) {
          newErrors.email = "Please enter a valid email address.";
        } else if (!allowedDomains.some((domain) => value.endsWith(domain))) {
          newErrors.email = "Email must use one of the allowed domains.";
        } else {
          delete newErrors.email;
        }
        break;
      case "password":
        if (!value) {
          delete newErrors.password;
        } else if (!passwordRegex.test(value)) {
          newErrors.password =
            "Password must be at least 8 characters, include 1 uppercase letter and 1 number.";
        } else {
          delete newErrors.password;
        }
        // As password changes, re-validate confirmPassword
        if (
          currentForm.confirmPassword &&
          value !== currentForm.confirmPassword
        ) {
          newErrors.confirmPassword = "Passwords do not match!";
        } else if (newErrors.confirmPassword === "Passwords do not match!") {
           // Clear error if they now match
           delete newErrors.confirmPassword;
        }
        break;
      case "confirmPassword":
        if (!value) {
          delete newErrors.confirmPassword;
        } else if (value !== currentForm.password) {
          newErrors.confirmPassword = "Passwords do not match!";
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      default:
        break;
    }
    setErrors(newErrors);
  };

  // --- handleChange now validates on-the-fly ---
  const handleChange = (e) => {
    const { name, value } = e.target;

    // --- Handle special inputs (from your original code) ---
    if (name === "full_name" || name === "department") {
      if (!/^[A-Za-z\s]*$/.test(value)) {
        return; // Don't update if invalid char
      }
    }

    const processedValue = name === "email" ? value.toLowerCase() : value;

    // Use the setter's callback-like pattern to get the *next* state
    setForm((prev) => {
      const nextState = { ...prev, [name]: processedValue };
      
      // Validate using the *next* state, not the current (stale) one
      validateField(name, processedValue, nextState);
      
      return nextState;
    });
  };

  // --- Master validation function for submit ---
  const validateFormOnSubmit = () => {
    const newErrors = {};

    // Email validation
    if (!form.email) {
      newErrors.email = "Email is required.";
    } else if (!emailRegex.test(form.email)) {
      newErrors.email = "Please enter a valid email address.";
    } else if (!allowedDomains.some((domain) => form.email.endsWith(domain))) {
      newErrors.email = `Email must use one of the allowed domains.`;
    }

    // Password validation
    if (!form.password) {
      newErrors.password = "Password is required.";
    } else if (!passwordRegex.test(form.password)) {
      newErrors.password =
        "Password must be at least 8 characters, include 1 uppercase letter and 1 number.";
    }

    // Confirm Password validation
    if (!form.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password.";
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match!";
    }
    
    setErrors(newErrors);
    // Return true if there are NO errors, false otherwise
    return Object.keys(newErrors).length === 0;
  };

  // --- handleSubmit now uses the master validation ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Clear all previous errors and messages
    setMessage("");
    setIsSuccess(false);

    // --- Run the full validation ---
    const isValid = validateFormOnSubmit();

    // If there are any errors, update state and stop submission
    if (!isValid) {
      return;
    }

    // --- Submission ---
    try {
      // ✅ Check if email already exists
      const { data: existingEmail, error: emailError } = await supabase
        .from("admins")
        .select("email")
        .eq("email", form.email)
        .maybeSingle();

      if (emailError) throw emailError;

      if (existingEmail) {
        // This is a field-specific error, but caught after submit
        setErrors({ email: "This email is already registered." });
        return;
      }

      // Check current number of Librarians
      if (form.role === "Librarian") {
        const { data: librarianCount, error: countError } = await supabase
          .from("admins")
          .select("id", { count: "exact" })
          .eq("role", "Librarian");

        if (countError) throw countError;

        if (librarianCount.length >= 3) {
          setMessage("Maximum of 3 Librarians allowed!");
          setIsSuccess(false); // This is an error message
          return;
        }
      }

      // Register user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.full_name,
            role: form.role,
            department: form.department,
          },
        },
      });

      if (authError) throw authError;

      // Insert into admins table
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .insert([
          {
            full_name: form.full_name,
            email: form.email,
            role: form.role,
            department: form.department,
          },
        ]);

      if (adminError) throw adminError;

      setMessage("Registered successfully! Please verify your email.");
      setIsSuccess(true); // This is a success message
      setForm({
        role: "Librarian",
        full_name: "",
        email: "",
        department: "",
        password: "",
        confirmPassword: "",
      });
      setErrors({}); // Clear errors on success
    } catch (err) {
      setMessage(`${err.message}`);
      setIsSuccess(false);
    }
  };

  // --- CORRECTED JSX RETURN STATEMENT ---
  return (
    <div className="form-container">
      <form className="register-form" onSubmit={handleSubmit}>
        <div className="form-header"></div>

        <label>Role:</label>
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="Librarian">Librarian</option>
          <option value="Registrar">Registrar</option>
        </select>

        <label>Full Name:</label>
        <input
          type="text"
          name="full_name"
          value={form.full_name}
          onChange={handleChange}
          required
        />
        
        <label>Email:</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          required
        />
        {/* Error message for email */}
        {errors.email && <p className="form-error-message">{errors.email}</p>}

        <label>Department:</label>
        <input
          type="text"
          name="department"
          value={form.department}
          onChange={handleChange}
        />

        <label>Password:</label>
        <div className="password-field">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <span
            className="toggle-eye"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        {/* Error message for password */}
        {errors.password && (
          <p className="form-error-message">{errors.password}</p>
        )}

        <label>Confirm Password:</label>
        <div className="password-field">
          <input
            type={showConfirm ? "text" : "password"}
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          <span
            className="toggle-eye"
            onClick={() => setShowConfirm(!showConfirm)}
          >
            {showConfirm ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>
        {/* Error message for confirm password */}
        {errors.confirmPassword && (
          <p className="form-error-message">{errors.confirmPassword}</p>
        )}

        <button type="submit" className="register-btn">
          Register
        </button>

        {/* General message for success or submit errors */}
        {message && (
          <p
            className={
              isSuccess ? "form-message-success" : "form-message-error"
            }
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}

export default Accounts;