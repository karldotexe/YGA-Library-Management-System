import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client.js";
import { FiSearch } from "react-icons/fi";
import "./Borrowed.css";

function Borrowed() {
  const [borrowed, setBorrowed] = useState([]);
  const [search, setSearch] = useState("");
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [selectedOverdue, setSelectedOverdue] = useState(null);
  const [showLostModal, setShowLostModal] = useState(false);
  const [selectedLost, setSelectedLost] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState(null);

  const adminSession = JSON.parse(localStorage.getItem("adminSession"));
  const processorName =
    adminSession?.full_name ||
    adminSession?.user?.user_metadata?.full_name ||
    adminSession?.email ||
    adminSession?.user?.email ||
    "Unknown Staff";

  const studentSession = JSON.parse(localStorage.getItem("studentSession"));
  const role = adminSession ? "admin" : studentSession?.role;

  useEffect(() => {
    fetchBorrowed();
  }, []);

  const fetchBorrowed = async () => {
    try {
      const { data: borrowedBooks, error } = await supabase
        .from("borrowed_books")
        .select("*")
        .eq("status", "approved");

      if (error) throw error;
      if (!borrowedBooks) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const borrowedWithDetails = await Promise.all(
        borrowedBooks.map(async (req) => {
          const { data: book } = await supabase
            .from("books")
            .select("*")
            .eq("book_id", req.book_id)
            .maybeSingle();

          const { data: student } = await supabase
            .from("students")
            .select("full_name")
            .eq("auth_user_id", req.student_id)
            .maybeSingle();

          const borrowDate = new Date(req.borrow_date);
          borrowDate.setHours(0, 0, 0, 0);

          const dueDate = new Date(borrowDate);
          dueDate.setDate(borrowDate.getDate() + req.borrow_days);

          let overdueDays = 0;
          if (today > dueDate) {
            overdueDays = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));
          }

          const penaltyFee = overdueDays * 10;

          if (
            overdueDays > 0 &&
            (overdueDays !== req.overdue_days || penaltyFee !== req.penalty_fee)
          ) {
            await supabase
              .from("borrowed_books")
              .update({ overdue_days: overdueDays, penalty_fee: penaltyFee })
              .eq("id", req.id);
          }

          let remainingOrOverdueText;
          if (overdueDays > 0) {
            remainingOrOverdueText = `Overdue by ${overdueDays} day${
              overdueDays > 1 ? "s" : ""
            }`;
          } else {
            const remainingDays = Math.ceil(
              (dueDate - today) / (1000 * 60 * 60 * 24)
            );
            remainingOrOverdueText = `Due in ${remainingDays} day${
              remainingDays !== 1 ? "s" : ""
            }`;
          }

          return {
            ...req,
            book,
            borrowerName: student?.full_name || "Unknown",
            displayOverdueDays: overdueDays,
            displayPenaltyFee: penaltyFee,
            displayStatusText: remainingOrOverdueText,
            overdue_days: req.overdue_days,
            penalty_fee: req.penalty_fee,
          };
        })
      );

      setBorrowed(borrowedWithDetails);
    } catch (err) {
      console.error("Error fetching borrowed books:", err.message);
      alert("Failed to fetch borrowed books.");
    }
  };

  const handleReturn = async (borrowId, bookId, penaltyFee = 0) => {
    try {
      const { error: updateBorrowedError } = await supabase
        .from("borrowed_books")
        .update({
          status: "returned",
          return_date: new Date().toISOString(),
          penalty_status: penaltyFee > 0 ? "paid" : null,
          processed_by: processorName,
        })
        .eq("id", borrowId);

      if (updateBorrowedError) throw updateBorrowedError;

      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("copies")
        .eq("book_id", bookId)
        .maybeSingle();

      if (bookError) throw bookError;

      if (bookData) {
        await supabase
          .from("books")
          .update({ copies: (bookData.copies || 0) + 1 })
          .eq("book_id", bookId);
      }

      alert(
        penaltyFee > 0
          ? "Book returned successfully with penalty marked as paid!"
          : "Book returned successfully!"
      );
      fetchBorrowed();
    } catch (err) {
      console.error("Error returning book:", err.message);
      alert("Failed to return book.");
    }
  };

  // --- UPDATED handleLost: add overdue penalty automatically ---
  const handleLost = async (borrowId, bookId, overdueDays = 0, overduePenalty = 0) => {
    try {
      const { data: bookData, error: bookError } = await supabase
        .from("books")
        .select("price")
        .eq("book_id", bookId)
        .maybeSingle();

      if (bookError) throw bookError;

      const bookPrice = bookData?.price || 0;
      const totalPenalty = (overdueDays > 0 ? overduePenalty : 0) + bookPrice;

      const { error: updateBorrowedError } = await supabase
        .from("borrowed_books")
        .update({
          status: "lost",
          penalty_status: "pending",
          penalty_fee: totalPenalty,
          return_date: new Date().toISOString(),
          processed_by: processorName,
        })
        .eq("id", borrowId);

      if (updateBorrowedError) throw updateBorrowedError;

      alert(`Book marked as lost. Total penalty ₱${totalPenalty.toFixed(2)} applied.`);
      fetchBorrowed();
    } catch (err) {
      console.error("Error marking book as lost:", err.message);
      alert("Failed to mark book as lost.");
    }
  };

  const confirmReturn = (borrowId, bookId, bookTitle, overdueDays, penaltyFee) => {
    if (overdueDays > 0) {
      setSelectedOverdue({ borrowId, bookId, bookTitle, overdueDays, penaltyFee });
      setShowOverdueModal(true);
    } else {
      setSelectedReturn({ borrowId, bookId, bookTitle });
      setShowReturnModal(true);
    }
  };

  const confirmLost = (borrowId, bookId, bookTitle, overdueDays = 0, overduePenalty = 0) => {
    setSelectedLost({ borrowId, bookId, bookTitle, overdueDays, overduePenalty });
    setShowLostModal(true);
  };

  const filteredBorrowed = borrowed.filter((req) => {
    const query = search.toLowerCase();
    return (
      req.book?.title?.toLowerCase().includes(query) ||
      req.book?.author?.toLowerCase().includes(query) ||
      req.book?.genre?.toLowerCase().includes(query) ||
      req.borrowerName?.toLowerCase().includes(query) ||
      req.book?.isbn?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="requests-page">
      <div className="yga-brwd-topbar">
        <div className="yga-brwd-search-box">
          <input
            type="text"
            placeholder="Search Title, Author, Borrower, ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="yga-brwd-search-icon" />
        </div>
      </div>

      {filteredBorrowed.length === 0 ? (
        <p className="requests-page__empty">No currently borrowed books found.</p>
      ) : (
        filteredBorrowed.map((req) => (
          <div key={req.id} className="requests-page__card">
            <div className="requests-page__book-image">
              <img
                src={req.book?.image || "/placeholder-image.webp"}
                alt={req.book?.title || "Book"}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/placeholder-image.webp";
                }}
              />
            </div>
            <div className="requests-page__book-info">
              <h3>{req.book?.title || "N/A"}</h3>
              <p>by {req.book?.author || "N/A"}</p>
              <p>ISBN: {req.book?.isbn || "N/A"}</p>
            </div>
            <div className="requests-page__borrower-info">
              <p><strong>Borrower:</strong> {req.borrowerName}</p>
              <p>Borrowed: {req.borrow_date ? new Date(req.borrow_date).toLocaleDateString() : "-"}</p>
              <p className={req.displayOverdueDays > 0 ? "overdue-text" : ""}>
                Status: {req.displayStatusText}
              </p>
              {req.displayOverdueDays > 0 && (
                <p className="penalty-text">
                  Penalty: <strong>₱{req.displayPenaltyFee.toFixed(2)}</strong>
                </p>
              )}
            </div>
            <div className="requests-page__actions">
              <button
                className="requests-page__btn-accept"
                onClick={() =>
                  confirmReturn(
                    req.id,
                    req.book?.book_id,
                    req.book?.title,
                    req.displayOverdueDays,
                    req.displayPenaltyFee
                  )
                }
              >
                Return Book
              </button>
              <button
                className="requests-page__btn-decline"
                onClick={() =>
                  confirmLost(
                    req.id,
                    req.book?.book_id,
                    req.book?.title,
                    req.displayOverdueDays,
                    req.displayPenaltyFee
                  )
                }
              >
                Mark as Lost
              </button>
            </div>
          </div>
        ))
      )}

      {/* --- MODALS --- */}
      {showOverdueModal && selectedOverdue && (
        <div className="yga-brwd-modal-overlay" onClick={() => setShowOverdueModal(false)}>
          <div className="yga-brwd-modal-content yga-brwd-modal-overdue" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Overdue Return</h3>
            <p>
              "<strong>{selectedOverdue.bookTitle}</strong>" is overdue by {selectedOverdue.overdueDays} day{selectedOverdue.overdueDays > 1 ? "s" : ""}.
            </p>
            <p className="penalty-emphasis">
              Confirm receipt of the <strong>₱{selectedOverdue.penaltyFee.toFixed(2)}</strong> penalty fee.
            </p>
            <div className="yga-brwd-modal-buttons">
              <button className="yga-brwd-modal-btn yga-brwd-cancel" onClick={() => setShowOverdueModal(false)}>Cancel</button>
              <button
                className="yga-brwd-modal-btn yga-brwd-confirm"
                onClick={() => {
                  handleReturn(selectedOverdue.borrowId, selectedOverdue.bookId, selectedOverdue.penaltyFee);
                  setShowOverdueModal(false);
                }}
              >
                Confirm Payment & Return
              </button>
            </div>
          </div>
        </div>
      )}

      {showReturnModal && selectedReturn && (
        <div className="yga-brwd-modal-overlay" onClick={() => setShowReturnModal(false)}>
          <div className="yga-brwd-modal-content yga-brwd-modal-return" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Return</h3>
            <p>Are you sure you want to return "<strong>{selectedReturn.bookTitle}</strong>"?</p>
            <div className="yga-brwd-modal-buttons">
              <button className="yga-brwd-modal-btn yga-brwd-cancel" onClick={() => setShowReturnModal(false)}>Cancel</button>
              <button className="yga-brwd-modal-btn yga-brwd-confirm" onClick={() => {
                handleReturn(selectedReturn.borrowId, selectedReturn.bookId);
                setShowReturnModal(false);
              }}>Confirm Return</button>
            </div>
          </div>
        </div>
      )}

      {showLostModal && selectedLost && (
        <div className="yga-brwd-modal-overlay" onClick={() => setShowLostModal(false)}>
          <div className="yga-brwd-modal-content yga-brwd-modal-lost" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Lost Book</h3>
            <p>Mark "<strong>{selectedLost.bookTitle}</strong>" as lost?</p>
            <p className="penalty-emphasis">
              The borrower will be charged the book's price plus overdue penalty: <strong>
                ₱{(selectedLost.overduePenalty + (selectedLost.overdueDays > 0 ? selectedLost.overduePenalty : 0) || 0).toFixed(2)}
              </strong>
            </p>
            <div className="yga-brwd-modal-buttons-lost">
              <button className="yga-brwd-modal-btn yga-brwd-cancel" onClick={() => setShowLostModal(false)}>Cancel</button>
              <button className="yga-brwd-modal-btn yga-brwd-confirm-lost" onClick={() => {
                handleLost(selectedLost.borrowId, selectedLost.bookId, selectedLost.overdueDays, selectedLost.overduePenalty);
                setShowLostModal(false);
              }}>Confirm Lost</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Borrowed;
