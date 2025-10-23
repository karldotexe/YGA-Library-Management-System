import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  FaBook,
  FaHistory,
  FaChevronDown,
  FaChevronUp,
  FaExclamationTriangle,
} from "react-icons/fa";
import liblogo from "../images/LibLogo.png";

function StudentSidebar() {
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const toggleHistoryDropdown = (e) => {
    e.preventDefault();
    setIsHistoryOpen(!isHistoryOpen);
  };

  return (
    <div className="sidebar">
      <img src={liblogo} alt="Library Logo" className="sidebar-logo" />
      <hr className="sidebar-divider" />

      <nav className="sidebar-nav">
        {/* Books */}
        <NavLink
          to="/student/books"
          className={({ isActive }) =>
            "sidebar-link" + (isActive ? " active" : "")
          }
        >
          <div className="sidebar-link-content">
            <div>
              <FaBook className="sidebar-icon" /> <span>Books</span>
            </div>
          </div>
        </NavLink>

        {/* History Dropdown */}
        <div className="sidebar-link" onClick={toggleHistoryDropdown}>
          <div className="sidebar-link-content">
            <div>
              <FaHistory className="sidebar-icon" /> <span>History</span>
            </div>
            {isHistoryOpen ? (
              <FaChevronUp className="sidebar-chevron" />
            ) : (
              <FaChevronDown className="sidebar-chevron" />
            )}
          </div>
        </div>

        {/* History Submenu */}
        {isHistoryOpen && (
          <div className="sidebar-submenu">
            <NavLink
              to="/student/history"
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaHistory className="sidebar-icon sub-icon" /> <span>Borrowing History</span>
            </NavLink>
            <NavLink
              to="/student/penaltyhistory"
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaExclamationTriangle className="sidebar-icon sub-icon" /> <span>Penalty History</span>
            </NavLink>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <hr className="sidebar-divider footer-divider" />
        All Rights Reserved @ Young Generation Academy of Caloocan, Inc |{" "}
        {new Date().getFullYear()}
      </div>
    </div>
  );
}

export default StudentSidebar;
