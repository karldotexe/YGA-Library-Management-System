import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { supabase } from "../../../supabase-client";
import "./StudentChangePass.css"; // reuse existing styles

function StudentChangePass() {
  const navigate = useNavigate();
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const togglePassword = (field) => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate("/student/studentprofile"); // Go back to student profile page
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const { current, new: newPassword, confirm } = passwords;

    // ⚠️ Empty field check
    if (!current || !newPassword || !confirm) {
      setError("Please fill out all fields.");
      return;
    }

    // ⚠️ Password strength validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError("Password must be at least 8 characters long, include 1 capital letter and 1 number.");
      return;
    }

    // ⚠️ Confirm password match
    if (newPassword !== confirm) {
      setError("New passwords do not match!");
      return;
    }

    try {
      // 1️⃣ Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("Session expired. Please log in again.");
        navigate("/login");
        return;
      }

      // 2️⃣ Re-authenticate with current password
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: current,
      });

      if (signInError) {
        setError("Incorrect current password.");
        return;
      }

      // 3️⃣ Update password
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

      if (updateError) {
        setError("Error updating password: " + updateError.message);
        return;
      }

      setSuccess("Password updated successfully!");
      setPasswords({ current: "", new: "", confirm: "" });

    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again later.");
    }
  };

  return (
    <div className="changepass-page">
      <div className="changepass-card">
        <div className="changepass-header"></div>
        <div className="changepass-content">
          <h2>Change Password</h2>
          <form onSubmit={handleSave}>
            {/* Current Password */}
            <div className="input-group">
              <label>Current Password</label>
              <div className="changepass-password-wrapper">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="current"
                  value={passwords.current}
                  onChange={handleChange}
                  placeholder="Enter current password"
                  required
                />
                <span
                  className="changepass-eye-icon"
                  onClick={() => togglePassword("current")}
                >
                  {showPassword.current ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* New Password */}
            <div className="input-group">
              <label>New Password</label>
              <div className="changepass-password-wrapper">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="new"
                  value={passwords.new}
                  onChange={handleChange}
                  placeholder="Enter new password"
                  required
                />
                <span
                  className="changepass-eye-icon"
                  onClick={() => togglePassword("new")}
                >
                  {showPassword.new ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="input-group">
              <label>Confirm New Password</label>
              <div className="changepass-password-wrapper">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirm"
                  value={passwords.confirm}
                  onChange={handleChange}
                  placeholder="Confirm new password"
                  required
                />
                <span
                  className="changepass-eye-icon"
                  onClick={() => togglePassword("confirm")}
                >
                  {showPassword.confirm ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>

            {/* Messages */}
            {error && <p className="error-message">{error}</p>}
            {success && <p className="success-message">{success}</p>}

            {/* Buttons */}
            <div className="changepass-buttons">
              <button
                type="button"
                className="cancel-btn"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button type="submit" className="save-btn">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default StudentChangePass;
