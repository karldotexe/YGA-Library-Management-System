import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase-client";
import "./Profile.css";

function Profile() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Determine role from localStorage
  const adminSession = JSON.parse(localStorage.getItem("adminSession"));
  const studentSession = JSON.parse(localStorage.getItem("studentSession"));
  const role = adminSession ? "admin" : studentSession?.role; // 'student', 'parent', 'library staff'

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // 1️⃣ Get the currently logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Session expired.");
      }

      // 2️⃣ Fetch the admin/staff record from the admins table
      const { data, error } = await supabase
        .from("admins")
        .select("full_name, department, email, role")
        .eq("email", user.email.toLowerCase())
        .maybeSingle(); // safer than single()

      if (error) throw error;

      if (!data) {
        throw new Error("Admin record not found.");
      }

      setAdmin(data);
    } catch (err) {
      console.error("Error fetching admin data:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="loading-text">Loading profile...</p>;
  }

  if (!admin) {
    return <p className="loading-text">No profile data found.</p>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header"></div>

        <div className="profile-content">
          <p><strong>Role:</strong> {admin.role}</p>
          <p><strong>Full Name:</strong> {admin.full_name}</p>
          <p><strong>Department:</strong> {admin.department}</p>
          <p><strong>Email:</strong> {admin.email}</p>
        </div>
      </div>

      <div className="button-group">
        <button
          className="change-pass-btn"
          onClick={() =>
            navigate(
              role === "admin"
                ? "/admin/changepassword"
                : "/registrar/changepassword"
            )
          }
        >
          Change Password
        </button>
        <button
          className="edit-btn"
          onClick={() =>
            navigate(
              role === "admin"
                ? "/admin/editprofile"
                : "/registrar/editprofile"
            )
          }
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default Profile;
