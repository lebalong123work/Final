import { useState } from "react";
import { Link } from "react-router-dom";
import "./login.css";
import Header from "../components/Header";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
const navigate = useNavigate();
  const onChange = (e) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

 

const onSubmit = async (e) => {
  e.preventDefault();

  try {
    const res = await fetch("http://localhost:5000/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      toast.error(data.message || "Đăng nhập thất bại");
      return;
    }

    // lưu token + user
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    toast.success("Đăng nhập thành công");

    setTimeout(() => {
      if (data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    }, 1000);

  } catch (error) {
    console.error(error);
    toast.error("Không kết nối được server");
  }
};


  const loginWithGoogle = () => {
    alert("Google login (UI). Tích hợp thật sẽ làm ở bước tiếp theo.");
  };

  return (
    <div className="login-page">
       <Header/>
       <ToastContainer position="top-right" autoClose={3000} />
      <div className="container py-5">
        <div className="row justify-content-center align-items-center g-4">
          {/* Left banner */}
         <div className="col-lg-6 d-none d-lg-block">
  <div className="login-hero p-4 p-xl-5 position-relative overflow-hidden">
    {/* Ảnh chìm nền */}
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
      Chào mừng đến với <span className="hero-z">Z</span>truyện
    </h2>

    <p className="hero-sub position-relative">
      Đồng bộ lịch sử đọc, theo dõi truyện yêu thích 
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
       <div className="mb-3">
  <div className="login-icon">
    <i className="bi bi-person-circle"></i>
  </div>
</div>

                <p className="text-secondary mb-4 text-center">Đăng nhập để tiếp tục</p>

                {/* Form */}
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                   <label className="form-label fw-semibold text-start w-100">
  Email
</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-person" />
                      </span>
                      <input
                        name="email"
                        value={form.email}
                        onChange={onChange}
                        className="form-control"
                        placeholder="vd: admin@gmail.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-2">
        <label className="form-label fw-semibold text-start w-100">Mật khẩu</label>
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
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPass((s) => !s)}
                        aria-label="toggle password"
                      >
                        <i
                          className={`bi ${
                            showPass ? "bi-eye-slash" : "bi-eye"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-3 mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="remember"
                      />
                      <label className="form-check-label" htmlFor="remember">
                        Ghi nhớ
                      </label>
                    </div>
                    <Link
                      to="/forgot-password"
                      className="link-primary text-decoration-none"
                    >
                      Quên mật khẩu?
                    </Link>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 py-2 fw-semibold"
                  >
                    Đăng nhập
                  </button>
                </form>

                {/* Separator */}
                <div className="login-sep my-4">
                  <span>hoặc</span>
                </div>

                {/* Google (đặt dưới form) */}
                <button
                  type="button"
                  className="btn btn-outline-dark w-100 d-flex align-items-center justify-content-center gap-2 login-google"
                  onClick={loginWithGoogle}
                >
                  <img
                    className="google-icon"
                    src="https://www.svgrepo.com/show/475656/google-color.svg"
                    alt="google"
                  />
                  Đăng nhập với Google
                </button>

                <div className="text-center mt-4 text-secondary">
                  Chưa có tài khoản?{" "}
                  <Link
                    to="/register"
                    className="link-primary fw-semibold text-decoration-none"
                  >
                    Đăng ký
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
