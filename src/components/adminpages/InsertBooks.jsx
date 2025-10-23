import React, { useState, useEffect } from "react"; // --- Added useEffect ---
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../supabase-client.js";
import "./InsertBooks.css";
import { FaArrowLeft } from "react-icons/fa";

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
  // --- ADDED STATE for success message ---
  const [successMessage, setSuccessMessage] = useState("");
  // --- ADDED STATE for error message (optional but good practice) ---
  const [errorMessage, setErrorMessage] = useState("");

  // --- useEffect to clear messages after a delay ---
  useEffect(() => {
    let successTimer;
    let errorTimer;
    if (successMessage) {
      successTimer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000); // Clear after 5 seconds
    }
    if (errorMessage) {
       errorTimer = setTimeout(() => {
         setErrorMessage("");
       }, 5000); // Clear after 5 seconds
    }
    // Cleanup function to clear timeouts if component unmounts
    return () => {
      clearTimeout(successTimer);
      clearTimeout(errorTimer);
    };
  }, [successMessage, errorMessage]); // Rerun effect when messages change

  const handleChange = (e) => {
     // --- Clear messages on input change ---
     setSuccessMessage("");
     setErrorMessage("");

    const { name, value } = e.target;

    // ISBN — only numbers, max 13 digits
    if (name === "isbn") {
      if (/^\d{0,13}$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    // Title — allow letters, numbers, spaces, common punctuation
    if (name === "title") {
      if (/^[A-Za-z0-9\s:'\-?]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    // Author — only letters, spaces, periods
    if (name === "author") {
      if (/^[A-Za-z\s.]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    // Genre — allow letters, spaces, commas
      if (name === "genre") {
        if (/^[A-Za-z\s,]*$/.test(value)) {
          setBook((prev) => ({ ...prev, [name]: value }));
        }
        return;
      }

    // Description Validation
    if (name === "description") {
      if (/^[A-Za-z0-9\s.,:'\-?!;()]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    // Year — only numbers, 4 digits max
    if (name === "year") {
      if (/^\d{0,4}$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    // Price — up to billions (max 9 digits before decimal)
    if (name === "price") {
       if (/^(\d{0,9}(\.\d{0,2})?|\.\d{0,2})$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    // Copies — only numbers (non-negative integer)
    if (name === "copies") {
      if (/^\d*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    // Default update
    setBook({ ...book, [name]: value });
  };

  const handleImageChange = (e) => {
     // --- Clear messages on image change ---
     setSuccessMessage("");
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
    // --- Clear previous messages on submit ---
    setSuccessMessage("");
    setErrorMessage("");

    // Basic field validations before submitting
    if (book.isbn.length !== 13) {
      setErrorMessage("ISBN must be exactly 13 digits.");
      return;
    }
    const currentYear = new Date().getFullYear();
    if (book.year.length !== 4 || parseInt(book.year, 10) > currentYear || parseInt(book.year, 10) < 1000 ) {
      setErrorMessage("Year must be a valid 4-digit year.");
      return;
    }
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
      if (book.copies === '' || parseInt(book.copies, 10) < 0) {
        setErrorMessage("Copies must be a non-negative number.");
        return;
    }
      if (book.price === '' || parseFloat(book.price) < 0) {
        setErrorMessage("Price must be a non-negative number.");
        return;
    }


    try {
      setUploading(true);

      // Step 1: Check if ISBN already exists
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

      // Step 2: Upload image if exists
      let imageUrl = null;
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
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

      // Step 3: Insert new book record
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

      // --- MODIFIED: Set success message instead of alert ---
      setSuccessMessage("Book added successfully!");

      // Reset form
      setBook({
        isbn: "", title: "", author: "", genre: "", description: "", year: "", copies: "", price: ""
      });
      setImageFile(null);
      setPreviewUrl(null);
      // Clear the file input visually (optional but recommended)
      const fileInput = document.getElementById("book-image-input");
      if(fileInput) fileInput.value = "";


    } catch (error) {
      console.error("Error adding book:", error);
      // --- MODIFIED: Set error message instead of alert ---
      setErrorMessage("❌ Failed to add book: " + (error.message || "Unknown error"));
    } finally {
      setUploading(false);
    }
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
            style={{ display: 'none' }}
          />
        </div>

        {/* Book Fields Area */}
        <div className="insert-book-fields">

           {/* --- ADDED: Success Message Display --- */}
           {successMessage && (
             <div className="insert-book-success-message">
               {successMessage}
             </div>
           )}

            {/* --- ADDED: Error Message Display --- */}
           {errorMessage && (
             <div className="insert-book-error-message">
               {errorMessage}
             </div>
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
           <input
              type="text"
              name="genre"
              value={book.genre}
              onChange={handleChange}
              required
            />
          </label>

          <label className="insert-book-description">
              <span>Description:</span>
              <textarea
                name="description"
                value={book.description}
                onChange={handleChange}
                rows="4"
                placeholder="A brief summary of the book..."
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
              min="0"
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
              placeholder="e.g., 299.99"
              inputMode="decimal"
              required
            />
          </label>

          <button type="submit" disabled={uploading}>
            {uploading ? "Adding..." : "Add Book"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default InsertBooks;