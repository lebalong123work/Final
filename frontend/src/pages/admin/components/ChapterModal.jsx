import { EditorContent } from "@tiptap/react";

export default function ChapterModal({
  // Chapter list modal
  chapterModalOpen,
  chapterComic,
  chapterItems,
  chapterLoading,
  chapterError,
  chapterSaving,
  onCloseManager,
  onOpenCreateForm,
  onOpenEditForm,
  onDeleteChapter,

  // Chapter form modal
  chapterFormOpen,
  editingChapterId,
  chapterDraft,
  setChapterDraft,
  chapterEditor,
  chapterImageInputRef,
  onCloseForm,
  onSaveChapter,
  onChangeChapterNo,
  onSetEditorLink,
  onAddImageByUrl,
  onPickChapterImageFile,
  onUploadImageToEditor,
}) {
  return (
    <>
      {chapterModalOpen ? (
        <div className="ad-modal-backdrop" onMouseDown={onCloseManager}>
          <div className="ad-modal ad-modal-lg" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ad-modal-header d-flex align-items-start justify-content-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="fw-bold">Manage Chapters</div>
                <div className="text-secondary small">
                  {chapterComic?.title || "—"} • Total chapters: {chapterComic?.total_chapters || 1}
                </div>
              </div>
              <button className="btn btn-light btn-sm" type="button" onClick={onCloseManager} disabled={chapterSaving}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="d-flex justify-content-between align-items-center gap-2 my-3 flex-wrap">
              <div className="text-secondary small">
                Existing: <b>{chapterItems.length}</b> / {chapterComic?.total_chapters || 1} chapters
              </div>
              <button className="btn btn-primary btn-sm" type="button" onClick={onOpenCreateForm}>
                <i className="bi bi-plus-lg me-1" /> Add Chapter
              </button>
            </div>

            {chapterError ? (
              <div className="alert alert-warning rounded-4">
                <i className="bi bi-exclamation-triangle me-2" />{chapterError}
              </div>
            ) : null}

            {chapterLoading ? (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body d-flex align-items-center gap-2">
                  <div className="spinner-border spinner-border-sm" />
                  <span className="text-secondary">Loading chapters...</span>
                </div>
              </div>
            ) : null}

            {!chapterLoading && chapterItems.length === 0 ? (
              <div className="card border-0 shadow-sm rounded-4">
                <div className="card-body text-center text-secondary">
                  <i className="bi bi-inbox fs-3 d-block mb-2" />No chapters yet.
                </div>
              </div>
            ) : null}

            {!chapterLoading && chapterItems.length > 0 ? (
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr><th>ID</th><th>Chapter</th><th>Title</th><th>Created At</th><th className="text-end">Actions</th></tr>
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
                            <button className="btn btn-primary btn-sm" type="button" onClick={() => onOpenEditForm(ch)}>
                              <i className="bi bi-pencil-square me-1" />Edit
                            </button>
                            <button className="btn btn-danger btn-sm" type="button" onClick={() => onDeleteChapter(ch)}>
                              <i className="bi bi-trash me-1" />Delete
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
        <div className="ad-modal-backdrop" onMouseDown={onCloseForm}>
          <div className="ad-modal ad-modal-lg" onMouseDown={(e) => e.stopPropagation()}>
            <div className="ad-modal-header d-flex align-items-start justify-content-between gap-3 mb-2">
              <div className="min-w-0">
                <div className="fw-bold">{editingChapterId ? "Edit Chapter" : "Add Chapter"}</div>
                <div className="text-secondary small">{chapterComic?.title || "—"}</div>
              </div>
              <button className="btn btn-light btn-sm" type="button" onClick={onCloseForm} disabled={chapterSaving}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="ad-modal-body-scroll mt-3">
              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Chapter number</label>
                  <input type="number" min="1" className="form-control"
                    value={chapterDraft.chapter_no}
                    onChange={(e) => onChangeChapterNo(e.target.value)}
                    disabled={chapterSaving || !!editingChapterId} />
                  {editingChapterId ? (
                    <div className="text-secondary small mt-1">When editing, the current API does not update the chapter number.</div>
                  ) : null}
                </div>

                <div className="col-md-8">
                  <label className="form-label fw-semibold">Chapter title</label>
                  <input className="form-control" value={chapterDraft.chapter_title}
                    onChange={(e) => setChapterDraft((p) => ({ ...p, chapter_title: e.target.value }))}
                    placeholder="E.g.: Chapter 1" disabled={chapterSaving} />
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label fw-semibold">Chapter content</label>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {[
                    { label: <b>B</b>, action: () => chapterEditor?.chain().focus().toggleBold().run(), active: chapterEditor?.isActive("bold") },
                    { label: <i>I</i>, action: () => chapterEditor?.chain().focus().toggleItalic().run(), active: chapterEditor?.isActive("italic") },
                    { label: <u>U</u>, action: () => chapterEditor?.chain().focus().toggleUnderline().run(), active: chapterEditor?.isActive("underline") },
                  ].map((btn, i) => (
                    <button key={i} type="button"
                      className={`btn btn-sm ${btn.active ? "btn-dark" : "btn-outline-dark"}`}
                      onClick={btn.action} disabled={!chapterEditor}>
                      {btn.label}
                    </button>
                  ))}
                  <button type="button"
                    className={`btn btn-sm ${chapterEditor?.isActive("bulletList") ? "btn-dark" : "btn-outline-dark"}`}
                    onClick={() => chapterEditor?.chain().focus().toggleBulletList().run()} disabled={!chapterEditor}>
                    • List
                  </button>
                  <button type="button" className="btn btn-outline-dark btn-sm"
                    onClick={() => onSetEditorLink(chapterEditor)} disabled={!chapterEditor}>
                    <i className="bi bi-link-45deg" /> Link
                  </button>
                  <button type="button" className="btn btn-outline-primary btn-sm"
                    onClick={() => onAddImageByUrl(chapterEditor)} disabled={!chapterEditor}>
                    <i className="bi bi-image" /> Image URL
                  </button>
                  <button type="button" className="btn btn-outline-success btn-sm"
                    onClick={onPickChapterImageFile} disabled={!chapterEditor}>
                    <i className="bi bi-upload" /> Upload image
                  </button>
                  <button type="button" className="btn btn-outline-secondary btn-sm"
                    onClick={() => chapterEditor?.chain().focus().clearContent().run()} disabled={!chapterEditor}>
                    Clear content
                  </button>
                </div>
                <input ref={chapterImageInputRef} type="file" accept="image/*" hidden
                  onChange={(e) => onUploadImageToEditor(e, chapterEditor, "Image inserted into chapter")} />
                <div className="border rounded-3 p-3 bg-white editor-scroll-box">
                  <EditorContent editor={chapterEditor} />
                </div>
              </div>
            </div>

            <div className="ad-modal-actions mt-4">
              <button className="btn btn-outline-secondary w-100" type="button" onClick={onCloseForm} disabled={chapterSaving}>Cancel</button>
              <button className="btn btn-primary w-100" type="button" onClick={onSaveChapter} disabled={chapterSaving}>
                {chapterSaving ? "Saving..." : editingChapterId ? "Update Chapter" : "Save Chapter"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
