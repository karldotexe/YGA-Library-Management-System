    import { Routes, Route } from "react-router-dom";
    import StudentSidebar from "../StudentSidebar";
    import StudentHeader from "../StudentHeader";
    import StudentBooks from "./StudentBooks";
    import StudentHistory from "./StudentHistory";
    import StudentProfile from "./StudentProfile";
    import StudentNotification from "./StudentNotification";
    import "./StudentLayout.css";
    import StudentPenaltyHistory from "./StudentPenaltyHistory";



    import StudentChangePass from "./StudentChangepass";
    import StudentEditProfile from "./StudentEditProfile";


    function StudentLayout() {
    return (
        <div className="student-layout">
        {/* Sidebar */}
        <StudentSidebar />

        {/* Main Content */}
        <div className="student-main-content">
            <StudentHeader />
            <div className="student-page-content">
            <Routes>
                <Route path="/books" element={<StudentBooks />} />
                <Route path="/history" element={<StudentHistory />} />
                <Route path="/studentprofile" element={<StudentProfile />} />
                <Route path="/notification" element={<StudentNotification />} />
                <Route path="/changepassword" element={<StudentChangePass />} />
                <Route path="/editprofile" element={<StudentEditProfile />} />
                <Route path="/penaltyhistory" element={<StudentPenaltyHistory />} />

            </Routes>
            </div>
        </div>
        </div>
    );
    }

    export default StudentLayout;
