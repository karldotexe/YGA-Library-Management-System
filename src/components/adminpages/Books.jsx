import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase-client.js";
import { FiSearch } from "react-icons/fi";
import { FaEdit } from "react-icons/fa";
import "./Books.css"; // Ensure this CSS file contains the updated styles

function Books() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortOption, setSortOption] = useState("");
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // --- Modal States ---
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false); // For bdm- modal
  const [borrowModal, setBorrowModal] = useState(false); // For sb-borrow modal
  const [penaltyModal, setPenaltyModal] = useState(false); // For sb-penalty modal
  const [banModal, setBanModal] = useState(false); // For sb-ban modal
  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowDays, setBorrowDays] = useState(1);

  const genreRef = useRef(null);
  const sortRef = useRef(null);
  const navigate = useNavigate();

  // Get user role
  const adminSession = JSON.parse(localStorage.getItem("adminSession"));
  // Assuming 'library staff' role might be stored in studentSession or requires another check
  const studentSession = JSON.parse(localStorage.getItem("studentSession"));
  const role = adminSession ? "admin" : studentSession?.role; // Example: "admin", "student", "parent", potentially "library staff"

  // Check if user has edit permissions (Admin or Library Staff)
  const canEdit = role === "admin" || role === "library staff"; // Adjust if staff role is stored differently

  useEffect(() => {
    fetchBooks();
    const handleClickOutside = (e) => {
      if (genreRef.current && !genreRef.current.contains(e.target)) setGenreDropdownOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target)) setSortDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchBooks() {
    // Select all necessary columns, including price and description
    const { data, error } = await supabase.from("books").select("book_id, title, author, genre, year, copies, price, image, description, isbn");
    if (error) {
      console.error("Error fetching books:", error);
    } else {
      setBooks(data || []);
      const allGenres = data
        ? data.flatMap((b) => b.genre?.split(",").map((g) => g.trim()) || [])
        : [];
      setGenres([...new Set(allGenres)].filter(g => g)); // Filter out empty genres
    }
  }

  const handleGenreChange = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  // --- Filtering and Sorting (Robust checks) ---
  const filteredBooks = books
    .filter((book) => {
      const query = search.toLowerCase();
      if (!query) return true;
      return (
        book.title?.toLowerCase().includes(query) ||
        book.author?.toLowerCase().includes(query) ||
        book.isbn?.toLowerCase().includes(query) ||
        book.year?.toString().includes(query)
      );
    })
    .filter((book) => {
      if (selectedGenres.length === 0) return true;
      const bookGenres = book.genre?.toLowerCase().split(",").map((g) => g.trim()) || [];
      return selectedGenres.some((selectedG) => bookGenres.includes(selectedG.toLowerCase()));
    });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortOption) {
      case "year": return (b.year || 0) - (a.year || 0);
      case "price-up": return (a.price || 0) - (b.price || 0);
      case "price-down": return (b.price || 0) - (a.price || 0);
      case "author-az": return (a.author || "").localeCompare(b.author || "");
      case "author-za": return (b.author || "").localeCompare(a.author || "");
      case "title-az": return (a.title || "").localeCompare(b.title || "");
      case "title-za": return (b.title || "").localeCompare(a.title || "");
      default: return 0;
    }
  });

  // --- Modal Logic ---

  // Step 1: Handle Book Card Click -> Open Details Modal (bdm-)
  const handleBookClick = (book) => {
    setSelectedBook(book);
    setIsDetailsModalOpen(true); // Always open details modal first
  };

   // Step 2: Proceed from Details Modal (bdm-) to Borrow Days Modal (sb-)
  // Also includes the ban check from the previous StudentBooks component logic
  const handleProceedToBorrow = async () => {
    if (!selectedBook || !selectedBook.copies || selectedBook.copies <= 0) return;

    // Ban Check Logic (moved here)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      // If not logged in (e.g., admin testing view without login), proceed directly?
      // Or require login? Assuming proceed for now, but you might want to force login.
      if (userError || !user) {
        console.warn("User not logged in or error fetching user. Proceeding to borrow days modal.");
         setIsDetailsModalOpen(false); // Close details
         setBorrowDays(1);
         setBorrowModal(true); // Open borrow days modal
        return;
      }

      // Check for unpaid penalties ONLY IF a user is logged in
      const { count, error: checkError } = await supabase
        .from("borrowed_books")
        .select("id", { count: 'exact', head: true })
        .eq("student_id", user.id) // Assuming admin/staff won't have student_id records like this
        .in("status", ["lost", "overdue"])
        .neq("penalty_status", "paid");

      if (checkError) {
        console.error("Error checking ban status:", checkError);
         // Decide: Proceed anyway or show error? Proceeding.
         setIsDetailsModalOpen(false);
         setBorrowDays(1);
         setBorrowModal(true);
        return;
      }

      if (count > 0) {
        setIsDetailsModalOpen(false); // Close details modal first
        setBanModal(true); // Show ban modal instead of borrow days
      } else {
        // Not banned, proceed to borrow days
        setIsDetailsModalOpen(false);
        setBorrowDays(1);
        setBorrowModal(true);
      }
    } catch (err) {
      console.error("Unexpected error during borrow transition:", err);
       // Fallback: Proceed to borrow days modal even on error?
       setIsDetailsModalOpen(false);
       setBorrowDays(1);
       setBorrowModal(true);
    }
  };

  // Step 3: Confirm Borrow Days (sb-borrow) -> Open Penalty Warning (sb-penalty)
  const confirmBorrowDays = () => {
    setBorrowModal(false);
    setPenaltyModal(true);
  };

  // Step 4: Confirm Penalty (sb-penalty) -> Submit Borrow Request
  const submitBorrowRequest = async () => {
     if (!selectedBook) return;
     setPenaltyModal(false);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      // Require user login to submit request
      if (userError || !user) throw new Error("You must be logged in to borrow a book.");

      const studentId = user.id; // Assume the logged-in user is the student borrowing
      const today = new Date().toISOString().split('T')[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(borrowDays, 10));
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Fetch student name using the auth user id
      // Ensure your 'students' table has an 'auth_user_id' column linked to auth.users.id
      const { data: studentData, error: studentError } = await supabase
        .from("students") // Make sure this table name is correct
        .select("full_name")
        .eq("auth_user_id", studentId) // Link via auth ID
        .single();

      if (studentError || !studentData) throw new Error(`Could not fetch student name: ${studentError?.message || 'Student profile not found.'}`);

      const { error: insertError } = await supabase.from("borrowed_books").insert([
        {
          book_id: selectedBook.book_id,
          student_id: studentId, // The logged-in user's ID
          borrower: studentData.full_name, // Fetched name
          borrow_days: parseInt(borrowDays, 10),
          status: "pending",
          borrow_date: today,
          due_date: dueDateStr,
        },
      ]);
      if (insertError) throw new Error(`Error creating borrow request: ${insertError.message}`);

      console.log(`Request submitted for: ${selectedBook.title}`);
      alert(`Borrow request for "${selectedBook.title}" submitted successfully!`);

    } catch (err) {
      console.error("Error during borrow submission:", err);
      alert(`Failed to submit borrow request: ${err.message || 'Please try again.'}`);
    } finally {
      // Reset state regardless of success/failure
      setSelectedBook(null); // Clear selected book after submission attempt
      setBorrowDays(1);
      closeModal(); // Ensure all modals are closed
    }
  };


  // Helper to close any open modal
  const closeModal = () => {
    setIsDetailsModalOpen(false);
    setBorrowModal(false);
    setPenaltyModal(false);
    setBanModal(false);
    // Setting selectedBook to null when *any* modal closes simplifies state management
    // However, keep it if transitioning, handled in specific transition functions.
    // If just closing without transition, nullify it.
    // Let's nullify it here for simplicity when clicking overlay/close button
    setSelectedBook(null);
  };

  // Helper function to format price
  const formatPrice = (price) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'N/A'; // Handle cases where price isn't a valid number
    }
    // Ensure it's treated as a number before formatting
    return `₱ ${Number(price).toFixed(2)}`;
  };


  return (
    // books-page (Original class)
    <div className="books-page">
      {/* Top Bar (Original class names) */}
      <div className="books-topbar">
        <div className="search-box-books">
          <input
            type="text"
            placeholder="Search Title, Author, ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="search-icon" />
        </div>

        <div className="dropdown-container" ref={genreRef}>
          <button
            className="dropdown-btn"
            onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
          >
            {selectedGenres.length === 0 ? "Filter by Genre" : selectedGenres.length === 1 ? selectedGenres[0] : `${selectedGenres.length} Genres`}
          </button>
          {genreDropdownOpen && (
            <div className="dropdown-content">
              {genres.length > 0 ? genres.map((genre) => (
                <label key={genre} className="filter-option">
                  <input type="checkbox" checked={selectedGenres.includes(genre)} onChange={() => handleGenreChange(genre)} />
                  {genre}
                </label>
              )) : <span style={{fontSize: '13px', color: '#888', padding: '8px 15px'}}>No genres found</span>}
            </div>
          )}
        </div>

        <div className="dropdown-container" ref={sortRef}>
          <button
            className="dropdown-btn"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          >
            {sortOption === "" ? "Sort By" : { year: "Year (Newest)", "price-up": "Price (Low-High)", "price-down": "Price (High-Low)", "author-az": "Author (A-Z)", "author-za": "Author (Z-A)", "title-az": "Title (A-Z)", "title-za": "Title (Z-A)" }[sortOption]}
          </button>
          {sortDropdownOpen && (
            <div className="dropdown-content">
              {[
                { value: "", label: "Default" },
                { value: "title-az", label: "Title (A-Z)" },
                { value: "title-za", label: "Title (Z-A)" },
                { value: "author-az", label: "Author (A-Z)" },
                { value: "author-za", label: "Author (Z-A)" },
                { value: "year", label: "Year (Newest)" },
                // Keep price sorts if needed for backend/logic, even if not displayed
                // { value: "price-up", label: "Price (Low-High)" },
                // { value: "price-down", label: "Price (High-Low)" },
              ].map((option) => (
                <div key={option.value} className="sort-option" onClick={() => { setSortOption(option.value); setSortDropdownOpen(false); }}>
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Book Button (Conditional based on canEdit flag) */}
        {canEdit && (
          <button className="add-btn" onClick={() => navigate("/admin/insertbooks")}>
            Add Book
          </button>
        )}
      </div>

      {/* Book List (bl- prefix) */}
      <div className="bl-book-list">
        {sortedBooks.length > 0 ? (
          sortedBooks.map((book) => (
            <div
              key={book.book_id || book.isbn} // Use book_id as primary key
              className="bl-book-card"
              onClick={() => handleBookClick(book)}
              title={book.title || 'View Details'}
            >
              <img
                src={book.image || "https://placehold.co/400x600/eee/ccc?text=No+Image"}
                alt={book.title || 'Book cover'}
                className="bl-book-cover"
                onError={(e) => { e.target.src = 'https://placehold.co/400x600/eee/ccc?text=No+Image'; }}
              />
              <div className="bl-book-title-on-card">{book.title || 'Untitled'}</div>
              {/* Conditionally render Edit Icon if user canEdit */}
              {canEdit && (
                <FaEdit
                  className="bl-edit-icon" // Use bl- prefix
                  onClick={(e) => {
                    e.stopPropagation(); // VERY important to prevent opening details modal
                    navigate(`/admin/editbooks/${book.isbn || book.book_id}`); // Use ISBN or ID
                  }}
                  title="Edit Book"
                />
              )}
            </div>
          ))
        ) : (
          // Use sb- prefix for consistency with page container
          <p className="sb-student-no-books">No books match your criteria.</p>
        )}
      </div>

      {/* --- Modals --- */}

      {/* Book Details Modal (bdm- prefix) */}
      {isDetailsModalOpen && selectedBook && (
        // Use sb- prefix for overlay for consistency
        <div className="sb-modal-overlay" onClick={closeModal}>
          {/* Use bdm- prefix for content */}
          <div className="bdm-modal-content" onClick={(e) => e.stopPropagation()}>
             {/* Use sb- prefix for close button */}
             <button className="sb-modal-close-button" onClick={closeModal}>&times;</button>
             <img
                src={selectedBook.image || "https://placehold.co/400x600/eee/ccc?text=No+Image"}
                alt={selectedBook.title || 'Book cover'}
                className="bdm-modal-cover" // bdm- prefix
                onError={(e) => { e.target.src = 'https://placehold.co/400x600/eee/ccc?text=No+Image'; }}
              />
              <div className="bdm-modal-info"> {/* bdm- prefix */}
                  <h3>{selectedBook.title || 'Untitled'}</h3>
                  <p className="bdm-author">by {selectedBook.author || 'Unknown Author'}</p>
                  <p className="bdm-description">{selectedBook.description || 'No description available.'}</p>
                  <div className="bdm-detail-grid"> {/* bdm- prefix */}
                      <p><span>Genre:</span> {selectedBook.genre || 'N/A'}</p>
                      <p><span>Year:</span> {selectedBook.year || 'N/A'}</p>
                      <p><span>ISBN:</span> {selectedBook.isbn || 'N/A'}</p>
                      <p><span>Copies Available:</span> {selectedBook.copies > 0 ? selectedBook.copies : 0}</p>
                      {/* Show price in details modal */}
                      <p><span className="bdm-price-label">Price:</span> {formatPrice(selectedBook.price)}</p>
                  </div>
                  <div className="bdm-modal-buttons"> {/* bdm- prefix */}
                     {/* Show Borrow Button conditionally based on role and availability */}
                     {(role === 'student' || role === 'parent') && ( // Only show for student/parent
                       <button
                          className="bdm-borrow-button" // bdm- prefix
                          onClick={handleProceedToBorrow}
                          disabled={!selectedBook.copies || selectedBook.copies <= 0}
                          title={(!selectedBook.copies || selectedBook.copies <= 0) ? "No copies available" : "Request to Borrow"}
                       >
                         Request to Borrow
                       </button>
                     )}
                     {/* Admins/Staff might not need a borrow button here */}
                  </div>
              </div>
          </div>
        </div>
      )}

      {/* Borrow Days Modal (sb- prefix) */}
      {borrowModal && selectedBook && (
        <div className="sb-modal-overlay" onClick={closeModal}>
          <div className="sb-modal-content sb-borrow" onClick={(e) => e.stopPropagation()}>
            {/* Close button added */}
             <button className="sb-modal-close-button" onClick={closeModal}>&times;</button>
            <h3>Borrow "{selectedBook.title}"</h3>
            <label htmlFor="borrowDaysInput">How many days? (1-7)</label>
            <input
              id="borrowDaysInput"
              type="number"
              min="1"
              max="7"
              value={borrowDays}
              onChange={(e) => {
                const val = Math.max(1, Math.min(7, Number(e.target.value) || 1));
                setBorrowDays(val);
              }}
            />
            <div className="sb-modal-buttons">
              <button onClick={closeModal}>Cancel</button>
              <button onClick={confirmBorrowDays}>Next: Confirm Penalty</button>
            </div>
          </div>
        </div>
      )}

      {/* Penalty Modal (sb- prefix) */}
      {penaltyModal && selectedBook && (
        <div className="sb-modal-overlay" onClick={closeModal}>
          <div className="sb-modal-content sb-penalty" onClick={(e) => e.stopPropagation()}>
             {/* Close button added */}
             <button className="sb-modal-close-button" onClick={closeModal}>&times;</button>
            <h3 className="sb-penalty-title">Penalty Fee Warning</h3>
            <p>Overdue Penalty: 10 Pesos per day.</p>
            {/* Display Lost Book Penalty */}
            <p>
              Lost Book Penalty: <span className="sb-penalty-price">{formatPrice(selectedBook.price)}</span> (Original Book Price)
            </p>
            <p style={{marginTop: '15px', fontSize:'0.9rem'}}>Please return books on time and handle them with care.</p>
            <div className="sb-modal-buttons">
              <button onClick={closeModal}>Cancel Request</button>
              <button onClick={submitBorrowRequest}>Agree & Submit Request</button>
            </div>
          </div>
        </div>
      )}

      {/* Ban Modal (sb- prefix) */}
      {banModal && (
        <div className="sb-modal-overlay" onClick={closeModal}>
          <div className="sb-modal-content sb-ban" onClick={(e) => e.stopPropagation()}>
             {/* Close button added */}
             <button className="sb-modal-close-button" onClick={closeModal} style={{color: '#fff', background: 'rgba(0,0,0,0.2)'}}>&times;</button>
            <h3>Borrowing Restricted</h3>
            <p>
              You have unpaid penalties for overdue or lost books. Please settle your account at the library to regain borrowing privileges.
            </p>
            <div className="sb-modal-buttons" style={{ marginTop: "15px", justifyContent: 'center' }}> {/* Center button */}
              <button onClick={closeModal} style={{ flexGrow: 0, padding: '10px 30px' }}> {/* Adjust size */}
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Books;