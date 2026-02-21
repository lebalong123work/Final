import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import "./profileWallet.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
const MOCK_LIBRARY = [
  { id: 1, title: "Kiếm Thần Trở Lại", cover: "https://picsum.photos/500/800?random=41", status: "Đang phát hành", lastRead: "Chap 86" },
  { id: 2, title: "Bí Mật Thanh Xuân", cover: "https://picsum.photos/500/800?random=42", status: "Hoàn thành", lastRead: "Chap 120" },
  { id: 3, title: "Hệ Thống Bá Đạo", cover: "https://picsum.photos/500/800?random=43", status: "Đang phát hành", lastRead: "Chap 37" },
  { id: 4, title: "Ta Có Một Thành Phố", cover: "https://picsum.photos/500/800?random=44", status: "Sắp ra mắt", lastRead: "Chưa đọc" },
];



const API_BASE = "http://localhost:5000";

export default function ProfileWallet() {
  const [tab, setTab] = useState("profile"); 
  const [q, setQ] = useState("");
const [showTopupModal, setShowTopupModal] = useState(false);
const [topupAmount, setTopupAmount] = useState("");
  const [me, setMe] = useState(null);          
  const [wallet, setWallet] = useState(null);  
  const [loading, setLoading] = useState(true);
  const [loadErr, setLoadErr] = useState("");
const [topupSubmitting, setTopupSubmitting] = useState(false);
  const token = localStorage.getItem("token");
const TX_LIMIT = 5;

const [recentTx, setRecentTx] = useState([]);
const [txList, setTxList] = useState([]);
const [txPage, setTxPage] = useState(1);
const [txTotalPages, setTxTotalPages] = useState(1);
const [txLoading, setTxLoading] = useState(false);
  const fmtVND = (n) =>
    new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";

  
  const uiUser = useMemo(() => {
    const username = me?.username || "User";
    const email = me?.email || "";
    return {
      name: username,
      username: email ? email : "@" + username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
      level: 1,
      xp: 0,
      nextXp: 100,
    
      stats: [
        { label: "Truyện theo dõi", value: 0, icon: "bi-bookmark-heart" },
        { label: "Chap đã đọc", value: 0, icon: "bi-lightning-charge" },
        { label: "Bình luận", value: 0, icon: "bi-chat-dots" },
      ],
    };
  }, [me]);

  const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("vi-VN");
};




const badgeClass = (status) => {
  if (status === "success") return "text-bg-success";
  if (status === "pending") return "text-bg-warning";
  if (status === "failed") return "text-bg-danger";
  return "text-bg-secondary";
};

const fetchRecentTx = async () => {
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/api/wallet/transactions?page=1&limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Lỗi tải giao dịch");
    setRecentTx(Array.isArray(data?.data) ? data.data : []);
  } catch (e) {
    console.error(e);
    setRecentTx([]);
  }
};

const fetchTxPage = async (page) => {
  if (!token) return;
  try {
    setTxLoading(true);
    const res = await fetch(
      `${API_BASE}/api/wallet/transactions?page=${page}&limit=${TX_LIMIT}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Lỗi tải lịch sử giao dịch");

    setTxList(Array.isArray(data?.data) ? data.data : []);
    setTxPage(data.page || page);
    setTxTotalPages(data.totalPages || 1);
  } catch (e) {
    console.error(e);
    setTxList([]);
    setTxTotalPages(1);
  } finally {
    setTxLoading(false);
  }
};

useEffect(() => {
  if (!token) return;

  if (tab === "wallet") {
    fetchRecentTx(); // lấy 5 giao dịch mới nhất
  }

  if (tab === "transactions") {
    fetchTxPage(txPage); // load trang hiện tại
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [tab, token]);

// khi đổi trang ở tab transactions
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
        const meRes = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const meData = await meRes.json();
        if (meRes.ok) setWallet(meData.wallet);

      } else if (data.status === "failed") {
        toast.error("Thanh toán thất bại");
      } else {
        toast.info("Giao dịch đã được xử lý trước đó");
      }

      // xoá query khỏi URL để tránh confirm lại khi F5
      window.history.replaceState({}, "", "/profile");
    } catch (e) {
      console.error(e);
      toast.error("Không kết nối được server");
    }
  })();
}, [token]);
  const xpPercent = useMemo(() => {
    const p = Math.round((uiUser.xp / uiUser.nextXp) * 100);
    return Math.min(100, Math.max(0, p));
  }, [uiUser]);

  const balance = wallet?.balance ?? 0;

  const filteredLibrary = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return MOCK_LIBRARY;
    return MOCK_LIBRARY.filter((x) => x.title.toLowerCase().includes(s));
  }, [q]);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoadErr("");
        setLoading(true);

        const res = await fetch(`${API_BASE}/api/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (!res.ok) {
          // token hết hạn / sai
          setLoadErr(data.message || "Không lấy được dữ liệu");
          setMe(null);
          setWallet(null);
          return;
        }

        setMe(data.user);
       console.log("user =", JSON.stringify(data.user, null, 2));
        setWallet(data.wallet);
      } catch (e) {
        console.error(e);
        setLoadErr("Không kết nối được server");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // UI khi chưa login
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

  // UI loading
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

  // UI lỗi load
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

    // đóng modal + reset
    setShowTopupModal(false);
    setTopupAmount("");

    if (data?.payUrl) {
      toast.update(loadingToastId, {
        render: "Tạo thanh toán thành công! Đang chuyển sang MoMo...",
        type: "success",
        isLoading: false,
        autoClose: 1200,
      });

      // chờ 0.8s cho người dùng thấy toast rồi chuyển trang
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
  return (
    <div className="pw-page">
      <Header />

      <div className="container-fluid px-4 py-4">
        {/* Top header */}
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

                {/* Level progress */}
                <div className="pw-xp mt-2">
                  <div className="d-flex justify-content-between small text-secondary">
                    <span>Level {uiUser.level}</span>
                    <span>
                      {uiUser.xp}/{uiUser.nextXp} XP
                    </span>
                  </div>
                  <div className="progress pw-progress mt-1">
                    <div
                      className="progress-bar"
                      role="progressbar"
                      style={{ width: `${xpPercent}%` }}
                      aria-valuenow={xpPercent}
                      aria-valuemin="0"
                      aria-valuemax="100"
                    />
                  </div>
                </div>

               
               
              </div>

              {/* Wallet summary */}
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

            {/* Stats */}
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

        {/* Tabs */}
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
          </div>
        </div>

        {/* Content */}
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
                    <div className="pw-mini-shelf">
                      {MOCK_LIBRARY.slice(0, 3).map((c) => (
                        <div className="pw-mini-item" key={c.id}>
                          <img className="pw-mini-cover" src={c.cover} alt={c.title} />
                          <div className="min-w-0">
                            <div className="fw-semibold text-truncate">{c.title}</div>
                            <div className="small text-secondary">
                              {c.status} • {c.lastRead}
                            </div>
                          </div>
                          <button className="btn btn-outline-primary btn-sm" type="button">
                            Đọc
                          </button>
                        </div>
                      ))}
                    </div>

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

                <div className="row g-3 mt-2">
                  {filteredLibrary.map((c) => (
                    <div className="col-12 col-sm-6 col-lg-3" key={c.id}>
                      <div className="pw-comic">
                        <div className="pw-comic-thumb">
                          <img src={c.cover} alt={c.title} />
                          <span className="pw-comic-chip">{c.status}</span>
                        </div>
                        <div className="mt-2">
                          <div className="fw-bold text-truncate">{c.title}</div>
                          <div className="small text-secondary">{c.lastRead}</div>
                          <div className="d-flex gap-2 mt-2">
                            <button className="btn btn-primary btn-sm w-100" type="button">
                              Đọc tiếp
                            </button>
                            <button className="btn btn-outline-secondary btn-sm" type="button">
                              <i className="bi bi-three-dots" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredLibrary.length === 0 && (
                    <div className="text-center text-secondary py-5">
                      Không tìm thấy truyện trong tủ 
                    </div>
                  )}
                </div>
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
        <div className="fw-semibold">{t.type}</div>
        
      </td>
      <td className="small text-secondary">{fmtDate(t.created_at)}</td>

      <td className={`text-end fw-bold ${Number(t.amount) < 0 ? "pw-neg" : "pw-pos"}`}>
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
                  <div className="d-flex gap-2">
                   
                    
                  </div>
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
  ) : txList.map((t) => (
    <tr key={t.id}>
      <td className="fw-semibold">{t.order_id || `TX${t.id}`}</td>
      <td>{t.type}</td>
     
      <td className="small text-secondary">{t.type}</td>
      <td className="small text-secondary">{fmtDate(t.created_at)}</td>
      <td className={`text-end fw-bold ${Number(t.amount) < 0 ? "pw-neg" : "pw-pos"}`}>
        {Number(t.amount) < 0 ? "-" : "+"}
        {fmtVND(Math.abs(Number(t.amount) || 0))}
      </td>
      <td className="text-end">
        <span className={`badge ${badgeClass(t.status)}`}>{t.status}</span>
      </td>
    </tr>
  ))}

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
    Trang {txPage}/{txTotalPages} • 5 dòng/trang
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
        </div>
      </div>
{showTopupModal && (
  <>
    {/* Overlay */}
    <div
      className="modal-backdrop fade show"
      onClick={() => setShowTopupModal(false)}
    />

    {/* Modal */}
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
            <label className="form-label fw-semibold">
              Nhập số tiền muốn nạp
            </label>

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
                >
                  {fmtVND(amount)}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setShowTopupModal(false)}
            >
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