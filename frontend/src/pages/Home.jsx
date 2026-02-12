import ComicSlider from "../components/ComicSlider";
import FeaturedBanner from "../components/FeaturedBanner";
import Footer from "../components/Footer";
import Header from "../components/Header";

const COMICS = [
  {
    id: 1,
    name: "Kiếp Này Có Năm...",
    updated: "2 tháng trước",
    cover: "https://picsum.photos/500/800?random=11",
    tags: ["Comedy", "Drama"],
  },
  {
    id: 2,
    name: "Đấu Phá Thương...",
    updated: "2 tháng trước",
    cover: "https://picsum.photos/500/800?random=12",
    tags: ["Action", "Adventure"],
  },
  {
    id: 3,
    name: "Bí Mật Thanh Xuân",
    updated: "2 tháng trước",
    cover: "https://picsum.photos/500/800?random=13",
    tags: ["Manhwa", "Ngôn Tình"],
  },
  {
    id: 4,
    name: "Trọng Sinh Đô Thị...",
    updated: "2 tháng trước",
    cover: "https://picsum.photos/500/800?random=14",
    tags: ["Manhua", "Martial Arts"],
  },
  {
    id: 5,
    name: "Maria Đoạn Tội",
    updated: "2 tháng trước",
    cover: "https://picsum.photos/500/800?random=15",
    tags: ["Drama", "Horror"],
  },
  {
    id: 6,
    name: "Truyện A",
    updated: "1 tuần trước",
    cover: "https://picsum.photos/500/800?random=16",
    tags: ["Romance", "School"],
  },
  {
    id: 7,
    name: "Truyện B",
    updated: "3 ngày trước",
    cover: "https://picsum.photos/500/800?random=17",
    tags: ["Action", "Fantasy"],
  },
  {
    id: 8,
    name: "Truyện C",
    updated: "Hôm qua",
    cover: "https://picsum.photos/500/800?random=18",
    tags: ["Comedy", "Slice"],
  },
];

export default function Home() {
  return (
    <div className="container-fluid px-4 py-4">
         <Header/>
                <FeaturedBanner />
           
             
         
      <ComicSlider title="Truyện Sắp Ra Mắt" items={COMICS} perPage={4} className="py-3" />
        <Footer />
    </div>
  );
}
