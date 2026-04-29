import ComicSlider from "./user/ComicSlider";
import FeaturedBanner from "../components/FeaturedBanner";
import Footer from "../components/Footer";
import Header from "../components/Header";
import SelfComicSlider from "./user/TextComicsPage";

export default function Home() {
  return (
    <>
      <Header />

      <main>
        <div className="container-fluid px-3 px-md-4">
          <FeaturedBanner />

          <ComicSlider
            title="Comics"
            perPage={4}
            limit={24}
            viewAllHref="/truyen"
          />

          <SelfComicSlider
            title="Novels"
            perPage={4}
            limit={24}
            viewAllHref="/self-comics"
          />
        </div>
      </main>

      <Footer />
    </>
  );
}
