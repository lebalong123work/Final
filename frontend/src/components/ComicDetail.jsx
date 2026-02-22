import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./comicDetail.css";
import Header from "./Header";

const API_BASE = "http://localhost:5000";
const IMG_BASE = "https://img.otruyenapi.com/uploads/comics/";

function buildThumb(thumb) {
  if (!thumb) return "https://via.placeholder.com/500x700?text=No+Image";
  if (thumb.startsWith("http")) return thumb;
  return IMG_BASE + thumb;
}

function stripHtml(html) {
  return (html || "").replace(/<[^>]+>/g, "").trim();
}

export default function ComicDetail() {
  const { slug } = useParams();
  const nav = useNavigate();

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  
  const [detail, setDetail] = useState(null);

  
  const [pricing, setPricing] = useState({ is_paid: false, price: 0 });

  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        setErr("");
        setLoading(true);

      
        const r1 = await fetch(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
        const j1 = await r1.json();
        if (!r1.ok) throw new Error(j1?.message || "Không tải được truyện");

        // 2) lấy pricing từ DB
        const r2 = await fetch(`${API_BASE}/api/external-comics/${slug}/pricing`);
        const j2 = await r2.json();
        const pr = j2?.data || { is_paid: false, price: 0 };

        setDetail(j1?.data || null);
        setPricing({ is_paid: !!pr.is_paid, price: Number(pr.price || 0) });

       
     
const paid = !!pr.is_paid;
if (!paid) {
  setHasAccess(true);
} else {
  const token = localStorage.getItem("token");
  if (!token) {
    setHasAccess(false);
  } else {
    const r3 = await fetch(`${API_BASE}/api/purchases/access/${slug}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j3 = await r3.json();
    setHasAccess(!!j3?.hasAccess);
  }
}
      
      } catch (e) {
        console.error(e);
        setErr(e.message || "Lỗi");
        setDetail(null);
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [slug]);

  const item = detail?.item;

  const chapters = useMemo(() => {
    const list = (item?.chapters || []).flatMap((sv) =>
      (sv?.server_data || []).map((ch) => ({
        server: sv.server_name,
        name: ch.chapter_name,
        title: ch.chapter_title,
        api: ch.chapter_api_data,
      }))
    );

   
    return list.sort((a, b) => Number(a.name) - Number(b.name));
  }, [item]);

  const isPaid = !!pricing.is_paid;
  const locked = isPaid && !hasAccess;

  const fmtVND = (n) => new Intl.NumberFormat("vi-VN").format(Number(n || 0)) + " ₫";

  const handleBuy = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    alert("Bạn cần đăng nhập để mua truyện");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/api/purchases/buy/${slug}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || "Mua thất bại");

    setHasAccess(true); // mở khóa ngay
    alert(`Mua thành công! Số dư còn lại: ${data?.data?.balance || 0}`);
  } catch (e) {
    alert(e.message || "Lỗi mua");
  }
};

  const goRead = (chapterApi) => {
    if (locked) return;
    
    nav(`/doc?api=${encodeURIComponent(chapterApi)}`);
  };

  if (loading) return <div className="cd-wrap cd-loading">Đang tải truyện...</div>;
  if (err) return <div className="cd-wrap"><div className="alert alert-danger">{err}</div></div>;
  if (!item) return null;

  return (
    <div> <Header/>
    <div className="cd-wrap">
       
      <div className="cd-hero">
        <div className="cd-hero-bg" style={{ backgroundImage: `url(${buildThumb(item.thumb_url)})` }} />

        <div className="cd-hero-content">
          <div className="cd-cover">
            <img src={buildThumb(item.thumb_url)} alt={item.name} />
            <div className="cd-badges">
              <span className={`cd-badge ${item.status === "ongoing" ? "ok" : "done"}`}>
                {item.status === "ongoing" ? "Đang ra" : "Hoàn thành"}
              </span>
              {isPaid ? (
                <span className="cd-badge pay">Trả phí • {fmtVND(pricing.price)}</span>
              ) : (
                <span className="cd-badge free">Miễn phí</span>
              )}
            </div>
          </div>

          <div className="cd-info">
            <h1 className="cd-title">{item.name}</h1>
            <div className="cd-sub">
              {(item.origin_name || []).join(" • ")}
            </div>

            <div className="cd-meta">
              <div><i className="bi bi-person me-2" />{(item.author || []).join(", ") || "—"}</div>
              <div><i className="bi bi-tags me-2" />{(item.category || []).map(x => x.name).join(", ") || "—"}</div>
            </div>

            <div className="cd-actions">
              {locked ? (
                <>
                  <button className="btn btn-danger cd-btn" onClick={handleBuy}>
                    <i className="bi bi-lock-fill me-2" />
                    Mua truyện • {fmtVND(pricing.price)}
                  </button>
                  <div className="cd-hint">
                    Truyện này đang khóa. Bạn cần mua để xem chapter.
                  </div>
                </>
              ) : (
                <Link className="btn btn-dark cd-btn" >
                  <i className="bi bi-book me-2" />
                  Đã mua
                </Link>
              )}
            </div>

            <div className="cd-desc">
              {stripHtml(item.content)}
            </div>
          </div>
        </div>
      </div>

      {/* Chapters */}
      <div className="cd-section">
        <div className="cd-section-head">
          <h3>Danh sách chapter</h3>
          <div className="cd-count">{chapters.length} chap</div>
        </div>

        {locked ? (
          <div className="cd-lockbox">
            <div className="cd-lockicon"><i className="bi bi-lock" /></div>
            <div className="cd-locktext">
              <div className="fw-bold">Nội dung bị khóa</div>
              <div className="text-secondary">Mua truyện để mở khóa danh sách chapter và đọc ảnh.</div>
            </div>
            <button className="btn btn-danger" onClick={handleBuy}>
              Mua truyện • {fmtVND(pricing.price)}
            </button>
          </div>
        ) : null}

        <div className={`cd-chapters ${locked ? "locked" : ""}`}>
          {chapters.map((ch) => (
            <button
              key={ch.api}
              type="button"
              className="cd-chap"
              onClick={() => goRead(ch.api)}
              disabled={locked}
              title={locked ? "Truyện trả phí — cần mua để đọc" : `Đọc chap ${ch.name}`}
            >
              <div className="cd-chap-left">
                <div className="cd-chap-no">Chap {ch.name}</div>
                {ch.title ? <div className="cd-chap-title">{ch.title}</div> : null}
              </div>
              <div className="cd-chap-right">
                <span className="cd-chap-server">{ch.server}</span>
                <i className="bi bi-chevron-right" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}