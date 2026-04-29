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

export default function TransactionsTab({ txLoading, txList, txPage, txTotalPages, setTxPage }) {
  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center">
          <h5 className="fw-bold m-0">Transaction History</h5>
          <div className="d-flex gap-2"></div>
        </div>
        <div className="table-responsive mt-3">
          <table className="table align-middle">
            <thead>
              <tr className="text-secondary small">
                <th>ID</th><th>Description</th><th>Method</th>
                <th>Date</th><th className="text-end">Amount</th><th className="text-end">Status</th>
              </tr>
            </thead>
            <tbody>
              {txLoading ? (
                <tr><td colSpan={7} className="text-center text-secondary py-4">Loading...</td></tr>
              ) : (
                txList.map((t) => (
                  <tr key={t.id}>
                    <td className="fw-semibold">{t.order_id || `TX${t.id}`}</td>
                    <td>{mapTxNote(t.note)}</td>
                    <td className="small text-secondary">{t.type}</td>
                    <td className="small text-secondary">{fmtDate(t.created_at)}</td>
                    <td className={`text-end fw-bold ${Number(t.amount) < 0 ? "pw-neg" : "pw-pos"}`}>
                      {Number(t.amount) < 0 ? "-" : "+"}{fmtVND(Math.abs(Number(t.amount) || 0))}
                    </td>
                    <td className="text-end">
                      <span className={`badge ${badgeClass(t.status)}`}>{t.status}</span>
                    </td>
                  </tr>
                ))
              )}
              {!txLoading && txList.length === 0 && (
                <tr><td colSpan={7} className="text-center text-secondary py-4">No transactions yet</td></tr>
              )}
            </tbody>
          </table>
          <div className="d-flex justify-content-between align-items-center mt-3">
            <div className="small text-secondary">Page {txPage}/{txTotalPages} - 5 rows/page</div>
            <div className="btn-group">
              <button className="btn btn-outline-dark btn-sm" disabled={txPage <= 1 || txLoading}
                onClick={() => setTxPage((p) => Math.max(1, p - 1))} type="button">
                <i className="bi bi-chevron-left" /> Previous
              </button>
              <button className="btn btn-outline-dark btn-sm" disabled={txPage >= txTotalPages || txLoading}
                onClick={() => setTxPage((p) => Math.min(txTotalPages, p + 1))} type="button">
                Next <i className="bi bi-chevron-right" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
