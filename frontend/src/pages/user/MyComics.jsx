import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../../components/Header";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import "./myComics.css";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import TiptapLink from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";

const API_BASE = "http://localhost:5000";
const LIMIT = 12;

function buildSelfCover(cover) {
  if (!cover) return "https://via.placeholder.com/500x700?text=No+Cover";
  if (cover.startsWith("http")) return cover;
  if (cover.startsWith("data:image")) return cover;
  if (cover.startsWith("/")) return `${API_BASE}${cover}`;
  return cover;
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN");
}

function statusLabel(status) {
  if (Number(status) === 1) return "Hiển thị";
  if (Number(status) === 0) return "Ẩn";
  return "Không rõ";
}

function priceLabel(item) {
  if (item?.is_paid) return item?.price > 0 ? fmtVND(item.price) : "Trả phí";
  return "Miễn phí";
}

export default function MyComics() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token") || "";

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  }, []);

  const [items, setItems] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [catLoading, setCatLoading] = useState(false);
  const [error, setError] = useState("");

  const [q, setQ] = useState("");
  const [catId, setCatId] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ===== modal thêm / sửa truyện =====
  const [selfModalOpen, setSelfModalOpen] = useState(false);
  const [selfSaving, setSelfSaving] = useState(false);
  const [editingSelfId, setEditingSelfId] = useState(null);

  const [selfDraft, setSelfDraft] = useState({
    title: "",
    author: "",
    translated_by: "",
    cover_image: "",
    description: "",
    total_chapters: 1,
    category_id: "",
    category_name: "",
    status: 1,
    is_paid: false,
    price: 0,
  });

  // ===== modal quản lý chương =====
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [chapterComic, setChapterComic] = useState(null);
  const [chapterItems, setChapterItems] = useState([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState("");

  // ===== modal thêm / sửa chương =====
  const [chapterFormOpen, setChapterFormOpen] = useState(false);
  const [chapterSaving, setChapterSaving] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterDraft, setChapterDraft] = useState({
    comic_id: "",
    chapter_no: 1,
    chapter_title: "Chương 1",
  });

  const coverInputRef = useRef(null);
  const descImageInputRef = useRef(null);
  const chapterImageInputRef = useRef(null);

  const descEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Nhập mô tả truyện...",
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
    },
  });

  const chapterEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Nhập nội dung chương...",
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),
      Underline,
      Image.configure({
        inline: false,
        allowBase64: true,
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
    },
  });

  useEffect(() => {
    if (!token) {
      toast.warning("Bạn cần đăng nhập để vào trang này.");
      navigate("/login");
    }
  }, [token, navigate]);

  const fetchCategories = async () => {
    try {
      setCatLoading(true);
      const r = await fetch(`${API_BASE}/api/categories`);
      const j = await r.json().catch(() => ({}));
      if (r.ok) {
        setCats(Array.isArray(j?.data) ? j.data : []);
      }
    } catch {
      //
    } finally {
      setCatLoading(false);
    }
  };

  const fetchMyComics = async (p = 1) => {
    try {
      setLoading(true);
      setError("");

      const url = new URL(`${API_BASE}/api/self-comics/my`);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(LIMIT));
      if (q.trim()) url.searchParams.set("q", q.trim());
      if (catId) url.searchParams.set("categoryId", String(catId));

      const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Không tải được truyện tự đăng");

      setItems(Array.isArray(data?.data) ? data.data : []);
      setPage(data?.page || p);
      setTotalPages(data?.totalPages || 1);
    } catch (e) {
      setItems([]);
      setPage(1);
      setTotalPages(1);
      setError(e.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const fetchChaptersByComic = async (comicId) => {
    try {
      setChapterError("");
      setChapterLoading(true);

      const res = await fetch(`${API_BASE}/api/self-chapters/comic/${comicId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Lỗi tải danh sách chương");

      setChapterItems(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setChapterItems([]);
      setChapterError(e.message || "Không tải được chương");
    } finally {
      setChapterLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMyComics(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, catId]);

  const handleDelete = async (comic) => {
    const result = await Swal.fire({
      title: "Xóa truyện này?",
      text: `Bạn có chắc muốn xóa "${comic?.title || "truyện này"}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true,
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/self-comics/${comic.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Xóa truyện thất bại");

      toast.success("Đã xóa truyện!");
      fetchMyComics(page);
    } catch (e) {
      toast.error(e.message || "Lỗi xóa truyện");
    }
  };

  // ================== editor helpers ==================
  const setEditorLink = (editor) => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Nhập link:", prev);
    if (url === null) return;

    const v = url.trim();
    if (!v) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: v }).run();
  };

  const addImageByUrlToEditor = (editor) => {
    if (!editor) return;
    const url = window.prompt("Nhập URL ảnh:");
    if (!url) return;
    const v = url.trim();
    if (!v) return;
    editor.chain().focus().setImage({ src: v, alt: "image" }).run();
  };

  const pickDescImageFile = () => descImageInputRef.current?.click();
  const pickChapterImageFile = () => chapterImageInputRef.current?.click();

  const uploadImageToEditor = (e, editor, successMsg = "Đã chèn ảnh") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (typeof base64 === "string") {
        editor?.chain().focus().setImage({ src: base64, alt: file.name }).run();
        toast.success(successMsg);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  // ================== cover image ==================
  const pickCoverFile = () => coverInputRef.current?.click();

  const onUploadCoverImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh hợp lệ");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (typeof base64 === "string") {
        setSelfDraft((p) => ({ ...p, cover_image: base64 }));
        toast.success("Đã chọn ảnh chính");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeCoverImage = () => {
    setSelfDraft((p) => ({ ...p, cover_image: "" }));
  };

  // ================== category ensure ==================
  const ensureCategoryId = async () => {
    const categoryName = String(selfDraft.category_name || "").trim();

    if (!categoryName) return null;

    const res = await fetch(`${API_BASE}/api/categories/ensure`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name: categoryName }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.message || "Không thể tạo / kiểm tra danh mục");
    }

    return data?.data?.id || null;
  };

  // ================== self modal ==================
  const resetSelfDraft = () => {
    setSelfDraft({
      title: "",
      author: "",
      translated_by: "",
      cover_image: "",
      description: "",
      total_chapters: 1,
      category_id: "",
      category_name: "",
      status: 1,
      is_paid: false,
      price: 0,
    });
    setEditingSelfId(null);
    setTimeout(() => descEditor?.commands?.setContent(""), 0);
  };

  const openSelfModal = () => {
    if (!token) {
      toast.warning("Bạn cần đăng nhập để đăng truyện.");
      return;
    }
    resetSelfDraft();
    setSelfModalOpen(true);
  };

  const openEditSelfModal = (comic) => {
    if (!token) {
      toast.warning("Bạn cần đăng nhập.");
      return;
    }

    setEditingSelfId(comic.id);
    setSelfDraft({
      title: comic?.title || "",
      author: comic?.author || "",
      translated_by: comic?.translated_by || "",
      cover_image: comic?.cover_image || "",
      description: comic?.description || "",
      total_chapters: Number(comic?.total_chapters || 1),
      category_id: comic?.category_id ? String(comic.category_id) : "",
      category_name: comic?.category_name || "",
      status: Number(comic?.status ?? 1),
      is_paid: !!comic?.is_paid,
      price: Number(comic?.price || 0),
    });

    setSelfModalOpen(true);
    setTimeout(() => {
      descEditor?.commands?.setContent(comic?.description || "");
    }, 0);
  };

  const closeSelfModal = () => {
    if (selfSaving) return;
    setSelfModalOpen(false);
    setEditingSelfId(null);
  };

  const saveSelfComic = async () => {
    if (!token) return toast.error("Thiếu token đăng nhập.");

    const title = String(selfDraft.title || "").trim();
    const author = String(selfDraft.author || "").trim();
    const translatedBy = String(selfDraft.translated_by || "").trim();
    const coverImage = String(selfDraft.cover_image || "").trim();
    const descriptionHTML = descEditor?.getHTML?.() || "";
    const totalChapters = Math.max(1, Number(selfDraft.total_chapters || 1));

    if (!title) return toast.error("Vui lòng nhập tiêu đề");
    if (!coverImage) return toast.error("Vui lòng thêm ảnh chính");
    if (totalChapters < 1) return toast.error("Tổng số chương phải >= 1");

    const isPaid = !!selfDraft.is_paid;
    const price = Math.max(0, Number(selfDraft.price || 0));

    if (isPaid && price <= 0) {
      return toast.error("Giá phải > 0 khi bật trả phí");
    }

    try {
      setSelfSaving(true);

      const ensuredCategoryId = await ensureCategoryId();

      const payload = {
        title,
        author: author || null,
        translated_by: translatedBy || null,
        cover_image: coverImage,
        description: descriptionHTML || null,
        total_chapters: totalChapters,
        status: Number(selfDraft.status || 1),
        category_id: ensuredCategoryId || null,
        is_paid: isPaid,
        price: isPaid ? price : 0,
      };

      const isEdit = !!editingSelfId;
      const url = isEdit
        ? `${API_BASE}/api/self-comics/${editingSelfId}`
        : `${API_BASE}/api/self-comics`;

      const method = isEdit ? "PATCH" : "POST";

      const r = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(
          data?.message || (isEdit ? "Cập nhật truyện thất bại" : "Tạo truyện thất bại")
        );
      }

      toast.success(isEdit ? "Đã cập nhật truyện!" : "Đã tạo truyện!");

      closeSelfModal();
      await fetchCategories();
      await fetchMyComics(1);
      setPage(1);
    } catch (e) {
      toast.error(e.message || "Lỗi lưu truyện");
    } finally {
      setSelfSaving(false);
    }
  };

  // ================== chapter manager ==================
  const openChapterManager = async (comic) => {
    setChapterComic(comic);
    setChapterModalOpen(true);
    setChapterItems([]);
    await fetchChaptersByComic(comic.id);
  };

  const closeChapterManager = () => {
    if (chapterSaving) return;
    setChapterModalOpen(false);
    setChapterComic(null);
    setChapterItems([]);
    setChapterError("");
    closeChapterForm();
  };

  const openCreateChapterForm = () => {
    if (!chapterComic) return;

    const nextNo =
      Array.isArray(chapterItems) && chapterItems.length
        ? Math.max(...chapterItems.map((x) => Number(x.chapter_no || 0))) + 1
        : 1;

    setEditingChapterId(null);
    setChapterDraft({
      comic_id: chapterComic.id,
      chapter_no: nextNo,
      chapter_title: `Chương ${nextNo}`,
    });
    setChapterFormOpen(true);

    setTimeout(() => {
      chapterEditor?.commands?.setContent("");
    }, 0);
  };

  const openEditChapterForm = async (chapter) => {
    setEditingChapterId(chapter.id);
    setChapterDraft({
      comic_id: chapter.comic_id,
      chapter_no: Number(chapter.chapter_no || 1),
      chapter_title: chapter.chapter_title || `Chương ${chapter.chapter_no || 1}`,
    });
    setChapterFormOpen(true);

    try {
      const res = await fetch(`${API_BASE}/api/self-chapters/${chapter.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Không tải được chi tiết chương");

      setTimeout(() => {
        chapterEditor?.commands?.setContent(data?.data?.content || "");
      }, 0);
    } catch (e) {
      toast.error(e.message || "Lỗi tải chương");
    }
  };

  const closeChapterForm = () => {
    if (chapterSaving) return;
    setEditingChapterId(null);
    setChapterFormOpen(false);
    setChapterDraft({
      comic_id: "",
      chapter_no: 1,
      chapter_title: "Chương 1",
    });
    setTimeout(() => {
      chapterEditor?.commands?.setContent("");
    }, 0);
  };

  const handleChangeChapterNo = (value) => {
    const n = Math.max(1, Number(value || 1));
    setChapterDraft((p) => ({
      ...p,
      chapter_no: n,
      chapter_title:
        !p.chapter_title || p.chapter_title.startsWith("Chương ")
          ? `Chương ${n}`
          : p.chapter_title,
    }));
  };

  const saveChapter = async () => {
    if (!token) return toast.error("Thiếu token đăng nhập.");
    if (!chapterComic) return toast.error("Thiếu truyện.");

    const chapterNo = Math.max(1, Number(chapterDraft.chapter_no || 1));
    const chapterTitle =
      String(chapterDraft.chapter_title || "").trim() || `Chương ${chapterNo}`;
    const contentHTML = chapterEditor?.getHTML?.() || "";
    const plainText = chapterEditor?.getText?.().trim() || "";
    const hasImage = contentHTML.includes("<img");

    if (!chapterTitle) return toast.error("Vui lòng nhập tiêu đề chương");
    if (!plainText && !hasImage) return toast.error("Vui lòng nhập nội dung chương");

    try {
      setChapterSaving(true);

      const isEdit = !!editingChapterId;
      const url = isEdit
        ? `${API_BASE}/api/self-chapters/${editingChapterId}`
        : `${API_BASE}/api/self-chapters`;

      const method = isEdit ? "PATCH" : "POST";

      const body = isEdit
        ? JSON.stringify({
            chapter_title: chapterTitle,
            content: contentHTML,
          })
        : JSON.stringify({
            comic_id: Number(chapterComic.id),
            chapter_no: chapterNo,
            chapter_title: chapterTitle,
            content: contentHTML,
          });

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          data?.message || (isEdit ? "Cập nhật chương thất bại" : "Thêm chương thất bại")
        );
      }

      toast.success(isEdit ? "Đã cập nhật chương!" : "Đã thêm chương!");
      closeChapterForm();
      await fetchChaptersByComic(chapterComic.id);
      await fetchMyComics(page);
    } catch (e) {
      toast.error(e.message || "Lỗi lưu chương");
    } finally {
      setChapterSaving(false);
    }
  };

  const deleteChapter = async (chapter) => {
    const result = await Swal.fire({
      title: "Xóa chương này?",
      text: `Bạn có chắc muốn xóa "${chapter?.chapter_title || "chương này"}" không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
      reverseButtons: true,
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/api/self-chapters/${chapter.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Xóa chương thất bại");

      toast.success("Đã xóa chương!");
      await fetchChaptersByComic(chapterComic.id);
      await fetchMyComics(page);
    } catch (e) {
      toast.error(e.message || "Lỗi xóa chương");
    }
  };

  return (
    <>
      <Header />
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />

      <div className="mc-page">
        <div className="container py-4 py-lg-5">
          <div className="mc-hero">
            <div className="mc-hero__content">
              <div className="mc-kicker">
                <i className="bi bi-journal-richtext me-2" />
                Creator Studio
              </div>

              <h1 className="mc-title">Truyện của tôi</h1>
              <p className="mc-subtitle">
                Quản lý truyện tự đăng, cập nhật nội dung và theo dõi danh sách truyện của bạn.
              </p>

              <div className="mc-hero__stats">
                <div className="mc-stat">
                  <span className="mc-stat__value">{items.length}</span>
                  <span className="mc-stat__label">Truyện hiện tại</span>
                </div>

                <div className="mc-stat">
                  <span className="mc-stat__value">{page}</span>
                  <span className="mc-stat__label">Trang hiện tại</span>
                </div>

                <div className="mc-stat">
                  <span className="mc-stat__value">{totalPages}</span>
                  <span className="mc-stat__label">Tổng trang</span>
                </div>
              </div>
            </div>

            <div className="mc-hero__actions">
              <button
                className="btn mc-btn-primary"
                type="button"
                onClick={openSelfModal}
              >
                <i className="bi bi-plus-circle me-2" />
                Thêm truyện mới
              </button>

              <Link className="btn mc-btn-light" to="/profile">
                <i className="bi bi-person-circle me-2" />
                Về trang cá nhân
              </Link>
            </div>
          </div>

          <div className="mc-toolbar">
            <div className="mc-search">
              <i className="bi bi-search" />
              <input
                type="text"
                placeholder="Tìm theo tên truyện..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="mc-filter-wrap">
              <select
                className="form-select mc-select"
                value={catId}
                onChange={(e) => {
                  setCatId(e.target.value);
                  setPage(1);
                }}
                disabled={catLoading}
              >
                <option value="">Tất cả danh mục</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

            
            </div>
          </div>

          {error ? (
            <div className="alert alert-warning rounded-4 mt-3">
              <i className="bi bi-exclamation-triangle me-2" />
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="mc-loading">
              <div className="spinner-border spinner-border-sm" />
              <span>Đang tải truyện...</span>
            </div>
          ) : null}

          {!loading && items.length === 0 ? (
            <div className="mc-empty">
              <div className="mc-empty__icon">
                <i className="bi bi-journal-x" />
              </div>
              <h3>Bạn chưa có truyện nào</h3>
              <p>Hãy bắt đầu tạo bộ truyện đầu tiên của bạn ngay hôm nay.</p>
              <button
                className="btn mc-btn-primary"
                type="button"
                onClick={openSelfModal}
              >
                <i className="bi bi-plus-lg me-2" />
                Tạo truyện đầu tiên
              </button>
            </div>
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="row g-4 mt-1">
              {items.map((c) => (
                <div key={c.id} className="col-12 col-sm-6 col-xl-4">
                  <div className="mc-card">
                    <div className="mc-card__thumb">
                      <img
                        src={buildSelfCover(c.cover_image)}
                        alt={c.title || "comic"}
                      />

                      <div className="mc-card__overlay">
                        <span className={`mc-badge ${Number(c.status) === 1 ? "show" : "hide"}`}>
                          {statusLabel(c.status)}
                        </span>

                        <span className={`mc-badge ${c?.is_paid ? "paid" : "free"}`}>
                          {priceLabel(c)}
                        </span>
                      </div>
                    </div>

                    <div className="mc-card__body">
                      <h3 className="mc-card__title" title={c?.title || ""}>
                        {c?.title || "Không có tiêu đề"}
                      </h3>

                      <div className="mc-card__meta">
                        <div>
                          <i className="bi bi-person me-2" />
                          <b>Tác giả:</b> {c?.author || user?.name || "—"}
                        </div>

                        <div>
                          <i className="bi bi-translate me-2" />
                          <b>Dịch bởi:</b> {c?.translated_by || "—"}
                        </div>

                        <div>
                          <i className="bi bi-grid me-2" />
                          <b>Danh mục:</b> {c?.category_name || "—"}
                        </div>

                        <div>
                          <i className="bi bi-collection-play me-2" />
                          <b>Tổng chương:</b> {c?.total_chapters || 1}
                        </div>

                        <div>
                          <i className="bi bi-clock-history me-2" />
                          <b>Cập nhật:</b> {fmtDate(c?.updated_at || c?.created_at)}
                        </div>
                      </div>

                      <div className="mc-card__actions">
                        <button
                          className="btn mc-action mc-action--edit"
                          type="button"
                          onClick={() => openEditSelfModal(c)}
                        >
                          <i className="bi bi-pencil-square me-2" />
                          Sửa
                        </button>

                        <button
                          className="btn mc-action mc-action--chapter"
                          type="button"
                          onClick={() => openChapterManager(c)}
                        >
                          <i className="bi bi-collection me-2" />
                          Chương
                        </button>

                        <button
                          className="btn mc-action mc-action--delete"
                          type="button"
                          onClick={() => handleDelete(c)}
                        >
                          <i className="bi bi-trash me-2" />
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {!loading && totalPages > 1 ? (
            <div className="mc-pagination">
              <button
                className="btn mc-page-btn"
                disabled={page <= 1}
                onClick={() => fetchMyComics(page - 1)}
                type="button"
              >
                <i className="bi bi-chevron-left" />
              </button>

              <div className="mc-page-indicator">
                Trang <b>{page}</b> / {totalPages}
              </div>

              <button
                className="btn mc-page-btn"
                disabled={page >= totalPages}
                onClick={() => fetchMyComics(page + 1)}
                type="button"
              >
                <i className="bi bi-chevron-right" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {selfModalOpen ? (
        <div className="ad-modal-backdrop" onMouseDown={closeSelfModal}>
          <div className="ad-modal ad-modal-lg mt-7" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ad-modal-header d-flex align-items-start justify-content-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="fw-bold">
                  {editingSelfId ? "Sửa truyện tự đăng" : "Thêm truyện tự đăng"}
                </div>
                <div className="text-secondary small">
                  Ảnh chính + mô tả + tác giả + tổng số chương + miễn phí / trả phí
                </div>
              </div>

              <button
                className="btn btn-light btn-sm"
                type="button"
                onClick={closeSelfModal}
                disabled={selfSaving}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="ad-modal-body-scroll mt-3">
              <label className="form-label fw-semibold">Tiêu đề</label>
              <input
                className="form-control"
                value={selfDraft.title}
                onChange={(e) => setSelfDraft((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ví dụ: Truyện tự đăng của tôi..."
                disabled={selfSaving}
              />

              <div className="mt-3">
                <label className="form-label fw-semibold">Tác giả</label>
                <input
                  className="form-control"
                  value={selfDraft.author}
                  onChange={(e) => setSelfDraft((p) => ({ ...p, author: e.target.value }))}
                  placeholder="Ví dụ: Nguyễn Văn A"
                  disabled={selfSaving}
                />
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Dịch bởi</label>
                <input
                  className="form-control"
                  value={selfDraft.translated_by}
                  onChange={(e) =>
                    setSelfDraft((p) => ({ ...p, translated_by: e.target.value }))
                  }
                  placeholder="Ví dụ: Nhóm dịch ABC"
                  disabled={selfSaving}
                />
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Ảnh chính</label>

                <div className="d-flex flex-wrap gap-2 mb-2">
                  <input
                    className="form-control"
                    value={selfDraft.cover_image}
                    onChange={(e) => setSelfDraft((p) => ({ ...p, cover_image: e.target.value }))}
                    placeholder="Nhập URL ảnh chính hoặc upload từ máy..."
                    disabled={selfSaving}
                  />

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm"
                      onClick={pickCoverFile}
                      disabled={selfSaving}
                    >
                      <i className="bi bi-upload me-1" />
                      Upload ảnh chính
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={removeCoverImage}
                      disabled={selfSaving || !selfDraft.cover_image}
                    >
                      <i className="bi bi-x-circle me-1" />
                      Xóa ảnh
                    </button>
                  </div>
                </div>

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={onUploadCoverImage}
                />

                {selfDraft.cover_image ? (
                  <div className="mt-2">
                    <img
                      src={buildSelfCover(selfDraft.cover_image)}
                      alt="cover preview"
                      className="self-cover-preview"
                    />
                  </div>
                ) : (
                  <div className="text-secondary small mt-2">Chưa có ảnh chính.</div>
                )}
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Mô tả truyện</label>

                <div className="d-flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${descEditor?.isActive("bold") ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => descEditor?.chain().focus().toggleBold().run()}
                    disabled={!descEditor}
                  >
                    <b>B</b>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${descEditor?.isActive("italic") ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => descEditor?.chain().focus().toggleItalic().run()}
                    disabled={!descEditor}
                  >
                    <i>I</i>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${descEditor?.isActive("underline") ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => descEditor?.chain().focus().toggleUnderline().run()}
                    disabled={!descEditor}
                  >
                    <u>U</u>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${descEditor?.isActive("bulletList") ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => descEditor?.chain().focus().toggleBulletList().run()}
                    disabled={!descEditor}
                  >
                    • List
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => setEditorLink(descEditor)}
                    disabled={!descEditor}
                  >
                    <i className="bi bi-link-45deg" /> Link
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => addImageByUrlToEditor(descEditor)}
                    disabled={!descEditor}
                  >
                    <i className="bi bi-image" /> Ảnh URL
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={pickDescImageFile}
                    disabled={!descEditor}
                  >
                    <i className="bi bi-upload" /> Upload ảnh
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => descEditor?.chain().focus().clearContent().run()}
                    disabled={!descEditor}
                  >
                    Xóa mô tả
                  </button>
                </div>

                <input
                  ref={descImageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => uploadImageToEditor(e, descEditor, "Đã chèn ảnh vào mô tả")}
                />

                <div className="border rounded-3 p-3 bg-white editor-scroll-box">
                  <EditorContent editor={descEditor} />
                </div>
              </div>

              <div className="row g-3 mt-1">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Tổng số chương</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={selfDraft.total_chapters}
                    onChange={(e) =>
                      setSelfDraft((p) => ({
                        ...p,
                        total_chapters: Math.max(1, Number(e.target.value || 1)),
                      }))
                    }
                    disabled={selfSaving}
                  />
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-semibold">Danh mục</label>
                  <input
                    className="form-control"
                    value={selfDraft.category_name}
                    onChange={(e) =>
                      setSelfDraft((p) => ({ ...p, category_name: e.target.value }))
                    }
                    placeholder="Ví dụ: Hành động, Tu tiên, Ngôn tình..."
                    disabled={selfSaving}
                  />
                  <div className="text-secondary small mt-1">
                    Nếu danh mục chưa có trong CSDL, hệ thống sẽ tự thêm mới.
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Trạng thái</label>
                <select
                  className="form-select"
                  value={selfDraft.status}
                  onChange={(e) => setSelfDraft((p) => ({ ...p, status: Number(e.target.value) }))}
                  disabled={selfSaving}
                >
                  <option value={1}>Hiển thị</option>
                  <option value={0}>Ẩn</option>
                </select>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Hình thức xem</label>
                <select
                  className="form-select"
                  value={selfDraft.is_paid ? "paid" : "free"}
                  onChange={(e) => {
                    const v = e.target.value;
                    setSelfDraft((p) => ({
                      ...p,
                      is_paid: v === "paid",
                      price: v === "paid" ? Number(p.price || 0) : 0,
                    }));
                  }}
                  disabled={selfSaving}
                >
                  <option value="free">Miễn phí</option>
                  <option value="paid">Trả phí</option>
                </select>

                {selfDraft.is_paid ? (
                  <div className="mt-2">
                    <label className="form-label fw-semibold mb-1">Giá (VNĐ)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-control"
                      value={selfDraft.price}
                      onChange={(e) => setSelfDraft((p) => ({ ...p, price: e.target.value }))}
                      placeholder="Ví dụ: 5000"
                      disabled={selfSaving}
                    />
                  </div>
                ) : (
                  <div className="text-secondary small mt-2">User sẽ được xem miễn phí.</div>
                )}
              </div>
            </div>

            <div className="ad-modal-actions mt-4">
              <button
                className="btn btn-outline-secondary w-100"
                type="button"
                onClick={closeSelfModal}
                disabled={selfSaving}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary w-100"
                type="button"
                onClick={saveSelfComic}
                disabled={selfSaving}
              >
                {selfSaving ? "Đang lưu..." : editingSelfId ? "Cập nhật" : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {chapterModalOpen ? (
        <div className="ad-modal-backdrop" onMouseDown={closeChapterManager}>
          <div className="ad-modal ad-modal-lg" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ad-modal-header d-flex align-items-start justify-content-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="fw-bold">Quản lý chương</div>
                <div className="text-secondary small">
                  {chapterComic?.title || "—"} • Tổng chương: {chapterComic?.total_chapters || 1}
                </div>
              </div>

              <button
                className="btn btn-light btn-sm"
                type="button"
                onClick={closeChapterManager}
                disabled={chapterSaving}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="d-flex justify-content-between align-items-center gap-2 my-3 flex-wrap">
              <div className="text-secondary small">
                Đã có: <b>{chapterItems.length}</b> / {chapterComic?.total_chapters || 1} chương
              </div>

              <button
                className="btn btn-primary btn-sm"
                type="button"
                onClick={openCreateChapterForm}
              >
                <i className="bi bi-plus-lg me-1" />
                Thêm chương
              </button>
            </div>

            {chapterError ? (
              <div className="alert alert-warning rounded-4">
                <i className="bi bi-exclamation-triangle me-2" />
                {chapterError}
              </div>
            ) : null}

            {chapterLoading ? (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" />
                  <span className="text-secondary">Đang tải chương...</span>
                </div>
              </div>
            ) : null}

            {!chapterLoading && chapterItems.length === 0 ? (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body text-center text-secondary">
                  <i className="bi bi-inbox fs-3 d-block mb-2" />
                  Chưa có chương nào.
                </div>
              </div>
            ) : null}

            {!chapterLoading && chapterItems.length > 0 ? (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Chương</th>
                      <th>Tiêu đề</th>
                      <th>Ngày tạo</th>
                      <th className="text-end">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapterItems.map((ch) => (
                      <tr key={ch.id}>
                        <td>{ch.id}</td>
                        <td>{ch.chapter_no}</td>
                        <td>{ch.chapter_title}</td>
                        <td>{ch.created_at ? new Date(ch.created_at).toLocaleString("vi-VN") : "—"}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <button
                              className="btn btn-primary btn-sm"
                              type="button"
                              onClick={() => openEditChapterForm(ch)}
                            >
                              <i className="bi bi-pencil-square me-1" />
                              Sửa
                            </button>

                            <button
                              className="btn btn-danger btn-sm"
                              type="button"
                              onClick={() => deleteChapter(ch)}
                            >
                              <i className="bi bi-trash me-1" />
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {chapterFormOpen ? (
        <div className="ad-modal-backdrop" onMouseDown={closeChapterForm}>
          <div className="ad-modal ad-modal-lg" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ad-modal-header d-flex align-items-start justify-content-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="fw-bold">
                  {editingChapterId ? "Sửa chương" : "Thêm chương"}
                </div>
                <div className="text-secondary small">
                  {chapterComic?.title || "—"}
                </div>
              </div>

              <button
                className="btn btn-light btn-sm"
                type="button"
                onClick={closeChapterForm}
                disabled={chapterSaving}
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="ad-modal-body-scroll mt-3">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Số chương</label>
                  <input
                    type="number"
                    min="1"
                    className="form-control"
                    value={chapterDraft.chapter_no}
                    onChange={(e) => handleChangeChapterNo(e.target.value)}
                    disabled={chapterSaving || !!editingChapterId}
                  />
                  {editingChapterId ? (
                    <div className="text-secondary small mt-1">
                      Khi sửa, API hiện tại không cập nhật số chương.
                    </div>
                  ) : null}
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-semibold">Tiêu đề chương</label>
                  <input
                    className="form-control"
                    value={chapterDraft.chapter_title}
                    onChange={(e) =>
                      setChapterDraft((p) => ({ ...p, chapter_title: e.target.value }))
                    }
                    placeholder="Ví dụ: Chương 1"
                    disabled={chapterSaving}
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Nội dung chương</label>

                <div className="d-flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    className={`btn btn-sm ${chapterEditor?.isActive("bold") ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => chapterEditor?.chain().focus().toggleBold().run()}
                    disabled={!chapterEditor}
                  >
                    <b>B</b>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${chapterEditor?.isActive("italic") ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => chapterEditor?.chain().focus().toggleItalic().run()}
                    disabled={!chapterEditor}
                  >
                    <i>I</i>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${chapterEditor?.isActive("underline") ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => chapterEditor?.chain().focus().toggleUnderline().run()}
                    disabled={!chapterEditor}
                  >
                    <u>U</u>
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm ${chapterEditor?.isActive("bulletList") ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => chapterEditor?.chain().focus().toggleBulletList().run()}
                    disabled={!chapterEditor}
                  >
                    • List
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-dark btn-sm"
                    onClick={() => setEditorLink(chapterEditor)}
                    disabled={!chapterEditor}
                  >
                    <i className="bi bi-link-45deg" /> Link
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => addImageByUrlToEditor(chapterEditor)}
                    disabled={!chapterEditor}
                  >
                    <i className="bi bi-image" /> Ảnh URL
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-success btn-sm"
                    onClick={pickChapterImageFile}
                    disabled={!chapterEditor}
                  >
                    <i className="bi bi-upload" /> Upload ảnh
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => chapterEditor?.chain().focus().clearContent().run()}
                    disabled={!chapterEditor}
                  >
                    Xóa nội dung
                  </button>
                </div>

                <input
                  ref={chapterImageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => uploadImageToEditor(e, chapterEditor, "Đã chèn ảnh vào chương")}
                />

                <div className="border rounded-3 p-3 bg-white editor-scroll-box">
                  <EditorContent editor={chapterEditor} />
                </div>
              </div>
            </div>

            <div className="ad-modal-actions mt-4">
              <button
                className="btn btn-outline-secondary w-100"
                type="button"
                onClick={closeChapterForm}
                disabled={chapterSaving}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary w-100"
                type="button"
                onClick={saveChapter}
                disabled={chapterSaving}
              >
                {chapterSaving ? "Đang lưu..." : editingChapterId ? "Cập nhật chương" : "Lưu chương"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <style>{`
        .tiptap-content {
          min-height: 220px;
          outline: none;
          line-height: 1.6;
        }

        .tiptap-content p {
          margin: 0 0 10px;
        }

        .tiptap-content ul {
          padding-left: 20px;
          margin: 0 0 10px;
        }

        .tiptap-content img {
          max-width: 100%;
          height: auto;
          display: block;
          border-radius: 12px;
          margin: 10px 0;
        }

        .tiptap-content a {
          text-decoration: underline;
        }

        .tiptap-content p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #999;
          pointer-events: none;
          height: 0;
        }

        .ad-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          z-index: 1050;
        }

        .ad-modal {
          width: 100%;
          max-width: 900px;
          max-height: 90vh;
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        .ad-modal-lg {
          max-width: 980px;
        }

        .ad-modal-header {
          flex: 0 0 auto;
        }

        .ad-modal-body-scroll {
          flex: 1 1 auto;
          overflow-y: auto;
          padding-right: 6px;
          min-height: 0;
        }

        .ad-modal-actions {
          flex: 0 0 auto;
          display: flex;
          gap: 12px;
          border-top: 1px solid #eee;
          padding-top: 16px;
          background: #fff;
        }

        .editor-scroll-box {
          min-height: 240px;
          max-height: 320px;
          overflow-y: auto;
        }

        .self-cover-preview {
          width: 150px;
          height: 210px;
          object-fit: cover;
          border-radius: 14px;
          border: 1px solid #ddd;
          display: block;
        }

        .ad-modal-body-scroll::-webkit-scrollbar,
        .editor-scroll-box::-webkit-scrollbar {
          width: 8px;
        }

        .ad-modal-body-scroll::-webkit-scrollbar-thumb,
        .editor-scroll-box::-webkit-scrollbar-thumb {
          background: #c7c7c7;
          border-radius: 10px;
        }

        .ad-modal-body-scroll::-webkit-scrollbar-track,
        .editor-scroll-box::-webkit-scrollbar-track {
          background: #f3f3f3;
        }

        @media (max-width: 767.98px) {
          .ad-modal {
            padding: 16px;
            border-radius: 14px;
          }

          .ad-modal-actions {
            flex-direction: column;
          }

          .self-cover-preview {
            width: 120px;
            height: 170px;
          }
        }
      `}</style>
    </>
  );
}
