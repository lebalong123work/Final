import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import "./profileWallet.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "http://localhost:5000";
const TX_LIMIT = 5;

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);
  const text = await res.text();

  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    const err = new Error(
      `API không trả JSON. URL: ${url} | Status: ${res.status} | Body: ${text.slice(0, 150)}`
    );
    err.status = res.status;
    err.raw = text;
    throw err;
  }

  if (!res.ok) {
    const err = new Error(json?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.raw = text;
    throw err;
  }

  return json;
}

function fmtVND(n) {
  return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";
}

function mapTxNote(note) {
  const raw = String(note || "").trim().toLowerCase();

  if (raw === "topup_momo") return "Nạp tiền MoMo thành công";
  if (raw === "topup") return "Nạp tiền thành công";
  if (raw === "purchase_comic") return "Mua truyện thành công";

  return note || "-";
}

function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
}

function badgeClass(status) {
  if (status === "success") return "text-bg-success";
  if (status === "pending") return "text-bg-warning";
  if (status === "failed") return "text-bg-danger";
  return "text-bg-secondary";
}

function mapLibraryStatus(item) {
  if (item?.comic_type === "self") {
    return Number(item?.status) === 1 ? "Đang hiển thị" : "Ẩn / nháp";
  }

  const raw = String(item?.status || "").toLowerCase();
  if (raw === "ongoing") return "Đang phát hành";
  if (raw === "completed") return "Hoàn thành";
  if (raw === "coming_soon") return "Sắp ra mắt";
  return item?.status || "—";
}

function buildLibraryCover(item) {
  if (!item?.cover_image) return "https://via.placeholder.com/500x700?text=No+Cover";

  if (item.comic_type === "self") {
    const cover = item.cover_image;
    if (cover.startsWith("http")) return cover;
    if (cover.startsWith("data:image")) return cover;
    if (cover.startsWith("/")) return `${API_BASE}${cover}`;
    return cover;
  }

  if (String(item.cover_image).startsWith("http")) return item.cover_image;
  return `https://img.otruyenapi.com/uploads/comics/${item.cover_image}`;
}

function buildLastReadText(item) {
  if (item?.comic_type === "self") {
    if (item?.last_read_chapter_no) {
      return `Chap ${item.last_read_chapter_no}${item?.last_read_chapter_title ? ` • ${item.last_read_chapter_title}` : ""}`;
    }
    return "Chưa đọc";
  }

  if (item?.last_read_chapter_title) {
    return `Chap ${item.last_read_chapter_title}`;
  }

  return "Chưa đọc";
}

function buildReadUrl(item) {
  if (item?.comic_type === "self") {
    if (!item?.id || !item?.last_read_chapter_id) {
      return `/self-comics/${item?.id}`;
    }

    return `/doc-self?comicId=${encodeURIComponent(
      item.id
    )}&chapterId=${encodeURIComponent(item.last_read_chapter_id)}`;
  }

  if (!item?.slug) return "#";

  const chapValue = item?.last_read_chapter_api || "";

  if (!chapValue) return `/truyen/${item.slug}`;

  return `/doc?slug=${encodeURIComponent(item.slug)}&chap=${encodeURIComponent(
    chapValue
  )}`;
}

function buildDetailUrl(item) {
  if (item?.comic_type === "self") {
    return `/self-comics/${item?.id}`;
  }
  return `/truyen/${item?.slug}`;
}

export default function ProfileWallet() {
  const navigate = useNavigate();

  const [tab, setTab] = useState("profile");
  const [q, setQ] = useState("");

  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupSubmitting, setTopupSubmitting] = useState(false);

  const [me, setMe] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");

  const token = localStorage.getItem("token") || "";

  const [followStats, setFollowStats] = useState({
    followers: 0,
    following: 0,
  });

  const [levelProgress, setLevelProgress] = useState({
    total_topup: 0,
    current_level: null,
    next_level: null,
    progress_percent: 0,
    progress_current: 0,
    progress_needed: 0,
  });

  const [recentTx, setRecentTx] = useState([]);
  const [txList, setTxList] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  const [library, setLibrary] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryErr, setLibraryErr] = useState("");

  const [commentStats, setCommentStats] = useState({
    total_comments: 0,
    external_comments: 0,
    self_comments: 0,
  });

  const [readingStats, setReadingStats] = useState({
    total_chapters_read: 0,
    total_self_comics_read: 0,
    total_external_comics_read: 0,
    total_comics_read: 0,
  });

  // ===== state đổi mật khẩu =====
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [showPw, setShowPw] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const fetchRecentTx = async () => {
    if (!token) return;
    try {
      const data = await fetchJSON(`${API_BASE}/api/wallet/transactions?page=1&limit=5`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRecentTx(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setRecentTx([]);
    }
  };

  const fetchFollowStats = async () => {
    if (!token) return;

    try {
      const data = await fetchJSON(`${API_BASE}/api/follows/me/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setFollowStats({
        followers: Number(data?.data?.followers || 0),
        following: Number(data?.data?.following || 0),
      });
    } catch (e) {
      console.error(e);
      setFollowStats({
        followers: 0,
        following: 0,
      });
    }
  };

  const fetchLevelProgress = async () => {
    if (!token) return;

    try {
      const data = await fetchJSON(`${API_BASE}/levels/me-progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLevelProgress(
        data?.data || {
          total_topup: 0,
          current_level: null,
          next_level: null,
          progress_percent: 0,
          progress_current: 0,
          progress_needed: 0,
        }
      );
    } catch (e) {
      console.error(e);
      setLevelProgress({
        total_topup: 0,
        current_level: null,
        next_level: null,
        progress_percent: 0,
        progress_current: 0,
        progress_needed: 0,
      });
    }
  };

  const fetchTxPage = async (page) => {
    if (!token) return;
    try {
      setTxLoading(true);

      const data = await fetchJSON(
        `${API_BASE}/api/wallet/transactions?page=${page}&limit=${TX_LIMIT}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setTxList(Array.isArray(data?.data) ? data.data : []);
      setTxPage(Number(data?.page || page));
      setTxTotalPages(Number(data?.totalPages || 1));
    } catch (e) {
      console.error(e);
      setTxList([]);
      setTxTotalPages(1);
    } finally {
      setTxLoading(false);
    }
  };

  const fetchLibrary = async () => {
    if (!token) return;

    try {
      setLibraryLoading(true);
      setLibraryErr("");

      const data = await fetchJSON(`${API_BASE}/api/reading-history/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLibrary(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setLibrary([]);
      setLibraryErr(e.message || "Lỗi tải tủ truyện");
    } finally {
      setLibraryLoading(false);
    }
  };

  const fetchCommentStats = async () => {
    if (!token) return;

    try {
      const data = await fetchJSON(`${API_BASE}/api/comments/me/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCommentStats(
        data?.data || {
          total_comments: 0,
          external_comments: 0,
          self_comments: 0,
        }
      );
    } catch (e) {
      console.error(e);
      setCommentStats({
        total_comments: 0,
        external_comments: 0,
        self_comments: 0,
      });
    }
  };

  const fetchReadingStats = async () => {
    if (!token) return;

    try {
      const data = await fetchJSON(`${API_BASE}/api/reading-history/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setReadingStats(
        data?.data || {
          total_chapters_read: 0,
          total_self_comics_read: 0,
          total_external_comics_read: 0,
          total_comics_read: 0,
        }
      );
    } catch (e) {
      console.error(e);
      setReadingStats({
        total_chapters_read: 0,
        total_self_comics_read: 0,
        total_external_comics_read: 0,
        total_comics_read: 0,
      });
    }
  };

  useEffect(() => {
    if (!token) return;

    if (tab === "wallet") {
      fetchRecentTx();
    }

    if (tab === "transactions") {
      fetchTxPage(txPage);
    }

    if (tab === "library") {
      fetchLibrary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, token]);

  useEffect(() => {
    if (!token) return;
    if (tab !== "transactions") return;
    fetchTxPage(txPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txPage]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const resultCode = url.searchParams.get("resultCode");
    const orderId = url.searchParams.get("orderId");

    if (!resultCode || !orderId) return;

    const payload = Object.fromEntries(url.searchParams.entries());

    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/momo/return-confirm`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data?.message || "Xác nhận giao dịch thất bại");
          return;
        }

        if (data.status === "success") {
          toast.success("Nạp tiền thành công! Đang cập nhật số dư...");

          window.history.replaceState({}, "", "/profile");

          setTimeout(() => {
            window.location.reload();
          }, 1200);

          const meData = await fetchJSON(`${API_BASE}/api/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setWallet(meData.wallet);
        } else if (data.status === "failed") {
          toast.error("Thanh toán thất bại");
        } else {
          toast.info("Giao dịch đã được xử lý trước đó");
        }

        window.history.replaceState({}, "", "/profile");
      } catch (e) {
        console.error(e);
        toast.error("Không kết nối được server");
      }
    })();
  }, [token]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoadErr("");
        setLoading(true);

        const data = await fetchJSON(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setMe(data.user);
        setWallet(data.wallet);

        await Promise.all([
          fetchReadingStats(),
          fetchLibrary(),
          fetchFollowStats(),
          fetchCommentStats(),
          fetchLevelProgress(),
        ]);
      } catch (e) {
        console.error(e);
        setLoadErr(e.message || "Không kết nối được server");
        setMe(null);
        setWallet(null);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleConfirmTopup = async () => {
    const amount = Number(topupAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.warn("Vui lòng nhập số tiền hợp lệ");
      return;
    }

    if (!token) {
      toast.warn("Bạn cần đăng nhập");
      return;
    }

    let loadingToastId = null;

    try {
      setTopupSubmitting(true);
      loadingToastId = toast.loading("Đang tạo thanh toán MoMo...");

      const res = await fetch(`${API_BASE}/api/wallet/topup/momo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.update(loadingToastId, {
          render: data?.message || "Tạo thanh toán thất bại",
          type: "error",
          isLoading: false,
          autoClose: 2500,
        });
        return;
      }

      setShowTopupModal(false);
      setTopupAmount("");

      if (data?.payUrl) {
        toast.update(loadingToastId, {
          render: "Tạo thanh toán thành công! Đang chuyển sang MoMo...",
          type: "success",
          isLoading: false,
          autoClose: 1200,
        });

        setTimeout(() => {
          window.location.href = data.payUrl;
        }, 800);

        return;
      }

      toast.update(loadingToastId, {
        render: "Không nhận được payUrl từ server",
        type: "error",
        isLoading: false,
        autoClose: 2500,
      });
    } catch (e) {
      console.error(e);

      if (loadingToastId) {
        toast.update(loadingToastId, {
          render: "Không kết nối được server",
          type: "error",
          isLoading: false,
          autoClose: 2500,
        });
      } else {
        toast.error("Không kết nối được server");
      }
    } finally {
      setTopupSubmitting(false);
    }
  };

  // ===== xử lý đổi mật khẩu =====
  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetPasswordForm = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!token) {
      toast.warn("Bạn cần đăng nhập");
      return;
    }

    const currentPassword = String(passwordForm.currentPassword || "").trim();
    const newPassword = String(passwordForm.newPassword || "").trim();
    const confirmPassword = String(passwordForm.confirmPassword || "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warn("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    if (newPassword.length < 6) {
      toast.warn("Mật khẩu mới tối thiểu 6 ký tự");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warn("Xác nhận mật khẩu không khớp");
      return;
    }

    try {
      setPwSubmitting(true);

      const data = await fetchJSON(`${API_BASE}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      toast.success(data?.message || "Đổi mật khẩu thành công");
      resetPasswordForm();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Đổi mật khẩu thất bại");
    } finally {
      setPwSubmitting(false);
    }
  };

  const uiUser = useMemo(() => {
    const username = me?.username || "User";
    const email = me?.email || "";

    return {
      name: username,
      username: email ? email : "@" + username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username
      )}&background=random`,
      level: Number(levelProgress?.current_level?.level_no || 1),
      totalTopup: Number(levelProgress?.total_topup || 0),
      nextTopup: Number(
        levelProgress?.next_level?.min_total_topup ||
          levelProgress?.progress_needed ||
          levelProgress?.total_topup ||
          0
      ),
      stats: [
        {
          label: "Lượt theo dõi",
          value: Number(followStats?.followers || 0),
          icon: "bi-bookmark-heart",
        },
        {
          label: "Chap đã đọc",
          value: Number(readingStats?.total_chapters_read || 0),
          icon: "bi-lightning-charge",
        },
        {
          label: "Bình luận",
          value: Number(commentStats?.total_comments || 0),
          icon: "bi-chat-dots",
        },
      ],
    };
  }, [me, readingStats, followStats, commentStats, levelProgress]);

  const topupPercent = useMemo(() => {
    return Math.min(100, Math.max(0, Number(levelProgress?.progress_percent || 0)));
  }, [levelProgress]);

  const balance = wallet?.balance ?? 0;

  const filteredLibrary = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return library;

    return library.filter((x) => {
      const title = String(x?.title || "").toLowerCase();
      return title.includes(s);
    });
  }, [q, library]);

  const quickLibrary = useMemo(() => {
    return library.slice(0, 3);
  }, [library]);

  if (!token) {
    return (
      <div className="pw-page">
        <Header />
        <div className="container py-5">
          <div className="alert alert-warning mb-0">
            Bạn cần đăng nhập để xem trang này.
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="pw-page">
        <Header />
        <ToastContainer position="top-right" autoClose={2500} />
        <div className="container py-5 text-center text-secondary">
          Đang tải dữ liệu...
        </div>
      </div>
    );
  }

  if (loadErr) {
    return (
      <div className="pw-page">
        <Header />
        <div className="container py-5">
          <div className="alert alert-danger">
            {loadErr}
            <div className="small mt-2 text-secondary">
              Nếu token hết hạn, hãy đăng nhập lại.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pw-page">
      <Header />
      <ToastContainer position="top-right" autoClose={2500} />

      <div className="container-fluid px-4 py-4">
        <div className="pw-top card border-0 shadow-sm">
          <div className="card-body p-3 p-md-4">
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-auto">
                <div className="pw-avatar-wrap">
                  <img className="pw-avatar" src={uiUser.avatar} alt="avatar" />
                  <span className="pw-level-badge">Lv {uiUser.level}</span>
                </div>
              </div>

              <div className="col">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <h3 className="m-0 pw-name">{uiUser.name}</h3>
                  <span className="pw-username">{uiUser.username}</span>
                </div>

                <div className="pw-xp mt-2">
                  <div className="d-flex justify-content-between small text-secondary">
                    <span>
                      Level {uiUser.level}
                      {levelProgress?.current_level?.name
                        ? ` • ${levelProgress.current_level.name}`
                        : ""}
                    </span>

                    <span>
                      {fmtVND(levelProgress?.progress_current || 0)}
                      {levelProgress?.next_level
                        ? ` / ${fmtVND(levelProgress?.progress_needed || 0)}`
                        : ""}
                    </span>
                  </div>

                  <div className="progress pw-progress mt-1">
                    <div
                      className="progress-bar bg-success"
                      role="progressbar"
                      style={{ width: `${topupPercent}%` }}
                      aria-valuenow={topupPercent}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>

                  <div className="small text-secondary mt-1">
                    Tổng đã nạp: <b>{fmtVND(levelProgress?.total_topup || 0)}</b>
                    {levelProgress?.next_level ? (
                      <>
                        {" "}
                        Cần thêm{" "}
                        <b>
                          {fmtVND(
                            Math.max(
                              0,
                              Number(levelProgress?.next_level?.min_total_topup || 0) -
                                Number(levelProgress?.total_topup || 0)
                            )
                          )}
                        </b>{" "}
                        để lên level {levelProgress?.next_level?.level_no}
                      </>
                    ) : (
                      <> </>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-auto">
                <div className="pw-wallet-mini">
                  <div className="text-secondary small">Số dư ví</div>
                  <div className="pw-balance">{fmtVND(balance)}</div>
                  <button
                    className="btn btn-primary btn-sm w-100 mt-2"
                    onClick={() => setTab("wallet")}
                    type="button"
                  >
                    <i className="bi bi-wallet2 me-2" />
                    Vào ví
                  </button>
                </div>
              </div>
            </div>

            <div className="row g-3 mt-1">
              {uiUser.stats.map((s) => (
                <div className="col-12 col-sm-4" key={s.label}>
                  <div className="pw-stat">
                    <div className="pw-stat-icon">
                      <i className={`bi ${s.icon}`} />
                    </div>
                    <div>
                      <div className="pw-stat-value">{s.value}</div>
                      <div className="pw-stat-label">{s.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pw-tabs mt-4">
          <div className="btn-group pw-tab-group" role="group" aria-label="tabs">
            <button
              type="button"
              className={`btn ${tab === "profile" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("profile")}
            >
              <i className="bi bi-person-badge me-2" />
              Trang cá nhân
            </button>

            <button
              type="button"
              className={`btn ${tab === "library" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("library")}
            >
              <i className="bi bi-bookshelf me-2" />
              Tủ truyện
            </button>

            <button
              type="button"
              className={`btn ${tab === "wallet" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("wallet")}
            >
              <i className="bi bi-wallet2 me-2" />
              Ví
            </button>

            <button
              type="button"
              className={`btn ${tab === "transactions" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("transactions")}
            >
              <i className="bi bi-receipt me-2" />
              Giao dịch
            </button>

            <button
              type="button"
              className={`btn ${tab === "password" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("password")}
            >
              <i className="bi bi-shield-lock me-2" />
              Mật khẩu
            </button>
          </div>
        </div>

        <div className="mt-4">
          {tab === "profile" && (
            <div className="row g-3">
              <div className="col-lg-7">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3">Hồ sơ xã hội</h5>

                    <div className="pw-info-grid">
                      <div className="pw-info-item">
                        <div className="text-secondary small">Tên</div>
                        <div className="fw-semibold">{me?.username}</div>
                      </div>
                      <div className="pw-info-item">
                        <div className="text-secondary small">Email</div>
                        <div className="fw-semibold">{me?.email}</div>
                      </div>
                      <div className="pw-info-item">
                        <div className="text-secondary small">SĐT</div>
                        <div className="fw-semibold">{me?.phone || "-"}</div>
                      </div>
                      <div className="pw-info-item">
                        <div className="text-secondary small">Số dư ví</div>
                        <div className="fw-semibold">{fmtVND(balance)}</div>
                      </div>
                    </div>

                    <div className="alert alert-light border mt-3 mb-0">
                      <i className="bi bi-info-circle me-2" />
                      Gợi ý: nạp tiền để tăng level và mua truyện.
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3">Tủ truyện nhanh</h5>

                    {libraryLoading ? (
                      <div className="text-secondary">Đang tải tủ truyện...</div>
                    ) : quickLibrary.length === 0 ? (
                      <div className="text-secondary">Bạn chưa có truyện nào trong tủ.</div>
                    ) : (
                      <div className="pw-mini-shelf">
                        {quickLibrary.map((c) => (
                          <div className="pw-mini-item" key={`${c.comic_type}-${c.id}`}>
                            <img
                              className="pw-mini-cover"
                              src={buildLibraryCover(c)}
                              alt={c.title}
                            />
                            <div className="min-w-0">
                              <div className="fw-semibold text-truncate">{c.title}</div>
                              <div className="small text-secondary">
                                {mapLibraryStatus(c)} • {buildLastReadText(c)}
                              </div>
                            </div>
                            <button
                              className="btn btn-outline-primary btn-sm"
                              type="button"
                              onClick={() => navigate(buildReadUrl(c))}
                            >
                              Đọc
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      className="btn btn-primary w-100 mt-3"
                      type="button"
                      onClick={() => setTab("library")}
                    >
                      Xem toàn bộ tủ truyện
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "library" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                  <h5 className="fw-bold m-0">Tủ truyện</h5>

                  <div className="pw-search input-group">
                    <span className="input-group-text">
                      <i className="bi bi-search" />
                    </span>
                    <input
                      className="form-control"
                      placeholder="Tìm trong tủ truyện..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                    />
                  </div>
                </div>

                {libraryErr ? (
                  <div className="alert alert-danger mt-3 mb-0">{libraryErr}</div>
                ) : null}

                {libraryLoading ? (
                  <div className="text-center text-secondary py-5">Đang tải tủ truyện...</div>
                ) : (
                  <div className="row g-3 mt-2">
                    {filteredLibrary.map((c) => (
                      <div className="col-12 col-sm-6 col-lg-3" key={`${c.comic_type}-${c.id}`}>
                        <div className="pw-comic">
                          <div className="pw-comic-thumb">
                            <img src={buildLibraryCover(c)} alt={c.title} />
                            <span className="pw-comic-chip">{mapLibraryStatus(c)}</span>
                          </div>

                          <div className="mt-2">
                            <div className="fw-bold text-truncate" title={c.title}>
                              {c.title}
                            </div>

                            <div className="small text-secondary">{buildLastReadText(c)}</div>

                            <div className="small text-secondary mt-1">
                              Đọc {Number(c.read_count || 0)} chap • {fmtDate(c.last_read_at)}
                            </div>

                            <div className="d-flex gap-2 mt-2">
                              <button
                                className="btn btn-primary btn-sm w-100"
                                type="button"
                                onClick={() => navigate(buildReadUrl(c))}
                              >
                                Đọc tiếp
                              </button>

                              <button
                                className="btn btn-outline-secondary btn-sm"
                                type="button"
                                onClick={() => navigate(buildDetailUrl(c))}
                                title="Xem chi tiết"
                              >
                                <i className="bi bi-three-dots" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {!libraryLoading && filteredLibrary.length === 0 && (
                      <div className="text-center text-secondary py-5">
                        Không tìm thấy truyện trong tủ
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "wallet" && (
            <div className="row g-3">
              <div className="col-lg-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="fw-bold mb-2">Ví của bạn</h5>
                    <div className="pw-wallet-card">
                      <div className="text-white-50 small">Số dư hiện tại</div>
                      <div className="pw-wallet-balance">{fmtVND(balance)}</div>
                      <div className="pw-wallet-actions">
                        <button
                          className="btn btn-light fw-semibold"
                          type="button"
                          onClick={() => setShowTopupModal(true)}
                        >
                          <i className="bi bi-plus-circle me-2" />
                          Nạp tiền
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-7">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold m-0">Giao dịch gần đây</h5>
                      <button
                        className="btn btn-outline-dark btn-sm"
                        type="button"
                        onClick={() => setTab("transactions")}
                      >
                        Xem tất cả
                      </button>
                    </div>

                    <div className="table-responsive mt-3">
                      <table className="table align-middle">
                        <thead>
                          <tr className="text-secondary small">
                            <th>Mã</th>
                            <th>Nội dung</th>
                            <th>Thời gian</th>
                            <th className="text-end">Số tiền</th>
                            <th className="text-end">Trạng thái</th>
                          </tr>
                        </thead>
                        <tbody>
                          {recentTx.map((t) => (
                            <tr key={t.id}>
                              <td className="fw-semibold">{t.order_id || `TX${t.id}`}</td>
                              <td>
                                <div className="fw-semibold">{mapTxNote(t.note)}</div>
                              </td>
                              <td className="small text-secondary">{fmtDate(t.created_at)}</td>
                              <td
                                className={`text-end fw-bold ${
                                  Number(t.amount) < 0 ? "pw-neg" : "pw-pos"
                                }`}
                              >
                                {Number(t.amount) < 0 ? "-" : "+"}
                                {fmtVND(Math.abs(Number(t.amount) || 0))}
                              </td>
                              <td className="text-end">
                                <span className={`badge ${badgeClass(t.status)}`}>
                                  {t.status}
                                </span>
                              </td>
                            </tr>
                          ))}

                          {recentTx.length === 0 && (
                            <tr>
                              <td colSpan={5} className="text-center text-secondary py-4">
                                Chưa có giao dịch
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "transactions" && (
            <div className="card border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
                  <h5 className="fw-bold m-0">Lịch sử giao dịch</h5>
                  <div className="d-flex gap-2"></div>
                </div>

                <div className="table-responsive mt-3">
                  <table className="table align-middle">
                    <thead>
                      <tr className="text-secondary small">
                        <th>Mã</th>
                        <th>Nội dung</th>
                        <th>Phương thức</th>
                        <th>Thời gian</th>
                        <th className="text-end">Số tiền</th>
                        <th className="text-end">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txLoading ? (
                        <tr>
                          <td colSpan={7} className="text-center text-secondary py-4">
                            Đang tải...
                          </td>
                        </tr>
                      ) : (
                        txList.map((t) => (
                          <tr key={t.id}>
                            <td className="fw-semibold">{t.order_id || `TX${t.id}`}</td>
                            <td>{mapTxNote(t.note)}</td>
                            <td className="small text-secondary">{t.type}</td>
                            <td className="small text-secondary">{fmtDate(t.created_at)}</td>
                            <td
                              className={`text-end fw-bold ${
                                Number(t.amount) < 0 ? "pw-neg" : "pw-pos"
                              }`}
                            >
                              {Number(t.amount) < 0 ? "-" : "+"}
                              {fmtVND(Math.abs(Number(t.amount) || 0))}
                            </td>
                            <td className="text-end">
                              <span className={`badge ${badgeClass(t.status)}`}>{t.status}</span>
                            </td>
                          </tr>
                        ))
                      )}

                      {!txLoading && txList.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center text-secondary py-4">
                            Chưa có giao dịch
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <div className="small text-secondary">
                      Trang {txPage}/{txTotalPages} - 5 dòng/trang
                    </div>

                    <div className="btn-group">
                      <button
                        className="btn btn-outline-dark btn-sm"
                        disabled={txPage <= 1 || txLoading}
                        onClick={() => setTxPage((p) => Math.max(1, p - 1))}
                        type="button"
                      >
                        <i className="bi bi-chevron-left" /> Trước
                      </button>

                      <button
                        className="btn btn-outline-dark btn-sm"
                        disabled={txPage >= txTotalPages || txLoading}
                        onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))}
                        type="button"
                      >
                        Sau <i className="bi bi-chevron-right" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "password" && (
            <div className="row g-3">
              <div className="col-lg-7">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3">
                      <i className="bi bi-shield-lock me-2" />
                      Đổi mật khẩu
                    </h5>

                    {me?.provider !== "local" ? (
                      <div className="alert alert-warning mb-0">
                        Tài khoản của bạn đang đăng nhập bằng <b>{me?.provider}</b>. Không thể đổi
                        mật khẩu local cho tài khoản này.
                      </div>
                    ) : (
                      <form onSubmit={handleChangePassword}>
                        <div className="mb-3">
                          <label className="form-label fw-semibold">Mật khẩu hiện tại</label>
                          <div className="input-group">
                            <input
                              type={showPw.current ? "text" : "password"}
                              className="form-control"
                              name="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={handlePwChange}
                              placeholder="Nhập mật khẩu hiện tại"
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() =>
                                setShowPw((prev) => ({ ...prev, current: !prev.current }))
                              }
                            >
                              <i className={`bi ${showPw.current ? "bi-eye-slash" : "bi-eye"}`} />
                            </button>
                          </div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Mật khẩu mới</label>
                          <div className="input-group">
                            <input
                              type={showPw.next ? "text" : "password"}
                              className="form-control"
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePwChange}
                              placeholder="Nhập mật khẩu mới"
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() =>
                                setShowPw((prev) => ({ ...prev, next: !prev.next }))
                              }
                            >
                              <i className={`bi ${showPw.next ? "bi-eye-slash" : "bi-eye"}`} />
                            </button>
                          </div>
                          <div className="form-text">Mật khẩu tối thiểu 6 ký tự.</div>
                        </div>

                        <div className="mb-3">
                          <label className="form-label fw-semibold">Xác nhận mật khẩu mới</label>
                          <div className="input-group">
                            <input
                              type={showPw.confirm ? "text" : "password"}
                              className="form-control"
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePwChange}
                              placeholder="Nhập lại mật khẩu mới"
                            />
                            <button
                              type="button"
                              className="btn btn-outline-secondary"
                              onClick={() =>
                                setShowPw((prev) => ({ ...prev, confirm: !prev.confirm }))
                              }
                            >
                              <i className={`bi ${showPw.confirm ? "bi-eye-slash" : "bi-eye"}`} />
                            </button>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={pwSubmitting}
                          >
                            {pwSubmitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-2" />
                                Đang cập nhật...
                              </>
                            ) : (
                              <>
                                <i className="bi bi-check-circle me-2" />
                                Cập nhật mật khẩu
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={resetPasswordForm}
                            disabled={pwSubmitting}
                          >
                            Làm mới
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="fw-bold mb-3">Lưu ý bảo mật</h5>

                    <div className="small text-secondary">
                      <div className="mb-2">
                        • Không dùng lại mật khẩu cũ hoặc mật khẩu quá dễ đoán.
                      </div>
                      <div className="mb-2">
                        • Nên kết hợp chữ hoa, chữ thường, số và ký tự đặc biệt.
                      </div>
                      <div className="mb-2">
                        • Không chia sẻ mật khẩu cho người khác.
                      </div>
                      <div>
                        • Sau khi đổi mật khẩu thành công, hãy dùng mật khẩu mới cho lần đăng nhập
                        tiếp theo.
                      </div>
                    </div>

                   
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTopupModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => setShowTopupModal(false)} />

          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-wallet2 me-2 text-primary" />
                    Nạp tiền vào ví
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowTopupModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <label className="form-label fw-semibold">Nhập số tiền muốn nạp</label>

                  <input
                    type="number"
                    className="form-control"
                    placeholder="Ví dụ: 100000"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(e.target.value)}
                  />

                  <div className="mt-3 d-flex gap-2 flex-wrap">
                    {[50000, 100000, 200000, 500000].map((amount) => (
                      <button
                        key={amount}
                        className="btn btn-outline-primary btn-sm"
                        onClick={() => setTopupAmount(amount)}
                        type="button"
                      >
                        {fmtVND(amount)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowTopupModal(false)}>
                    Hủy
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmTopup}
                    disabled={topupSubmitting}
                  >
                    {topupSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Đang tạo thanh toán...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2" />
                        Xác nhận nạp
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}