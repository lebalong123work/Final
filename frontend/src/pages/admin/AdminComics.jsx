import { useEffect, useRef, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminComics.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";

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
  if (status === "ongoing") return "Đang ra";
  if (status === "completed") return "Hoàn thành";
  if (Number(status) === 1) return "Hiển thị";
  if (Number(status) === 0) return "Ẩn";
  return String(status || "unknown");
}

function normalizeStatusTone(status) {
  if (status === "ongoing") return "success";
  if (status === "completed") return "secondary";
  if (Number(status) === 1) return "success";
  if (Number(status) === 0) return "secondary";
  return "dark";
}

export default function AdminComics() {
  const [tab, setTab] = useState("external");

  // ===== EXTERNAL =====
  const [extItems, setExtItems] = useState([]);
  const [extLoading, setExtLoading] = useState(false);
  const [extError, setExtError] = useState("");

  // ===== SELF =====
  const [selfItems, setSelfItems] = useState([]);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState("");

  // search + paging
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // categories
  const [cats, setCats] = useState([]);
  const [catId, setCatId] = useState("");

  // ===== MODAL: pricing external =====
  const [settingComic, setSettingComic] = useState(null);
 const [settingDraft, setSettingDraft] = useState({
  tab: "pricing", // pricing | translator
  type: "free",
  price: 0,
  translator: "",
});
  const [savingSetting, setSavingSetting] = useState(false);

  // ===== MODAL: create/edit self comic =====
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
  status: 1,
  is_paid: false,
  price: 0,
});

  // ===== MODAL: chapters manager =====
  const [chapterModalOpen, setChapterModalOpen] = useState(false);
  const [chapterComic, setChapterComic] = useState(null);
  const [chapterItems, setChapterItems] = useState([]);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState("");

  // ===== MODAL: create/edit chapter =====
  const [chapterFormOpen, setChapterFormOpen] = useState(false);
  const [chapterSaving, setChapterSaving] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState(null);
  const [chapterDraft, setChapterDraft] = useState({
    comic_id: "",
    chapter_no: 1,
    chapter_title: "Chương 1",
  });

  const token = localStorage.getItem("token") || "";
  const coverInputRef = useRef(null);
  const descImageInputRef = useRef(null);
  const chapterImageInputRef = useRef(null);

  // ===== TipTap editor: description =====
  const descEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Nhập mô tả truyện...",
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

  // ===== TipTap editor: chapter content =====
  const chapterEditor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Nhập nội dung chương...",
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

  // ================== FETCH ==================
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
      if (!res.ok) throw new Error(data?.message || "Lỗi tải truyện từ DB");

      setExtItems(Array.isArray(data?.data) ? data.data : []);
      setPage(data.page || p);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setExtItems([]);
      setPage(1);
      setTotalPages(1);
      setExtError(e.message || "Không tải được");
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
      if (!res.ok) throw new Error(data?.message || "Lỗi tải truyện tự đăng");

      setSelfItems(Array.isArray(data?.data) ? data.data : []);
      setPage(data.page || p);
      setTotalPages(data.totalPages || 1);
    } catch (e) {
      setSelfItems([]);
      setPage(1);
      setTotalPages(1);
      setSelfError(e.message || "Không tải được");
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
      if (!res.ok) throw new Error(data?.message || "Lỗi tải danh sách chương");

      setChapterItems(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      setChapterItems([]);
      setChapterError(e.message || "Không tải được chương");
    } finally {
      setChapterLoading(false);
    }
  };

  const handleSyncToDB = async () => {
    if (!token) {
      toast.warning("Bạn cần đăng nhập admin để đồng bộ.");
      return;
    }

    const toastId = toast.loading("Đang đồng bộ dữ liệu...");
    try {
      setExtLoading(true);

      const res = await fetch(`${API_BASE}/api/admin/external-comics/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || "Đồng bộ thất bại");

      await fetchExternalFromDB(1);

      toast.update(toastId, {
        render: `Đồng bộ thành công! ${data?.stats?.upsertedComics || 0} truyện`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (e) {
      toast.update(toastId, {
        render: e.message || "Không đồng bộ được",
        type: "error",
        isLoading: false,
        autoClose: 3000,
      });
    } finally {
      setExtLoading(false);
    }
  };

  // ================== EFFECT ==================
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

  // ================== BADGE PRICING ==================
  const pricingLabel = (comic) => {
    if (!comic) return null;
    if (comic.is_paid) {
      return {
        text: `Trả phí${comic.price ? ` • ${fmtVND(comic.price)}` : ""}`,
        tone: "danger",
      };
    }
    return { text: "Miễn phí", tone: "success" };
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
    if (!token) return toast.error("Thiếu token admin.");
    if (!settingComic?.api_id) return;

    const isPaid = settingDraft.type === "paid";
    const price = Math.max(0, Number(settingDraft.price || 0));

    if (isPaid && price <= 0) return toast.error("Giá phải > 0 khi bật trả phí");

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
      if (!res.ok) throw new Error(data?.message || "Lưu cài đặt thất bại");

      setExtItems((prev) =>
        prev.map((x) =>
          x.api_id === settingComic.api_id
            ? { ...x, is_paid: data?.data?.is_paid, price: data?.data?.price }
            : x
        )
      );

      toast.success("Đã lưu cài đặt giá!");
      closeSetting();
    } catch (e) {
      toast.error(e.message || "Lỗi lưu");
    } finally {
      setSavingSetting(false);
    }
  };


  const saveTranslator = async () => {
  if (!token) return toast.error("Thiếu token admin.");
  if (!settingComic?.slug && !settingComic?.api_id) {
    return toast.error("Không tìm thấy định danh truyện.");
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
      throw new Error(data?.message || "Lưu translator thất bại");
    }

    setExtItems((prev) =>
      prev.map((x) =>
        (x.api_id === settingComic.api_id || x.slug === settingComic.slug)
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

    toast.success(data?.message || "Đã cập nhật translator");
  } catch (e) {
    toast.error(e.message || "Lỗi lưu translator");
  } finally {
    setSavingSetting(false);
  }
};
  // ================== Editor helpers ==================
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

  // ================== COVER IMAGE ==================
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

  // ================== SELF COMIC MODAL ==================



const resetSelfDraft = () => {
  setSelfDraft({
    title: "",
    author: "",
    translated_by: "",
    cover_image: "",
    description: "",
    total_chapters: 1,
    category_id: "",
    status: 1,
    is_paid: false,
    price: 0,
  });
  setEditingSelfId(null);
  setTimeout(() => descEditor?.commands?.setContent(""), 0);
};

  const openSelfModal = () => {
    if (!token) return toast.warning("Bạn cần đăng nhập để đăng truyện.");
    resetSelfDraft();
    setSelfModalOpen(true);
  };

 const openEditSelfModal = (comic) => {
  if (!token) return toast.warning("Bạn cần đăng nhập.");
  setEditingSelfId(comic.id);

  setSelfDraft({
    title: comic?.title || "",
    author: comic?.author || "",
    translated_by: comic?.translated_by || "",
    cover_image: comic?.cover_image || "",
    description: comic?.description || "",
    total_chapters: Number(comic?.total_chapters || 1),
    category_id: comic?.category_id ? String(comic.category_id) : "",
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

    const payload = {
      title,
      author: author || null,
      translated_by: translatedBy || null,
      cover_image: coverImage,
      description: descriptionHTML || null,
      total_chapters: totalChapters,
      status: Number(selfDraft.status || 1),
      category_id: selfDraft.category_id ? Number(selfDraft.category_id) : null,
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
    await fetchSelfFromDB(1);
    setPage(1);
  } catch (e) {
    toast.error(e.message || "Lỗi lưu truyện");
  } finally {
    setSelfSaving(false);
  }
};

  const deleteSelfComic = async (comic) => {
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
      await fetchSelfFromDB(page);
    } catch (e) {
      toast.error(e.message || "Lỗi xóa truyện");
    }
  };

  // ================== CHAPTER MANAGER ==================
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
      const res = await fetch(`${API_BASE}/api/self-chapters/${chapter.id}`);
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
        throw new Error(data?.message || (isEdit ? "Cập nhật chương thất bại" : "Thêm chương thất bại"));
      }

      toast.success(isEdit ? "Đã cập nhật chương!" : "Đã thêm chương!");
      closeChapterForm();
      await fetchChaptersByComic(chapterComic.id);
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
    } catch (e) {
      toast.error(e.message || "Lỗi xóa chương");
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
                <h2 className="m-0 ad-title">Quản lý truyện</h2>
                <div className="text-secondary small">
                  Truyện ngoài (DB) & truyện tự đăng
                </div>
              </div>

              <div className="d-flex gap-2 align-items-center flex-wrap">
                <div className="input-group ad-search">
                  <span className="input-group-text bg-white">
                    <i className="bi bi-search" />
                  </span>
                  <input
                    className="form-control"
                    placeholder="Tìm truyện..."
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
                      <option value="">Tất cả danh mục</option>
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
                      Thêm truyện
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
                    Đồng bộ
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
                Truyện ngoài (DB)
                <span className="ms-2 badge rounded-pill text-bg-light">{extItems.length}</span>
              </button>

              <button
                className={`ad-tab ${tab === "self" ? "active" : ""}`}
                onClick={() => setTab("self")}
                type="button"
              >
                <i className="bi bi-person-lines-fill me-2" />
                Truyện tự đăng
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
                  <span className="text-secondary">Đang tải dữ liệu...</span>
                </div>
              </div>
            ) : null}

            {tab === "self" && selfLoading ? (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" />
                  <span className="text-secondary">Đang tải dữ liệu...</span>
                </div>
              </div>
            ) : null}

            <div className="row g-3 mt-1">
              {current.map((c) => {
                const id = c?.api_id || c?.id;
                const name = c?.name || c?.title || "Không tên";
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
                              Cài đặt
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn btn-primary btn-sm"
                                type="button"
                                onClick={() => openEditSelfModal(c)}
                              >
                                <i className="bi bi-pencil-square me-1" />
                                Sửa
                              </button>

                              <button
                                className="btn btn-info btn-sm text-white"
                                type="button"
                                onClick={() => openChapterManager(c)}
                              >
                                <i className="bi bi-collection-play me-1" />
                                Chương
                              </button>

                              <button
                                className="btn btn-danger btn-sm"
                                type="button"
                                onClick={() => deleteSelfComic(c)}
                              >
                                <i className="bi bi-trash me-1" />
                                Xóa
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
      Dịch bởi: <b>{c?.translator || "—"}</b>
    </div>
  ) : null}
                     {tab === "self" ? (
  <>
    <div className="text-secondary small mt-2">
      Tác giả: <b>{c?.author || "—"}</b>
    </div>

    <div className="text-secondary small mt-2">
      Dịch bởi: <b>{c?.translated_by || "—"}</b>
    </div>

    <div className="text-secondary small mt-2">
      Tổng chương: <b>{c?.total_chapters || 1}</b>
    </div>

    <div className="text-secondary small mt-2">
      Danh mục: <b>{c?.category_name || "—"}</b>
    </div>

    <div className="text-secondary small mt-2">
      Ảnh chính: <b>{c?.cover_image ? "Đã có" : "Chưa có"}</b>
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
                      Không có truyện nào.
                    </div>
                  </div>
                </div>
              ) : null}

              {!selfLoading && tab === "self" && current.length === 0 ? (
                <div className="col-12">
                  <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body text-center text-secondary">
                      <i className="bi bi-inbox fs-3 d-block mb-2" />
                      Chưa có truyện tự đăng.
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

        {selfModalOpen ? (
          <div className="ad-modal-backdrop" onMouseDown={closeSelfModal}>
            <div className="ad-modal ad-modal-lg" onMouseDown={(e) => e.stopPropagation()}>
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
                  <div className="text-secondary small mt-1">
                    Có thể để trống nếu chưa muốn thêm tác giả.
                  </div>
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
  <div className="text-secondary small mt-1">
    Có thể để trống nếu truyện không có nhóm dịch.
  </div>
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
                    <select
                      className="form-select"
                      value={selfDraft.category_id}
                      onChange={(e) => setSelfDraft((p) => ({ ...p, category_id: e.target.value }))}
                      disabled={selfSaving}
                    >
                      <option value="">-- Chọn danh mục --</option>
                      {cats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
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

 {settingComic ? (
  <div className="ad-modal-backdrop" onMouseDown={closeSetting}>
    <div className="ad-modal" onMouseDown={(e) => e.stopPropagation()}>
      <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
        <div className="min-w-0">
          <div className="fw-bold">Cài đặt truyện (Truyện ngoài DB)</div>
          <div className="text-secondary small text-truncate" title={settingComic?.name}>
            {settingComic?.name}
          </div>
        </div>

        <button
          className="btn btn-light btn-sm"
          type="button"
          onClick={closeSetting}
          disabled={savingSetting}
        >
          <i className="bi bi-x-lg" />
        </button>
      </div>

      <div className="mt-3">
        <div className="d-flex gap-2 flex-wrap mb-3">
          <button
            type="button"
            className={`btn ${
              settingDraft.tab === "pricing" ? "btn-dark" : "btn-outline-dark"
            }`}
            onClick={() => setSettingDraft((p) => ({ ...p, tab: "pricing" }))}
            disabled={savingSetting}
          >
            <i className="bi bi-cash-coin me-2" />
            Giá truyện
          </button>

          <button
            type="button"
            className={`btn ${
              settingDraft.tab === "translator" ? "btn-dark" : "btn-outline-dark"
            }`}
            onClick={() => setSettingDraft((p) => ({ ...p, tab: "translator" }))}
            disabled={savingSetting}
          >
            <i className="bi bi-translate me-2" />
            Dịch bởi
          </button>
        </div>

        {settingDraft.tab === "pricing" ? (
          <>
            <label className="form-label fw-semibold">Hình thức xem</label>
            <select
              className="form-select"
              value={settingDraft.type}
              onChange={(e) =>
                setSettingDraft((p) => ({ ...p, type: e.target.value }))
              }
              disabled={savingSetting}
            >
              <option value="free">Miễn phí</option>
              <option value="paid">Trả phí</option>
            </select>

            {settingDraft.type === "paid" ? (
              <div className="mt-3">
                <label className="form-label fw-semibold">Giá (VNĐ)</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  value={settingDraft.price}
                  onChange={(e) =>
                    setSettingDraft((p) => ({ ...p, price: e.target.value }))
                  }
                  placeholder="Ví dụ: 5000"
                  disabled={savingSetting}
                />
              </div>
            ) : (
              <div className="text-secondary small mt-2">
                User sẽ được xem miễn phí.
              </div>
            )}

            <div className="ad-modal-actions mt-4">
              <button
                className="btn btn-outline-secondary w-100"
                type="button"
                onClick={closeSetting}
                disabled={savingSetting}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary w-100"
                type="button"
                onClick={saveSetting}
                disabled={savingSetting}
              >
                {savingSetting ? "Đang lưu..." : "Lưu cài đặt"}
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="form-label fw-semibold">Dịch bởi</label>
            <input
              className="form-control"
              value={settingDraft.translator}
              onChange={(e) =>
                setSettingDraft((p) => ({ ...p, translator: e.target.value }))
              }
              placeholder="Ví dụ: Nhóm dịch ABC"
              disabled={savingSetting}
            />

            <div className="text-secondary small mt-2">
              Có thể để trống để xóa thông tin translator.
            </div>

            <div className="mt-3 p-3 rounded-3 border bg-light">
              <div className="small text-secondary">Giá trị hiện tại</div>
              <div className="fw-semibold">
                {String(settingDraft.translator || "").trim() || "—"}
              </div>
            </div>

            <div className="ad-modal-actions mt-4">
              <button
                className="btn btn-outline-secondary w-100"
                type="button"
                onClick={closeSetting}
                disabled={savingSetting}
              >
                Hủy
              </button>
              <button
                className="btn btn-primary w-100"
                type="button"
                onClick={saveTranslator}
                disabled={savingSetting}
              >
                {savingSetting ? "Đang lưu..." : "Lưu dịch giả"}
              </button>
            </div>
          </>
        )}
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
        `}</style>
      </main>
    </div>
  );
}