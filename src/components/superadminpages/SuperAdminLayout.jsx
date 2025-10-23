import { Routes, Route } from "react-router-dom";
import SuperAdminSidebar from "../SuperAdminSidebar"; 
import SuperAdminHeader from "../SuperAdminHeader";  

import Dashboard from "../adminpages/Dashboard";
import Accounts from "../adminpages/Accounts";
import Students from "../adminpages/Students";
import Profile from "../adminpages/Profile";
import ChangePassword from "../adminpages/ChangePassword";  
import EditProfile from "../adminpages/EditProfile";
import RegisteredList from "../adminpages/RegisteredList";
import "./SuperAdminLayout.css";
import AccountsList from "../adminpages/AccountsList";
import SuperAdminDashboard from "./SuperAdminDashboard";

function SuperAdminLayout() {
  return (
    <div className="superadmin-layout">
      <SuperAdminSidebar />
      <div className="main-content">
        <SuperAdminHeader />
        <div className="page-content">
          <Routes>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="students" element={<Students />} />
            <Route path="profile" element={<Profile />} />
            <Route path="changepassword" element={<ChangePassword />} />
            <Route path="editprofile" element={<EditProfile />} />
            <Route path="registeredlist" element={<RegisteredList />} />
            <Route path="accountslist" element={<AccountsList />} />
            <Route path="reports" element={<SuperAdminDashboard />} />
        
        
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminLayout;