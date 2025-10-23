import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import { FiSearch } from "react-icons/fi"; // ✅ add this
import "./Archives.css";

export default function Archives() {
  const [archives, setArchives] = useState([]);
  const [search, setSearch] = useState("");

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

  async function handleDelete(isbn) {
    if (!window.confirm("Delete this archived book permanently?")) return;
    const { error } = await supabase.from("archives").delete().eq("isbn", isbn);
    if (error) {
      alert("Failed to delete: " + error.message);
    } else {
      alert("Deleted successfully!");
      setArchives((prev) => prev.filter((b) => b.isbn !== isbn));
    }
  }

  async function handleRetrieve(isbn) {
    const bookToRestore = archives.find((b) => b.isbn === isbn);
    if (!bookToRestore) return;

    if (!window.confirm("Retrieve this book back to active books?")) return;

    const { error: insertError } = await supabase
      .from("books")
      .insert([bookToRestore]);

    if (insertError) {
      alert("Error restoring book: " + insertError.message);
      return;
    }

    const { error: deleteError } = await supabase
      .from("archives")
      .delete()
      .eq("isbn", isbn);

    if (deleteError) {
      alert("Error cleaning up archives: " + deleteError.message);
      return;
    }

    alert("Book retrieved successfully!");
    fetchArchives();
  }

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
          {filtered.map((book) => (
            <tr key={book.isbn}>
              <td>{book.title}</td>
              <td>{book.author}</td>
              <td>{book.genre}</td>
              <td>{book.year}</td>
              <td>{book.date_archived}</td>
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
                  onClick={() => handleDelete(book.isbn)}
                >
                  Delete
                </button>
                <button
                  className="retrieve-btn"
                  onClick={() => handleRetrieve(book.isbn)}
                >
                  Retrieve
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
