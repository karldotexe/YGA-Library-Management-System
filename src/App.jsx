import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./LandingPage";
import LogIn from "./LogIn";
import SignUp from "./SignUp";
import ForgotPassword from "./ForgotPassword";
import AdminLayout from "./components/adminpages/AdminLayout";
import StudentLayout from "./components/studentpages/StudentLayout";
import RegistrarLayout from "./components/superadminpages/SuperAdminLayout";
import ProtectedRoute from "./ProtectedRoute";
import ResetPassword from "./ResetPassword";

import Footer from "./Footer";

function App() {
  return (
    <div>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/landingpage" element={<LandingPage />} />
          <Route path="/login" element={<LogIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/resetpassword" element={<ResetPassword />} />

          {/* Protected Routes */}
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminLayout />
              </ProtectedRoute>
            }
          />

          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRole="student">
                <StudentLayout />
              </ProtectedRoute>
            }
          />

         
          <Route
            path="/registrar/*"
            element={
              <ProtectedRoute allowedRole="registrar">
                <RegistrarLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
        
      
      <Footer /> 
      </Router>
    </div>
  );
}

export default App;