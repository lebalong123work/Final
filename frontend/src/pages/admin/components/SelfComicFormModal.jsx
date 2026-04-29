import { EditorContent } from "@tiptap/react";

function buildSelfCover(cover) {
  if (!cover) return "https://via.placeholder.com/500x700?text=No+Cover";
  if (cover.startsWith("http") || cover.startsWith("data:image")) return cover;
  return cover;
}

function getSelectedValues(selectEl) {
  return Array.from(selectEl.selectedOptions || []).map((opt) => opt.value);
}

export default function SelfComicFormModal({
  selfModalOpen,
  selfSaving,
  editingSelfId,
  selfDraft,
  setSelfDraft,
  cats,
  coverInputRef,
  descImageInputRef,
  descEditor,
  onClose,
  onSave,
  onPickCoverFile,
  onUploadCoverImage,
  onRemoveCoverImage,
  onPickDescImageFile,
  onSetEditorLink,
  onAddImageByUrl,
  onUploadImageToEditor,
}) {
  if (!selfModalOpen) return null;

  return (
    <div className="ad-modal-backdrop" onMouseDown={onClose}>
      <div className="ad-modal ad-modal-lg" onMouseDown={(e) => e.stopPropagation()}>
        <div className="ad-modal-header d-flex align-items-start justify-content-between gap-3 mb-2">
          <div className="fw-bold">{editingSelfId ? "Edit Novel" : "Add Novel"}</div>
          <button className="btn btn-light btn-sm" type="button" onClick={onClose} disabled={selfSaving}>
            <i className="bi bi-x-lg" />
          </button>
        </div>

        <div className="ad-modal-body-scroll mt-3">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Cover Image</label>
              <div className="d-flex flex-column align-items-center gap-2">
                {selfDraft.cover_image ? (
                  <>
                    <img src={buildSelfCover(selfDraft.cover_image)} alt="cover" className="self-cover-preview" />
                    <button className="btn btn-outline-danger btn-sm" type="button" onClick={onRemoveCoverImage} disabled={selfSaving}>
                      Remove Image
                    </button>
                  </>
                ) : (
                  <div className="self-cover-preview d-flex align-items-center justify-content-center border rounded-3 text-secondary">
                    <i className="bi bi-image fs-1" />
                  </div>
                )}
                <input ref={coverInputRef} type="file" accept="image/*" hidden onChange={onUploadCoverImage} />
                <button className="btn btn-outline-primary btn-sm w-100" type="button" onClick={onPickCoverFile} disabled={selfSaving}>
                  <i className="bi bi-upload me-1" /> Choose Cover Image
                </button>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Title</label>
                <input
                  className="form-control" value={selfDraft.title}
                  onChange={(e) => setSelfDraft((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Novel title" disabled={selfSaving}
                />
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Author</label>
                <input
                  className="form-control" value={selfDraft.author}
                  onChange={(e) => setSelfDraft((p) => ({ ...p, author: e.target.value }))}
                  placeholder="Author name" disabled={selfSaving}
                />
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Translated by</label>
                <input
                  className="form-control" value={selfDraft.translated_by}
                  onChange={(e) => setSelfDraft((p) => ({ ...p, translated_by: e.target.value }))}
                  placeholder="Translator name" disabled={selfSaving}
                />
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Total Chapters</label>
                <input
                  type="number" min="1" className="form-control"
                  value={selfDraft.total_chapters}
                  onChange={(e) => setSelfDraft((p) => ({ ...p, total_chapters: e.target.value }))}
                  disabled={selfSaving}
                />
              </div>
            </div>

            <div className="col-md-8">
              <label className="form-label fw-semibold">Categories</label>
              <select
                className="form-select category-multi-select" multiple size={8}
                value={selfDraft.category_ids}
                onChange={(e) => setSelfDraft((p) => ({ ...p, category_ids: getSelectedValues(e.target) }))}
                disabled={selfSaving}
              >
                {cats.map((c) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
              <div className="text-secondary small mt-1">Hold <b>Ctrl</b> to select multiple categories.</div>
              <div className="d-flex flex-wrap gap-2 mt-2">
                {selfDraft.category_ids.length > 0 ? selfDraft.category_ids.map((catIdValue) => {
                  const found = cats.find((x) => String(x.id) === String(catIdValue));
                  return <span key={catIdValue} className="badge text-bg-light border">{found?.name || catIdValue}</span>;
                }) : <span className="text-secondary small">No categories selected</span>}
              </div>
            </div>
          </div>

          <div className="mt-3">
            <label className="form-label fw-semibold">Status</label>
            <select className="form-select" value={selfDraft.status}
              onChange={(e) => setSelfDraft((p) => ({ ...p, status: Number(e.target.value) }))} disabled={selfSaving}>
              <option value={1}>Visible</option>
              <option value={0}>Hidden</option>
            </select>
          </div>

          <div className="mt-3">
            <label className="form-label fw-semibold">Access type</label>
            <select className="form-select"
              value={selfDraft.is_paid ? "paid" : "free"}
              onChange={(e) => {
                const v = e.target.value;
                setSelfDraft((p) => ({ ...p, is_paid: v === "paid", price: v === "paid" ? Number(p.price || 0) : 0 }));
              }} disabled={selfSaving}>
              <option value="free">Free</option>
              <option value="paid">Paid</option>
            </select>
            {selfDraft.is_paid ? (
              <div className="mt-2">
                <label className="form-label fw-semibold mb-1">Price (VND)</label>
                <input type="number" min="0" className="form-control"
                  value={selfDraft.price}
                  onChange={(e) => setSelfDraft((p) => ({ ...p, price: e.target.value }))}
                  placeholder="E.g.: 5000" disabled={selfSaving} />
              </div>
            ) : (
              <div className="text-secondary small mt-2">Users will be able to read for free.</div>
            )}
          </div>

          <div className="mt-3">
            <label className="form-label fw-semibold">Description</label>
            <div className="d-flex flex-wrap gap-2 mb-2">
              <button type="button"
                className={`btn btn-sm ${descEditor?.isActive("bold") ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => descEditor?.chain().focus().toggleBold().run()} disabled={!descEditor}>
                <b>B</b>
              </button>
              <button type="button"
                className={`btn btn-sm ${descEditor?.isActive("italic") ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => descEditor?.chain().focus().toggleItalic().run()} disabled={!descEditor}>
                <i>I</i>
              </button>
              <button type="button"
                className={`btn btn-sm ${descEditor?.isActive("underline") ? "btn-dark" : "btn-outline-dark"}`}
                onClick={() => descEditor?.chain().focus().toggleUnderline().run()} disabled={!descEditor}>
                <u>U</u>
              </button>
              <button type="button" className="btn btn-outline-dark btn-sm"
                onClick={() => onSetEditorLink(descEditor)} disabled={!descEditor}>
                <i className="bi bi-link-45deg" /> Link
              </button>
              <button type="button" className="btn btn-outline-primary btn-sm"
                onClick={() => onAddImageByUrl(descEditor)} disabled={!descEditor}>
                <i className="bi bi-image" /> Image URL
              </button>
              <button type="button" className="btn btn-outline-success btn-sm"
                onClick={onPickDescImageFile} disabled={!descEditor}>
                <i className="bi bi-upload" /> Upload Image
              </button>
            </div>
            <input ref={descImageInputRef} type="file" accept="image/*" hidden
              onChange={(e) => onUploadImageToEditor(e, descEditor, "Image inserted into description")} />
            <div className="border rounded-3 p-3 bg-white editor-scroll-box">
              <EditorContent editor={descEditor} />
            </div>
          </div>
        </div>

        <div className="ad-modal-actions mt-4">
          <button className="btn btn-outline-secondary w-100" type="button" onClick={onClose} disabled={selfSaving}>Cancel</button>
          <button className="btn btn-primary w-100" type="button" onClick={onSave} disabled={selfSaving}>
            {selfSaving ? "Saving..." : editingSelfId ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
