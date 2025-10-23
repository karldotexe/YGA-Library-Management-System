import { Routes, Route } from "react-router-dom";
import LibraryStaffSidebar from "../LibraryStaffSidebar";
import LibraryStaffHeader from "../LibraryStaffHeader";
import Dashboard from "./Dashboard";
import Books from "./Books";
import Students from "./Students";
import Borrowed from "./Borrowed";
import Request from "./Request";
import History from "./History";
import Archives from "./Archives";
import Profile from "./Profile";
import EditBooks from "./EditBooks";
import ChangePassword from "./ChangePassword";
import EditProfile from "./EditProfile";
import LostBooks from "./LostBooks";
import OverdueHistory from "./OverdueHistory";
import InsertBooks from "./InsertBooks";
import RegisteredList from "./RegisteredList";

import "./AdminLayout.css";

function LibraryStaffLayout() {
  return (
    <div className="admin-layout">
      <LibraryStaffSidebar />
      <div className="main-content">
        <LibraryStaffHeader />
        <div className="page-content">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="books" element={<Books />} />
            <Route path="students" element={<Students />} />
            <Route path="borrowed" element={<Borrowed />} />
            <Route path="request" element={<Request />} />
            <Route path="history" element={<History />} />
            <Route path="archives" element={<Archives />} />
            <Route path="profile" element={<Profile />} />
            <Route path="editbooks/:isbn" element={<EditBooks />} />
            <Route path="insertbooks" element={<InsertBooks />} />
            <Route path="changepassword" element={<ChangePassword />} />
            <Route path="editprofile" element={<EditProfile />} />
            <Route path="lostbooks" element={<LostBooks />} />
            <Route path="overduehistory" element={<OverdueHistory />} />
            <Route path="registeredlist" element={<RegisteredList />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default LibraryStaffLayout;
