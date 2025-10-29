import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../supabase-client";
import { FaArrowLeft } from "react-icons/fa";
import "./EditBooks.css";

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

function EditBooks() {
  const { isbn } = useParams();
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
    image: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);

  useEffect(() => {
    if (isbn) fetchBook();
  }, [isbn]);

  async function fetchBook() {
    setLoading(true);
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("isbn", isbn)
      .single();

    if (error || !data) {
      console.error("Error fetching book:", error);
      alert("Failed to load book details.");
      navigate("/admin/books");
    } else {
      setBook(data);
      setImagePreview(data.image ?? null);
    }
    setLoading(false);
  }

  const handleChange = (e) => {
    setErrorMsg("");
    const { name, value } = e.target;

    if (name === "isbn" && /^\d{0,13}$/.test(value)) {
      return setBook((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "title" && /^[A-Za-z0-9\s:'\-?]*$/.test(value)) {
      return setBook((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "author" && /^[A-Za-z\s.]*$/.test(value)) {
      return setBook((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "genre") {
      return setBook((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "description" && /^[A-Za-z0-9\s.,:'\-?!;()]*$/.test(value) && value.length <= 400) {
      return setBook((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "year" && /^\d{0,4}$/.test(value)) {
      const num = parseInt(value, 10);
      const currentYear = new Date().getFullYear();
      if (value === "" || (num >= 1800 && num <= currentYear)) {
        return setBook((prev) => ({ ...prev, [name]: value }));
      }
    }
    if (name === "price" && /^(\d{0,9}(\.\d{0,2})?|\.\d{0,2})$/.test(value)) {
      return setBook((prev) => ({ ...prev, [name]: value }));
    }
    if (name === "copies") {
      if (value === "" || (/^\d+$/.test(value) && parseInt(value, 10) <= 10000)) {
        return setBook((prev) => ({ ...prev, [name]: value }));
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  async function handleSave(e) {
    e.preventDefault();
    setErrorMsg("");

    if (book.isbn.length !== 13) return setErrorMsg("ISBN must be exactly 13 digits.");
    if (!book.title.trim()) return setErrorMsg("Title cannot be empty.");
    if (!book.author.trim()) return setErrorMsg("Author cannot be empty.");
    if (!book.genre.trim()) return setErrorMsg("Genre cannot be empty.");
    if (!book.description.trim()) return setErrorMsg("Description cannot be empty.");
    if (book.copies === "" || parseInt(book.copies, 10) < 1) return setErrorMsg("Copies must be at least 1.");
    if (book.price === "" || parseFloat(book.price) < 0) return setErrorMsg("Price must be non-negative.");

    setLoading(true);
    let finalImageUrl = book.image;

    try {
      if (book.isbn !== isbn) {
        const { data: existingBook } = await supabase.from("books").select("isbn").eq("isbn", book.isbn).maybeSingle();
        if (existingBook) {
          setErrorMsg("This ISBN already exists. Please use a unique ISBN.");
          setLoading(false);
          return;
        }
      }

      if (newImageFile) {
        setUploadingImage(true);
        const fileExt = newImageFile.name.split(".").pop();
        const fileName = `${book.isbn}-${Date.now()}.${fileExt}`;
        const bucket = "book-images";

        if (book.image) {
          try {
            const oldFileName = book.image.substring(book.image.lastIndexOf("/") + 1);
            await supabase.storage.from(bucket).remove([oldFileName]);
          } catch {}
        }

        const { error: uploadError } = await supabase.storage.from(bucket).upload(fileName, newImageFile);
        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
        finalImageUrl = publicUrlData?.publicUrl ?? null;
        setUploadingImage(false);
      }

      const { error: updateError } = await supabase
        .from("books")
        .update({
          isbn: book.isbn.trim(),
          title: book.title.trim(),
          author: book.author.trim(),
          genre: book.genre.trim(),
          description: book.description.trim(),
          year: parseInt(book.year, 10),
          copies: parseInt(book.copies, 10),
          price: parseFloat(book.price),
          image: finalImageUrl,
        })
        .eq("isbn", isbn);

      if (updateError) throw updateError;

      // ✅ Show success modal instead of inline message
      setIsSuccessModalOpen(true);
      setTimeout(() => {
        setIsSuccessModalOpen(false);
        navigate("/admin/books");
      }, 1500);
    } catch (err) {
      console.error("Save Error:", err);
      setErrorMsg("❌ Failed to save changes: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  const openArchiveModal = () => setIsArchiveModalOpen(true);
  const closeArchiveModal = () => setIsArchiveModalOpen(false);

  async function confirmArchive() {
    closeArchiveModal();
    setLoading(true);
    try {
      const { data: currentBookData } = await supabase
        .from("books")
        .select("*")
        .eq("isbn", isbn)
        .single();

      const archivedBook = {
        ...currentBookData,
        date_archived: new Date().toISOString().split("T")[0],
      };
      delete archivedBook.id;
      delete archivedBook.created_at;

      await supabase.from("archives").insert([archivedBook]);
      await supabase.from("books").delete().eq("isbn", isbn);
      alert("Book archived successfully!");
      navigate("/admin/archives");
    } catch (err) {
      console.error("Archive Error:", err);
      alert("Failed to archive book: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  if (loading && !book.isbn) {
    return <div className="edit-book-page"><p>Loading book details...</p></div>;
  }

  return (
    <div className="edit-book-page">
      <button className="edit-book-back-btn" onClick={() => navigate("/admin/books")}>
        <FaArrowLeft className="edit-book-back-icon" /> Back
      </button>

      <form className="edit-book-form" onSubmit={handleSave}>
        <div className="edit-book-image-upload" onClick={() => document.getElementById("edit-book-image-input")?.click()}>
          {uploadingImage ? (
            <p>Uploading...</p>
          ) : imagePreview ? (
            <img src={imagePreview} alt="Preview" className="edit-book-preview" />
          ) : (
            <div className="edit-book-placeholder">+</div>
          )}
          <input id="edit-book-image-input" type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
        </div>

        <div className="edit-book-fields">
          {errorMsg && <div className="edit-book-error-message">{errorMsg}</div>}

          <label><span>ISBN:</span>
            <input type="text" name="isbn" value={book.isbn} onChange={handleChange} maxLength="13" required />
          </label>

          <label><span>Title:</span>
            <input type="text" name="title" value={book.title} onChange={handleChange} required />
          </label>

          <label><span>Author:</span>
            <input type="text" name="author" value={book.author} onChange={handleChange} required />
          </label>

          <label><span>Genre:</span>
            <select name="genre" value={book.genre} onChange={handleChange} required>
              <option value="">Select a genre</option>
              {commonGenres.map((genre) => <option key={genre} value={genre}>{genre}</option>)}
            </select>
          </label>

          <label className="edit-book-description">
            <span>Description:</span>
            <textarea name="description" value={book.description} onChange={handleChange} rows="4" maxLength="400" required />
          </label>

          <label><span>Year:</span>
            <input type="text" name="year" value={book.year} onChange={handleChange} maxLength="4" inputMode="numeric" required />
          </label>

          <label><span>Copies:</span>
            <input type="number" name="copies" value={book.copies} onChange={handleChange} min="1" max="10000" required />
          </label>

          <label><span>Price:</span>
            <input type="text" name="price" value={book.price} onChange={handleChange} placeholder="e.g., 299.99" inputMode="decimal" required />
          </label>

          <div className="edit-book-button-group">
            <button type="button" className="edit-book-archive-btn" onClick={openArchiveModal} disabled={loading || uploadingImage}>
              {loading ? "Archiving..." : "Archive"}
            </button>

            <button type="submit" className="edit-book-save-btn" disabled={loading || uploadingImage}>
              {uploadingImage ? "Uploading..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>

      {/* ✅ Success Modal */}
      {isSuccessModalOpen && (
        <div className="yga-brwd-modal-overlay">
          <div className="yga-brwd-modal-content success">
            <h3>Book Updated!</h3>
            <p>The book has been successfully updated.</p>
          </div>
        </div>
      )}

      {/* Archive Modal */}
      {isArchiveModalOpen && (
        <div className="yga-brwd-modal-overlay" onClick={closeArchiveModal}>
          <div className="yga-brwd-modal-content yga-brwd-modal-lost" onClick={(e) => e.stopPropagation()}>
            <h3>Archive this book?</h3>
            <p>Are you sure you want to archive <strong>{book.title}</strong>?</p>
            <div className="yga-brwd-modal-buttons">
              <button className="yga-brwd-modal-btn yga-brwd-cancel" onClick={closeArchiveModal}>Cancel</button>
              <button className="yga-brwd-modal-btn yga-brwd-confirm-lost" onClick={confirmArchive}>Confirm Archive</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditBooks;
