import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase-client";
import "./EditProfile.css";

function EditProfile() {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState({
    full_name: "",
    department: "",
    email: "",
    role: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user)
        throw new Error("Session expired. Please log in again.");

      const { data, error } = await supabase
        .from("admins")
        .select("full_name, department, email, role")
        .eq("email", user.email)
        .single();

      if (error || !data) throw new Error("Admin record not found.");
      setAdmin(data);
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // ✅ Allow only letters and spaces for full_name and department
    if (name === "full_name" || name === "department") {
      if (/^[A-Za-z\s]*$/.test(value)) {
        setAdmin((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    setAdmin((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    if (!admin.full_name || !admin.department) {
      setError("Full Name and Department cannot be empty.");
      setSaving(false);
      return;
    }

    try {
      // --- STEP 1: Update the public.admins table ---
      const { error: tableError } = await supabase
        .from("admins")
        .update({ full_name: admin.full_name, department: admin.department })
        .eq("email", admin.email);

      if (tableError) throw tableError;

      // --- STEP 2: Update the auth user's metadata (display name) ---
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: admin.full_name,
        },
      });

      if (authError) throw authError;

      // --- STEP 3: Update the local storage session ---
      // This is crucial so other parts of the app see the new name immediately.
      const adminSession = JSON.parse(localStorage.getItem("adminSession"));
      if (adminSession) {
        // Handle both possible session structures
        // Case 1: Flat structure (from 'admins' table)
        if (adminSession.full_name) {
          adminSession.full_name = admin.full_name;
        }
        // Case 2: Nested Supabase Auth structure
        if (adminSession.user && adminSession.user.user_metadata) {
          adminSession.user.user_metadata.full_name = admin.full_name;
        }
        // Update department as well
        if (adminSession.department) {
           adminSession.department = admin.department;
        }
        
        localStorage.setItem("adminSession", JSON.stringify(adminSession));
      }
      
      // Also update registrar session if it exists and matches
      const registrarSession = JSON.parse(localStorage.getItem("registrarSession"));
      if (registrarSession && registrarSession.email === admin.email) {
         if (registrarSession.full_name) {
          registrarSession.full_name = admin.full_name;
        }
        if (registrarSession.user && registrarSession.user.user_metadata) {
          registrarSession.user.user_metadata.full_name = admin.full_name;
        }
        if (registrarSession.department) {
           registrarSession.department = admin.department;
        }
        localStorage.setItem("registrarSession", JSON.stringify(registrarSession));
      }


      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setError(`Failed to update profile: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    const registrarSession = JSON.parse(
      localStorage.getItem("registrarSession")
    );
    const adminSession = JSON.parse(localStorage.getItem("adminSession"));

    if (adminSession) navigate("/admin/profile");
    else if (registrarSession) navigate("/registrar/profile");
    else navigate("/"); // fallback
  };

  if (loading) return <p className="editprofile-loading-text">Loading...</p>;

  return (
    <div className="editprofile-page">
      <div className="editprofile-card">
        <div className="editprofile-header"></div>
        <div className="editprofile-content">
          <h2>Edit Profile</h2>

          <div className="editprofile-input-group">
            <label>Full Name</label>
            <input
              type="text"
              name="full_name"
              value={admin.full_name}
              onChange={handleChange}
              placeholder="Enter full name"
            />
          </div>

          <div className="editprofile-input-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={admin.department}
              onChange={handleChange}
              placeholder="Enter department"
            />
          </div>

          <div className="editprofile-input-group">
            <label>Email</label>
            <input type="text" value={admin.email} disabled />
          </div>

          {error && <p className="editprofile-error">{error}</p>}
          {success && <p className="editprofile-success">{success}</p>}

          <div className="editprofile-button-group">
            <button
              className="editprofile-cancel-btn"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              className="editprofile-save-btn"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EditProfile;