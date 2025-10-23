import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client.js";
import { FiSearch } from "react-icons/fi";
import "./OverdueHistory.css";

function OverdueHistory() {
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOverdueHistory();
  }, []);

  // Fetch returned books with penalty fees
  const fetchOverdueHistory = async () => {
    try {
      const { data, error } = await supabase
        .from("borrowed_books")
        .select("*")
        .eq("status", "returned")
        .gt("penalty_fee", 0); // only show books with penalties

      if (error) throw error;
      if (!data) return;

      const detailedOverdue = await Promise.all(
        data.map(async (req) => {
          const { data: book } = await supabase
            .from("books")
            .select("title, author, image")
            .eq("book_id", req.book_id)
            .maybeSingle();

          const { data: student } = await supabase
            .from("students")
            .select("full_name")
            .eq("auth_user_id", req.student_id)
            .maybeSingle();

          return {
            ...req,
            book,
            borrowerName: student?.full_name || "Unknown",
          };
        })
      );

      setOverdueBooks(detailedOverdue);
    } catch (err) {
      console.error("Error fetching overdue history:", err.message);
      alert("Failed to fetch overdue history.");
    }
  };

  // Search logic
  const filteredOverdue = overdueBooks.filter((item) => {
    const query = search.toLowerCase();
    return (
      item.book?.title?.toLowerCase().includes(query) ||
      item.book?.author?.toLowerCase().includes(query) ||
      item.borrowerName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="overduehistory-page">
      <h2></h2>

      {/* 🔍 Search Box */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      {/* 📚 Table */}
      {filteredOverdue.length === 0 ? (
        <p className="no-overduehistory">No overdue history available.</p>
      ) : (
        <table className="overduehistory-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Borrower</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Overdue Days</th>
              <th>Penalty Fee</th>
            </tr>
          </thead>
          <tbody>
            {filteredOverdue.map((item) => (
              <tr key={item.id}>
                <td>{item.book?.title || "Untitled"}</td>
                <td>{item.borrowerName}</td>
                <td>
                  {item.borrow_date
                    ? new Date(item.borrow_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {item.due_date
                    ? new Date(item.due_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>{item.overdue_days || 0}</td>
                <td>₱{item.penalty_fee?.toFixed(2) || "0.00"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default OverdueHistory;
