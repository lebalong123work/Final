import { Link } from "react-router-dom";
import "./footer.css";

export default function Footer() {
  return (
    <footer className="ft-wrapper">
      <div className="container-fluid px-4 py-5">
        <div className="row g-4">
          {/* Logo + description */}
          <div className="col-lg-4 col-md-6">
            <div className="ft-brand d-flex align-items-center gap-2 mb-3">
              <div className="d-flex align-items-center gap-2 mb-3 position-relative">
                <a href="/">
                  <img
                    className="hero-logo"
                    src="https://i.ibb.co/MxWp9rJW/logo-fotor-bg-remover-202603048410-2.png"
                    alt="logo-fotor-bg-remover-202603048410-1"
                    border="0"
                  />
                </a>

                <span className="ft-title">
                  <span className="ft-z">R</span>eadink
                </span>
              </div>
            </div>

            <p className="ft-desc">
              Free online comic reading platform. Fast updates, friendly
              interface, smooth experience on all devices.
            </p>

            <div className="ft-social mt-3">
              <a href="#">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#">
                <i className="bi bi-youtube"></i>
              </a>
              <a href="#">
                <i className="bi bi-instagram"></i>
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div className="col-lg-2 col-md-6">
            <h5 className="ft-heading">Links</h5>
            <ul className="ft-links">
              <li>
                <a href="#">Home</a>
              </li>
              <li>
                <a href="#">Genres</a>
              </li>
              <li>
                <a href="#">New Comics</a>
              </li>
              <li>
                <a href="#">Completed</a>
              </li>
            </ul>
          </div>

          {/* Policy */}
          <div className="col-lg-3 col-md-6">
            <h5 className="ft-heading">Policy</h5>
            <ul className="ft-links">
              <li>
                <Link to="/lien-he">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Fanpage */}
          <div className="col-lg-3 col-md-6">
            <h5 className="ft-heading">Fanpage</h5>
            <p className="ft-desc">Follow us to get new comics every day.</p>
            <button className="btn btn-primary ft-btn">Follow now</button>
          </div>
        </div>

        <hr className="ft-divider mt-5" />

        <div className="text-center ft-copy">
          © 2026 Readink. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
