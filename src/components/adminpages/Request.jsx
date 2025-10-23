import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client.js";
import { FiSearch } from "react-icons/fi";
import "./Request.css";

function Request() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState("");
  const [declineModal, setDeclineModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data: borrowedBooks, error: borrowError } = await supabase
        .from("borrowed_books")
        .select("*")
        .eq("status", "pending");

      if (borrowError) throw borrowError;
      if (!borrowedBooks) return;

      const requestsWithDetails = await Promise.all(
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

          return {
            ...req,
            book,
            borrowerName: student?.full_name || "Unknown",
          };
        })
      );

      setRequests(requestsWithDetails);
    } catch (err) {
      console.error("Error fetching requests:", err.message);
    }
  };
const handleApprove = async (requestId, bookId, studentId) => {
    try {
      // 1️⃣ Reduce the book copies by 1
      const { data: book, error: bookError } = await supabase
        .from("books")
        .select("copies")
        .eq("book_id", bookId)
        .maybeSingle();

      if (bookError || !book) {
        console.error("Error fetching book:", bookError);
        return;
      }

      if (book.copies <= 0) {
        alert("No more copies available for this book.");
        return;
      }

      const { error: updateBookError } = await supabase
        .from("books")
        .update({ copies: book.copies - 1 })
        .eq("book_id", bookId);

      if (updateBookError) {
        console.error("Error updating book copies:", updateBookError);
        return;
      }

      // 2️⃣ Approve the borrow request
      const { error: approveError } = await supabase
        .from("borrowed_books")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (approveError) {
        console.error("Error approving request:", approveError);
        return;
      }

      // 3️⃣ Increment student's borrow_count
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("borrow_count")
        .eq("auth_user_id", studentId)
        .maybeSingle();

      if (studentError || !student) {
        console.error("Error fetching student:", studentError);
      } else {
        await supabase
          .from("students")
          .update({ borrow_count: (student.borrow_count || 0) + 1 })
          .eq("auth_user_id", studentId);
      }

      fetchRequests(); // Refresh requests list
    } catch (err) {
      console.error(err);
    }
  };



  const handleDecline = async (requestId) => {
    const { error } = await supabase
      .from("borrowed_books")
      .update({ status: "declined" })
      .eq("id", requestId);

    if (error) console.error("Error declining request:", error);
    else fetchRequests();
  };

  const openDeclineModal = (request) => {
    setSelectedRequest(request);
    setDeclineModal(true);
  };

  const confirmDecline = () => {
    if (selectedRequest) {
      handleDecline(selectedRequest.id);
      setSelectedRequest(null);
      setDeclineModal(false);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const query = search.toLowerCase();
    return (
      req.book?.title?.toLowerCase().includes(query) ||
      req.book?.author?.toLowerCase().includes(query) ||
      req.book?.genre?.toLowerCase().includes(query) ||
      req.borrowerName?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="requests-page">
      <h2 className="requests-page__header"></h2>

      {/* 🔍 Search Bar */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      {filteredRequests.length === 0 ? (
        <p className="requests-page__empty">No pending requests.</p>
      ) : (
        filteredRequests.map((req) => (
          <div key={req.id} className="requests-page__card">
            <div className="requests-page__book-image">
              <img
                src={req.book?.image || "/placeholder-book.png"}
                alt={req.book?.title || "Book"}
              />
            </div>

            <div className="requests-page__book-info">
              <h3 className="requests-page__book-title">{req.book?.title}</h3>
              <p className="requests-page__book-author">{req.book?.author}</p>
              <p className="requests-page__book-year">{req.book?.year}</p>
              <p className="requests-page__book-genre">{req.book?.genre}</p>
            </div>

            <div className="requests-page__borrower-info">
              <p className="requests-page__borrower-name">
                Borrower: {req.borrowerName}
              </p>
              <p className="requests-page__loan-days">
                Borrow Days: {req.borrow_days}
              </p>
            </div>

            <div className="requests-page__actions">

              <button
                className="requests-page__btn-accept"
                onClick={() => handleApprove(req.id, req.book.book_id, req.student_id)}
              >
                Accept
              </button>


              <button
                className="requests-page__btn-decline"
                onClick={() => openDeclineModal(req)}
              >
                Decline
              </button>
            </div>
          </div>
        ))
      )}

      {/* Decline Confirmation Modal */}
      {declineModal && selectedRequest && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Decline this request?</h3>
            <p>
              Are you sure you want to decline the request for{" "}
              <strong>{selectedRequest.book?.title}</strong> by{" "}
              {selectedRequest.borrowerName}?
            </p>
            <div className="modal-buttons">
              <button onClick={() => setDeclineModal(false)}>Cancel</button>
              <button onClick={confirmDecline}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Request;
