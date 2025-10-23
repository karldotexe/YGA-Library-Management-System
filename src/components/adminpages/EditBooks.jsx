import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../../supabase-client";
import { FaArrowLeft } from "react-icons/fa";
import "./EditBooks.css"; // Ensure path is correct

function EditBooks() {
  const { isbn } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState({
    isbn: "",
    title: "",
    author: "",
    genre: "",
    description: "", // <-- ADDED
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

    if (error) {
      console.error("Error fetching book:", error);
      alert("Failed to load book details.");
      navigate("/admin/books");
    } else if (data) {
      setBook(data);
      setImagePreview(data.image ?? null);
    } else {
      alert("Book not found.");
      navigate("/admin/books");
    }
    setLoading(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    let newValue = value;

    // Clear error on change
    if (errorMsg) setErrorMsg("");

    if (name === "isbn") {
      newValue = value.replace(/\D/g, "").slice(0, 13); // Only digits, max 13
    } else if (name === "title") {
      if (/^[A-Za-z0-9\s:'\-?.,()]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    } else if (name === "author") {
      if (/^[A-Za-z\s.]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    } else if (name === "genre") {
      if (/^[A-Za-z\s,]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    // --- ADDED: Description Validation ---
    } else if (name === "description") {
      if (/^[A-Za-z0-9\s.,:'\-?!;()]*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    } else if (name === "year") {
      newValue = value.replace(/\D/g, "").slice(0, 4);
    } else if (name === "price") {
      if (/^(\d{0,9}(\.\d{0,2})?|\.\d{0,2})$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    } else if (name === "copies") {
      if (/^\d*$/.test(value)) {
        setBook((prev) => ({ ...prev, [name]: value }));
      }
      return;
    }

    if (name === "isbn" || name === "year") {
      setBook((prev) => ({ ...prev, [name]: newValue }));
    }
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (file) {
      setNewImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    let finalImageUrl = book.image;

    // --- Validation ---
    if (!book.isbn || book.isbn.length < 10 || book.isbn.length > 13) {
      setErrorMsg("ISBN must be 10 to 13 digits long.");
      setLoading(false);
      return;
    }
    if (!book.title?.trim()) {
      setErrorMsg("Title cannot be empty.");
      setLoading(false);
      return;
    }
    if (!book.author?.trim()) {
      setErrorMsg("Author cannot be empty.");
      setLoading(false);
      return;
    }
    if (!book.genre?.trim()) {
      setErrorMsg("Genre cannot be empty.");
      setLoading(false);
      return;
    }
    // --- ADDED: Description Validation ---
    if (!book.description?.trim()) {
        setErrorMsg("Description cannot be empty.");
        setLoading(false);
        return;
    }
    const currentYear = new Date().getFullYear();
    if (
      !/^\d{4}$/.test(book.year) ||
      parseInt(book.year, 10) > currentYear ||
      parseInt(book.year, 10) < 1000
    ) {
      setErrorMsg("Year must be a valid 4-digit year.");
      setLoading(false);
      return;
    }
    if (book.copies === "" || book.copies === null || parseInt(book.copies, 10) < 0) {
      setErrorMsg("Copies must be a non-negative number.");
      setLoading(false);
      return;
    }
    if (book.price === "" || book.price === null || parseFloat(book.price) < 0) {
      setErrorMsg("Price must be a non-negative number.");
      setLoading(false);
      return;
    }
    // --- End Validation ---

    try {
      if (book.isbn !== isbn) {
        const { data: existingBook, error: fetchError } = await supabase
          .from("books")
          .select("isbn")
          .eq("isbn", book.isbn)
          .maybeSingle();

        if (fetchError) throw fetchError;
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

        if (book.image && book.image.includes(supabase.storage.url)) {
          try {
            const oldFileName = book.image.substring(
              book.image.lastIndexOf("/") + 1
            );
            if (oldFileName) {
              await supabase.storage.from(bucket).remove([oldFileName]);
              console.log("Old image removed:", oldFileName);
            }
          } catch (removeError) {
            console.warn("Could not remove old image:", removeError.message);
          }
        }

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(fileName, newImageFile, { upsert: false });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(fileName);

        finalImageUrl = publicUrlData?.publicUrl ?? null;
        setUploadingImage(false);
      }

      // --- Update Book Data ---
      const { error: updateError } = await supabase
        .from("books")
        .update({
          isbn: book.isbn.trim(),
          title: book.title.trim(),
          author: book.author.trim(),
          genre: book.genre.trim(),
          description: book.description.trim(), // <-- ADDED
          year: parseInt(book.year, 10),
          copies: parseInt(book.copies, 10),
          price: parseFloat(book.price),
          image: finalImageUrl,
        })
        .eq("isbn", isbn); // Update based on the ORIGINAL isbn

      if (updateError) throw updateError;

      alert("Book updated successfully!");
      navigate("/admin/books");
    } catch (err) {
      console.error("Save Error:", err);
      setErrorMsg("❌ Failed to save changes: " + (err.message || "Unknown error"));
      setUploadingImage(false);
    } finally {
      setLoading(false);
    }
  }

  async function handleArchive() {
    const confirmArchive = window.confirm(
      "Are you sure you want to archive this book?"
    );
    if (!confirmArchive) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const { data: currentBookData, error: fetchErr } = await supabase
        .from("books")
        .select("*")
        .eq("isbn", isbn)
        .single();

      if (fetchErr || !currentBookData) {
        throw fetchErr || new Error("Book not found for archiving.");
      }

      const archivedBook = {
        ...currentBookData, // This now includes description
        date_archived: new Date().toISOString().split("T")[0],
      };
      delete archivedBook.id;
      delete archivedBook.created_at;

      const { error: insertError } = await supabase
        .from("archives")
        .insert([archivedBook]);

      if (insertError) {
        console.error("Archive insert error:", insertError);
        throw insertError;
      }

      const { error: deleteError } = await supabase
        .from("books")
        .delete()
        .eq("isbn", isbn);

      if (deleteError) {
        console.error("Book delete error:", deleteError);
        throw deleteError;
      }

      alert("📦 Book archived successfully!");
      navigate("/admin/archives");
    } catch (err) {
      console.error("Archive Error:", err);
      alert("Failed to archive book: " + (err.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  }

  if (loading && !book.isbn) {
    return (
      <div className="edit-book-page">
        <p>Loading book details...</p>
      </div>
    );
  }

  return (
    <div className="edit-book-page">
      <button
        className="edit-book-back-btn"
        onClick={() => navigate("/admin/books")}
      >
        <FaArrowLeft className="edit-book-back-icon" /> Back
      </button>

      <form className="edit-book-form" onSubmit={handleSave}>
        <div
          className="edit-book-image-upload"
          onClick={() =>
            document.getElementById("edit-book-image-input")?.click()
          }
        >
          {uploadingImage ? (
            <p>Uploading...</p>
          ) : imagePreview ? (
            <img src={imagePreview} alt="Preview" className="edit-book-preview" />
          ) : (
            <div className="edit-book-placeholder">+</div>
          )}
          <input
            id="edit-book-image-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
            disabled={uploadingImage}
          />
        </div>

        <div className="edit-book-fields">
          {errorMsg && <p className="edit-book-error-message">{errorMsg}</p>}

          <label>
            <span>ISBN:</span>
            <input
              type="text"
              name="isbn"
              value={book.isbn || ""}
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
              value={book.title || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Author:</span>
            <input
              type="text"
              name="author"
              value={book.author || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <span>Genre:</span>
            <input
              type="text"
              name="genre"
              value={book.genre || ""}
              onChange={handleChange}
              required
            />
          </label>

          {/* --- ADDED: Description Textarea --- */}
          <label className="edit-book-description">
            <span>Description:</span>
            <textarea
              name="description"
              value={book.description || ""}
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
              value={book.year || ""}
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
              value={book.copies ?? ""}
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
              value={book.price ?? ""}
              onChange={handleChange}
              inputMode="decimal"
              required
            />
          </label>

          <div className="edit-book-button-group">
            <button
              type="button"
              className="edit-book-archive-btn"
              onClick={handleArchive}
              disabled={loading || uploadingImage}
            >
              {loading && !uploadingImage ? "Archiving..." : "Archive"}
            </button>

            <button
              type="submit"
              className="edit-book-save-btn"
              disabled={loading || uploadingImage}
            >
              {loading && !uploadingImage
                ? "Saving..."
                : uploadingImage
                ? "Uploading..."
                : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default EditBooks;