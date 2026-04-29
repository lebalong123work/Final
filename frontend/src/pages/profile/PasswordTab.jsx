export default function PasswordTab({ me, passwordForm, handlePwChange, handleChangePassword, showPw, setShowPw, pwSubmitting, resetPasswordForm }) {
  return (
    <div className="row g-3">
      <div className="col-lg-7">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h5 className="fw-bold mb-3">
              <i className="bi bi-shield-lock me-2" />
              Change Password
            </h5>

            {me?.provider !== "local" ? (
              <div className="alert alert-warning mb-0">
                Your account is logged in via <b>{me?.provider}</b>. Cannot change
                the password for this account.
              </div>
            ) : (
              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Current Password</label>
                  <div className="input-group">
                    <input
                      type={showPw.current ? "text" : "password"}
                      className="form-control"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePwChange}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPw((prev) => ({ ...prev, current: !prev.current }))}
                    >
                      <i className={`bi ${showPw.current ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">New Password</label>
                  <div className="input-group">
                    <input
                      type={showPw.next ? "text" : "password"}
                      className="form-control"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePwChange}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPw((prev) => ({ ...prev, next: !prev.next }))}
                    >
                      <i className={`bi ${showPw.next ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                  <div className="form-text">Password must be at least 6 characters.</div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Confirm New Password</label>
                  <div className="input-group">
                    <input
                      type={showPw.confirm ? "text" : "password"}
                      className="form-control"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePwChange}
                      placeholder="Re-enter new password"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPw((prev) => ({ ...prev, confirm: !prev.confirm }))}
                    >
                      <i className={`bi ${showPw.confirm ? "bi-eye-slash" : "bi-eye"}`} />
                    </button>
                  </div>
                </div>

                <div className="d-flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={pwSubmitting}>
                    {pwSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check-circle me-2" />
                        Update Password
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={resetPasswordForm}
                    disabled={pwSubmitting}
                  >
                    Reset
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
            <h5 className="fw-bold mb-3">Security Tips</h5>
            <div className="small text-secondary">
              <div className="mb-2">• Do not reuse old passwords or use easily guessable ones.</div>
              <div className="mb-2">• Use a mix of uppercase, lowercase, numbers, and special characters.</div>
              <div className="mb-2">• Do not share your password with others.</div>
              <div>• After successfully changing your password, use the new password for your next login.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
