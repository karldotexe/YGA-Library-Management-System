import React, { useEffect, useState, useRef } from "react";
import { supabase } from "../../../supabase-client.js";
import { FiSearch } from "react-icons/fi";
import "./StudentBooks.css";

function StudentBooks() {
  const [books, setBooks] = useState([]);
  const [search, setSearch] = useState("");
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [sortOption, setSortOption] = useState("");
  const [genreDropdownOpen, setGenreDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Modal States
  const [bookDetailsModal, setBookDetailsModal] = useState(false);
  const [borrowModal, setBorrowModal] = useState(false);
  const [penaltyModal, setPenaltyModal] = useState(false);
  const [banModal, setBanModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [borrowDays, setBorrowDays] = useState(1);

  const genreRef = useRef(null);
  const sortRef = useRef(null);

  useEffect(() => {
    fetchBooks();
    const handleClickOutside = (e) => {
      if (genreRef.current && !genreRef.current.contains(e.target))
        setGenreDropdownOpen(false);
      if (sortRef.current && !sortRef.current.contains(e.target))
        setSortDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchBooks() {
    const { data, error } = await supabase.from("books").select("*, price");
    if (error) {
      console.error("Error fetching books:", error);
    } else {
      setBooks(data || []);
      const allGenres = data
        ? data.flatMap((b) => b.genre?.split(",").map((g) => g.trim()) || [])
        : [];
      setGenres([...new Set(allGenres)].filter((g) => g));
    }
  }

  const handleGenreChange = (genre) => {
    setSelectedGenres((prev) =>
      prev.includes(genre)
        ? prev.filter((g) => g !== genre)
        : [...prev, genre]
    );
  };

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
      const bookGenres =
        book.genre?.toLowerCase().split(",").map((g) => g.trim()) || [];
      return selectedGenres.some((selectedG) =>
        bookGenres.includes(selectedG.toLowerCase())
      );
    });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortOption) {
      case "year":
        return (b.year || 0) - (a.year || 0);
      case "price-up":
        return (a.price || 0) - (b.price || 0);
      case "price-down":
        return (b.price || 0) - (a.price || 0);
      case "author-az":
        return (a.author || "").localeCompare(b.author || "");
      case "author-za":
        return (b.author || "").localeCompare(a.author || "");
      case "title-az":
        return (a.title || "").localeCompare(b.title || "");
      case "title-za":
        return (b.title || "").localeCompare(a.title || "");
      default:
        return 0;
    }
  });

  const handleBookClick = (book) => {
    setSelectedBook(book);
    setBookDetailsModal(true);
  };

  const openBorrowFlow = async () => {
    if (!selectedBook) return;
    if (!selectedBook.copies || selectedBook.copies <= 0) {
      alert(`${selectedBook.title} is currently unavailable.`);
      return;
    }

    setBookDetailsModal(false);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        alert("Please log in to borrow books.");
        return;
      }

      const { count, error: checkError } = await supabase
        .from("borrowed_books")
        .select("id", { count: "exact", head: true })
        .eq("student_id", user.id)
        .in("status", ["lost", "overdue"])
        .neq("penalty_status", "paid");

      if (checkError) {
        console.error("Ban check error:", checkError);
        alert("Could not verify your eligibility.");
        return;
      }

      if (count > 0) setBanModal(true);
      else setBorrowModal(true);
    } catch (err) {
      console.error("Unexpected error:", err);
      alert("Unexpected error occurred.");
    }
  };

  const confirmBorrowDays = () => {
    setBorrowModal(false);
    setPenaltyModal(true);
  };

  const submitBorrowRequest = async () => {
    if (!selectedBook) return;
    setPenaltyModal(false);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user)
        throw new Error("Please log in again.");

      const studentId = user.id;
      const today = new Date().toISOString().split("T")[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + parseInt(borrowDays, 10));
      const dueDateStr = dueDate.toISOString().split("T")[0];

      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .select("full_name")
        .eq("auth_user_id", studentId)
        .single();

      if (studentError) throw new Error("Student profile not found.");

      const { error: insertError } = await supabase.from("borrowed_books").insert([
        {
          book_id: selectedBook.book_id,
          student_id: studentId,
          borrower: studentData.full_name,
          borrow_days: parseInt(borrowDays, 10),
          status: "pending",
          borrow_date: today,
          due_date: dueDateStr,
        },
      ]);
      if (insertError) throw new Error(insertError.message);

      alert(`Borrow request for "${selectedBook.title}" submitted successfully!`);
      fetchBooks();
    } catch (err) {
      alert(`Failed: ${err.message}`);
    } finally {
      closeModal();
    }
  };

  const closeModal = () => {
    setBookDetailsModal(false);
    setBorrowModal(false);
    setPenaltyModal(false);
    setBanModal(false);
    setSelectedBook(null);
    setBorrowDays(1);
  };

  const formatPrice = (price) => {
    if (!price || isNaN(price)) return "N/A";
    return `₱ ${Number(price).toFixed(2)}`;
  };

  return (
    <div className="yga-sb-page">
      {/* --- Top Bar --- */}
      <div className="student-books-topbar">
        <div className="student-search-box">
          <input
            type="text"
            placeholder="Search Title, Author, ISBN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FiSearch className="search-icon" />
        </div>

        <div className="student-dropdown-container" ref={genreRef}>
          <button
            className="student-dropdown-btn"
            onClick={() => setGenreDropdownOpen(!genreDropdownOpen)}
          >
            {selectedGenres.length === 0
              ? "Select Genre"
              : selectedGenres.length === 1
              ? selectedGenres[0]
              : `${selectedGenres.length} Genres`}
          </button>
          {genreDropdownOpen && (
            <div className="student-dropdown-checkboxes">
              {genres.map((genre) => (
                <label key={genre}>
                  <input
                    type="checkbox"
                    checked={selectedGenres.includes(genre)}
                    onChange={() => handleGenreChange(genre)}
                  />
                  {genre}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="student-dropdown-container" ref={sortRef}>
          <button
            className="student-dropdown-btn"
            onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
          >
            {sortOption === ""
              ? "Sort By"
              : {
                  year: "Year (Newest)",
                  "price-up": "Price (Low-High)",
                  "price-down": "Price (High-Low)",
                  "author-az": "Author (A-Z)",
                  "author-za": "Author (Z-A)",
                  "title-az": "Title (A-Z)",
                  "title-za": "Title (Z-A)",
                }[sortOption]}
          </button>
          {sortDropdownOpen && (
            <div className="student-dropdown-checkboxes">
              {[{ value: "", label: "Default" },
               { value: "title-az", label: "Title (A-Z)" },
               { value: "title-za", label: "Title (Z-A)" },
               { value: "author-az", label: "Author (A-Z)" },
               { value: "author-za", label: "Author (Z-A)" },
               { value: "year", label: "Year (Newest)" }].map((option) => (
                <div
                  key={option.value}
                  className="sort-option"
                  onClick={() => {
                    setSortOption(option.value);
                    setSortDropdownOpen(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* --- Book Cards --- */}
      <div className="yga-sb-book-list">
        {sortedBooks.length > 0 ? (
          sortedBooks.map((book) => (
            <div
              key={book.book_id || book.isbn}
              className="yga-sb-book-card"
              onClick={() => handleBookClick(book)}
            >
              <img
                src={
                  book.image ||
                  "https://placehold.co/400x600/eee/ccc?text=No+Image"
                }
                alt={book.title}
                className="yga-sb-book-cover"
              />
              <div className="yga-sb-book-title-on-card">{book.title}</div>
            </div>
          ))
        ) : (
          <p className="yga-sb-no-books">No books match your criteria.</p>
        )}
      </div>

      {/* --- Book Details Modal --- */}
      {bookDetailsModal && selectedBook && (
        <div className="yga-sb-modal-overlay" onClick={closeModal}>
          <div
            className="yga-sb-modal-content yga-sb-bookdetails"
            onClick={(e) => e.stopPropagation()}
          >
            <button className="yga-sb-modal-close-button" onClick={closeModal}>
              &times;
            </button>
            <img
              src={
                selectedBook.image ||
                "https://placehold.co/400x600/eee/ccc?text=No+Image"
              }
              alt={selectedBook.title}
              className="yga-sb-bookdetails-cover"
            />
            <h3>{selectedBook.title}</h3>
            <p><strong>Author:</strong> {selectedBook.author || "Unknown"}</p>
            <p><strong>Genre:</strong> {selectedBook.genre || "N/A"}</p>
            <p><strong>Year:</strong> {selectedBook.year || "N/A"}</p>
            <p><strong>Price:</strong> {formatPrice(selectedBook.price)}</p>
            <p><strong>Available Copies:</strong> {selectedBook.copies ?? "N/A"}</p>
            <p className="yga-sb-bookdetails-desc">
              {selectedBook.description || "No description available."}
            </p>
            <div className="yga-sb-modal-buttons">
              <button onClick={closeModal}>Close</button>
              <button onClick={openBorrowFlow}>Borrow This Book</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Borrow Modal (1–7 days selection) --- */}
      {borrowModal && selectedBook && (
        <div className="yga-sb-modal-overlay" onClick={closeModal}>
          <div
            className="yga-sb-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Borrow “{selectedBook.title}”</h3>
            <p>Select how many days you want to borrow (1–7):</p>
           <input
              type="number"
              min="1"
              max="7"
              value={borrowDays}
              onChange={(e) => {
                let value = parseInt(e.target.value, 10);
                if (isNaN(value)) value = 1; // default
                if (value < 1) value = 1;
                if (value > 7) value = 7;
                setBorrowDays(value);
              }}
            />

            <div className="yga-sb-modal-buttons">
              <button onClick={closeModal}>Cancel</button>
              <button onClick={confirmBorrowDays}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Penalty Modal (Updated) --- */}
      {penaltyModal && selectedBook && (
        <div className="yga-sb-modal-overlay" onClick={closeModal}>
          <div
            className="yga-sb-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirm Borrow</h3>
            <p>
              You are borrowing “{selectedBook.title}” for {borrowDays} day
              {borrowDays > 1 ? "s" : ""}. Please confirm to proceed.
            </p>
            <div className="yga-sb-penalty-info">
              <p><strong>Penalty Rules:</strong></p>
              
                <p><strong>₱10</strong> per day for each overdue day</p>
                <p>Lost book penalty = Original price <strong>({formatPrice(selectedBook.price)})</strong></p>
              
            </div>
            <div className="yga-sb-modal-buttons">
              <button onClick={closeModal}>Cancel</button>
              <button onClick={submitBorrowRequest}>Confirm Borrow</button>
            </div>
          </div>
        </div>
      )}

      {/* --- Ban Modal --- */}
      {banModal && (
        <div className="yga-sb-modal-overlay" onClick={closeModal}>
          <div
            className="yga-sb-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Borrowing Restricted</h3>
            <p>
              You have outstanding overdue or lost books with unpaid penalties.
              Please settle them before borrowing again.
            </p>
            <div className="yga-sb-modal-buttons">
              <button onClick={closeModal}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentBooks;
