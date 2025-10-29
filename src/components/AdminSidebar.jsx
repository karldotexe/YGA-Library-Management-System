import React, { useState } from "react";
import { NavLink } from "react-router-dom"; // Use NavLink for active styling
import {
  FaHome,
  FaBook,
  FaClipboardList,
  FaBookmark,
  FaHistory,
  FaArchive,
  FaChevronDown,
  FaChevronUp,
  FaLayerGroup,
  FaClock,         // --- Added icon for Overdue ---
  FaTimesCircle,   // --- Added icon for Lost Books ---
} from "react-icons/fa";
import "./AdminSidebar.css";
import liblogo from "../images/LibLogo.png";

function AdminSidebar() {
  const [isBooksOpen, setIsBooksOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // --- State for History dropdown ---

  const toggleBooksDropdown = (e) => {
    e.preventDefault();
    setIsBooksOpen(!isBooksOpen);
    // Optionally close other dropdowns
    setIsHistoryOpen(false);
  };

  const toggleHistoryDropdown = (e) => { // --- Function to toggle History ---
    e.preventDefault();
    setIsHistoryOpen(!isHistoryOpen);
    // Optionally close other dropdowns
    setIsBooksOpen(false);
  };

  return (
    <div className="sidebar">
      <img src={liblogo} alt="Library Logo" className="sidebar-logo" />
      <hr className="sidebar-divider" />
      <nav className="sidebar-nav">
        {/* Dashboard Link */}
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            "sidebar-link" + (isActive ? " active" : "")
          }
        >
          <div className="sidebar-link-content">
            <div> {/* Icon and text wrapper */}
              <FaHome className="sidebar-icon" /> <span>Dashboard</span>
            </div>
          </div>
        </NavLink>

        {/* --- Books Dropdown Toggle --- */}
        <div className="sidebar-link" onClick={toggleBooksDropdown}>
          <div className="sidebar-link-content">
             <div> {/* Icon and text wrapper */}
               <FaBook className="sidebar-icon" /> <span>Books</span>
             </div>
            {isBooksOpen ? (
              <FaChevronUp className="sidebar-chevron" />
            ) : (
              <FaChevronDown className="sidebar-chevron" />
            )}
          </div>
        </div>

        {/* --- Books Submenu --- */}
        {isBooksOpen && (
          <div className="sidebar-submenu">
            <NavLink
              to="/admin/books"
               end // Add 'end' prop to match only exact path
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaLayerGroup className="sidebar-icon sub-icon" />{" "}
              <span>All Books</span>
            </NavLink>
            <NavLink
              to="/admin/borrowed"
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaClipboardList className="sidebar-icon sub-icon" />{" "}
              <span>Borrowed</span>
            </NavLink>
            <NavLink
              to="/admin/request"
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaBookmark className="sidebar-icon sub-icon" />{" "}
              <span>Request</span>
            </NavLink>
      
            <NavLink
              to="/admin/archives"
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaArchive className="sidebar-icon sub-icon" /> <span>Archives</span>
            </NavLink>
          </div>
        )}


        {/* --- History Dropdown Toggle (NEW) --- */}
        <div className="sidebar-link" onClick={toggleHistoryDropdown}>
          <div className="sidebar-link-content">
             <div> {/* Icon and text wrapper */}
               <FaHistory className="sidebar-icon" /> <span>History</span>
             </div>
            {isHistoryOpen ? (
              <FaChevronUp className="sidebar-chevron" />
            ) : (
              <FaChevronDown className="sidebar-chevron" />
            )}
          </div>
        </div>

        {/* --- History Submenu (NEW) --- */}
        {isHistoryOpen && (
          <div className="sidebar-submenu">
            <NavLink
              to="/admin/history"
              end // Match exact path
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              {/* Using FaHistory again for the general history */}
              <FaHistory className="sidebar-icon sub-icon" />{" "}
              <span>Borrow / Return</span>
            </NavLink>
            <NavLink
              to="/admin/overduehistory"
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaClock className="sidebar-icon sub-icon" />{" "}
              <span>Overdue</span>
            </NavLink>
            <NavLink
              to="/admin/lostbooks"
              className={({ isActive }) =>
                "sidebar-sublink" + (isActive ? " active" : "")
              }
            >
              <FaTimesCircle className="sidebar-icon sub-icon" />{" "}
              <span>Lost Books</span>
            </NavLink>

          </div>

        
        )}

      </nav>
      
      <div className="sidebar-footer">
        <hr className="sidebar-divider footer-divider" />
        All Rights Reserved @ Young Generation Academy of Caloocan, Inc | {new Date().getFullYear()} {/* Dynamically set year */}
      </div>
    </div>
  );
}

export default AdminSidebar;