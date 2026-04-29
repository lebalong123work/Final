import { useEffect, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminComics.css";
import "./adminTransactions.css";
import { ToastContainer, toast } from "react-toastify";
import Swal from "sweetalert2";
const API_BASE = "http://localhost:5000";

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  const text = await res.text();

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {

    //
  }

  if (!res.ok) throw new Error(json?.message || `HTTP ${res.status}`);
  return json;
}

export default function AdminCategories() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const token = localStorage.getItem("token") || "";

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);

      const data = await fetchJSON(`${API_BASE}/api/categories`);

      setRows(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setName("");
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setName(row.name);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const saveCategory = async () => {
    if (!name.trim()) {
      toast.error("Category name cannot be empty");
      return;
    }

    try {
      setSaving(true);

      if (editing) {
        const res = await fetchJSON(
          `${API_BASE}/api/categories/${editing.id}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ name }),
          }
        );

        setRows((prev) =>
          prev.map((x) => (x.id === editing.id ? res.data : x))
        );

        toast.success("Category updated successfully");
      } else {
        const res = await fetchJSON(`${API_BASE}/api/categories`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name }),
        });

        setRows((prev) => [res.data, ...prev]);

        toast.success("Category added successfully");
      }

      closeModal();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id) => {
  const result = await Swal.fire({
    title: "Delete category?",
    text: "You will not be able to recover it after deletion.",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Delete",
    cancelButtonText: "Cancel",
    confirmButtonColor: "#dc3545",
    reverseButtons: true,
    focusCancel: true,
  });

  if (!result.isConfirmed) return;

  try {
    await fetchJSON(`${API_BASE}/api/categories/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    setRows((prev) => prev.filter((x) => x.id !== id));
    toast.success("Category deleted");
  } catch (e) {
    toast.error(e.message);
  }
};

  return (
    <div className="ad-layout">
      <AdminSidebar />
  <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <main className="ad-main">
        <div className="container-fluid px-4 py-4">

          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="ad-title m-0">Manage Categories</h2>
              <div className="small text-secondary">
                Total: <b>{rows.length}</b> categories
              </div>
            </div>

            <button className="btn btn-dark" onClick={openAdd}>
              <i className="bi bi-plus-lg me-1"></i>
              Add Category
            </button>
          </div>

          {err && (
            <div className="alert alert-warning">
              {err}
            </div>
          )}

          {/* Table */}
          <div className="card shadow-sm border-0 rounded-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr className="text-secondary small">
                      <th>ID</th>
                      <th>Category Name</th>
                      <th>Created At</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          Loading...
                        </td>
                      </tr>
                    ) : rows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-5 text-secondary">
                          No categories found
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr key={r.id}>
                          <td>{r.id}</td>
                          <td className="fw-semibold">{r.name}</td>
                          <td className="small text-secondary">
                            {fmtDate(r.created_at)}
                          </td>

                          <td className="text-end">
                            <button
                              className="btn btn-outline-dark btn-sm me-2"
                              onClick={() => openEdit(r)}
                            >
                              <i className="bi bi-pencil"></i>
                            </button>

                            <button
                              className="btn btn-outline-danger btn-sm"
                              onClick={() => deleteCategory(r.id)}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modal */}
          {modalOpen && (
            <div className="ad-modal-backdrop">
              <div className="ad-modal">

                <div className="d-flex justify-content-between mb-3">
                  <div className="fw-bold">
                    {editing ? "Edit Category" : "Add Category"}
                  </div>

                  <button
                    className="btn btn-light btn-sm"
                    onClick={closeModal}
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                </div>

                <label className="form-label">Category Name</label>

                <input
                  className="form-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <div className="d-flex gap-2 mt-4">
                  <button
                    className="btn btn-outline-secondary w-100"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary w-100"
                    onClick={saveCategory}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}