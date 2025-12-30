import React, { useEffect, useState } from "react";

const LocationsPage = () => {
  const [locations, setLocations] = useState([]);
  const [loadingTable, setLoadingTable] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [savingLocation, setSavingLocation] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);
  const [formName, setFormName] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [locationToDelete, setLocationToDelete] = useState(null);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [messageText, setMessageText] = useState("");
  const [messageType, setMessageType] = useState("");

  const showMessage = (text, type) => {
    setMessageText(text);
    setMessageType(type);
    setTimeout(() => {
      setMessageText("");
      setMessageType("");
    }, 3000);
  };

  // Load locations
  const fetchLocations = async () => {
    try {
      setLoadingTable(true);
      const res = await fetch("http://localhost:5000/api/locations");
      const data = await res.json();
      setLocations(data.locations || []);
    } catch (error) {
      console.error("Get locations error:", error);
      showMessage("Failed to load locations", "error");
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Open create modal
  const openCreateModal = () => {
    setEditingLocation(null);
    setFormName("");
    setFormCode("");
    setFormErrors({});
    setModalVisible(true);
  };

  // Open edit modal
  const openEditModal = (location) => {
    setEditingLocation(location);
    setFormName(location.name);
    setFormCode(location.code);
    setFormErrors({});
    setModalVisible(true);
  };

  // Create / update location
  const handleSaveLocation = async () => {
    // Validate
    const errors = {};
    if (!formName.trim()) errors.name = "Please enter location name";
    if (!formCode.trim()) errors.code = "Please enter location code";

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSavingLocation(true);
      const url = editingLocation
        ? `http://localhost:5000/api/locations/${editingLocation._id}`
        : "http://localhost:5000/api/locations";

      const res = await fetch(url, {
        method: editingLocation ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, code: formCode }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage(
          data.message ||
            (editingLocation
              ? "Location updated successfully"
              : "Location created successfully"),
          "success"
        );
        setModalVisible(false);
        setEditingLocation(null);
        setFormName("");
        setFormCode("");
        setFormErrors({});
        fetchLocations();
      } else {
        showMessage(data.message || "Failed to save location", "error");
      }
    } catch (error) {
      console.error("Save location error:", error);
      showMessage("Failed to save location", "error");
    } finally {
      setSavingLocation(false);
    }
  };

  // Open delete confirmation modal
  const openDeleteModal = (location) => {
    setLocationToDelete(location);
    setDeletePassword("");
    setDeleteModalVisible(true);
  };

  // Confirm delete with password
  const handleConfirmDelete = async () => {
    if (!locationToDelete) return;

    const storedUser = localStorage.getItem("authUser");
    let authUser = null;
    if (storedUser) {
      try {
        authUser = JSON.parse(storedUser);
      } catch (e) {
        console.error("Error parsing authUser:", e);
      }
    }

    if (!authUser || !authUser.email) {
      showMessage("User info missing. Please log in again.", "error");
      return;
    }

    if (!deletePassword) {
      showMessage("Please enter your password to confirm.", "error");
      return;
    }

    try {
      setDeleteLoading(true);

      // Verify password
      const loginRes = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: authUser.email,
          password: deletePassword,
        }),
      });

      if (!loginRes.ok) {
        showMessage("Incorrect password", "error");
        setDeleteLoading(false);
        return;
      }

      // Delete location
      const deleteRes = await fetch(
        `http://localhost:5000/api/locations/${locationToDelete._id}`,
        { method: "DELETE" }
      );

      if (deleteRes.ok) {
        showMessage("Location deleted successfully", "success");
        setDeleteModalVisible(false);
        setLocationToDelete(null);
        setDeletePassword("");
        fetchLocations();
      } else {
        showMessage("Failed to delete location", "error");
      }
    } catch (error) {
      console.error("Delete location error:", error);
      showMessage("Failed to delete location. Please try again.", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  // ---------- UI styles (no logic change) ----------
  const styles = {
    page: {
      minHeight: "100vh",
      background: "#f8fafc",
      padding: "28px 16px",
    },
    container: {
      maxWidth: 980,
      margin: "0 auto",
    },
    toast: {
      position: "fixed",
      top: 18,
      right: 18,
      zIndex: 9999,
      padding: "10px 14px",
      borderRadius: 12,
      border: "1px solid",
      boxShadow: "0 10px 25px rgba(15, 23, 42, 0.12)",
      background: "#ffffff",
      color: "#0f172a",
      display: "flex",
      alignItems: "center",
      gap: 10,
      fontWeight: 600,
      fontSize: 14,
      maxWidth: 360,
    },
    toastDot: (type) => ({
      width: 10,
      height: 10,
      borderRadius: 999,
      background: type === "success" ? "#16a34a" : "#ef4444",
      boxShadow:
        type === "success"
          ? "0 0 0 4px rgba(22,163,74,0.15)"
          : "0 0 0 4px rgba(239,68,68,0.15)",
    }),
    card: {
      background: "#ffffff",
      borderRadius: 18,
      border: "1px solid #e2e8f0",
      boxShadow: "0 12px 30px rgba(15, 23, 42, 0.06)",
      padding: 18,
    },
    headerRow: {
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "space-between",
      gap: 12,
      flexWrap: "wrap",
      marginBottom: 14,
    },
    title: {
      margin: 0,
      fontSize: 22,
      fontWeight: 800,
      color: "#0f172a",
      letterSpacing: "-0.02em",
    },
    subtitle: {
      margin: "6px 0 0 0",
      color: "#64748b",
      fontSize: 13,
      lineHeight: "18px",
    },
    countPill: {
      marginTop: 10,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 10px",
      borderRadius: 999,
      background: "#f1f5f9",
      border: "1px solid #e2e8f0",
      color: "#0f172a",
      fontSize: 12,
      fontWeight: 700,
    },
    primaryBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 14px",
      color: "#ffffff",
      border: "1px solid #1d4ed8",
      borderRadius: 12,
      fontWeight: 700,
      cursor: "pointer",
      background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
      boxShadow: "0 10px 20px rgba(37, 99, 235, 0.18)",
      fontSize: 14,
      height: 40,
    },
    primaryBtnDisabled: {
      opacity: 0.6,
      cursor: "not-allowed",
    },
    ghostBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      border: "1px solid #e2e8f0",
      borderRadius: 12,
      background: "#ffffff",
      color: "#0f172a",
      fontWeight: 700,
      cursor: "pointer",
      fontSize: 14,
      height: 36,
    },
    dangerBtn: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 12px",
      border: "1px solid #fecaca",
      borderRadius: 12,
      background: "#fff1f2",
      color: "#b91c1c",
      fontWeight: 800,
      cursor: "pointer",
      fontSize: 13,
      height: 36,
    },
    tableWrap: {
      overflowX: "auto",
      borderRadius: 14,
      border: "1px solid #e2e8f0",
      background: "#ffffff",
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: 0,
      minWidth: 560,
    },
    th: {
      padding: "12px 16px",
      textAlign: "left",
      fontSize: 12,
      fontWeight: 800,
      color: "#334155",
      background: "#f8fafc",
      borderBottom: "1px solid #e2e8f0",
    },
    td: {
      padding: "12px 16px",
      borderBottom: "1px solid #f1f5f9",
      color: "#0f172a",
      fontSize: 14,
    },
    nameCell: {
      fontWeight: 800,
      color: "#0f172a",
    },
    codePill: {
      display: "inline-flex",
      alignItems: "center",
      padding: "4px 10px",
      borderRadius: 999,
      background: "#eff6ff",
      border: "1px solid #dbeafe",
      color: "#1d4ed8",
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: "0.02em",
    },
    actionsRow: {
      display: "flex",
      gap: 8,
      flexWrap: "wrap",
    },
    linkBtn: {
      border: "1px solid #e2e8f0",
      background: "#ffffff",
      borderRadius: 10,
      padding: "8px 10px",
      cursor: "pointer",
      fontWeight: 800,
      color: "#0f172a",
      fontSize: 12,
    },
    linkBtnDanger: {
      border: "1px solid #fecaca",
      background: "#fff1f2",
      color: "#b91c1c",
    },
    emptyState: {
      padding: 24,
      textAlign: "center",
      color: "#64748b",
    },
    modalOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: "rgba(15, 23, 42, 0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
      padding: 16,
    },
    modalCard: {
      background: "#ffffff",
      borderRadius: 16,
      border: "1px solid #e2e8f0",
      boxShadow: "0 25px 60px rgba(15, 23, 42, 0.30)",
      width: "100%",
      maxWidth: 520,
      padding: 18,
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 12,
    },
    modalTitle: {
      margin: 0,
      fontSize: 18,
      fontWeight: 900,
      color: "#0f172a",
    },
    modalSub: {
      margin: "4px 0 0 0",
      fontSize: 13,
      color: "#64748b",
    },
    label: {
      display: "block",
      fontSize: 12,
      fontWeight: 800,
      color: "#334155",
      marginBottom: 6,
    },
    input: (hasError) => ({
      width: "100%",
      padding: "10px 12px",
      border: hasError ? "1px solid #ef4444" : "1px solid #cbd5e1",
      borderRadius: 12,
      fontSize: 14,
      boxSizing: "border-box",
      outline: "none",
      background: "#ffffff",
    }),
    errorText: {
      color: "#ef4444",
      fontSize: 12,
      marginTop: 6,
      marginBottom: 0,
      fontWeight: 700,
    },
    modalFooter: {
      display: "flex",
      gap: 10,
      marginTop: 14,
    },
    dangerHeader: {
      margin: 0,
      fontSize: 18,
      fontWeight: 900,
      color: "#b91c1c",
    },
    warningBox: {
      background: "#fff1f2",
      border: "1px solid #fecaca",
      borderRadius: 12,
      padding: 12,
      marginBottom: 12,
      color: "#0f172a",
    },
    smallMuted: {
      color: "#64748b",
      fontSize: 13,
      margin: "0 0 10px 0",
    },
  };

  return (
    <div style={styles.page}>
      {/* Toast */}
      {messageText && (
        <div
          style={{
            ...styles.toast,
            borderColor: messageType === "success" ? "#bbf7d0" : "#fecaca",
          }}
        >
          <span style={styles.toastDot(messageType)} />
          <span style={{ lineHeight: "18px" }}>{messageText}</span>
        </div>
      )}

      <div style={styles.container}>
        {/* Main card */}
        <div style={styles.card}>
          <div style={styles.headerRow}>
            <div>
              <h2 style={styles.title}>Locations</h2>
              <p style={styles.subtitle}>
                Manage your store locations used for voting sessions.
              </p>

              <div style={styles.countPill}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: "#2563eb",
                    boxShadow: "0 0 0 4px rgba(37,99,235,0.12)",
                  }}
                />
                <span>{locations.length} location{locations.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            <button onClick={openCreateModal} style={styles.primaryBtn}>
              <span style={{ fontSize: 18, lineHeight: 0 }}>+</span>
              Add Location
            </button>
          </div>

          {/* Table */}
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Location Name</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {loadingTable ? (
                  <tr>
                    <td colSpan="3" style={{ ...styles.td, padding: 20, color: "#64748b" }}>
                      Loading...
                    </td>
                  </tr>
                ) : locations.length === 0 ? (
                  <tr>
                    <td colSpan="3" style={styles.emptyState}>
                      No locations found. Create your first location.
                    </td>
                  </tr>
                ) : (
                  locations.map((location) => (
                    <tr key={location._id}>
                      <td style={styles.td}>
                        <span style={styles.nameCell}>{location.name}</span>
                      </td>
                      <td style={styles.td}>
                        <span style={styles.codePill}>{location.code}</span>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionsRow}>
                          <button
                            onClick={() => openEditModal(location)}
                            style={styles.linkBtn}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openDeleteModal(location)}
                            style={{ ...styles.linkBtn, ...styles.linkBtnDanger }}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.modalTitle}>
                  {editingLocation ? "Edit location" : "Add location"}
                </h3>
                <p style={styles.modalSub}>
                  {editingLocation
                    ? "Update the name and code for this location."
                    : "Create a new location for voting."}
                </p>
              </div>

              <button
                onClick={() => {
                  setModalVisible(false);
                  setEditingLocation(null);
                  setFormName("");
                  setFormCode("");
                  setFormErrors({});
                }}
                style={styles.ghostBtn}
              >
                Close
              </button>
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={styles.label}>Location Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="e.g. Sheffield"
                style={styles.input(!!formErrors.name)}
              />
              {formErrors.name && <p style={styles.errorText}>{formErrors.name}</p>}
            </div>

            <div style={{ marginBottom: 6 }}>
              <label style={styles.label}>Location Code</label>
              <input
                type="text"
                value={formCode}
                onChange={(e) => setFormCode(e.target.value)}
                placeholder="e.g. SHF"
                style={styles.input(!!formErrors.code)}
              />
              {formErrors.code && <p style={styles.errorText}>{formErrors.code}</p>}
            </div>

            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  setModalVisible(false);
                  setEditingLocation(null);
                  setFormName("");
                  setFormCode("");
                  setFormErrors({});
                }}
                style={{ ...styles.ghostBtn, flex: 1, justifyContent: "center" }}
              >
                Cancel
              </button>

              <button
                onClick={handleSaveLocation}
                disabled={savingLocation}
                style={{
                  ...styles.primaryBtn,
                  ...(!savingLocation ? {} : styles.primaryBtnDisabled),
                  flex: 1,
                  justifyContent: "center",
                }}
              >
                {savingLocation ? "Saving..." : editingLocation ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModalVisible && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalCard}>
            <div style={styles.modalHeader}>
              <div>
                <h3 style={styles.dangerHeader}>Delete location</h3>
                <p style={styles.modalSub}>
                  This action cannot be undone. Please confirm with your password.
                </p>
              </div>

              <button
                onClick={() => {
                  setDeleteModalVisible(false);
                  setLocationToDelete(null);
                  setDeletePassword("");
                }}
                style={styles.ghostBtn}
              >
                Close
              </button>
            </div>

            {locationToDelete && (
              <div style={styles.warningBox}>
                <div style={{ fontWeight: 900, marginBottom: 6 }}>
                  {locationToDelete.name}
                </div>
                <span style={styles.codePill}>{locationToDelete.code}</span>
              </div>
            )}

            <p style={styles.smallMuted}>Enter your login password to continue.</p>

            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input(false)}
            />

            <div style={styles.modalFooter}>
              <button
                onClick={() => {
                  setDeleteModalVisible(false);
                  setLocationToDelete(null);
                  setDeletePassword("");
                }}
                style={{ ...styles.ghostBtn, flex: 1, justifyContent: "center" }}
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
                style={{
                  ...styles.dangerBtn,
                  flex: 1,
                  justifyContent: "center",
                  opacity: deleteLoading ? 0.6 : 1,
                  cursor: deleteLoading ? "not-allowed" : "pointer",
                }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationsPage;
