import { useEffect, useState } from "react";
import { supabase } from "../../../supabase-client";
import { FiSearch } from "react-icons/fi";
import "./AccountsList.css";

function AccountsList() {
  const [admins, setAdmins] = useState([]);
  const [protectedLibrarianId, setProtectedLibrarianId] = useState(null);
  const [protectedRegistrarId, setProtectedRegistrarId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Unique modal state
  const [accountsListModalOpen, setAccountsListModalOpen] = useState(false);
  const [accountsListModalContent, setAccountsListModalContent] = useState("");
  const [accountsListModalDeleteId, setAccountsListModalDeleteId] = useState(null);

  useEffect(() => {
    fetchAdmins();
  }, []);

  async function fetchAdmins() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("admins")
        .select("id, full_name, email, department, role")
        .order("id", { ascending: true });

      if (error) throw error;

      setAdmins(data || []);

      const firstLibrarian = data.find(
        (a) => a.role?.toLowerCase() === "librarian"
      );
      if (firstLibrarian) setProtectedLibrarianId(firstLibrarian.id);

      const firstRegistrar = data.find(
        (a) => a.role?.toLowerCase() === "registrar"
      );
      if (firstRegistrar) setProtectedRegistrarId(firstRegistrar.id);
    } catch (err) {
      console.error(err);
      setMessage("Failed to fetch admin accounts: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  const openAccountsListModal = (content, id = null) => {
    setAccountsListModalContent(content);
    setAccountsListModalDeleteId(id);
    setAccountsListModalOpen(true);
  };

  const closeAccountsListModal = () => {
    setAccountsListModalOpen(false);
    setAccountsListModalDeleteId(null);
  };

  const confirmAccountsListDelete = async () => {
    if (!accountsListModalDeleteId) return;

    try {
      const { error } = await supabase
        .from("admins")
        .delete()
        .eq("id", accountsListModalDeleteId);

      if (error) throw error;

      setMessage("Account removed successfully!");
      fetchAdmins();
    } catch (err) {
      console.error(err);
      setMessage("Failed to remove account: " + err.message);
    } finally {
      closeAccountsListModal();
    }
  };

  const handleRemove = (id) => {
    if (id === protectedLibrarianId || id === protectedRegistrarId) {
      openAccountsListModal("This account cannot be removed!");
      return;
    }
    openAccountsListModal("Are you sure you want to remove this account?", id);
  };

  const filteredAdmins = admins.filter((a) =>
    [a.full_name, a.email, a.department, a.role].some((field) =>
      field?.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="archives-page">
      <div className="search-box">
        <input
          type="text"
          placeholder="Search by name, email, department, role"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <FiSearch className="search-icon" />
      </div>

      {loading ? (
        <p className="no-archives">Loading accounts...</p>
      ) : filteredAdmins.length === 0 ? (
        <p className="no-archives">No admin accounts found.</p>
      ) : (
        <table className="archives-table">
          <thead>
            <tr>
              <th>Full Name</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdmins.map((admin) => {
              const isProtected =
                admin.id === protectedLibrarianId ||
                admin.id === protectedRegistrarId;

              return (
                <tr key={admin.id}>
                  <td>{admin.full_name}</td>
                  <td>{admin.email}</td>
                  <td>{admin.department}</td>
                  <td>{admin.role}</td>
                  <td>
                    <button
                      className="accountsList-delete-btn"
                      onClick={() => handleRemove(admin.id)}
                      title={isProtected ? "Protected Account" : ""}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {message && <p className="no-archives">{message}</p>}

      {/* Unique modal */}
      {accountsListModalOpen && (
        <div className="accountsList-modal-overlay">
          <div className="accountsList-modal">
            <p>{accountsListModalContent}</p>
            {accountsListModalDeleteId ? (
              <div className="accountsList-modal-buttons">
                <button
                  className="accountsList-modal-btn confirm"
                  onClick={confirmAccountsListDelete}
                >
                  Yes
                </button>
                <button
                  className="accountsList-modal-btn cancel"
                  onClick={closeAccountsListModal}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="accountsList-modal-buttons">
                <button
                  className="accountsList-modal-btn cancel"
                  onClick={closeAccountsListModal}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountsList;
