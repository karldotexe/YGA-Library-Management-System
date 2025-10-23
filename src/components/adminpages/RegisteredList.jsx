import React, { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import { FiSearch } from "react-icons/fi";
import "./RegisteredList.css";

export default function RegisteredList() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents();
  }, []);

  async function fetchStudents() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("students")
        .select("*"); // fetch all columns

      if (error) throw error;

      setStudents(data);
    } catch (err) {
      console.error("Error fetching students:", err.message);
    } finally {
      setLoading(false);
    }
  }

  // 🔍 Filter by any field
  const filtered = students.filter((student) =>
    Object.values(student)
      .join(" ")
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="registeredlist-page">
      {/* Search bar */}
      <div className="search-box">
        <input
          type="text"
          placeholder="Search student..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      {/* Table */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="registeredlist-table">
          <thead>
            <tr>
              <th>LRN</th>
              <th>Full Name</th>
              <th>Age</th>
              <th>Grade</th>
              <th>Section / Course</th>
              <th>Handled By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <tr key={s.lrn}>
                  <td>{s.lrn}</td>
                  <td>{s.full_name}</td>
                  <td>{s.age}</td>
                  <td>{s.grade}</td>
                  <td>{s.section}</td>
                  <td>{s.handled_by}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-registered">
                  No registered students found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
