import React, { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "../supabase-client";
import "./SignUp.css";
import LibLogo from "./images/LibLogo.png";
import YGALogo from "./images/YGALogo.png";
import { useNavigate } from "react-router-dom";

function SignUp() {
  const [step, setStep] = useState(2);
  const [handledBy, setHandledBy] = useState("Student");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    lrn: "",
    full_name: "",
    contact: "",
    grade: "",
    section: "",
    age: "",
    gender: "Male",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleLogoClick = () => navigate("/landingpage");

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "lrn") {
      if (/^\d{0,12}$/.test(value)) setForm((p) => ({ ...p, [name]: value }));
      return;
    }
    if (name === "full_name") {
      if (/^[A-Za-z\s]*$/.test(value)) setForm((p) => ({ ...p, [name]: value }));
      return;
    }
    if (name === "contact") {
      if (/^\d{0,11}$/.test(value)) setForm((p) => ({ ...p, [name]: value }));
      return;
    }
    if (name === "grade") {
      if (value === "" || /^[1-6]$/.test(value))
        setForm((p) => ({ ...p, [name]: value }));
      return;
    }
    if (name === "section") {
      if (/^[A-Za-z0-9\s-]*$/.test(value)) setForm((p) => ({ ...p, [name]: value }));
      return;
    }
    if (name === "age") {
      if (!/^\d*$/.test(value)) return;
      const num = Number(value);
      if (value !== "" && (num < 1 || num > 120)) return;
      setForm((p) => ({ ...p, [name]: value }));
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validateStepOne = async () => {
    setErrors({});
    let newErrors = {};

    if (!form.lrn || !form.full_name || !form.contact || !form.section || !form.age) {
      newErrors.general = "Please fill in all required fields.";
    }
    if (form.lrn.length !== 12) newErrors.lrn = "LRN must be exactly 12 digits.";
    if (form.contact.length < 10 || form.contact.length > 11)
      newErrors.contact = "Contact number must be 10–11 digits.";

    const ageNum = parseInt(form.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120)
      newErrors.age = "Age must be between 1 and 120.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    try {
      const { data: existingStudents, error } = await supabase
        .from("students")
        .select("lrn, auth_user_id")
        .eq("lrn", form.lrn);

      if (error) throw error;
      if (!existingStudents || existingStudents.length === 0) {
        setErrors({ lrn: "LRN not found. Please contact your administrator." });
        return false;
      }

      const studentRecord = existingStudents[0];
      // This is your check: it only allows LRNs where auth_user_id IS null
      if (studentRecord.auth_user_id) {
        setErrors({ lrn: "This LRN is already registered. Please log in instead." });
        return false;
      }
    } catch (err) {
      console.error("Error checking LRN:", err);
      setErrors({ general: "Error checking your LRN. Please try again." });
      return false;
    }

    return true; // LRN exists and is unclaimed. Success!
  };

  const handleNext = async (e) => {
    e.preventDefault();
    if (await validateStepOne()) setStep(3);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");

    // 1. Password validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(form.password)) {
      setErrors({
        password:
          "Password must be at least 8 characters, include one capital letter and one number.",
      });
      return;
    }
    if (form.password !== form.confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    try {
      // 2. Check if email is in the 'admins' table
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from("admins")
        .select("email")
        .eq("email", form.email.trim());

      if (adminCheckError) throw adminCheckError;

      if (adminCheck && adminCheck.length > 0) {
        setErrors({ email: "This email is not available for user registration." });
        return;
      }

      // 3. Check if email is already used by another student
      const { data: emailCheck, error: emailCheckError } = await supabase
        .from("students")
        .select("lrn")
        .eq("email", form.email.trim())
        .neq("lrn", form.lrn);

      if (emailCheckError) throw emailCheckError;

      if (emailCheck && emailCheck.length > 0) {
        setErrors({ email: "This email is already in use by another account." });
        return;
      }

      // 4. Create the Auth account
      const { data: signUpData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
          // ✅ ADDED: Pass metadata here so Login.jsx can read it
          data: {
            role: handledBy === "Parent" ? "parent" : "student",
            lrn: form.lrn,
            full_name: form.full_name.trim()
          }
        },
      });

      if (authError) throw authError;

      // 5. Get auth user ID
      const authUserId = signUpData?.user?.id;

      // 6. Update student table (where lrn matches)
      if (authUserId) {
        const { error: updateError } = await supabase
          .from("students")
          .update({
            auth_user_id: authUserId,
            full_name: form.full_name.trim(),
            // ✅ BUG FIX 1: Convert contact string to number
            contact: parseInt(form.contact.trim(), 10), 
            // ✅ BUG FIX 2: Convert grade string to number or null
            grade: form.grade ? parseInt(form.grade, 10) : null,
            section: form.section.trim(),
            age: parseInt(form.age),
            gender: form.gender,
            email: form.email.trim(),
            handled_by: handledBy,
          })
          .eq("lrn", form.lrn); // Find the pre-registered row

        if (updateError) {
          console.error("Failed to update student record:", updateError);
          // If this fails, we should tell the user
          setErrors({ general: "Error saving student data. Please contact support." });
          return;
        }
      } else {
        // This case should rarely happen, but it's good to handle
        setErrors({ general: "Could not create user account. Please try again." });
        return;
      }

      setSuccess(
        "Signup successful! Please check your email to verify your account before logging in."
      );

      // Reset form
      setForm({
        lrn: "",
        full_name: "",
        contact: "",
        grade: "",
        section: "",
        age: "",
        gender: "Male",
        email: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      if (err.message.includes("User already registered")) {
        setErrors({ email: "This email is already registered." });
      } else {
        setErrors({ general: err.message });
      }
    }
  };


  // === STEP 2: PERSONAL INFO ===
  if (step === 2) {
    return (
      <div className="login-container">
        <div className="login-left">
          <img
            src={LibLogo}
            alt="Library Logo"
            className="lib-logo"
            onClick={handleLogoClick}
          />
          <div className="login-box">
            <h2>Sign Up</h2>
            <div className="signup-form-container">
              <form onSubmit={handleNext}>
                <label>Sign up as:</label>
                <select
                  name="handledBy"
                  value={handledBy}
                  onChange={(e) => setHandledBy(e.target.value)}
                  required
                >
                  <option>Student</option>
                  <option>Parent</option>
                </select>

                <label>LRN:</label>
                <input type="text" name="lrn" value={form.lrn} onChange={handleChange} required />
                {errors.lrn && <p className="inline-error-message">{errors.lrn}</p>}

                <label>Full Name:</label>
                <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required />

                <label>Contact:</label>
                <input type="text" name="contact" value={form.contact} onChange={handleChange} required />
                {errors.contact && <p className="inline-error-message">{errors.contact}</p>}

                <label>Grade:</label>
                <input type="text" name="grade" value={form.grade} onChange={handleChange} placeholder="Blank for preschool" />

                <label>Section/Course:</label>
                <input type="text" name="section" value={form.section} onChange={handleChange} required />

                <label>Age:</label>
                <input type="text" name="age" value={form.age} onChange={handleChange} required />
                {errors.age && <p className="inline-error-message">{errors.age}</p>}

                <label>Gender:</label>
                <select name="gender" value={form.gender} onChange={handleChange} required>
                  <option>Male</option>
                  <option>Female</option>
                </select>

                {errors.general && <p className="error-message">{errors.general}</p>}

                <div className="button-container">
                  <button type="submit" className="next-btn-signup">Next</button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="login-right">
          <img src={YGALogo} alt="School Logo" className="school-logo" />
          <div className="welcome-text">
            <h1>
              Welcome to our
              <br />
              online school library.
            </h1>
          </div>
        </div>
      </div>
    );
  }

  // === STEP 3: ACCOUNT INFO ===
  return (
    <div className="login-container">
      <div className="login-left">
        <img src={LibLogo} alt="Library Logo" className="lib-logo" onClick={handleLogoClick} />
        <div className="login-box">
          <h2>Account Information</h2>
          <form onSubmit={handleSubmit}>
            <label>Email:</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
            {errors.email && <p className="inline-error-message">{errors.email}</p>}

            <label>Password:</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.password && <p className="inline-error-message">{errors.password}</p>}

            <label>Confirm Password:</label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                required
              />
              <span className="eye-icon" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            {errors.confirmPassword && <p className="inline-error-message">{errors.confirmPassword}</p>}

            {errors.general && <p className="error-message">{errors.general}</p>}
            {success && <p className="success-message">{success}</p>}

            <div className="button-container">
              <button type="submit" className="submit-btn-signup">Submit</button>
            </div>
          </form>
        </div>
      </div>

      <div className="login-right">
        <img src={YGALogo} alt="School Logo" className="school-logo" />
        <div className="welcome-text">
          <h1>
            Welcome to our
            <br />
            online school library.
          </h1>
        </div>
      </div>
    </div>
  );
}

export default SignUp;