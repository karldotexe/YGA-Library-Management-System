import React, { useState } from "react";
import { FaBars, FaSignOutAlt, FaUserCog } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../images/YGALogo.png";
import "./AdminHeader.css";

function AdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  // Map routes to page titles
  const pageTitles = {
    "/admin/dashboard": "Dashboard Overview",
    "/admin/books": "Books",
    "/admin/students": "Students",
    "/admin/borrowed": "Borrowed Books",
    "/admin/request": "Requested Books",
    "/admin/history": "Returned History",
    "/admin/archives": "Archives",
    "/admin/profile": "Profile",
    "/admin/insertbooks": "Books",
    "/admin/editbooks/": "Books",
    "/admin/registeredlist": "Registered List",
    "/admin/changepassword": "Profile",
    "/admin/editprofile": "Profile",
    "/admin/lostbooks": "Lost Books",
    "/admin/overduehistory": "Overdue History",
  };

  // Default title
  let title = "Dashboard";

  // Show "Books" for both insert and edit pages
  if (location.pathname.startsWith("/editbooks") || location.pathname.startsWith("/insertbooks")) {
    title = "Books";
  } else {
    title = pageTitles[location.pathname] || "Dashboard";
  }

  const handleLogout = () => {
    localStorage.removeItem("adminSession");
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/admin/profile");
    setShowDropdown(false);
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        <img src={logo} alt="Logo" className="header-logo" />
        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-right">
        <span className="greeting">Good Day, Librarian</span>
        <div className="menu-wrapper">
          <FaBars
            className="menu-icon"
            onClick={() => setShowDropdown(!showDropdown)}
          />

          {showDropdown && (
            <div className="dropdown-menu">
              <button className="dropdown-item" onClick={goToProfile}>
                <FaUserCog className="dropdown-icon" />
                Profile
              </button>

              <hr className="dropdown-divider" />

              <button className="dropdown-item logout" onClick={handleLogout}>
                <FaSignOutAlt className="dropdown-icon" />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
