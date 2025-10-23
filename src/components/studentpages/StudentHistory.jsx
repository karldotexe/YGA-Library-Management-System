import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import { FiSearch } from "react-icons/fi";
import "./StudentHistory.css";

export default function StudentHistory() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error("Error getting user:", error);
      return;
    }
    if (user) {
      setUserId(user.id);
      fetchStudentHistory(user.id);
    }
  }

  async function fetchStudentHistory(studentId) {
    try {
      // Fetch only returned books for the logged-in student
      const { data: returnedBooks, error } = await supabase
        .from("borrowed_books")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "returned");

      if (error) throw error;
      if (!returnedBooks) return;

      const historyWithDetails = await Promise.all(
        returnedBooks.map(async (entry) => {
          const { data: book } = await supabase
            .from("books")
            .select("title")
            .eq("book_id", entry.book_id)
            .maybeSingle();

          return {
            ...entry,
            bookTitle: book?.title || "Unknown",
          };
        })
      );

      setHistory(historyWithDetails);
    } catch (err) {
      console.error("Error fetching student history:", err);
    }
  }

  const filteredHistory = history.filter((h) => {
    const query = search.toLowerCase();
    return h.bookTitle?.toLowerCase().includes(query);
  });

  return (
    <div className="archives-page">
      <h2 className="requests-page__header"></h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by book title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      {filteredHistory.length === 0 ? (
        <p className="no-archives">You have no returned books yet.</p>
      ) : (
        <table className="archives-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Borrow Days</th>
              <th>Borrow Date</th>
              <th>Return Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.bookTitle}</td>
                <td>{entry.borrow_days}</td>
                <td>
                  {entry.created_at
                    ? new Date(entry.created_at).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {entry.return_date
                    ? new Date(entry.return_date).toLocaleDateString()
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
