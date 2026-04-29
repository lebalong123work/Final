import { useState } from "react";
import { Link } from "react-router-dom";
import "./login.css";
import Header from "../components/Header";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_FORGOT = "http://localhost:5000/api/auth/forgot-password";

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}

export default function ForgotPassword() {
  const [value, setValue] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = value.trim();

    if (!isEmail(v)) {
      toast.error("Please enter a valid Email address");
      return;
    }

    try {
      setSubmitting(true);
      setSent(false);

      const res = await fetch(API_FORGOT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.message || "Request failed");
        return;
      }

      toast.success(data.message || "New password has been sent to your email");
      setSent(true);
      setValue("");
    } catch (err) {
      console.error("forgot password error:", err);
      toast.error("Cannot connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <Header />

      <ToastContainer position="top-right" autoClose={2000} />

      <div className="container py-5">
        <div className="row justify-content-center align-items-center g-4">
          {/* Left hero */}
          <div className="col-lg-6 d-none d-lg-block">
            <div className="login-hero p-4 p-xl-5 position-relative overflow-hidden">
              <div className="hero-bg-img" />

              <div className="d-flex align-items-center gap-2 mb-3 position-relative">
                <img
                  src="https://i.ibb.co/MxWp9rJW/logo-fotor-bg-remover-202603048410-2.png"
                  alt="Readink Logo"
                  className="hero-logo"
                />

                <span className="hero-brand">
                  <span className="hero-z">R</span>eadink
                </span>
              </div>

              <h2 className="hero-title position-relative">
                Recover your password quickly
              </h2>
              <p className="hero-sub position-relative">
                Enter your Email to receive a new password
              </p>

              <div className="hero-badges mt-4 position-relative">
                <span className="badge rounded-pill text-bg-light">Secure</span>
                <span className="badge rounded-pill text-bg-light">Fast</span>
                <span className="badge rounded-pill text-bg-light">Easy</span>
              </div>
            </div>
          </div>

          {/* Right card */}
          <div className="col-12 col-md-10 col-lg-6 col-xl-5">
            <div className="card login-card shadow-sm border-0">
              <div className="card-body p-4 p-md-5">
                <div className="mb-3 text-center">
                  <div className="login-icon">
                    <i className="bi bi-key" />
                  </div>
                </div>

                <p className="text-secondary mb-4 text-center">Forgot your password?</p>

                {sent && (
                  <div className="alert alert-success" role="alert">
                    A new password has been issued, please check your email.
                  </div>
                )}

                <form className="login-form" onSubmit={onSubmit}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-start w-100">
                      Email or Phone Number
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope" />
                      </span>
                  <input
  type="email"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  className="form-control"
  placeholder="ex: abc@gmail.com"
  required
  autoComplete="email"
  disabled={submitting}
/>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={submitting}
                  >
                    {submitting ? "Sending..." : "Send new password"}
                  </button>
                </form>

                <div className="text-center mt-4 text-secondary">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="link-primary fw-semibold text-decoration-none"
                  >
                    Login
                  </Link>
                </div>

                <div className="text-center mt-2">
                  <Link to="/register" className="text-decoration-none small">
                    Create a new account
                  </Link>
                </div>
              </div>
            </div>
          </div>
          {/* end right */}
        </div>
      </div>
    </div>
  );
}
