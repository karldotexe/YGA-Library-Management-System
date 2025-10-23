import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUsersCog,
  FaUserGraduate,
  FaChevronDown,
  FaChevronUp,
  FaClipboardList, // Icon for Account List
  FaListUl,        // Icon for Registered List
  FaChartBar,      // ✅ New icon for Reports
} from "react-icons/fa";
import "./SuperAdminSidebar.css";
import liblogo from "../images/liblogo.png";

function SuperAdminSidebar() {
  const [isAccountsOpen, setIsAccountsOpen] = useState(false);
  const [isStudentsOpen, setIsStudentsOpen] = useState(false);

  const toggleAccountsDropdown = (e) => {
    e.preventDefault();
    setIsAccountsOpen(!isAccountsOpen);
    setIsStudentsOpen(false); // Close other dropdown
  };

  const toggleStudentsDropdown = (e) => {
    e.preventDefault();
    setIsStudentsOpen(!isStudentsOpen);
    setIsAccountsOpen(false); // Close other dropdown
  };

  return (
    <div className="sidebar">
      <img src={liblogo} alt="Library Logo" className="sidebar-logo" />
      <hr className="sidebar-divider" />
      <nav className="sidebar-nav">
        
        {/* --- Reports --- */}
        <NavLink
          to="/registrar/reports"
          className={({ isActive }) =>
            "sidebar-link" + (isActive ? " active" : "")
          }
        >
          <div className="sidebar-link-content">
            <div>
              <FaChartBar className="sidebar-icon" /> <span>Reports</span>
            </div>
          </div>
        </NavLink>

        {/* --- Dashboard --- */}
        <NavLink
          to="/registrar/dashboard"
          className={({ isActive }) =>
            "sidebar-link" + (isActive ? " active" : "")
          }
        >
          <div className="sidebar-link-content">
            <div>
              <FaHome className="sidebar-icon" /> <span>Dashboard</span>
            </div>
          </div>
        </NavLink>

        {/* --- Admins Dropdown --- */}
        <div className="sidebar-link" onClick={toggleAccountsDropdown}>
          <div className="sidebar-link-content">
            <div>
              <FaUsersCog className="sidebar-icon" /> <span>Admins</span>
            </div>
            {isAccountsOpen ? (
              <FaChevronUp className="sidebar-chevron" />
            ) : (
              <FaChevronDown className="sidebar-chevron" />
            )}
          </div>
        </div>

        {/* --- Accounts Submenu --- */}
        {isAccountsOpen && (
          <div className="sidebar-submenu">
            <NavLink
              to="/registrar/accounts"
              end
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaUsersCog className="sidebar-icon sub-icon" />{" "}
              <span>Create Account</span>
            </NavLink>

            <NavLink
              to="/registrar/accountslist"
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaClipboardList className="sidebar-icon sub-icon" />{" "}
              <span>Account List</span>
            </NavLink>
          </div>
        )}

        {/* --- Students Dropdown --- */}
        <div className="sidebar-link" onClick={toggleStudentsDropdown}>
          <div className="sidebar-link-content">
            <div>
              <FaUserGraduate className="sidebar-icon" /> <span>Students</span>
            </div>
            {isStudentsOpen ? (
              <FaChevronUp className="sidebar-chevron" />
            ) : (
              <FaChevronDown className="sidebar-chevron" />
            )}
          </div>
        </div>

        {/* --- Students Submenu --- */}
        {isStudentsOpen && (
          <div className="sidebar-submenu">
            <NavLink
              to="/registrar/students"
              end
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaUserGraduate className="sidebar-icon sub-icon" />{" "}
              <span>Register Student</span>
            </NavLink>

            <NavLink
              to="/registrar/registeredlist"
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaListUl className="sidebar-icon sub-icon" />{" "}
              <span>Registered List</span>
            </NavLink>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <hr className="sidebar-divider footer-divider" />
        All Rights Reserved @ Young Generation Academy of Caloocan, Inc |{" "}
        {new Date().getFullYear()}
      </div>
    </div>
  );
}

export default SuperAdminSidebar;
