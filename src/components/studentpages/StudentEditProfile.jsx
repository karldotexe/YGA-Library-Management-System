import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase-client";
import "./StudentEditProfile.css";
import defaultProfile from "../../images/student.jpg";

function StudentEditProfile() {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(defaultProfile);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user)
        throw new Error("Session expired. Please log in again.");

      const { data, error } = await supabase
        .from("students")
        .select("full_name, grade, section, age, gender, contact, email, image")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error("Student record not found.");

      let avatarUrl = defaultProfile;
      if (data.image) {
        const { data: publicData } = supabase.storage
          .from("student-images")
          .getPublicUrl(data.image);
        avatarUrl = `${publicData.publicUrl}?t=${Date.now()}`;
      }

      setStudent({
        ...data, // Store all fetched data
        gender: data.gender || "Male",
        avatar_url: avatarUrl, // Store the public URL
      });

      setPreview(avatarUrl);
    } catch (err) {
      console.error("Error fetching student data:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Input validation handler
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Full Name → letters and spaces only
    if (name === "full_name") {
      if (/^[A-Za-z\s]*$/.test(value)) {
        setStudent((prev) => ({ ...prev, full_name: value }));
      }
      return;
    }

    // Grade → blank or number 1–6
    if (name === "grade") {
      if (
        value === "" ||
        (/^[1-6]$/.test(value) && Number(value) >= 1 && Number(value) <= 6)
      ) {
        setStudent((prev) => ({ ...prev, grade: value }));
      }
      return;
    }

    // Section → letters, numbers, spaces, and dashes only
    if (name === "section") {
      if (/^[A-Za-z0-9\s-]*$/.test(value)) {
        setStudent((prev) => ({ ...prev, section: value }));
      }
      return;
    }

    // Age → digits only, 1–120
    if (name === "age") {
      if (!/^\d*$/.test(value)) return;
      const num = Number(value);
      if (value !== "" && (num < 1 || num > 120)) return;
      setStudent((prev) => ({ ...prev, age: value }));
      return;
    }

    // Contact → only digits, 0–11 max
    if (name === "contact") {
      if (/^\d{0,11}$/.test(value)) {
        setStudent((prev) => ({ ...prev, contact: value }));
      }
      return;
    }

    setStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setError("");
    setSuccess("");
    setSaving(true);

    // ✅ Validation before saving
    if (!student.full_name || !student.section) {
      setError("Full Name and Section cannot be empty.");
      setSaving(false);
      return;
    }

    if (!student.age) {
      setError("Age cannot be empty.");
      setSaving(false);
      return;
    }

    const ageNum = Number(student.age);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError("Age must be between 1 and 120.");
      setSaving(false);
      return;
    }

    // ✅ Contact must be 10–11 digits
    if (
      student.contact &&
      (student.contact.length < 10 || student.contact.length > 11)
    ) {
      setError("Contact number must be 10 or 11 digits.");
      setSaving(false);
      return;
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user)
        throw new Error("Session expired. Please log in again.");

      let imagePath = student.image;
      let newAvatarUrl = student.avatar_url; // Get the current public URL

      // Upload new profile image if selected
      if (selectedFile) {
        if (imagePath) {
          // Attempt to remove old image, ignore error if it fails
          await supabase.storage.from("student-images").remove([imagePath]);
        }

        const fileExt = selectedFile.name.split(".").pop();
        const filePath = `avatars/${user.id}_${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("student-images")
          .upload(filePath, selectedFile, {
            cacheControl: "0",
            upsert: false,
            contentType: selectedFile.type || "image/jpeg",
          });

        if (uploadError) throw uploadError;

        const { data: publicData } = supabase.storage
          .from("student-images")
          .getPublicUrl(filePath);

        imagePath = filePath; // This is the new path
        newAvatarUrl = `${publicData.publicUrl}?t=${Date.now()}`; // This is the new public URL
        setPreview(newAvatarUrl); // Update preview to permanent URL
      }

      // This is the data that will be saved to the database
      const dbUpdates = {
        full_name: student.full_name.trim(),
        grade: student.grade ? Number(student.grade) : null,
        section: student.section.trim(),
        age: Number(student.age),
        gender: student.gender?.toUpperCase() || "MALE",
        contact: student.contact ? Number(student.contact) : null,
        image: imagePath, // Save the path to the DB
      };

      // --- 1. Update public.students table ---
      const { error: updateError } = await supabase
        .from("students")
        .update(dbUpdates)
        .eq("auth_user_id", user.id);

      if (updateError) throw updateError;

      // --- 2. Update auth.user metadata ---
      // This saves the name and public URL to the auth user object
      const { error: authError } = await supabase.auth.updateUser({
        data: {
          full_name: dbUpdates.full_name,
          avatar_url: newAvatarUrl, // Save the *public URL*
        },
      });

      if (authError) {
        console.warn("Auth user metadata not updated:", authError.message);
      }

      // --- 3. Update localStorage ---
      // This makes the StudentProfile page update instantly
      const sessionData = {
        ...student, // Get existing data (like email)
        ...dbUpdates, // Overwrite with new data from the form
        avatar_url: newAvatarUrl, // Add/overwrite the public URL
        image: imagePath, // Ensure path is also updated in session
      };
      localStorage.setItem("studentSession", JSON.stringify(sessionData));
      // --- End Modifications ---

      window.dispatchEvent(new Event("student-avatar-updated"));
      setSuccess("Profile updated successfully!");
      setSelectedFile(null);

      // Navigate back to profile page after 1.5s
      setTimeout(() => {
        navigate("/student/studentprofile");
      }, 1500);
      
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => navigate("/student/studentprofile");

  if (loading || !student)
    return <p className="editprofile-loading-text">Loading...</p>;

  return (
    <div className="editprofile-page">
      <div className="editprofile-card">
        <div className="editprofile-header"></div>
        <div className="editprofile-content">
          <h2>Edit Profile</h2>

          <div className="editprofile-avatar-top">
            <div className="editprofile-avatar-circle">
              <img
                src={preview || defaultProfile}
                alt="Avatar Preview"
                className="editprofile-avatar-img"
              />
            </div>
            <label className="choose-avatar-btn">
              Choose profile picture
              <input type="file" accept="image/*" onChange={handleFileChange} />
            </label>
          </div>

          <div className="editprofile-form-fields">
            <div className="editprofile-input-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={student.full_name || ""}
                onChange={handleChange}
                placeholder="Enter full name"
              />
            </div>

            <div className="editprofile-input-group">
              <label>Grade</label>
              <input
                type="number"
                name="grade"
                value={student.grade || ""}
                onChange={handleChange}
                placeholder="Blank for preschool"
                min="1"
                max="6"
              />
            </div>

            <div className="editprofile-input-group">
              <label>Section / Course</label>
              <input
                type="text"
                name="section"
                value={student.section || ""}
                onChange={handleChange}
                placeholder="Enter section"
              />
            </div>

            <div className="editprofile-input-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={student.age || ""}
                onChange={handleChange}
                placeholder="Enter your age"
                min="1"
                max="120"
              />
            </div>

            <div className="editprofile-input-group">
              <label>Gender</label>
              <select
                name="gender"
                value={student.gender || "Male"}
                onChange={handleChange}
              >
                <option value="Male">MALE</option>
                <option value="Female">FEMALE</option>
              </select>
            </div>

            <div className="editprofile-input-group">
              <label>Contact</label>
              <input
                type="text"
                name="contact"
                value={student.contact || ""}
                onChange={handleChange}
                maxLength="11"
                placeholder="e.g. 09123456789"
              />
            </div>

            <div className="editprofile-input-group">
              <label>Email</label>
              <input type="text" value={student.email || ""} disabled />
            </div>
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

export default StudentEditProfile;