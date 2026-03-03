import { useState } from "react";
import { Link } from "react-router-dom";
import "./login.css";
import Header from "../components/Header";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

 const onSubmit = async (e) => {
  e.preventDefault();

  if (form.password !== form.confirmPassword) {
    toast.error("Mật khẩu xác nhận không khớp!");
    return;
  }

  try {
    const res = await fetch("http://localhost:5000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: form.username,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message);
      return;
    }

    toast.success("Đăng ký thành công ");

    setForm({
      username: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    });

 } catch (error) {
  console.error(error);

  toast.error(
    error?.message || "Lỗi kết nối server"
  );
}
};


  const registerWithGoogle = () => {
      toast("Google register (UI). Tích hợp thật sẽ làm ở bước tiếp theo.");
  };

  return (
    <div className="login-page">
      <Header />
  <ToastContainer 
      position="top-right"
      autoClose={3000}
      theme="colored"
    />
      <div className="container py-5">
        <div className="row justify-content-center align-items-center g-4">
          {/* Left banner */}
          <div className="col-lg-6 d-none d-lg-block">
            <div className="login-hero p-4 p-xl-5 position-relative overflow-hidden">
              <div className="hero-bg-img" />

            <div className="d-flex align-items-center gap-2 mb-3 position-relative">
  <img
    src="https://www.zettruyen.space/images/logo.webp"
    alt="Ztruyen Logo"
    className="hero-logo"
  />

  <span className="hero-brand">
    <span className="hero-z">Z</span>truyện
  </span>
</div>

              <h2 className="hero-title position-relative">
                Tạo tài khoản để lưu truyện yêu thích
              </h2>

              <p className="hero-sub position-relative">
                Lưu lịch sử đọc, theo dõi truyện và nhận thông báo chap mới.
              </p>

              <div className="hero-badges mt-4 position-relative">
                <span className="badge rounded-pill text-bg-light">Nhanh</span>
                <span className="badge rounded-pill text-bg-light">Bảo mật</span>
                <span className="badge rounded-pill text-bg-light">Mượt</span>
              </div>
            </div>
          </div>

          {/* Right card */}
          <div className="col-12 col-md-10 col-lg-6 col-xl-5">
            <div className="card login-card shadow-sm border-0">
              <div className="card-body p-4 p-md-5">
                <div className="mb-3 text-center">
                  <div className="login-icon">
                    <i className="bi bi-person-plus"></i>
                  </div>
                </div>

                <p className="text-secondary mb-4 text-center">
                  Đăng ký để bắt đầu
                </p>

                {/* Form */}
                <form className="login-form" onSubmit={onSubmit}>
                  {/* Username */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-start w-100">
                      Tên người dùng
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-person" />
                      </span>
                      <input
                        name="username"
                        value={form.username}
                        onChange={onChange}
                        className="form-control"
                        placeholder="vd: duy_thuan"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-start w-100">
                      Email
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope" />
                      </span>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={onChange}
                        className="form-control"
                        placeholder="vd: abc@gmail.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-start w-100">
                      Số điện thoại
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-telephone" />
                      </span>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={onChange}
                        className="form-control"
                        placeholder="vd: 090xxxxxxx"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-start w-100">
                      Mật khẩu
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock" />
                      </span>
                      <input
                        name="password"
                        value={form.password}
                        onChange={onChange}
                        type={showPass ? "text" : "password"}
                        className="form-control"
                        placeholder="Nhập mật khẩu"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPass((s) => !s)}
                        aria-label="toggle password"
                      >
                        <i className={`bi ${showPass ? "bi-eye-slash" : "bi-eye"}`} />
                      </button>
                    </div>
                    <div className="form-text">Mật khẩu tối thiểu 6 ký tự.</div>
                  </div>

                  {/* Confirm Password */}
                  <div className="mb-3">
                    <label className="form-label fw-semibold text-start w-100">
                      Xác nhận mật khẩu
                    </label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-shield-lock" />
                      </span>
                      <input
                        name="confirmPassword"
                        value={form.confirmPassword}
                        onChange={onChange}
                        type={showConfirm ? "text" : "password"}
                        className="form-control"
                        placeholder="Nhập lại mật khẩu"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowConfirm((s) => !s)}
                        aria-label="toggle confirm password"
                      >
                        <i className={`bi ${showConfirm ? "bi-eye-slash" : "bi-eye"}`} />
                      </button>
                    </div>
                  </div>

                  {/* Terms */}
                  
<div className="d-flex">
  <button
    type="submit"
    className="btn btn-primary w-100 py-2 fw-semibold d-flex align-items-center justify-content-center"
  >
    Đăng ký
  </button>
</div>

                </form>

                {/* Separator */}
                <div className="login-sep my-4">
                  <span>hoặc</span>
                </div>

                {/* Google */}
                <button
                  type="button"
                  className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center gap-2 login-google"
                  onClick={registerWithGoogle}
                >
                  <img
                    className="google-icon"
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="google"
                  />
                  Đăng ký với Google
                </button>

                <div className="text-center mt-4 text-secondary">
                  Đã có tài khoản?{" "}
                  <Link to="/login" className="link-primary fw-semibold text-decoration-none">
                    Đăng nhập
                  </Link>
                </div>
              </div>
            </div>

       
          </div>
        </div>
      </div>
    </div>
  );
}
