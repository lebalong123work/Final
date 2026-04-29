export default function ExternalComicSettingModal({
  settingComic,
  settingDraft,
  setSettingDraft,
  savingSetting,
  onClose,
  onSavePricing,
  onSaveTranslator,
}) {
  if (!settingComic) return null;

  return (
    <div className="ad-modal-backdrop" onMouseDown={onClose}>
      <div className="ad-modal" onMouseDown={(e) => e.stopPropagation()}>
        <div className="d-flex align-items-start justify-content-between gap-3 mb-2">
          <div className="min-w-0">
            <div className="fw-bold">Comic Settings (External DB Comic)</div>
            <div className="text-secondary small text-truncate" title={settingComic?.name}>
              {settingComic?.name}
            </div>
          </div>
          <button className="btn btn-light btn-sm" type="button" onClick={onClose} disabled={savingSetting}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="mt-3">
          <div className="d-flex gap-2 flex-wrap mb-3">
            <button
              type="button"
              className={`btn ${settingDraft.tab === "pricing" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setSettingDraft((p) => ({ ...p, tab: "pricing" }))}
              disabled={savingSetting}
            >
              <i className="bi bi-cash-coin me-2" />
              Pricing
            </button>
            <button
              type="button"
              className={`btn ${settingDraft.tab === "translator" ? "btn-dark" : "btn-outline-dark"}`}
              onClick={() => setSettingDraft((p) => ({ ...p, tab: "translator" }))}
              disabled={savingSetting}
            >
              <i className="bi bi-translate me-2" />
              Translator
            </button>
          </div>

          {settingDraft.tab === "pricing" ? (
            <>
              <label className="form-label fw-semibold">Access type</label>
              <select
                className="form-select"
                value={settingDraft.type}
                onChange={(e) => setSettingDraft((p) => ({ ...p, type: e.target.value }))}
                disabled={savingSetting}
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>

              {settingDraft.type === "paid" ? (
                <div className="mt-3">
                  <label className="form-label fw-semibold">Price (VND)</label>
                  <input
                    type="number" min="0" className="form-control"
                    value={settingDraft.price}
                    onChange={(e) => setSettingDraft((p) => ({ ...p, price: e.target.value }))}
                    placeholder="E.g.: 5000" disabled={savingSetting}
                  />
                </div>
              ) : (
                <div className="text-secondary small mt-2">Users will be able to read for free.</div>
              )}

              <div className="ad-modal-actions mt-4">
                <button className="btn btn-outline-secondary w-100" type="button" onClick={onClose} disabled={savingSetting}>Cancel</button>
                <button className="btn btn-primary w-100" type="button" onClick={onSavePricing} disabled={savingSetting}>
                  {savingSetting ? "Saving..." : "Save settings"}
                </button>
              </div>
            </>
          ) : (
            <>
              <label className="form-label fw-semibold">Translated by</label>
              <input
                className="form-control"
                value={settingDraft.translator}
                onChange={(e) => setSettingDraft((p) => ({ ...p, translator: e.target.value }))}
                placeholder="E.g.: Translation Group ABC" disabled={savingSetting}
              />
              <div className="text-secondary small mt-2">Leave blank to remove translator info.</div>
              <div className="mt-3 p-3 rounded-3 border bg-light">
                <div className="small text-secondary">Current value</div>
                <div className="fw-semibold">{String(settingDraft.translator || "").trim() || "—"}</div>
              </div>

              <div className="ad-modal-actions mt-4">
                <button className="btn btn-outline-secondary w-100" type="button" onClick={onClose} disabled={savingSetting}>Cancel</button>
                <button className="btn btn-primary w-100" type="button" onClick={onSaveTranslator} disabled={savingSetting}>
                  {savingSetting ? "Saving..." : "Save Translator"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
