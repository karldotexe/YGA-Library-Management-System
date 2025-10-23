import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client.js";
import { FiSearch } from "react-icons/fi";
import "./LostBooks.css";

export default function LostBooks() {
  const [lostBooks, setLostBooks] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLostBooks();
  }, []);

  const fetchLostBooks = async () => {
    try {
      // 1️⃣ Fetch all lost borrowed_books
      const { data: lost, error: lostError } = await supabase
        .from("borrowed_books")
        .select("*")
        .eq("status", "lost");

      if (lostError) throw lostError;

      // 2️⃣ For each lost book, fetch book and student info
      const updatedLost = await Promise.all(
        lost.map(async (lb) => {
          // Fetch book info
          const { data: book } = await supabase
            .from("books")
            .select("title, price")
            .eq("book_id", lb.book_id)
            .maybeSingle();

          // Fetch student info
          const { data: student } = await supabase
            .from("students")
            .select("full_name")
            .eq("auth_user_id", lb.student_id)
            .maybeSingle();

          // Calculate penalty if not set
          let penalty = lb.penalty_fee;
          if (penalty === null && lb.due_date && book?.price) {
            const today = new Date();
            const due = new Date(lb.due_date);
            const overdueDays = Math.max(
              0,
              Math.ceil((today - due) / (1000 * 60 * 60 * 24))
            );
            penalty = overdueDays * book.price;
          }

          return {
            ...lb,
            book,
            student,
            penalty_fee: penalty,
          };
        })
      );

      setLostBooks(updatedLost);
    } catch (err) {
      console.error("Error fetching lost books:", err.message);
    }
  };

  const handlePayPenalty = async (borrowId) => {
    if (!window.confirm("Mark penalty as paid?")) return;

    try {
      const { error } = await supabase
        .from("borrowed_books")
        .update({ penalty_status: "paid" })
        .eq("id", borrowId);

      if (error) throw error;

      fetchLostBooks();
    } catch (err) {
      console.error("Failed to update penalty status:", err.message);
      alert("Failed to mark penalty as paid.");
    }
  };

  const filtered = lostBooks.filter(
    (b) =>
      b.book?.title.toLowerCase().includes(search.toLowerCase()) ||
      b.student?.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="lostbooks-page">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      {filtered.length === 0 ? (
        <p className="no-lostbooks">No lost books.</p>
      ) : (
        <table className="lostbooks-table">
          <thead>
            <tr>
              <th>Book</th>
              <th>Borrower</th>
              <th>Borrow Date</th>
              <th>Due Date</th>
              <th>Penalty Fee</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((lb) => (
              <tr key={lb.id}>
                <td>{lb.book?.title || "Unknown"}</td>
                <td>{lb.student?.full_name || "-"}</td>
                <td>
                  {lb.borrow_date
                    ? new Date(lb.borrow_date).toLocaleDateString()
                    : "-"}
                </td>
                <td>
                  {lb.due_date
                    ? new Date(lb.due_date).toLocaleDateString()
                    : "-"}
                </td>
                <td> ₱ {lb.penalty_fee || 0}</td>
                <td>
                  {lb.penalty_status === "paid" ? (
                    <button disabled>Paid</button>
                  ) : (
                    <button onClick={() => handlePayPenalty(lb.id)}>Pay</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
