import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import "./Dashboard.css";
// Import necessary icons
import {
  FaUsers, FaUserCheck, FaCalendarAlt, FaBook, FaUndo, FaHourglassHalf,
  FaExclamationTriangle, FaBoxOpen, FaUserClock, FaArchive, FaRegTimesCircle,
  FaRegCheckCircle, FaBookmark, FaUserPlus, FaListOl,
  FaUserSlash
} from "react-icons/fa";

// --- STUDENT DETAILS MODAL COMPONENT ---
function StudentDetailsModal({ student, onClose }) {
  if (!student) return null;

  const defaultAvatar = "/default-avatar.png";

  return (
    <div className="modal-overlay student-modal-overlay" onClick={onClose}>
      <div className="modal-content student-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <img
          src={student.image || defaultAvatar}
          alt={student.full_name || "Student"}
          className="modal-student-image"
          onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
        />
        <div className="modal-student-details">
          <h3>{student.full_name || "N/A"}</h3>
          <div className="details-grid">
            <p><strong>LRN:</strong> {student.lrn || "N/A"}</p>
            <p><strong>Grade:</strong> {student.grade || "N/A"}</p>
            <p><strong>Section:</strong> {student.section || "N/A"}</p>
            <p><strong>Age:</strong> {student.age || "N/A"}</p>
            <p><strong>Gender:</strong> {student.gender || "N/A"}</p>
            <p><strong>Contact:</strong> {student.contact || "N/A"}</p>
            <p className="detail-email"><strong>Email:</strong> {student.email || "N/A"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- END STUDENT DETAILS MODAL COMPONENT ---

// --- BOOK DETAILS MODAL COMPONENT ---
function BookDetailsModal({ book, onClose }) {
  if (!book) return null;


  return (
    <div className="modal-overlay book-modal-overlay" onClick={onClose}>
      <div className="modal-content book-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <div className="modal-book-details">
          <h3>{book.title || "N/A"}</h3>
          <div className="details-grid">
            <p><strong>Author:</strong> {book.author || "N/A"}</p>
            <p><strong>Genre:</strong> {book.genre || "N/A"}</p>
            <p><strong>Year:</strong> {book.year || "N/A"}</p>
            <p><strong>Copies Left:</strong> {book.copies || "N/A"}</p>
            <p><strong>Price:</strong> ₱{book.price ? Number(book.price).toFixed(2) : "0.00"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
// --- END BOOK DETAILS MODAL COMPONENT ---

// --- TOP LIST MODAL COMPONENT ---
function TopListModal({ title, list, onClose, renderItem }) {
  if (!list || list.length === 0) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content top-list-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>&times;</button>
        <h3>{title}</h3>
        <div className="top-list-modal-body">
          <ol className="top-list">
            {list.map(renderItem)}
          </ol>
        </div>
      </div>
    </div>
  );
}
// --- END TOP LIST MODAL COMPONENT ---


export default function Dashboard() {
  const [stats, setStats] = useState({
      inactiveStudents: 0,
      registeredStudents: 0,
      avgSession: "0d",
      totalBooks: 0,
      unreturned: 0,
      returnedBooks: 0,
      pendingRequests: 0,
      archivedBooks: 0,
      borrowedThisWeek: 0,
      overdueBooks: 0,
      lostBooks: 0,
      unpaidLostBooks: 0,
  });
  const [topBorrowers, setTopBorrowers] = useState([]);
  const [topBooks, setTopBooks] = useState([]);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showTopBooksModal, setShowTopBooksModal] = useState(false);
  const [showTopBorrowersModal, setShowTopBorrowersModal] = useState(false);

  useEffect(() => {
      fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);
      try {
        // Date boundaries
        const now = new Date();
        const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // --- Parallel fetching ---
        const [
          studentsRes, booksRes, borrowedRes, archivesRes, recentStudentsRes
        ] = await Promise.all([
          supabase.from("students").select("auth_user_id", { count: 'exact' }),
          supabase.from("books").select("book_id", { count: 'exact' }),
          supabase.from("borrowed_books").select("id, status, borrow_date, due_date, return_date, borrow_days, penalty_status, student_id, book_id, created_at"),
          supabase.from("archives").select("book_id", { count: 'exact' }),
          supabase.from("students")
            .select("id, full_name, lrn, grade, section, created_at, image, contact, age, gender, email")
            .not('full_name', 'is', null)
            .not('full_name', 'eq', '')
            .not('email', 'is', null)
            .not('email', 'eq', '')
            .order('created_at', { ascending: false })
            .limit(5)
        ]);

        // Error Handling
        if (studentsRes.error) throw new Error(`Students: ${studentsRes.error.message}`);
        if (booksRes.error) throw new Error(`Books: ${booksRes.error.message}`);
        if (borrowedRes.error) throw new Error(`Borrowed: ${borrowedRes.error.message}`);
        if (archivesRes.error) throw new Error(`Archives: ${archivesRes.error.message}`);
        if (recentStudentsRes.error) throw new Error(`Recent Students: ${recentStudentsRes.error.message}`);

        // Process Results
        const borrowed = borrowedRes.data || [];
        let recentStudentsData = recentStudentsRes.data || [];

        // --- Generate Public URLs for Recent Student Images ---
        if (recentStudentsData.length > 0) {
          recentStudentsData = recentStudentsData.map(student => {
            let imageUrl = null;
            if (student.image) {
              const { data } = supabase.storage
                .from('student-images')
                .getPublicUrl(student.image);

              if (data?.publicUrl) {
                imageUrl = data.publicUrl;
              } else {
                console.warn(`Could not get public URL for: ${student.image}`);
              }
            }
            return { ...student, image: imageUrl };
          });
        }

        // Calculate Stats
        const registeredStudents = studentsRes.count || 0;
        const totalBooks = booksRes.count || 0;
        const archivedBooks = archivesRes.count || 0;

        let returnedCount = 0, pendingRequests = 0, borrowedThisWeekCount = 0, currentlyOverdueCount = 0;
        let currentlyBorrowedCount = 0, lostCount = 0, unpaidLostCount = 0, totalBorrowDaysSum = 0;
        const borrowsThisMonth = [];

        borrowed.forEach((b) => {
          totalBorrowDaysSum += b.borrow_days || 0;
          const borrowDate = b.borrow_date ? new Date(b.borrow_date) : null;
          const dueDateString = b.due_date?.replace(' ', 'T');
          const dueDate = dueDateString ? new Date(dueDateString) : null;
            if(dueDate) dueDate.setHours(0,0,0,0);
          const createdDate = b.created_at ? new Date(b.created_at) : null;

          if (b.status === "returned") returnedCount++;
          if (b.status === "pending") pendingRequests++;
          if (b.status === "lost") {
              lostCount++;
              if (b.penalty_status === 'unpaid' || b.penalty_status === 'pending') unpaidLostCount++;
            }
            if (b.status === "approved" && !b.return_date) {
              currentlyBorrowedCount++;
              if (dueDate && dueDate < todayStart) currentlyOverdueCount++;
            }
            if (borrowDate) {
              const normalizedBorrowDate = new Date(borrowDate);
              normalizedBorrowDate.setHours(0,0,0,0);
              if (normalizedBorrowDate >= startOfWeek) borrowedThisWeekCount++;
            }
            const firstDayOfMonthLocal = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDayOfMonthLocal = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
            if(createdDate && createdDate >= firstDayOfMonthLocal && createdDate <= lastDayOfMonthLocal) {
              borrowsThisMonth.push(b);
            }
        });
        const avgSession = borrowed.length ? `${Math.round(totalBorrowDaysSum / borrowed.length)}d` : "0d";

        // Calculate Top Borrowers & Active/Inactive Students
        const borrowerCounts = borrowsThisMonth.reduce((acc, borrow) => { if (borrow.student_id) { acc[borrow.student_id] = (acc[borrow.student_id] || 0) + 1; } return acc; }, {});

        const activeStudentsThisMonth = Object.keys(borrowerCounts).length;
        const inactiveStudentsThisMonth = registeredStudents - activeStudentsThisMonth;

        const sortedBorrowerIds = Object.entries(borrowerCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([id]) => id);
        let topBorrowersList = [];

        if (sortedBorrowerIds.length > 0) {
          const { data: topStudentData, error: topStudentError } = await supabase
            .from('students')
            .select('auth_user_id, full_name, lrn, grade, section, image, contact, age, gender, email')
            .in('auth_user_id', sortedBorrowerIds);

          if (topStudentError) throw topStudentError;

          const processedTopStudentData = topStudentData.map(student => {
            let imageUrl = null;
            if (student.image) {
              const { data } = supabase.storage.from('student-images').getPublicUrl(student.image);
              if (data?.publicUrl) imageUrl = data.publicUrl;
            }
            return { ...student, image: imageUrl };
          });

          const studentMap = (processedTopStudentData || []).reduce((m, s) => {
            m[s.auth_user_id] = s;
            return m;
          }, {});

          // --- MODIFICATION: Filter out non-existent students ---
          topBorrowersList = sortedBorrowerIds.map(id => {
            const student = studentMap[id];
            if (!student) return null; // Skip if student not found
            return {
              student: student,
              count: borrowerCounts[id]
            };
          }).filter(Boolean); // Removes all null entries
        }

        // Calculate Top Books
        const bookCounts = borrowsThisMonth.reduce((acc, borrow) => { if (borrow.book_id) { acc[borrow.book_id] = (acc[borrow.book_id] || 0) + 1; } return acc; }, {});
        const sortedBookIds = Object.entries(bookCounts).sort(([, a], [, b]) => b - a).slice(0, 10).map(([id]) => id);
        let topBooksList = [];

        if (sortedBookIds.length > 0) {
          const numIds = sortedBookIds.map(id => parseInt(id, 10));
          const { data: topBookData, error: topBookError } = await supabase
            .from('books')
            .select('book_id, title, author, genre, year, copies, price, image')
            .in('book_id', numIds);

          if (topBookError) throw topBookError;

          const processedTopBookData = topBookData.map(book => {
            let imageUrl = null;
            if (book.image) {
              const { data } = supabase.storage.from('book-images').getPublicUrl(book.image);
              if (data?.publicUrl) imageUrl = data.publicUrl;
            }
            return { ...book, image: imageUrl };
          });

          const bookMap = (processedTopBookData || []).reduce((m, b) => {
            m[b.book_id] = b;
            return m;
          }, {});

          // --- MODIFICATION: Filter out non-existent books ---
          topBooksList = sortedBookIds.map(id => {
            const book = bookMap[parseInt(id, 10)];
            if (!book) return null; // Skip if book not found
            return {
              book: book,
              count: bookCounts[id]
            };
          }).filter(Boolean); // Removes all null entries
        }

        // Update state
        setStats({
          inactiveStudents: inactiveStudentsThisMonth,
          registeredStudents,
          avgSession,
          totalBooks,
          unreturned: currentlyBorrowedCount,
          returnedBooks: returnedCount,
          pendingRequests,
          archivedBooks,
          borrowedThisWeek: borrowedThisWeekCount,
          overdueBooks: currentlyOverdueCount,
          lostBooks: lostCount,
          unpaidLostBooks: unpaidLostCount,
        });
        setTopBorrowers(topBorrowersList);
        setTopBooks(topBooksList);
        setRecentStudents(recentStudentsData);

      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError(`Failed to load dashboard data: ${err.message || err}`);
      } finally {
          setLoading(false);
      }
  };

    if (loading) { return <div className="dashboard-loading">Loading Dashboard Data...</div>; }
    if (error) { return <div className="dashboard-error">⚠️ Error: {error}</div>; }

  const defaultAvatar = "/default-avatar.png";

  return (
    <div className="dashboard-container">

      {/* Grid Layout */}
      <div className="dashboard-grid">

        <div className="dash-card stat-card primary"><div className="stat-header"><FaUsers className="stat-icon"/><span>Registered Students</span></div><div className="stat-value">{stats.registeredStudents}</div></div>
        <div className="dash-card stat-card">
         <div className="stat-header">
           <FaUserSlash className="stat-icon"/>
           <span>Inactive Students (This Month)</span>
         </div>
         <div className="stat-value">{stats.inactiveStudents}</div>
        </div>


        <div className="dash-card stat-card"><div className="stat-header"><FaCalendarAlt className="stat-icon"/><span>Avg. Borrow Days</span></div><div className="stat-value">{stats.avgSession}</div></div>
        <div className="dash-card stat-card"><div className="stat-header"><FaBook className="stat-icon"/><span>Total Books</span></div><div className="stat-value">{stats.totalBooks}</div></div>
        <div className="dash-card stat-card"><div className="stat-header"><FaHourglassHalf className="stat-icon"/><span>Currently Borrowed</span></div><div className="stat-value">{stats.unreturned}</div></div>
        <div className="dash-card stat-card"><div className="stat-header"><FaUndo className="stat-icon"/><span>Total Returned</span></div><div className="stat-value">{stats.returnedBooks}</div></div>
        <div className="dash-card stat-card"><div className="stat-header"><FaBookmark className="stat-icon"/><span>Pending Requests</span></div><div className="stat-value">{stats.pendingRequests}</div></div>
        <div className="dash-card stat-card"><div className="stat-header"><FaArchive className="stat-icon"/><span>Archived Books</span></div><div className="stat-value">{stats.archivedBooks}</div></div>
        <div className="dash-card stat-card"><div className="stat-header"><FaUserClock className="stat-icon"/><span>Borrowed This Week</span></div><div className="stat-value">{stats.borrowedThisWeek}</div></div>
        <div className="dash-card stat-card"><div className="stat-header"><FaExclamationTriangle className="stat-icon"/><span>Currently Overdue</span></div><div className="stat-value">{stats.overdueBooks}</div></div>
        <div className="dash-card stat-card"><div className="stat-header"><FaRegTimesCircle className="stat-icon"/><span>Total Lost Books</span></div><div className="stat-value">{stats.lostBooks}</div></div>
        <div className="dash-card stat-card"><div className="stat-header"><FaRegCheckCircle className="stat-icon"/><span>Unpaid Lost Books</span></div><div className="stat-value">{stats.unpaidLostBooks}</div></div>

        {/* --- Recent Students Card --- */}
        <div className="dash-card recent-students-card">
          <div className="card-header">
            <h3><FaUserPlus /> Recent Registered Students</h3>
          </div>
          <ul className="student-list">
            {recentStudents.length > 0 ? (
              recentStudents.map(student => (
                <li
                  key={student.id}
                  className="student-item"
                  onClick={() => setSelectedStudent(student)}
                >
                 <div className="student-info">
                   <img
                      src={student.image || defaultAvatar}
                      alt={student.full_name || 'Avatar'}
                      className="student-avatar-img"
                      onError={(e) => { e.target.onerror = null; e.target.src = defaultAvatar; }}
                   />
                   <div>
                     <span className="student-name">{student.full_name || 'N/A'}</span>
                     <span className="student-detail">LRN: {student.lrn || 'N/A'} | G{student.grade || '?'} - {student.section || 'N/A'}</span>
                   </div>
                 </div>
                 <span className="student-timestamp">
                   {student.created_at ? new Date(student.created_at).toLocaleDateString() : ''}
                 </span>
                </li>
              ))
            ) : (
              <p className="no-data">No recent valid registrations.</p>
            )}
          </ul>
        </div>

        {/* --- Top Books Card --- */}
        <div
         className="dash-card top-list-card clickable-card"
         onClick={() => setShowTopBooksModal(true)}
        >
          <div className="card-header"> <h3><FaListOl /> Top Books Borrowed <br /> (This Month)</h3> </div>
          {topBooks.length > 0 ? (
            <ol className="top-list">
              {topBooks.map(({ book, count }, index) => (
                <li
                  key={book.book_id || index}
                  className="list-item clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBook(book);
                  }}
                >
                  <span className="rank">{index + 1}.</span>
                  <span className="name">{book.title}</span>
                  <span className="count">{count}</span>
                </li>
              ))}
            </ol>
          ) : ( 
            // --- MODIFICATION: Updated empty state message ---
            <p className="no-data">No valid top books this month.</p>
          )}
        </div>

        {/* --- Top Borrowers Card --- */}
        <div
         className="dash-card top-list-card clickable-card"
         onClick={() => setShowTopBorrowersModal(true)}
        >
          <div className="card-header"> <h3><FaListOl /> Top Borrowers <br />(This Month)</h3> </div>
          {topBorrowers.length > 0 ? (
            <ol className="top-list">
              {topBorrowers.map(({ student, count }, index) => (
                <li
                  key={student.auth_user_id || index}
                  className="list-item clickable"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedStudent(student);
                  }}
                >
                  <span className="rank">{index + 1}.</span>
                  <span className="name">{student.full_name}</span>
                  <span className="count">{count} borrows</span>
                </li>
              ))}
            </ol>
          ) : ( 
            // --- MODIFICATION: Updated empty state message ---
            <p className="no-data">No valid top borrowers this month.</p>
          )}
        </div>

      </div> {/* End Grid */}

      {/* --- Render ALL Modals --- */}
      <StudentDetailsModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
      <BookDetailsModal
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />

      {/* --- RENDER NEW LIST MODALS --- */}
      {showTopBooksModal && (
        <TopListModal
          title="Top Books Borrowed"
          list={topBooks}
          onClose={() => setShowTopBooksModal(false)}
          renderItem={({ book, count }, index) => (
            <li
              key={book.book_id || index}
              className="list-item clickable"
              onClick={() => {
                setSelectedBook(book);
                setShowTopBooksModal(false);
              }}
            >
              <span className="rank">{index + 1}.</span>
              <span className="name">{book.title}</span>
              <span className="count">{count}</span>
            </li>
          )}
        />
      )}

      {showTopBorrowersModal && (
        <TopListModal
          title="Top Borrowers"
          list={topBorrowers}
          onClose={() => setShowTopBorrowersModal(false)}
          renderItem={({ student, count }, index) => (
            <li
              key={student.auth_user_id || index}
              className="list-item clickable"
              onClick={() => {
                setSelectedStudent(student);
                setShowTopBorrowersModal(false);
              }}
            >
              <span className="rank">{index + 1}.</span>
              <span className="name">{student.full_name}</span>
              <span className="count">{count} borrows</span>
            </li>
          )}
        />
      )}

    </div> // End Container
  );
}