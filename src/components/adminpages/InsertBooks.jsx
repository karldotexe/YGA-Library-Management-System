import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase-client.js";
import "./InsertBooks.css";
import { FaArrowLeft } from "react-icons/fa";

// --- List of common genres ---
const commonGenres = [
  "Fiction",
  "Non-Fiction",
  "Science Fiction",
  "Fantasy",
  "Mystery",
  "Thriller",
  "Romance",
  "Biography",
  "History",
  "Self-Help",
  "Poetry",
  "Academic",
  "Children's",
  "Young Adult",
  "Horror",
  "Graphic Novel",
  "Cookbook",
];

function InsertBooks() {
  const navigate = useNavigate();
  const [book, setBook] = useState({
    isbn: "",
    title: "",
    author: "",
    genre: "",
    description: "",
    year: "",
    copies: "",
    price: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // State for the modal
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    // Timeout for the error message
    let errorTimer;
    if (errorMessage) {
      errorTimer = setTimeout(() => {
        setErrorMessage("");
      }, 5000);
    }
    return () => {
      clearTimeout(errorTimer);
    };
  }, [errorMessage]);


    useEffect(() => {
      if (isSuccessModalOpen) {
        const timer = setTimeout(() => {
          navigate("/admin/books");
        }, 2000); // redirect after 2 seconds
        return () => clearTimeout(timer);
      }
    }, [isSuccessModalOpen, navigate]);

  const handleChange = (e) => {
    setErrorMessage("");
    const { name, value } = e.target;

    if (name === "isbn") {
      if (/^\d{0,13}$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "title") {
      if (/^[A-Za-z0-9\s:'\-?]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "author") {
      if (/^[A-Za-z\s.]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "genre") {
      if (/^[A-Za-z\s,]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "description") {
      if (
        /^[A-Za-z0-9\s.,:'\-?!;()]*$/.test(value) &&
        value.length <= 400
      ) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "year") {
      if (/^\d{0,4}$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "price") {
      if (/^(\d{0,9}(\.\d{0,2})?|\.\d{0,2})$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "copies") {
      if (value === "") {
        setBook((prev) => ({ ...prev, [name]: "" }));
        return;
      }
      if (/^\d+$/.test(value)) {
        const num = parseInt(value, 10);
        if (num <= 10000) {
          setBook((prev) => ({ ...prev, [name]: value }));
        }
      }
      return;
    }
  };

  const handleImageChange = (e) => {
    setErrorMessage("");
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // --- Validations ---
    if (book.isbn.length !== 13) {
      setErrorMessage("ISBN must be exactly 13 digits.");
      return;
    }

    // --- MODIFIED: Year Validation ---
    const currentYear = new Date().getFullYear();
    if (
      book.year.length !== 4 ||
      parseInt(book.year, 10) > currentYear ||
      parseInt(book.year, 10) < 1800 // Changed from 1000
    ) {
      // Updated error message
      setErrorMessage(
        `Year must be valid`
      );
      return;
    }
    // --- End of Modified Validation ---

    if (!book.title.trim()) {
      setErrorMessage("Title cannot be empty.");
      return;
    }
    if (!book.author.trim()) {
      setErrorMessage("Author cannot be empty.");
      return;
    }
    if (!book.genre.trim()) {
      setErrorMessage("Genre cannot be empty.");
      return;
    }
    if (!book.description.trim()) {
      setErrorMessage("Description cannot be empty.");
      return;
    }
    if (
      book.copies === "" ||
      parseInt(book.copies, 10) < 1 ||
      parseInt(book.copies, 10) > 10000
    ) {
      setErrorMessage("Copies must be between 1 and 10,000.");
      return;
    }
    if (book.price === "" || parseFloat(book.price) < 0) {
      setErrorMessage("Price must be a non-negative number.");
      return;
    }
    // --- End Validations ---

    try {
      setUploading(true);

      const { data: existingBook, error: fetchError } = await supabase
        .from("books")
        .select("isbn")
        .eq("isbn", book.isbn)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingBook) {
        setErrorMessage("This ISBN already exists. Please use a unique ISBN.");
        setUploading(false);
        return;
      }

      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `${book.isbn}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("book-images")
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("book-images")
          .getPublicUrl(fileName);

        if (!publicUrlData || !publicUrlData.publicUrl) {
          console.warn("Could not get public URL for uploaded image.");
        }
        imageUrl = publicUrlData.publicUrl;
      }

      const { error: insertError } = await supabase.from("books").insert([
        {
          isbn: book.isbn,
          title: book.title.trim(),
          author: book.author.trim(),
          genre: book.genre.trim(),
          description: book.description.trim(),
          year: parseInt(book.year, 10),
          copies: parseInt(book.copies, 10),
          price: parseFloat(book.price),
          image: imageUrl,
        },
      ]);

      if (insertError) throw insertError;

      // --- Open success modal ---
      setIsSuccessModalOpen(true);

      // Reset form
      setBook({
        isbn: "",
        title: "",
        author: "",
        genre: "",
        description: "",
        year: "",
        copies: "",
        price: "",
      });
      setImageFile(null);
      setPreviewUrl(null);
      const fileInput = document.getElementById("book-image-input");
      if (fileInput) fileInput.value = "";
    } catch (error) {
      console.error("Error adding book:", error);
      setErrorMessage(
        "❌ Failed to add book: " + (error.message || "Unknown error")
      );
    } finally {
      setUploading(false);
    }
  };

  // --- Function to close the success modal ---
  const closeSuccessModal = () => {
    setIsSuccessModalOpen(false);
  };

  return (
    <div className="insert-book-page">
      <button className="insert-book-back-btn" onClick={() => navigate(-1)}>
        <FaArrowLeft className="insert-book-back-icon" /> Back
      </button>

      <form className="insert-book-form" onSubmit={handleSubmit}>
        {/* Image Upload Area */}
        <div
          className="insert-book-image-upload"
          onClick={() => document.getElementById("book-image-input")?.click()}
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="insert-book-preview"
            />
          ) : (
            <div className="insert-book-placeholder">+</div>
          )}
          <input
            type="file"
            id="book-image-input"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>

        {/* Book Fields Area */}
        <div className="insert-book-fields">
          {errorMessage && (
            <div className="insert-book-error-message">{errorMessage}</div>
          )}

          <label>
            <span>ISBN:</span>
            <input
              type="text"
              name="isbn"
              value={book.isbn}
              onChange={handleChange}
              maxLength="13"
              required
            />
          </label>

          <label>
            <span>Title:</span>
            <input
              type="text"
              name="title"
              value={book.title}
              maxLength="400"
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Author:</span>
            <input
              type="text"
              name="author"
              value={book.author}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Genre:</span>
            <select
              name="genre"
              value={book.genre}
              onChange={handleChange}
              required
            >
              <option value="">Select a genre</option>
              {commonGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </label>

          <label className="insert-book-description">
            <span>Description:</span>
            <textarea
              name="description"
              value={book.description}
              onChange={handleChange}
              rows="4"
              placeholder="A brief summary of the book..."
              maxLength="400"
              required
            />
          </label>

          <label>
            <span>Year:</span>
            <input
              type="text"
              name="year"
              value={book.year}
              onChange={handleChange}
              maxLength="4"
              inputMode="numeric"
              required
            />
          </label>

          <label>
            <span>Copies:</span>
            <input
              type="number"
              name="copies"
              value={book.copies}
              onChange={handleChange}
              min="1"
              max="10000"
              required
            />
          </label>

          <label>
            <span>Price:</span>
            <input
              type="text"
              name="price"
              value={book.price}
              onChange={handleChange}
              inputMode="decimal"
              required
            />
          </label>

          <button type="submit" disabled={uploading}>
            {uploading ? "Adding..." : "Add Book"}
          </button>
        </div>
      </form>

            
        {isSuccessModalOpen && (
          <div
            className="yga-brwd-modal-overlay"
            onClick={closeSuccessModal}
          >
            <div
              className="yga-brwd-modal-content yga-brwd-modal-return"
              onClick={(e) => e.stopPropagation()}
            >
              <h3>Success</h3>
              <p>Book added successfully!</p>
            </div>
          </div>
        )}

    </div>
  );
}

export default InsertBooks;