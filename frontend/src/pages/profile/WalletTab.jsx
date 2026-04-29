function fmtVND(n) { return new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫"; }
function fmtDate(iso) { if (!iso) return "-"; const d = new Date(iso); return Number.isNaN(d.getTime()) ? iso : d.toLocaleString("vi-VN"); }
function mapTxNote(note) {
  const raw = String(note || "").trim().toLowerCase();
  if (raw === "topup_momo") return "MoMo top-up successful";
  if (raw === "topup") return "Top-up successful";
  if (raw === "purchase_comic") return "Comic purchase successful";
  return note || "-";
}
function badgeClass(status) {
  if (status === "success") return "text-bg-success";
  if (status === "pending") return "text-bg-warning";
  if (status === "failed") return "text-bg-danger";
  return "text-bg-secondary";
}

export default function WalletTab({ balance, recentTx, setShowTopupModal, setTab }) {
  return (
    <div className="row g-3">
      <div className="col-lg-5">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold mb-2">Your Wallet</h5>
            <div className="pw-wallet-card">
              <div className="text-white-50 small">Current balance</div>
              <div className="pw-wallet-balance">{fmtVND(balance)}</div>
              <div className="pw-wallet-actions">
                <button className="btn btn-light fw-semibold" type="button" onClick={() => setShowTopupModal(true)}>
                  <i className="bi bi-plus-circle me-2" />
                  Top Up
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
              <h5 className="fw-bold m-0">Recent Transactions</h5>
              <button className="btn btn-outline-dark btn-sm" type="button" onClick={() => setTab("transactions")}>
                View all
              </button>
            </div>
            <div className="table-responsive mt-3">
              <table className="table align-middle">
                <thead>
                  <tr className="text-secondary small">
                    <th>ID</th><th>Description</th><th>Date</th>
                    <th className="text-end">Amount</th><th className="text-end">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((t) => (
                    <tr key={t.id}>
                      <td className="fw-semibold">{t.order_id || `TX${t.id}`}</td>
                      <td><div className="fw-semibold">{mapTxNote(t.note)}</div></td>
                      <td className="small text-secondary">{fmtDate(t.created_at)}</td>
                      <td className={`text-end fw-bold ${Number(t.amount) < 0 ? "pw-neg" : "pw-pos"}`}>
                        {Number(t.amount) < 0 ? "-" : "+"}{fmtVND(Math.abs(Number(t.amount) || 0))}
                      </td>
                      <td className="text-end">
                        <span className={`badge ${badgeClass(t.status)}`}>{t.status}</span>
                      </td>
                    </tr>
                  ))}
                  {recentTx.length === 0 && (
                    <tr><td colSpan={5} className="text-center text-secondary py-4">No transactions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
