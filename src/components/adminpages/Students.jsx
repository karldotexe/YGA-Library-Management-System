import React, { useState, useRef } from "react";
import { supabase } from "../../../supabase-client.js";
import "./Students.css"; // Make sure this path is correct
import { useNavigate } from "react-router-dom";
import * as XLSX from 'xlsx';

function Students() {
  const navigate = useNavigate();

  // State for single LRN form
  const [lrn, setLrn] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false); // For styling message

  // State for bulk upload
  const [file, setFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState([]); // To show results
  const fileInputRef = useRef(null); // To trigger file input



  // Input validation logic (for single LRN - max 12 digits)
  const handleChange = (e) => {
    const { value } = e.target;
    // LRN → digits only, max 12 characters
    if (/^\d*$/.test(value) && value.length <= 12) {
      setLrn(value);
    }
  };

  // Handler for single LRN registration
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setIsError(false);
    setBulkResults([]); // Clear bulk results

    // Validation
    const trimmedLrn = lrn.trim();
    if (!trimmedLrn) {
      setMessage("Please fill in the LRN field.");
      setIsError(true);
      setLoading(false);
      return;
    }
    // ADDED: Exact 12-digit check
    if (trimmedLrn.length !== 12) {
      setMessage("LRN must contain exactly 12 digits.");
      setIsError(true);
      setLoading(false);
      return;
    }


    try {
      // 1️⃣ Check if LRN already exists
      const { data: existing, error: checkError } = await supabase
        .from("students")
        .select("lrn")
        .eq("lrn", trimmedLrn) // Use trimmed LRN
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        // PGRST116 means no rows found, which is expected for a new LRN
        throw checkError;
      }
      if (existing) {
        setMessage("That LRN is already registered.");
        setIsError(true);
        setLoading(false);
        return;
      }

      // 2️⃣ Insert new student with LRN only
      const { error: insertError } = await supabase
        .from("students")
        .insert([{ lrn: trimmedLrn }]); // Use trimmed LRN

      if (insertError) throw insertError;

      setMessage("Registered successfully!");
      setIsError(false);
      setLrn(""); // Clear the form
    } catch (err) {
      console.error(err);
      setMessage("Failed to register student: " + err.message);
      setIsError(true);
    }

    setLoading(false);
  };

  // --- BULK UPLOAD FUNCTIONS ---

  // Stores the selected file in state
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setBulkResults([]); // Clear previous results
      setMessage(""); // Clear single-form message
      setIsError(false);
    }
  };

  // Processes the text or excel file
  const handleBulkRegister = () => {
    if (!file) return;

    setBulkLoading(true);
    setBulkResults([]);
    setMessage("");
    setIsError(false);
    const reader = new FileReader();
    const fileType = file.type;
    const isExcel = fileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || fileType === 'application/vnd.ms-excel' || file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    reader.onload = async (event) => {
      let rawLrns = []; // Renamed to indicate raw data
      try {
        if (isExcel) {
          // Process Excel file
          const data = event.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Extract potential LRNs from the first column
           rawLrns = jsonData
             .map(row => row[0])
             .filter(lrn => lrn != null) // Filter out empty cells
             .map(lrn => String(lrn).trim()); // Convert to string and trim

        } else {
          // Process Text file
          const text = event.target.result;
          rawLrns = text
            .split(/[\n\r,]+/) // Split by newline, carriage return, or comma
            .map((lrn) => lrn.trim());
        }

        // --- FILTERING LOGIC UPDATED ---

        // 1. Filter for non-empty strings that contain ONLY digits
        const digitOnlyLrns = rawLrns.filter(lrn => lrn !== "" && /^\d+$/.test(lrn));

        // 2. Filter the digit-only strings for EXACTLY 12 digits
        const validFormatLrns = digitOnlyLrns.filter(lrn => lrn.length === 12);

        if (validFormatLrns.length === 0) {
           // If NO valid LRNs were found after all filtering
           throw new Error("File contains no valid 12-digit LRNs consisting only of numbers.");
        }

        // --- The rest of the logic remains the same, using validFormatLrns ---
        let results = [];

        if (validFormatLrns.length > 0) {
          // Check which of the valid LRNs already exist
          const { data: existing, error } = await supabase
            .from("students")
            .select("lrn")
            .in("lrn", validFormatLrns);

          if (error) throw error;

          const existingLrns = existing.map((row) => row.lrn);
          const lrnsToInsert = validFormatLrns.filter(
            (lrn) => !existingLrns.includes(lrn)
          );
          const lrnsThatExist = validFormatLrns.filter((lrn) =>
            existingLrns.includes(lrn)
          );

          // Add ONE message for all duplicates (if any)
          if (lrnsThatExist.length > 0) {
            results.push({
              lrn: "Notice",
              status: "error", // Use 'error' status for styling consistency
              message: `${lrnsThatExist.length} LRN(s) were already registered and were skipped.`,
            });
          }

          // Insert the new LRNs
          if (lrnsToInsert.length > 0) {
            const rowsToInsert = lrnsToInsert.map((lrn) => ({ lrn }));
            const { error: insertError } = await supabase
              .from("students")
              .insert(rowsToInsert);

            if (insertError) throw insertError;

            // Add ONE summary success message
            results.push({
              lrn: "Success",
              status: "success",
              message: `Registered ${lrnsToInsert.length} new LRN(s) successfully.`,
            });
          }
        }

        setBulkResults(results);

      } catch (err) {
        console.error("Bulk Registration Error:", err);
        setBulkResults([
          { lrn: "Processing Error", status: "error", message: err.message || "Could not process the file." },
        ]);
      } finally {
         setBulkLoading(false);
         setFile(null); // Clear file state after processing
         if (fileInputRef.current) {
            fileInputRef.current.value = ""; // Reset file input visually
         }
      }
    };

    reader.onerror = (error) => {
      console.error("File Reading Error:", error);
      setBulkResults([
        { lrn: "File Read Error", status: "error", message: "Failed to read the selected file." },
      ]);
      setBulkLoading(false);
    };

    // Read file based on type
    if (isExcel) {
        reader.readAsArrayBuffer(file); // Read Excel as ArrayBuffer
    } else {
        reader.readAsText(file); // Read text file as text
    }
  };

  // --- END OF BULK FUNCTIONS ---

  return (
    <div className="lrn-reg-page">
      <div className="lrn-reg-container">
        <div className="lrn-reg-header"></div> {/* Optional Header */}

        {/* --- Single LRN Form --- */}
        <form className="lrn-reg-form" onSubmit={handleRegister}>
          <div className="lrn-reg-form-row">
            <label htmlFor="lrn">Register Single LRN:</label>
            <input
              type="text"
              name="lrn"
              id="lrn"
              value={lrn}
              onChange={handleChange}
              placeholder="Enter 12-digit LRN"
              inputMode="numeric" // Helps mobile users get numeric keyboard
              pattern="\d{12}" // HTML5 validation pattern
              maxLength="12"
              required // Make single input required
            />
          </div>

          <button type="submit" className="lrn-reg-register-btn" disabled={loading}>
            {loading ? "Registering..." : "Register"}
          </button>
          {message && <p className={`lrn-reg-message ${isError ? 'error' : 'success'}`}>{message}</p>}
        </form>

        {/* --- Bulk Upload UI --- */}
        <div className="lrn-reg-bulk-upload-section">
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: "none" }} // Hide the default input
            onChange={handleFileChange}
            // Accept common text and Excel file extensions/MIME types
            accept=".txt, .xlsx, .xls, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          />
          {/* Custom styled button to trigger file input */}
          <button
            type="button"
            className="lrn-reg-bulk-upload-btn"
            onClick={() => fileInputRef.current?.click()} // Trigger hidden input
          >
            {/* Show file name or default text */}
            {file ? file.name : "Select LRN bulk file (.txt, .xlsx)"}
          </button>
          {/* Button to start the bulk registration process */}
          <button
            type="button"
            className="lrn-reg-register-btn lrn-reg-bulk-register-btn"
            onClick={handleBulkRegister}
            disabled={bulkLoading || !file} // Disable if loading or no file selected
          >
            {bulkLoading ? "Registering..." : "Register LRNs from File"}
          </button>
        </div>

        {/* --- Bulk Results Display --- */}
        {bulkResults.length > 0 && (
          <div className="lrn-reg-bulk-results">
            <ul>
              {bulkResults.map((result, index) => (
                // Use status for conditional styling
                <li key={index} className={`lrn-reg-result-${result.status}`}>
                  <strong>{result.lrn || 'Status'}:</strong> {result.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default Students;