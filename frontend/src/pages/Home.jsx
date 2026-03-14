import ComicSlider from "./user/ComicSlider";

import FeaturedBanner from "../components/FeaturedBanner";
import Footer from "../components/Footer";
import Header from "../components/Header";
import SelfComicSlider from "./user/TextComicsPage";

export default function Home() {
  return (
    <>
    <div className="container-fluid px-4 py-4">
      <Header />
      <FeaturedBanner />

      <ComicSlider
        title="Truyện tranh"
        perPage={4}
        limit={24}
        viewAllHref="/truyen"
      />

      <SelfComicSlider
        title="Truyện chữ"
        perPage={4}
        limit={24}
        viewAllHref="/self-comics"
      />

    
    </div>
  <Footer />
    </>
  );
}