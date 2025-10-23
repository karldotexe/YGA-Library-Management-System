import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase-client";
import "./StudentProfile.css";

function StudentProfile() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      // 1️⃣ Get the currently logged-in user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error("Session expired.");
      }

      // 2️⃣ Fetch the student record from the students table
      const { data, error } = await supabase
        .from("students")
        .select("full_name, grade, section, age, gender, contact, email")
        .eq("email", user.email.toLowerCase())
        .maybeSingle(); // safer than single()

      if (error) throw error;
      if (!data) throw new Error("Student record not found.");

      setStudent(data);
    } catch (err) {
      console.error("Error fetching student data:", err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <p className="loading-text">Loading profile...</p>;
  }

  if (!student) {
    return <p className="loading-text">No student data found.</p>;
  }

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header"></div>

        <div className="profile-content">
          <p><strong>Full Name:</strong> {student.full_name}</p>
          <p><strong>Grade:</strong> {student.grade}</p>
          <p><strong>Section:</strong> {student.section}</p>
          <p><strong>Age:</strong> {student.age}</p>
          <p><strong>Gender:</strong> {student.gender}</p>
          <p><strong>Contact:</strong> {student.contact}</p>
          <p><strong>Email:</strong> {student.email}</p>
        </div>
      </div>

      <div className="button-group">
        <button
          className="change-pass-btn"
          onClick={() => navigate("/student/changepassword")}
        >
          Change Password
        </button>
        <button
          className="edit-btn"
          onClick={() => navigate("/student/editprofile")}
        >
          Edit
        </button>
      </div>
    </div>
  );
}

export default StudentProfile;
