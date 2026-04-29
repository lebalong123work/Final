import { useEffect, useRef, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminComics.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";

import ExternalComicSettingModal from "./components/ExternalComicSettingModal";
import SelfComicFormModal from "./components/SelfComicFormModal";
import ChapterModal from "./components/ChapterModal";

const API_BASE = "http://localhost:5000";
const LIMIT = 12;
const IMG_BASE = "https://img.otruyenapi.com/uploads/comics/";

function buildThumb(thumb) {
  if (!thumb) return "";
  if (thumb.startsWith("http")) return thumb;
  return IMG_BASE + thumb;
}

function buildSelfCover(cover) {
  if (!cover) return "https://via.placeholder.com/500x700?text=No+Cover";
  if (cover.startsWith("http")) return cover;
  if (cover.startsWith("data:image")) return cover;
  if (cover.startsWith("/")) return `${API_BASE}${cover}`;
  return cover;
}

function Badge({ children, tone = "dark" }) {
  return <span className={`badge rounded-pill text-bg-${tone}`}>{children}</span>;
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

function normalizeStatusLabel(status) {
  if (status === "ongoing") return "Ongoing";
  if (status === "completed") return "Completed";
  if (Number(status) === 1) return "Visible";
  if (Number(status) === 0) return "Hidden";
  return String(status || "unknown");
}

function normalizeStatusTone(status) {
  if (status === "ongoing") return "success";
  if (status === "completed") return "secondary";
  if (Number(status) === 1) return "success";
  if (Number(status) === 0) return "secondary";
  return "dark";
}

function getSelectedValues(selectEl) {
  return Array.from(selectEl.selectedOptions || []).map((opt) => opt.value);
}

export default function AdminComics() {
  const [tab, setTab] = useState("external");

  const [extItems, setExtItems] = useState([]);
  const [extLoading, setExtLoading] = useState(false);
  const [extError, setExtError] = useState("");

  const [selfItems, setSelfItems] = useState([]);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState("");

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [cats, setCats] = useState([]);
  const [catId, setCatId] = useState("");

  const [settingComic, setSettingComic] = useState(null);
  const [settingDraft, setSettingDraft] = useState({
    tab: "pricing",
    type: "free",
    price: 0,
    translator: "",
  });
  const [savingSetting, setSavingSetting] = useState(false);

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
    category_ids: [],
    status: 1,
    is_paid: false,
    price: 0,
  });

  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [chapterComic, setChapterComic] = useState(null);
  const [chapterItems, setChapterItems] = useState([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState("");

  const [chapterFormOpen, setChapterFormOpen] = useState(false);
  const [chapterSaving, setChapterSaving] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterDraft, setChapterDraft] = useState({
    comic_id: "",
    chapter_no: 1,
    chapter_title: "Chapter 1",
  });

  const token = localStorage.getItem("token") || "";
  const coverInputRef = useRef(null);
  const descImageInputRef = useRef(null);
  const chapterImageInputRef = useRef(null);

  const descEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Enter comic description...",
      }),
      Link.configure({
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
        placeholder: "Enter chapter content...",
      }),
      Link.configure({
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

  const fetchCategories = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/categories`);
      const j = await r.json().catch(() => ({}));
      if (r.ok) setCats(Array.isArray(j?.data) ? j.data : []);
    } catch {
      //
    }
  };

  const fetchExternalFromDB = async (p = 1) => {
    try {
      setExtError("");
      setExtLoading(true);

      const url = new URL(`${API_BASE}/api/external-comics`);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(LIMIT));
      if (q.trim()) url.searchParams.set("q", q.trim());

      const res = await fetch(url.toString());
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load comics from DB");

      setExtItems(Array.isArray(data?.data) ? data.data : []);
      setPage(data.page || p);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setExtItems([]);
      setPage(1);
      setTotalPages(1);
      setExtError(e.message || "Failed to load");
    } finally {
      setExtLoading(false);
    }
  };

  const fetchSelfFromDB = async (p = 1) => {
    try {
      setSelfError("");
      setSelfLoading(true);

      const url = new URL(`${API_BASE}/api/self-comics`);
      url.searchParams.set("page", String(p));
      url.searchParams.set("limit", String(LIMIT));
      if (q.trim()) url.searchParams.set("q", q.trim());
      if (catId) url.searchParams.set("categoryId", String(catId));

      const res = await fetch(url.toString(), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load self-published comics");

      setSelfItems(Array.isArray(data?.data) ? data.data : []);
      setPage(data.page || p);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setSelfItems([]);
      setPage(1);
      setTotalPages(1);
      setSelfError(e.message || "Failed to load");
    } finally {
      setSelfLoading(false);
    }
  };

  const fetchChaptersByComic = async (comicId) => {
    try {
      setChapterError("");
      setChapterLoading(true);

      const res = await fetch(`${API_BASE}/api/self-chapters/comic/${comicId}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load chapter list");

      setChapterItems(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setChapterItems([]);
      setChapterError(e.message || "Failed to load chapters");
    } finally {
      setChapterLoading(false);
    }
  };

  const handleSyncToDB = async () => {
    if (!token) {
      toast.warning("You need to log in as admin to sync.");
      return;
    }

    const toastId = toast.loading("Syncing data...");
    try {
      setExtLoading(true);

      const res = await fetch(`${API_BASE}/api/admin/external-comics/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          maxPages: 1,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Sync failed");

      await fetchExternalFromDB(1);

      toast.update(toastId, {
        render: `Sync successful! ${data?.stats?.upsertedComics || 0} comics`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (e) {
      toast.update(toastId, {
        render: e.message || "Sync failed",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setExtLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "external") fetchExternalFromDB(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q]);

  useEffect(() => {
    if (tab !== "self") return;
    fetchCategories();
    fetchSelfFromDB(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, q, catId]);

  const current = tab === "external" ? extItems : selfItems;

  const pricingLabel = (comic) => {
    if (!comic) return null;
    if (comic.is_paid) {
      return {
        text: `Paid${comic.price ? ` • ${fmtVND(comic.price)}` : ""}`,
        tone: "danger",
      };
    }
    return { text: "Free", tone: "success" };
  };

  const openSetting = (comic) => {
    const isPaid = !!comic?.is_paid;
    setSettingComic(comic);
    setSettingDraft({
      tab: "pricing",
      type: isPaid ? "paid" : "free",
      price: Number(comic?.price || 0),
      translator: comic?.translator || "",
    });
  };

  const closeSetting = () => {
    if (savingSetting) return;
    setSettingComic(null);
    setSettingDraft({
      tab: "pricing",
      type: "free",
      price: 0,
      translator: "",
    });
  };

  const saveSetting = async () => {
    if (!token) return toast.error("Admin token missing.");
    if (!settingComic?.api_id) return;

    const isPaid = settingDraft.type === "paid";
    const price = Math.max(0, Number(settingDraft.price || 0));

    if (isPaid && price <= 0) return toast.error("Price must be > 0 when paid mode is enabled");

    try {
      setSavingSetting(true);

      const res = await fetch(
        `${API_BASE}/api/admin/external-comics/${settingComic.api_id}/pricing`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ is_paid: isPaid, price }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to save settings");

      setExtItems((prev) =>
        prev.map((x) =>
          x.api_id === settingComic.api_id
            ? { ...x, is_paid: data?.data?.is_paid, price: data?.data?.price }
            : x
        )
      );

      toast.success("Pricing settings saved!");
      closeSetting();
    } catch (e) {
      toast.error(e.message || "Save error");
    } finally {
      setSavingSetting(false);
    }
  };

  const saveTranslator = async () => {
    if (!token) return toast.error("Admin token missing.");
    if (!settingComic?.slug && !settingComic?.api_id) {
      return toast.error("Comic identifier not found.");
    }

    const comicKey = settingComic?.slug || settingComic?.api_id;
    const translator = String(settingDraft.translator || "").trim();

    try {
      setSavingSetting(true);

      const res = await fetch(
        `${API_BASE}/api/external-comics/${encodeURIComponent(comicKey)}/translator`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            translator: translator || null,
          }),
        }
      );

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.message || "Failed to save translator");
      }

      setExtItems((prev) =>
        prev.map((x) =>
          x.api_id === settingComic.api_id || x.slug === settingComic.slug
            ? { ...x, translator: data?.data?.translator ?? null }
            : x
        )
      );

      setSettingComic((prev) =>
        prev
          ? {
              ...prev,
              translator: data?.data?.translator ?? null,
            }
          : prev
      );

      setSettingDraft((prev) => ({
        ...prev,
        translator: data?.data?.translator || "",
      }));

      toast.success(data?.message || "Translator updated");
    } catch (e) {
      toast.error(e.message || "Save translator error");
    } finally {
      setSavingSetting(false);
    }
  };

  const setEditorLink = (editor) => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href || "";
    const url = window.prompt("Enter URL:", prev);
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
    const url = window.prompt("Enter image URL:");
    if (!url) return;
    const v = url.trim();
    if (!v) return;
    editor.chain().focus().setImage({ src: v, alt: "image" }).run();
  };

  const pickDescImageFile = () => descImageInputRef.current?.click();
  const pickChapterImageFile = () => chapterImageInputRef.current?.click();

  const uploadImageToEditor = (e, editor, successMsg = "Image inserted") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
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

  const pickCoverFile = () => coverInputRef.current?.click();

  const onUploadCoverImage = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      if (typeof base64 === "string") {
        setSelfDraft((p) => ({ ...p, cover_image: base64 }));
        toast.success("Cover image selected");
      }
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const removeCoverImage = () => {
    setSelfDraft((p) => ({ ...p, cover_image: "" }));
  };

  const resetSelfDraft = () => {
    setSelfDraft({
      title: "",
      author: "",
      translated_by: "",
      cover_image: "",
      description: "",
      total_chapters: 1,
      category_ids: [],
      status: 1,
      is_paid: false,
      price: 0,
    });
    setEditingSelfId(null);
    setTimeout(() => descEditor?.commands?.setContent(""), 0);
  };

  const openSelfModal = () => {
    if (!token) return toast.warning("You need to log in to publish a comic.");
    resetSelfDraft();
    setSelfModalOpen(true);
  };

  const openEditSelfModal = (comic) => {
    if (!token) return toast.warning("You need to log in.");
    setEditingSelfId(comic.id);

    setSelfDraft({
      title: comic?.title || "",
      author: comic?.author || "",
      translated_by: comic?.translated_by || "",
      cover_image: comic?.cover_image || "",
      description: comic?.description || "",
      total_chapters: Number(comic?.total_chapters || 1),
      category_ids: Array.isArray(comic?.categories)
        ? comic.categories.map((x) => String(x.id))
        : [],
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
    if (!token) return toast.error("Login token missing.");

    const title = String(selfDraft.title || "").trim();
    const author = String(selfDraft.author || "").trim();
    const translatedBy = String(selfDraft.translated_by || "").trim();
    const coverImage = String(selfDraft.cover_image || "").trim();
    const descriptionHTML = descEditor?.getHTML?.() || "";
    const totalChapters = Math.max(1, Number(selfDraft.total_chapters || 1));
    const normalizedCategoryIds = Array.isArray(selfDraft.category_ids)
      ? [...new Set(selfDraft.category_ids.map((x) => Number(x)).filter((x) => Number.isInteger(x) && x > 0))]
      : [];

    if (!title) return toast.error("Please enter a title");
    if (!coverImage) return toast.error("Please add a cover image");
    if (totalChapters < 1) return toast.error("Total chapters must be >= 1");
    if (normalizedCategoryIds.length === 0) {
      return toast.error("Please select at least 1 category");
    }

    const isPaid = !!selfDraft.is_paid;
    const price = Math.max(0, Number(selfDraft.price || 0));

    if (isPaid && price <= 0) {
      return toast.error("Price must be > 0 when paid mode is enabled");
    }

    try {
      setSelfSaving(true);

      const payload = {
        title,
        author: author || null,
        translated_by: translatedBy || null,
        cover_image: coverImage,
        description: descriptionHTML || null,
        total_chapters: totalChapters,
        status: Number(selfDraft.status || 1),
        category_ids: normalizedCategoryIds,
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
          data?.message || (isEdit ? "Failed to update comic" : "Failed to create comic")
        );
      }

      toast.success(isEdit ? "Comic updated!" : "Comic created!");
      closeSelfModal();
      await fetchSelfFromDB(1);
      setPage(1);
    } catch (e) {
      toast.error(e.message || "Error saving comic");
    } finally {
      setSelfSaving(false);
    }
  };

  const deleteSelfComic = async (comic) => {
    const result = await Swal.fire({
      title: "Delete this comic?",
      text: `Are you sure you want to delete "${comic?.title || "this comic"}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
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
      if (!res.ok) throw new Error(data?.message || "Failed to delete comic");

      toast.success("Comic deleted!");
      await fetchSelfFromDB(page);
    } catch (e) {
      toast.error(e.message || "Error deleting comic");
    }
  };

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
      chapter_title: `Chapter ${nextNo}`,
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
      chapter_title: chapter.chapter_title || `Chapter ${chapter.chapter_no || 1}`,
    });
    setChapterFormOpen(true);

    try {
      const res = await fetch(`${API_BASE}/api/self-chapters/${chapter.id}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Failed to load chapter details");

      setTimeout(() => {
        chapterEditor?.commands?.setContent(data?.data?.content || "");
      }, 0);
    } catch (e) {
      toast.error(e.message || "Error loading chapter");
    }
  };

  const closeChapterForm = () => {
    if (chapterSaving) return;
    setEditingChapterId(null);
    setChapterFormOpen(false);
    setChapterDraft({
      comic_id: "",
      chapter_no: 1,
      chapter_title: "Chapter 1",
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
        !p.chapter_title || p.chapter_title.startsWith("Chapter ")
          ? `Chapter ${n}`
          : p.chapter_title,
    }));
  };

  const saveChapter = async () => {
    if (!token) return toast.error("Login token missing.");
    if (!chapterComic) return toast.error("Missing comic.");

    const chapterNo = Math.max(1, Number(chapterDraft.chapter_no || 1));
    const chapterTitle =
      String(chapterDraft.chapter_title || "").trim() || `Chapter ${chapterNo}`;
    const contentHTML = chapterEditor?.getHTML?.() || "";
    const plainText = chapterEditor?.getText?.().trim() || "";
    const hasImage = contentHTML.includes("<img");

    if (!chapterTitle) return toast.error("Please enter a chapter title");
    if (!plainText && !hasImage) return toast.error("Please enter chapter content");

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
        throw new Error(data?.message || (isEdit ? "Failed to update chapter" : "Failed to add chapter"));
      }

      toast.success(isEdit ? "Chapter updated!" : "Chapter added!");
      closeChapterForm();
      await fetchChaptersByComic(chapterComic.id);
    } catch (e) {
      toast.error(e.message || "Error saving chapter");
    } finally {
      setChapterSaving(false);
    }
  };

  const deleteChapter = async (chapter) => {
    const result = await Swal.fire({
      title: "Delete this chapter?",
      text: `Are you sure you want to delete "${chapter?.chapter_title || "this chapter"}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
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
      if (!res.ok) throw new Error(data?.message || "Failed to delete chapter");

      toast.success("Chapter deleted!");
      await fetchChaptersByComic(chapterComic.id);
    } catch (e) {
      toast.error(e.message || "Error deleting chapter");
    }
  };

  return (
    <div className="ad-layout">
      <AdminSidebar />

      <main className="ad-main">
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />

        <div className="ad-page">
          <div className="container-fluid px-4 py-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
              <div>
                <h2 className="m-0 ad-title">Manage Comics</h2>
                <div className="text-secondary small">
                  External Comics (DB) &amp; Self-published Comics
                </div>
              </div>

              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="input-group ad-search">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Search comics..."
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>

                {tab === "self" ? (
                  <>
                    <select
                      className="form-select"
                      style={{ width: 220 }}
                      value={catId}
                      onChange={(e) => {
                        setCatId(e.target.value);
                        setPage(1);
                      }}
                    >
                      <option value="">All categories</option>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>

                    <button
                      className="btn btn-primary d-flex align-items-center gap-2 px-4 rounded-3 text-nowrap"
                      type="button"
                      onClick={openSelfModal}
                    >
                      <i className="bi bi-plus-lg" />
                      Add Comic
                    </button>
                  </>
                ) : (
                  <button
                    className="btn btn-outline-dark d-flex align-items-center gap-2 px-4 text-nowrap"
                    type="button"
                    onClick={handleSyncToDB}
                    disabled={extLoading}
                  >
                    <i className={`bi ${extLoading ? "bi-arrow-repeat" : "bi-cloud-download"}`} />
                    Sync
                  </button>
                )}
              </div>
            </div>

            <div className="ad-tabs mb-3">
              <button
                className={`ad-tab ${tab === "external" ? "active" : ""}`}
                onClick={() => setTab("external")}
                type="button"
              >
                <i className="bi bi-globe2 me-2" />
                External Comics (DB)
                <span className="ms-2 badge rounded-pill text-bg-light">{extItems.length}</span>
              </button>

              <button
                className={`ad-tab ${tab === "self" ? "active" : ""}`}
                onClick={() => setTab("self")}
                type="button"
              >
                <i className="bi bi-person-lines-fill me-2" />
                Self-published Comics
                <span className="ms-2 badge rounded-pill text-bg-light">{selfItems.length}</span>
              </button>
            </div>

            {tab === "external" && extError ? (
              <div className="alert alert-warning rounded-4">
                <i className="bi bi-exclamation-triangle me-2" />
                {extError}
              </div>
            ) : null}

            {tab === "self" && selfError ? (
              <div className="alert alert-warning rounded-4">
                <i className="bi bi-exclamation-triangle me-2" />
                {selfError}
              </div>
            ) : null}

            {tab === "external" && extLoading ? (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" />
                  <span className="text-secondary">Loading data...</span>
                </div>
              </div>
            ) : null}

            {tab === "self" && selfLoading ? (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" />
                  <span className="text-secondary">Loading data...</span>
                </div>
              </div>
            ) : null}

            <div className="row g-3 mt-1">
              {current.map((c) => {
                const id = c?.api_id || c?.id;
                const name = c?.name || c?.title || "Untitled";
                const status = c?.status || "unknown";
                const updatedAt = c?.updated_at || c?.updatedAt || c?.created_at;
                const priceBadge = pricingLabel(c);

                const thumb =
                  tab === "external"
                    ? buildThumb(c?.thumb_url)
                    : buildSelfCover(c?.cover_image);

                return (
                  <div key={id} className="col-12 col-sm-6 col-lg-4 d-flex">
                    <div className="card ad-comic-card border-0 shadow-sm w-100">
                      <div className="ad-comic-thumb">
                        {thumb ? <img src={thumb} alt={name} /> : null}

                        <div className="ad-comic-topbadges">
                          <Badge tone={normalizeStatusTone(status)}>
                            {normalizeStatusLabel(status)}
                          </Badge>

                          {priceBadge ? <Badge tone={priceBadge.tone}>{priceBadge.text}</Badge> : null}
                        </div>

                        <div className="ad-comic-actions d-flex gap-2 flex-wrap">
                          {tab === "external" ? (
                            <button className="btn btn-warning btn-sm" type="button" onClick={() => openSetting(c)}>
                              <i className="bi bi-gear me-1" />
                              Settings
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                type="button"
                                onClick={() => openEditSelfModal(c)}
                              >
                                <i className="bi bi-pencil-square me-1" />
                                Edit
                              </button>

                              <button
                                className="btn btn-info btn-sm text-white"
                                type="button"
                                onClick={() => openChapterManager(c)}
                              >
                                <i className="bi bi-collection-play me-1" />
                                Chapters
                              </button>

                              <button
                                className="btn btn-danger btn-sm"
                                type="button"
                                onClick={() => deleteSelfComic(c)}
                              >
                                <i className="bi bi-trash me-1" />
                                Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="fw-bold ad-comic-title" title={name}>
                          {name}
                        </div>

                        {tab === "external" ? (
                          <div className="text-secondary small mt-2">
                            Translated by: <b>{c?.translator || "—"}</b>
                          </div>
                        ) : null}

                        {tab === "self" ? (
                          <>
                            <div className="text-secondary small mt-2">
                              Author: <b>{c?.author || "—"}</b>
                            </div>

                            <div className="text-secondary small mt-2">
                              Translated by: <b>{c?.translated_by || "—"}</b>
                            </div>

                            <div className="text-secondary small mt-2">
                              Total chapters: <b>{c?.total_chapters || 1}</b>
                            </div>

                            <div className="text-secondary small mt-2">Categories:</div>
                            <div className="d-flex flex-wrap gap-2 mt-1">
                              {Array.isArray(c?.categories) && c.categories.length > 0 ? (
                                c.categories.map((cat) => (
                                  <span key={cat.id} className="badge text-bg-light border">
                                    {cat.name}
                                  </span>
                                ))
                              ) : (
                                <b>—</b>
                              )}
                            </div>

                            <div className="text-secondary small mt-2">
                              Cover image: <b>{c?.cover_image ? "Set" : "Not set"}</b>
                            </div>
                          </>
                        ) : null}

                        <div className="ad-comic-meta mt-3">
                          <div className="text-secondary small">
                            <i className="bi bi-clock me-1" />
                            {updatedAt ? new Date(updatedAt).toLocaleString("vi-VN") : "—"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {!extLoading && tab === "external" && current.length === 0 ? (
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body text-center text-secondary">
                      <i className="bi bi-inbox fs-3 d-block mb-2" />
                      No comics found.
                    </div>
                  </div>
                </div>
              ) : null}

              {!selfLoading && tab === "self" && current.length === 0 ? (
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body text-center text-secondary">
                      <i className="bi bi-inbox fs-3 d-block mb-2" />
                      No self-published comics yet.
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="d-flex justify-content-center mt-4">
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${page <= 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => (tab === "external" ? fetchExternalFromDB(page - 1) : fetchSelfFromDB(page - 1))}
                      type="button"
                    >
                      «
                    </button>
                  </li>

                  <li className="page-item active">
                    <span className="page-link">
                      {page}/{totalPages}
                    </span>
                  </li>

                  <li className={`page-item ${page >= totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link"
                      onClick={() => (tab === "external" ? fetchExternalFromDB(page + 1) : fetchSelfFromDB(page + 1))}
                      type="button"
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        </div>

        <SelfComicFormModal
          selfModalOpen={selfModalOpen}
          selfSaving={selfSaving}
          editingSelfId={editingSelfId}
          selfDraft={selfDraft}
          setSelfDraft={setSelfDraft}
          cats={cats}
          coverInputRef={coverInputRef}
          descImageInputRef={descImageInputRef}
          descEditor={descEditor}
          onClose={closeSelfModal}
          onSave={saveSelfComic}
          onPickCoverFile={pickCoverFile}
          onUploadCoverImage={onUploadCoverImage}
          onRemoveCoverImage={removeCoverImage}
          onPickDescImageFile={pickDescImageFile}
          onSetEditorLink={setEditorLink}
          onAddImageByUrl={addImageByUrlToEditor}
          onUploadImageToEditor={uploadImageToEditor}
        />

        <ChapterModal
          chapterModalOpen={chapterModalOpen}
          chapterComic={chapterComic}
          chapterItems={chapterItems}
          chapterLoading={chapterLoading}
          chapterError={chapterError}
          chapterSaving={chapterSaving}
          onCloseManager={closeChapterManager}
          onOpenCreateForm={openCreateChapterForm}
          onOpenEditForm={openEditChapterForm}
          onDeleteChapter={deleteChapter}
          chapterFormOpen={chapterFormOpen}
          editingChapterId={editingChapterId}
          chapterDraft={chapterDraft}
          setChapterDraft={setChapterDraft}
          chapterEditor={chapterEditor}
          chapterImageInputRef={chapterImageInputRef}
          onCloseForm={closeChapterForm}
          onSaveChapter={saveChapter}
          onChangeChapterNo={handleChangeChapterNo}
          onSetEditorLink={setEditorLink}
          onAddImageByUrl={addImageByUrlToEditor}
          onPickChapterImageFile={pickChapterImageFile}
          onUploadImageToEditor={uploadImageToEditor}
        />

        <ExternalComicSettingModal
          settingComic={settingComic}
          settingDraft={settingDraft}
          setSettingDraft={setSettingDraft}
          savingSetting={savingSetting}
          onClose={closeSetting}
          onSavePricing={saveSetting}
          onSaveTranslator={saveTranslator}
        />

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
        `}</style>
      </main>
    </div>
  );
}