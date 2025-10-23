import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import { FiSearch } from "react-icons/fi";
import "./StudentPenaltyHistory.css";

export default function StudentPenaltyHistory() {
  const [penalties, setPenalties] = useState([]);
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
      fetchPaidPenalties(user.id);
    }
  }

  async function fetchPaidPenalties(studentId) {
    try {
      // Fetch borrowed books with paid penalties for this student
      const { data: paidPenalties, error } = await supabase
        .from("borrowed_books")
        .select("*")
        .eq("student_id", studentId)
        .eq("penalty_status", "paid")
        .order("created_at", { ascending: false }); // Most recent first

      if (error) throw error;
      if (!paidPenalties) return;

      // Add book title from books table
      const penaltiesWithDetails = await Promise.all(
        paidPenalties.map(async (entry) => {
          const { data: book } = await supabase
            .from("books")
            .select("title")
            .eq("book_id", entry.book_id)
            .maybeSingle();

          return {
            ...entry,
            bookTitle: book?.title || "Unknown Book",
          };
        })
      );

      setPenalties(penaltiesWithDetails);
    } catch (err) {
      console.error("Error fetching paid penalties:", err);
    }
  }

  const filteredPenalties = penalties.filter((p) =>
    p.bookTitle?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="archives-page">
      <h2 className="requests-page__header">Paid Penalties</h2>

      <div className="search-box">
        <input
          type="text"
          placeholder="Search by book title"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      {filteredPenalties.length === 0 ? (
        <p className="no-archives">You have no paid penalties yet.</p>
      ) : (
        <table className="archives-table">
          <thead>
            <tr>
              <th>Book Title</th>
              <th>Penalty Fee</th>
              <th>Borrow Date</th>
              <th>Return Date</th>
              <th>Registrar</th>
            </tr>
          </thead>
          <tbody>
            {filteredPenalties.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.bookTitle}</td>
                <td>{entry.penalty_fee ? `₱${entry.penalty_fee}` : "-"}</td>
                <td>
                  {entry.borrow_date
                    ? new Date(entry.borrow_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {entry.return_date
                    ? new Date(entry.return_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>{entry.processed_by || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
