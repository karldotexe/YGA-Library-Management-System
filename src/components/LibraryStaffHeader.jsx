import React, { useState } from "react";
import { FaBars, FaSignOutAlt, FaUserCog } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../images/YGALogo.png";
import "./AdminHeader.css";

function LibraryStaffHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  // Map routes to page titles
  const pageTitles = {
    "/librarystaff/dashboard": "Dashboard",
    "/librarystaff/books": "Books",
    "/librarystaff/students": "Students",
    "/librarystaff/borrowed": "Borrowed",
    "/librarystaff/request": "Request",
    "/librarystaff/history": "History",
    "/librarystaff/archives": "Archives",
    "/librarystaff/profile": "Profile",
    "/librarystaff/insertbooks": "Books",
    "/librarystaff/editbooks": "Books",
    "/librarystaff/registeredlist": "Registered List",
    "/librarystaff/changepassword": "Profile",
    "/librarystaff/editprofile": "Profile",
    "/librarystaff/accountslist": "Admin Accounts",
    "/librarystaff/lostbooks": "Lost Books",
    "/librarystaff/overduehistory": "Overdue History",
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
    navigate("/librarystaff/profile");
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

export default LibraryStaffHeader;
