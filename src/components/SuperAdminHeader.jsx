import React, { useState } from "react";
import { FaBars, FaSignOutAlt, FaUserCog } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "../images/YGALogo.png"; // --- Re-added the logo import ---
import "./AdminHeader.css"; // You can reuse the AdminHeader.css

function SuperAdminHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  // Cleaned up page titles for Registrar routes
  const pageTitles = {
    "/registrar/dashboard": "Dashboard",
    "/registrar/reports": "Overview",
    "/registrar/students": "Students",
    "/registrar/accounts": "Accounts",
    "/registrar/accountslist": "Admins List",
    "/registrar/profile": "Profile",
    "/registrar/registeredlist": "Students",
  };

  // Simplified title logic
  let title = pageTitles[location.pathname] || "Dashboard";

  // Logout now removes 'registrarSession'
  const handleLogout = () => {
    localStorage.removeItem("registrarSession"); 
    navigate("/login");
  };

  const goToProfile = () => {
    navigate("/registrar/profile");
    setShowDropdown(false);
  };

  return (
    <header className="admin-header">
      <div className="header-left">
        {/* --- Re-added the logo img tag --- */}
        <img src={logo} alt="Logo" className="header-logo" />
        <h2 className="header-title">{title}</h2>
      </div>

      <div className="header-right">
        {/* Greeting is now 'Registrar' */}
        <span className="greeting">Good Day, Registrar</span>
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

export default SuperAdminHeader;