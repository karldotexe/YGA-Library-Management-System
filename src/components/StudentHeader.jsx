import React, { useState, useEffect } from "react";
import { FaBell, FaSignOutAlt, FaCog } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../../supabase-client";
import "./StudentHeader.css";
import logo from "../images/YGAlogo.png";
import defaultProfile from "../images/student.jpg";

function StudentHeader() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(defaultProfile);
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ Fetch student avatar dynamically
  const fetchStudentAvatar = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Session expired.");

      const { data, error } = await supabase
        .from("students")
        .select("image")
        .eq("auth_user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      if (data?.image) {
        const { data: publicUrlData } = supabase.storage
          .from("student-images")
          .getPublicUrl(data.image);

        if (publicUrlData?.publicUrl) {
          // ✅ Bust cache every time image changes
          setAvatarUrl(`${publicUrlData.publicUrl}?t=${Date.now()}`);
        } else {
          setAvatarUrl(defaultProfile);
        }
      } else {
        setAvatarUrl(defaultProfile);
      }
    } catch (err) {
      console.error("Failed to fetch avatar:", err.message);
      setAvatarUrl(defaultProfile);
    }
  };

 useEffect(() => {
    // --- Define channels outside async function for cleanup ---
    let studentUpdateChannel = null;
    let notificationChannel = null;

    // --- Create an async function inside useEffect to handle async operations ---
    const setupHeader = async () => {
      // Fetch initial data
      fetchStudentAvatar();
      checkNewNotifications();

      // --- Get user ID before setting up notification channel ---
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Don't proceed if user isn't logged in
      if (userError || !user) {
         console.error("User not found for realtime setup:", userError);
         return; 
      }
      const currentUserId = user.id;

      // --- Realtime Subscriptions ---
      studentUpdateChannel = supabase
        .channel("student-image-updates")
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "students", filter: `auth_user_id=eq.${currentUserId}` }, // Filter updates by user ID here too
          (payload) => {
            // Check if the payload's new data matches the current user before fetching avatar
            if (payload.new.auth_user_id === currentUserId) {
                fetchStudentAvatar(); // Refetch avatar on relevant student update
            }
          }
        )
        .subscribe();

      // ✅ Use the fetched currentUserId in the filter
      notificationChannel = supabase
        .channel('new-student-notifications')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen for INSERT or UPDATE
            schema: 'public',
            table: 'borrowed_books',
            // Correctly use the fetched user ID
            filter: `student_id=eq.${currentUserId}` 
          },
          (payload) => {
            // Check if the change resulted in an unread notification
            const newRecord = payload.new;
            // Ensure the record actually belongs to the user (double-check, though filter should handle it)
            if (newRecord?.student_id !== currentUserId) return; 

            const isNotification = newRecord.status === 'approved' || 
                                  newRecord.status === 'declined' || 
                                  (newRecord.status === 'lost' && newRecord.penalty_status === 'paid') ||
                                  (newRecord.status === 'returned' && newRecord.penalty_status === 'paid');
            
            // If it's a new/updated notification and marked unread, show the dot
            if (isNotification && newRecord.is_read === false) {
               setHasNewNotifications(true);
            } 
          }
        )
        .subscribe();
    };

    // --- Call the async setup function ---
    setupHeader();

    // --- Custom Event Listeners (remain the same) ---
    const handleAvatarUpdate = () => { fetchStudentAvatar(); };
    window.addEventListener("student-avatar-updated", handleAvatarUpdate);

    const handleNotificationsRead = () => {
      setHasNewNotifications(false); 
    };
    window.addEventListener("notifications-read", handleNotificationsRead);

    // --- Cleanup ---
    return () => {
      // Unsubscribe from channels if they were successfully created
      if (studentUpdateChannel) {
        supabase.removeChannel(studentUpdateChannel);
      }
      if (notificationChannel) {
        supabase.removeChannel(notificationChannel); 
      }
      window.removeEventListener("student-avatar-updated", handleAvatarUpdate);
      window.removeEventListener("notifications-read", handleNotificationsRead); 
    };
  }, []); // Run only once on mount

  // ✅ Get current page title
  const getPageTitle = () => {
    const path = location.pathname.split("/")[2] || "Dashboard";
    const titles = {
      books: "Books",
      history: "History",
      notification: "Notification",
      studentprofile: "Profile",
      changepassword: "Change Password",
      editprofile: "Edit Profile",
      dashboard: "Dashboard",
    };
    return titles[path] || "Dashboard";
  };

  const handleLogout = () => {
    localStorage.removeItem("studentSession");
    navigate("/login");
  };

  return (
    <header className="student-header">
      <div className="student-header-left">
        <img src={logo} alt="Library Logo" className="student-header-logo" />
        <h2 className="student-header-title">{getPageTitle()}</h2>
      </div>

      <div className="student-header-right">
        <FaBell
          className="student-header-bell"
          onClick={() => navigate("/student/notification")}
          style={{ cursor: "pointer" }}
        />

        <div
          className="student-header-profile"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <img
            src={avatarUrl}
            alt="Profile"
            className="student-header-avatar"
            onError={() => setAvatarUrl(defaultProfile)}
          />
          {dropdownOpen && (
            <div className="student-dropdown">
              <button
                className="student-dropdown-item"
                onClick={() => navigate("/student/studentprofile")}
              >
                <FaCog /> Profile
              </button>
              <hr className="student-dropdown-divider" />
              <button
                className="student-dropdown-item logout"
                onClick={handleLogout}
              >
                <FaSignOutAlt /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default StudentHeader;
