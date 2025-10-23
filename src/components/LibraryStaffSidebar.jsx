import { Link } from "react-router-dom";
import {
  FaHome,
  FaBook,
  FaUserGraduate,
  FaClipboardList,
  FaBookmark,
  FaHistory,
  FaUserCog,
  FaArchive,
} from "react-icons/fa";
import "./AdminSidebar.css";
import liblogo from "../images/liblogo.png";

function LibraryStaffSidebar() {
  return (
    <div className="sidebar">
      <img src={liblogo} alt="Library Logo" className="sidebar-logo" />
      <hr className="sidebar-divider" />
      <nav className="sidebar-nav">
        <Link to="/librarystaff/dashboard" className="sidebar-link">
          <FaHome className="sidebar-icon" /> <span>Dashboard</span>
        </Link>
        <Link to="/librarystaff/books" className="sidebar-link">
          <FaBook className="sidebar-icon" /> <span>Books</span>
        </Link>
        <Link to="/librarystaff/students" className="sidebar-link">
          <FaUserGraduate className="sidebar-icon" /> <span>Students</span>
        </Link>
        <Link to="/librarystaff/borrowed" className="sidebar-link">
          <FaClipboardList className="sidebar-icon" /> <span>Borrowed</span>
        </Link>
        <Link to="/librarystaff/request" className="sidebar-link">
          <FaBookmark className="sidebar-icon" /> <span>Request</span>
        </Link>
        <Link to="/librarystaff/history" className="sidebar-link">
          <FaHistory className="sidebar-icon" /> <span>History</span>
        </Link>
        <Link to="/librarystaff/archives" className="sidebar-link">
          <FaArchive className="sidebar-icon" /> <span>Archives</span>
        </Link>
        <div className="sidebar-footer">
          <hr className="sidebar-divider" />
          All Rights Reserved @ Young Generation Academy of Caloocan, Inc | 2025
        </div>
      </nav>
    </div>
  );
}

export default LibraryStaffSidebar;
