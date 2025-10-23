import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import { FiSearch } from "react-icons/fi";
import "./Archives.css"; // reuse table styles

export default function History() {
  const [history, setHistory] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    try {
      // Fetch books that were returned
      const { data: returnedBooks, error } = await supabase
        .from("borrowed_books")
        .select("*")
        .eq("status", "returned");

      if (error) throw error;
      if (!returnedBooks) return;

      const historyWithDetails = await Promise.all(
        returnedBooks.map(async (entry) => {
          const { data: student } = await supabase
            .from("students")
            .select("full_name, grade, section")
            .eq("auth_user_id", entry.student_id)
            .maybeSingle();

          const { data: book } = await supabase
            .from("books")
            .select("title")
            .eq("book_id", entry.book_id)
            .maybeSingle();

          return {
            ...entry,
            borrowerName: student?.full_name || "Unknown",
            grade: student?.grade || "-",
            section: student?.section || "-",
            bookTitle: book?.title || "Unknown",
          };
        })
      );

      setHistory(historyWithDetails);
    } catch (err) {
      console.error("Error fetching history:", err);
    }
  }

    const filteredHistory = history.filter((h) => {
    const query = search.toLowerCase();
    return (
      h.borrowerName?.toString().toLowerCase().includes(query) ||
      h.grade?.toString().toLowerCase().includes(query) ||
      h.section?.toString().toLowerCase().includes(query) ||
      h.bookTitle?.toString().toLowerCase().includes(query)
    );
  });


  return (
    <div className="archives-page">
      <h2 className="requests-page__header"></h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by student, grade, section, or book"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      {filteredHistory.length === 0 ? (
        <p className="no-archives">No returned books found.</p>
      ) : (
        <table className="archives-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Grade</th>
              <th>Section</th>
              <th>Borrowed Book</th>
              <th>Borrow Days</th>
              <th>Borrow Date</th>
              <th>Return Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredHistory.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.borrowerName}</td>
                <td>{entry.grade}</td>
                <td>{entry.section}</td>
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
