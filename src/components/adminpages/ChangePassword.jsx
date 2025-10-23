import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "../../../supabase-client";
import "./ChangePassword.css"; // Ensure path is correct

function ChangePassword() {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [role, setRole] = useState(""); // store user role

  // Fetch current user role
  useEffect(() => {
    const fetchRole = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (user && !userError) {
        // Check if user exists in admins table
        const { data: adminData } = await supabase
          .from("admins")
          .select("role")
          .eq("email", user.email.toLowerCase())
          .maybeSingle();

        if (adminData?.role) {
          setRole(adminData.role);
        } else {
            // Assume library staff if not found in admins (or any other logic you have)
             const { data: staffData } = await supabase
              .from("library_staff") // Assuming you have a library_staff table
              .select("role") // Assuming it has a role column
              .eq("email", user.email.toLowerCase())
              .maybeSingle();

            if (staffData?.role) {
                 setRole(staffData.role); // Or just "library staff"
            } else {
                 console.warn("User role not found in admins or library_staff.");
                 // Handle unknown role - maybe navigate away or show error
                 // For now, defaulting, but you might want better handling
                 setRole("unknown");
            }
        }
      } else if (userError) {
          console.error("Error fetching user:", userError);
          // Handle error, maybe navigate to login
           navigate("/login");
      }
    };
    fetchRole();
  }, [navigate]); // Added navigate to dependency array

  const togglePassword = (field) => setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

   const handleCancel = () => {
      const registrarSession = JSON.parse(localStorage.getItem("registrarSession"));
      const adminSession = JSON.parse(localStorage.getItem("adminSession"));

      if (adminSession) navigate("/admin/profile");
      else if (registrarSession) navigate("/registrar/profile");
      else navigate("/"); // fallback
};


  const handleSave = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");

    const { current, new: newPassword, confirm } = passwords;
    if (!current || !newPassword || !confirm) { setError("Please fill out all fields."); return; }

    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) { setError("Password must be at least 8 characters long, include 1 capital letter and 1 number."); return; }

    if (newPassword !== confirm) { setError("New passwords do not match!"); return; }

    try {
      // Re-verify user identity with current password before updating
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Session error. Please log in again.");
        navigate("/login");
        return;
      }

      // Check current password validity by attempting a sign-in (Supabase doesn't have a direct check method)
      // This is a common workaround, but be aware it might trigger sign-in events if audited.
      // A better approach might be a custom RPC function if security is paramount.
      const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: current
      });

      // If signInError occurs, it means the current password was incorrect.
      if (signInError) {
          // Differentiate between generic errors and invalid credentials
          if (signInError.message.includes("Invalid login credentials")) {
               setError("Incorrect current password.");
          } else {
               setError("Error verifying current password: " + signInError.message);
          }
          return;
      }

      // If sign-in was successful (password correct), proceed to update
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setError("Error updating password: " + updateError.message);
        return;
      }

      setSuccess("Password updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" }); // Clear fields
      // Optionally navigate away after a short delay
      // setTimeout(() => navigate based on role, 2000);

    } catch (err) {
      console.error("Password change error:", err);
      // Avoid exposing detailed internal errors to the user
      setError("Something went wrong. Please try again later.");
    }
  };

  return (
    // ✅ Renamed class
    <div className="change-pass-page">
      {/* ✅ Renamed class */}
      <div className="change-pass-card">
        {/* ✅ Renamed class */}
        <div className="change-pass-header"></div>
        {/* ✅ Renamed class */}
        <div className="change-pass-content">
          <h2>Change Password</h2>
          <form onSubmit={handleSave}>
            {/* Current Password */}
            {/* ✅ Renamed class */}
            <div className="change-pass-input-group">
              <label>Current Password</label>
              {/* ✅ Renamed class */}
              <div className="change-pass-password-wrapper">
                <input type={showPassword.current ? "text" : "password"} name="current" value={passwords.current} onChange={handleChange} placeholder="Enter current password" required />
                {/* ✅ Renamed class */}
                <span className="change-pass-eye-icon" onClick={() => togglePassword("current")}>
                  {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* New Password */}
            {/* ✅ Renamed class */}
            <div className="change-pass-input-group">
              <label>New Password</label>
              {/* ✅ Renamed class */}
              <div className="change-pass-password-wrapper">
                <input type={showPassword.new ? "text" : "password"} name="new" value={passwords.new} onChange={handleChange} placeholder="Enter new password" required />
                {/* ✅ Renamed class */}
                <span className="change-pass-eye-icon" onClick={() => togglePassword("new")}>
                  {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Confirm New Password */}
            {/* ✅ Renamed class */}
            <div className="change-pass-input-group">
              <label>Confirm New Password</label>
              {/* ✅ Renamed class */}
              <div className="change-pass-password-wrapper">
                <input type={showPassword.confirm ? "text" : "password"} name="confirm" value={passwords.confirm} onChange={handleChange} placeholder="Confirm new password" required />
                {/* ✅ Renamed class */}
                <span className="change-pass-eye-icon" onClick={() => togglePassword("confirm")}>
                  {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Messages */}
            {/* ✅ Renamed class */}
            {error && <p className="change-pass-error-message">{error}</p>}
            {/* ✅ Renamed class */}
            {success && <p className="change-pass-success-message">{success}</p>}

            {/* Buttons */}
            {/* ✅ Renamed class */}
            <div className="change-pass-buttons">
              {/* ✅ Renamed class */}
              <button type="button" className="change-pass-cancel-btn" onClick={handleCancel}>Cancel</button>
              {/* ✅ Renamed class */}
              <button type="submit" className="change-pass-save-btn">Save</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;