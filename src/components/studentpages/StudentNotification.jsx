import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client.js";
import "./StudentNotification.css";

// Import necessary icons if needed
import { FaCheckCircle, FaUndoAlt } from "react-icons/fa";

// --- 1. Define Limit ---
const INITIAL_NOTIFICATION_LIMIT = 5; // Show 5 notifications initially

function StudentNotification() {
  const [notifications, setNotifications] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  // --- 2. Add State for Toggling ---
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    // ... (fetchNotifications logic remains exactly the same as before)
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) throw userError || new Error("User not found");
      const studentId = user.id;

      const { data: allBorrowed, error } = await supabase
        .from("borrowed_books")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false });
      if (error) throw error;

      const approvalDeclinedRecords = allBorrowed.filter(b => b.status === 'approved' || b.status === 'declined');
      const paidLostRecords = allBorrowed.filter(b => b.status?.toLowerCase() === 'lost' && b.penalty_status?.toLowerCase() === 'paid');
      const paidOverdueRecords = allBorrowed.filter(b => b.status?.toLowerCase() === 'returned' && b.penalty_status?.toLowerCase() === 'paid');
      const returnedOkRecords = allBorrowed.filter(b => b.status?.toLowerCase() === 'returned' && (!b.penalty_fee || Number(b.penalty_fee) === 0) && b.penalty_status?.toLowerCase() !== 'paid');

      const fetchTitles = async (records) => {
        if (!records || records.length === 0) return [];
        return Promise.all(
          records.map(async (record) => {
            const { data: bookData } = await supabase.from("books").select("title").eq("book_id", record.book_id).maybeSingle();
            return { ...record, bookTitle: bookData?.title || "Unknown Title" };
          })
        );
      };

      const [approvalDeclinedWithBooks, paidLostWithBooks, paidOverdueWithBooks, returnedOkWithBooks] = await Promise.all([
         fetchTitles(approvalDeclinedRecords),
         fetchTitles(paidLostRecords),
         fetchTitles(paidOverdueRecords),
         fetchTitles(returnedOkRecords)
      ]);

      const allNotifications = [...approvalDeclinedWithBooks, ...paidLostWithBooks, ...paidOverdueWithBooks, ...returnedOkWithBooks];
      allNotifications.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      setNotifications(allNotifications);

      // --- Reminder Logic ---
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const overdueBooks = allBorrowed.filter((b) => { const dueDate = b.due_date ? new Date(b.due_date) : null; if (dueDate) dueDate.setHours(0, 0, 0, 0); return !b.return_date && dueDate && dueDate < today && (!b.penalty_status || b.penalty_status.toLowerCase() !== "paid"); });
      const unpaidLostBooks = allBorrowed.filter((b) => b.penalty_status?.toLowerCase() === "pending" && b.status?.toLowerCase() === "lost");
      const reminderMessages = [];
      if (overdueBooks.length > 0) reminderMessages.push(`You have ${overdueBooks.length} overdue book${ overdueBooks.length > 1 ? "s" : "" }. Please return them.`);
      if (unpaidLostBooks.length > 0) reminderMessages.push(`You have ${unpaidLostBooks.length} unpaid lost book${ unpaidLostBooks.length > 1 ? "s" : "" }. Please settle the fees.`);
      setReminders(reminderMessages);

    } catch (err) {
      console.error("Error fetching notifications:", err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <p className="no-notifications">Loading notifications...</p>;

  // --- Helper functions (getNotificationClass, renderNotificationMessage) remain the same ---
   const getNotificationClass = (notif) => {
     if (notif.status === "approved") return "notification-approved";
     if (notif.status === "declined") return "notification-declined";
     if (notif.status?.toLowerCase() === "lost" && notif.penalty_status?.toLowerCase() === "paid") return "notification-paid-lost";
     if (notif.status?.toLowerCase() === 'returned' && notif.penalty_status?.toLowerCase() === 'paid') return "notification-paid-overdue";
     if (notif.status?.toLowerCase() === 'returned' && (!notif.penalty_fee || Number(notif.penalty_fee) === 0)) return "notification-returned-ok";
     return "";
   };

   const renderNotificationMessage = (notif) => {
     if (notif.status === "approved") { return ( <> Your request to borrow <strong>{notif.bookTitle}</strong> has been <span className="approved-text">approved</span>. Claim it in the library. </> ); }
     if (notif.status === "declined") { return ( <> Your request to borrow <strong>{notif.bookTitle}</strong> has been <span className="declined-text">declined</span>. Please settle any outstanding fees before borrowing again. </> ); }
     if (notif.status?.toLowerCase() === "lost" && notif.penalty_status?.toLowerCase() === "paid") { return ( <> Payment successful for the lost book: <strong>{notif.bookTitle}</strong>. Thank you! <FaCheckCircle style={{ color: '#28a745', marginLeft: '5px', verticalAlign: 'middle' }} /> </> ); }
     if (notif.status?.toLowerCase() === 'returned' && notif.penalty_status?.toLowerCase() === 'paid') { return ( <> Overdue fee payment successful for the returned book: <strong>{notif.bookTitle}</strong>. Thank you! <FaCheckCircle style={{ color: '#28a745', marginLeft: '5px', verticalAlign: 'middle' }} /> </> ); }
     if (notif.status?.toLowerCase() === 'returned' && (!notif.penalty_fee || Number(notif.penalty_fee) === 0)) { return ( <> Successfully returned the book: <strong>{notif.bookTitle}</strong>. Thank you for returning it on time! <FaUndoAlt style={{ color: '#17a2b8', marginLeft: '5px', verticalAlign: 'middle' }} /> </> ); }
     return null;
   };

  // --- 3. Slice the notifications array ---
  const displayedNotifications = showAllNotifications
    ? notifications
    : notifications.slice(0, INITIAL_NOTIFICATION_LIMIT);

  return (
    <div className="notifications-page">
      {/* Render Reminders First (unaffected by show all/less) */}
      {reminders.length > 0 &&
        reminders.map((reminder, index) => (
          <div key={`reminder-${index}`} className="notification-card notification-reminder">
            <p className="notification-message">
              <strong>Reminder:</strong> {reminder}
            </p>
          </div>
        ))}

      {/* Render Sliced Notifications */}
      {displayedNotifications.length === 0 && reminders.length === 0 ? (
        <p className="no-notifications">No notifications yet.</p>
      ) : (
        // --- 4. Map over displayedNotifications ---
        displayedNotifications.map((notif) => (
          <div
            key={notif.id}
            className={`notification-card ${getNotificationClass(notif)}`}
          >
            <p className="notification-date">
              {notif.return_date
                ? new Date(notif.return_date).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
                : new Date(notif.created_at).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
              }
            </p>
            <p className="notification-message">
              {renderNotificationMessage(notif)}
            </p>
            {notif.status === "approved" && ( <p className="notification-extra">Have fun reading!</p> )}
            {(getNotificationClass(notif) === "notification-paid-lost" || getNotificationClass(notif) === "notification-paid-overdue") && ( <p className="notification-extra">Your account status is updated.</p> )}
            {getNotificationClass(notif) === "notification-returned-ok" && ( <p className="notification-extra">Ready to borrow again!</p> )}
          </div>
        ))
      )}

      {/* --- 5. Render Toggle Button --- */}
      {notifications.length > INITIAL_NOTIFICATION_LIMIT && (
        <div className="show-all-toggle-notifications"> {/* Use a distinct class */}
          <button onClick={() => setShowAllNotifications(!showAllNotifications)}>
            {showAllNotifications ? "Show Less" : "Show All"}
          </button>
        </div>
      )}
    </div>
  );
}

export default StudentNotification;