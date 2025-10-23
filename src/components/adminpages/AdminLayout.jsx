import { Routes, Route } from "react-router-dom";
import AdminSidebar from "../AdminSidebar";
import AdminHeader from "../AdminHeader";
import Dashboard from "./Dashboard";
import Books from "./Books";
import Borrowed from "./Borrowed";
import Request from "./Request";
import History from "./History";
import Archives from "./Archives";
import Profile from "./Profile";
import InsertBooks from "./InsertBooks";
import EditBooks from "./EditBooks";
import RegisteredList from "./RegisteredList";
import ChangePassword from "./ChangePassword";
import EditProfile from "./EditProfile";
import LostBooks from "./LostBooks";
import OverdueHistory from "./OverdueHistory";

import "./AdminLayout.css";

function AdminLayout() {
  return (
    <div className="admin-layout">
      <AdminSidebar />
      <div className="main-content">
        <AdminHeader />
        <div className="page-content">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="books" element={<Books />} />
            <Route path="borrowed" element={<Borrowed />} />
            <Route path="request" element={<Request />} />
            <Route path="history" element={<History />} />
            <Route path="archives" element={<Archives />} />
            <Route path="profile" element={<Profile />} />
            <Route path="insertbooks" element={<InsertBooks />} />
            <Route path="editbooks/:isbn" element={<EditBooks />} />
            <Route path="registeredlist" element={<RegisteredList />} />
            <Route path="changepassword" element={<ChangePassword />} />
            <Route path="editprofile" element={<EditProfile />} />
            <Route path="lostbooks" element={<LostBooks />} />
            <Route path="overduehistory" element={<OverdueHistory />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
