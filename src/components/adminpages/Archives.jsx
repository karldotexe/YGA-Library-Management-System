import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import { FiSearch } from "react-icons/fi";
import "./Archives.css";

export default function Archives() {
  const [archives, setArchives] = useState([]);
  const [search, setSearch] = useState("");

  // --- Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRetrieveModalOpen, setIsRetrieveModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  useEffect(() => {
    fetchArchives();
  }, []);

  async function fetchArchives() {
    const { data, error } = await supabase.from("archives").select("*");
    if (error) {
      console.error("Error fetching archives:", error);
      alert("Failed to load archived books.");
      return;
    }

    const today = new Date();
    const toDelete = data.filter((b) => {
      if (!b.date_archived) return false;
      const archivedDate = new Date(b.date_archived);
      const diffDays = Math.floor((today - archivedDate) / (1000 * 60 * 60 * 24));
      return diffDays >= 15;
    });

    for (const b of toDelete) {
      await supabase.from("archives").delete().eq("isbn", b.isbn);
    }

    const remaining = data.filter((b) => !toDelete.some((d) => d.isbn === b.isbn));
    setArchives(remaining);
  }

  // --- Modal Opening Functions ---

  async function handleDelete(book) {
    // if (!window.confirm("Delete this archived book permanently?")) return; // OLD
    setSelectedBook(book);
    setIsDeleteModalOpen(true);
  }

  async function handleRetrieve(book) {
    // if (!window.confirm("Retrieve this book back to active books?")) return; // OLD
    setSelectedBook(book);
    setIsRetrieveModalOpen(true);
  }

  // --- Modal Confirmation Functions ---

  async function confirmDelete() {
    if (!selectedBook) return;
    const { isbn } = selectedBook;

    const { error } = await supabase.from("archives").delete().eq("isbn", isbn);
    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      alert("Deleted successfully!");
      setArchives((prev) => prev.filter((b) => b.isbn !== isbn));
    }
    closeModals();
  }

  async function confirmRetrieve() {
    if (!selectedBook) return;
    const { isbn } = selectedBook;

    // selectedBook contains all the data, no need to find it again
    const { error: insertError } = await supabase
      .from("books")
      .insert([selectedBook]); // Just insert the whole book object

    if (insertError) {
      alert("Error restoring book: " + insertError.message);
      closeModals();
      return;
    }

    const { error: deleteError } = await supabase
      .from("archives")
      .delete()
      .eq("isbn", isbn);

    if (deleteError) {
      alert("Error cleaning up archives: " + deleteError.message);
      // Still proceed to refresh and close modal
    }

    alert("Book retrieved successfully!");
    fetchArchives(); // Refresh the list
    closeModals();
  }

  const closeModals = () => {
    setIsDeleteModalOpen(false);
    setIsRetrieveModalOpen(false);
    setSelectedBook(null);
  };

  const filtered = archives.filter((b) =>
    [b.title, b.author, b.genre].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="archives-page">
      {/* 🔍 Search bar (same style as Books.jsx) */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      <table className="archives-table-arc">
        <thead>
          <tr>
            <th>Title</th>
            <th>Author</th>
            <th>Genre</th>
            <th>Year</th>
            <th>Date Archived</th>
            <th>Stocks Left</th>
            <th>Days Left</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {filtered.length === 0 ? (
            <tr>
              <td colSpan="8" style={{ textAlign: "center", padding: "20px" }}>
                No archived books found.
              </td>
            </tr>
          ) : (
            filtered.map((book) => (
              <tr key={book.isbn}>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.genre}</td>
                <td>{book.year}</td>
                <td>{book.date_archived ? new Date(book.date_archived).toLocaleDateString() : "-"}</td>
                <td>{book.copies}</td>
                <td>
                  {(() => {
                    if (!book.date_archived) return "-";
                    const today = new Date();
                    const archivedDate = new Date(book.date_archived);
                    const diffDays = Math.floor(
                      (today - archivedDate) / (1000 * 60 * 60 * 24)
                    );
                    const daysLeft = 15 - diffDays;
                    return daysLeft > 0 ? `${daysLeft}` : "Expired";
                  })()}
                </td>
                <td>
                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(book)}
                  >
                    Delete
                  </button>
                  <button
                    className="retrieve-btn"
                    onClick={() => handleRetrieve(book)}
                  >
                    Retrieve
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* --- MODALS --- */}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedBook && (
        <div className="yga-brwd-modal-overlay" onClick={closeModals}>
          <div
            className="yga-brwd-modal-content yga-brwd-modal-lost" // Use 'lost' style for danger
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Delete this book?</h3>
            <p>
              Are you sure you want to permanently delete{" "}
              <strong>{selectedBook.title}</strong>? This action cannot be
              undone.
            </p>
            <div className="yga-brwd-modal-buttons">
              <button
                className="yga-brwd-modal-btn yga-brwd-cancel"
                onClick={closeModals}
              >
                Cancel
              </button>
              <button
                className="yga-brwd-modal-btn yga-brwd-confirm-lost" // Red button
                onClick={confirmDelete}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Retrieve Confirmation Modal */}
      {isRetrieveModalOpen && selectedBook && (
        <div className="yga-brwd-modal-overlay" onClick={closeModals}>
          <div
            className="yga-brwd-modal-content yga-brwd-modal-return" // Use 'return' style
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Retrieve this book?</h3>
            <p>
              Are you sure you want to restore{" "}
              <strong>{selectedBook.title}</strong> to the main library?
            </p>
            <div className="yga-brwd-modal-buttons">
              <button
                className="yga-brwd-modal-btn yga-brwd-cancel"
                onClick={closeModals}
              >
                Cancel
              </button>
              <button
                className="yga-brwd-modal-btn yga-brwd-confirm" // Green button
                onClick={confirmRetrieve}
              >
                Confirm Retrieve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}