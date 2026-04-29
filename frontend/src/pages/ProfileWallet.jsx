import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import "./profileWallet.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProfileTab from "./profile/ProfileTab";
import LibraryTab from "./profile/LibraryTab";
import WalletTab from "./profile/WalletTab";
import TransactionsTab from "./profile/TransactionsTab";
import PasswordTab from "./profile/PasswordTab";

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
      `API did not return JSON. URL: ${url} | Status: ${res.status} | Body: ${text.slice(0, 150)}`,
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

export default function ProfileWallet() {
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
      const data = await fetchJSON(
        `${API_BASE}/api/wallet/transactions?page=1&limit=5`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
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
      const data = await fetchJSON(`${API_BASE}/api/levels/me-progress`, {
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
        },
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
        },
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

      const data = await fetchJSON(`${API_BASE}/api/reactions/library`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setLibrary(Array.isArray(data?.data) ? data.data : []);
    } catch (e) {
      console.error(e);
      setLibrary([]);
      setLibraryErr(e.message || "Failed to load library");
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
        },
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
        },
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
          toast.error(data?.message || "Transaction confirmation failed");
          return;
        }

        if (data.status === "success") {
          toast.success("Top-up successful! Updating balance...");

          window.history.replaceState({}, "", "/profile");

          setTimeout(() => {
            window.location.reload();
          }, 1200);

          const meData = await fetchJSON(`${API_BASE}/api/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });

          setWallet(meData.wallet);
        } else if (data.status === "failed") {
          toast.error("Payment failed");
        } else {
          toast.info("Transaction has already been processed");
        }

        window.history.replaceState({}, "", "/profile");
      } catch (e) {
        console.error(e);
        toast.error("Cannot connect to server");
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
        setLoadErr(e.message || "Cannot connect to server");
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
      toast.warn("Please enter a valid amount");
      return;
    }

    if (!token) {
      toast.warn("You need to log in");
      return;
    }

    let loadingToastId = null;

    try {
      setTopupSubmitting(true);
      loadingToastId = toast.loading("Creating MoMo payment...");

      const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(`${API_BASE}/api/wallet/topup/momo`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ amount }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok) {
        toast.update(loadingToastId, {
          render: data?.message || "Failed to create payment",
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
          render: "Payment created! Redirecting to MoMo...",
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
        render: "No payUrl received from server",
        type: "error",
        isLoading: false,
        autoClose: 2500,
      });
    } catch (e) {
      console.error(e);

      if (loadingToastId) {
        toast.update(loadingToastId, {
          render: "Cannot connect to server",
          type: "error",
          isLoading: false,
          autoClose: 2500,
        });
      } else {
        toast.error("Cannot connect to server");
      }
    } finally {
      setTopupSubmitting(false);
    }
  };

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
      toast.warn("You need to log in");
      return;
    }

    const currentPassword = String(passwordForm.currentPassword || "").trim();
    const newPassword = String(passwordForm.newPassword || "").trim();
    const confirmPassword = String(passwordForm.confirmPassword || "").trim();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.warn("Please fill in all required fields");
      return;
    }

    if (newPassword.length < 6) {
      toast.warn("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.warn("Password confirmation does not match");
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

      toast.success(data?.message || "Password changed successfully");
      resetPasswordForm();
    } catch (e) {
      console.error(e);
      toast.error(e.message || "Failed to change password");
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
        username,
      )}&background=random`,
      level: Number(levelProgress?.current_level?.level_no || 1),
      totalTopup: Number(levelProgress?.total_topup || 0),
      nextTopup: Number(
        levelProgress?.next_level?.min_total_topup ||
          levelProgress?.progress_needed ||
          levelProgress?.total_topup ||
          0,
      ),
      stats: [
        {
          label: "Followers",
          value: Number(followStats?.followers || 0),
          icon: "bi-bookmark-heart",
        },
        {
          label: "Chapters Read",
          value: Number(readingStats?.total_chapters_read || 0),
          icon: "bi-lightning-charge",
        },
        {
          label: "Comments",
          value: Number(commentStats?.total_comments || 0),
          icon: "bi-chat-dots",
        },
      ],
    };
  }, [me, readingStats, followStats, commentStats, levelProgress]);

  const topupPercent = useMemo(() => {
    return Math.min(
      100,
      Math.max(0, Number(levelProgress?.progress_percent || 0)),
    );
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
            You need to log in to view this page.
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
          Loading data...
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
              If your session has expired, please log in again.
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
                    Total topped up:{" "}
                    <b>{fmtVND(levelProgress?.total_topup || 0)}</b>
                    {levelProgress?.next_level ? (
                      <>
                        {" "}
                        Need{" "}
                        <b>
                          {fmtVND(
                            Math.max(
                              0,
                              Number(
                                levelProgress?.next_level?.min_total_topup || 0,
                              ) - Number(levelProgress?.total_topup || 0),
                            ),
                          )}
                        </b>{" "}
                        to reach level {levelProgress?.next_level?.level_no}
                      </>
                    ) : (
                      <> </>
                    )}
                  </div>
                </div>
              </div>

              <div className="col-12 col-md-auto">
                <div className="pw-wallet-mini">
                  <div className="text-secondary small">Wallet Balance</div>
                  <div className="pw-balance">{fmtVND(balance)}</div>
                  <button
                    className="btn btn-primary btn-sm w-100 mt-2"
                    onClick={() => setTab("wallet")}
                    type="button"
                  >
                    <i className="bi bi-wallet2 me-2" />
                    Go to Wallet
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
          <div className="pw-tab-group" role="group" aria-label="tabs">
            <button
              type="button"
              className={`btn ${tab === "profile" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("profile")}
            >
              <i className="bi bi-person-badge me-2" />
              Profile
            </button>

            <button
              type="button"
              className={`btn ${tab === "library" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("library")}
            >
              <i className="bi bi-bookshelf me-2" />
              Library
            </button>

            <button
              type="button"
              className={`btn ${tab === "wallet" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("wallet")}
            >
              <i className="bi bi-wallet2 me-2" />
              Wallet
            </button>

            <button
              type="button"
              className={`btn ${tab === "transactions" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("transactions")}
            >
              <i className="bi bi-receipt me-2" />
              Transactions
            </button>

            <button
              type="button"
              className={`btn ${tab === "password" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setTab("password")}
            >
              <i className="bi bi-shield-lock me-2" />
              Password
            </button>
          </div>
        </div>

        <div className="mt-4">
          {tab === "profile" && (
            <ProfileTab
              me={me}
              balance={balance}
              libraryLoading={libraryLoading}
              quickLibrary={quickLibrary}
              setTab={setTab}
            />
          )}

          {tab === "library" && (
            <LibraryTab
              q={q}
              setQ={setQ}
              libraryLoading={libraryLoading}
              libraryErr={libraryErr}
              filteredLibrary={filteredLibrary}
            />
          )}

          {tab === "wallet" && (
            <WalletTab
              balance={balance}
              recentTx={recentTx}
              setShowTopupModal={setShowTopupModal}
              setTab={setTab}
            />
          )}

          {tab === "transactions" && (
            <TransactionsTab
              txLoading={txLoading}
              txList={txList}
              txPage={txPage}
              txTotalPages={txTotalPages}
              setTxPage={setTxPage}
            />
          )}

          {tab === "password" && (
            <PasswordTab
              me={me}
              passwordForm={passwordForm}
              handlePwChange={handlePwChange}
              handleChangePassword={handleChangePassword}
              showPw={showPw}
              setShowPw={setShowPw}
              pwSubmitting={pwSubmitting}
              resetPasswordForm={resetPasswordForm}
            />
          )}
        </div>
      </div>

      {showTopupModal && (
        <>
          <div
            className="modal-backdrop fade show"
            onClick={() => setShowTopupModal(false)}
          />

          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-wallet2 me-2 text-primary" />
                    Top Up Wallet
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowTopupModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <label className="form-label fw-semibold">
                    Enter the amount to top up
                  </label>

                  <input
                    type="number"
                    className="form-control"
                    placeholder="E.g.: 100000"
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
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowTopupModal(false)}
                  >
                    Cancel
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmTopup}
                    disabled={topupSubmitting}
                  >
                    {topupSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Creating payment...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2" />
                        Confirm Top Up
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
