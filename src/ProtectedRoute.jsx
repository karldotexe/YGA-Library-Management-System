import React from "react";
import { Navigate } from "react-router-dom";

/**
 * @param {React.Component} children - The route component to render
 * @param {string} allowedRole - Role allowed to access this route ('admin', 'student', 'parent', 'registrar')
 */
function ProtectedRoute({ children, allowedRole }) {
  // Get sessions from localStorage
  const adminSession = JSON.parse(localStorage.getItem("adminSession"));
  const studentSession = JSON.parse(localStorage.getItem("studentSession"));
  const registrarSession = JSON.parse(localStorage.getItem("registrarSession"));

  // Determine current role
  let role = null;
  if (adminSession) role = "admin";
  else if (studentSession) role = studentSession.role; // 'student' or 'parent'
  else if (registrarSession) role = "registrar";

  // If role does not match allowedRole, redirect to landing page
  if (role !== allowedRole) {
    return <Navigate to="/landingpage" replace />;
  }

  return children;
}

export default ProtectedRoute;