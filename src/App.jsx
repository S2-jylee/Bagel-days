import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileDrawer from "./components/MobileDrawer";
import ScrollTopButton from "./components/ScrollTopButton";
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import Pickup from "./pages/Pickup";
import Visit from "./pages/Visit";
import Contact from "./pages/Contact";
import OrderDisplay from "./pages/OrderDisplay";
import Admin from "./pages/Admin";

const STANDALONE_ROUTES = ["/order-display", "/admin"];

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const isStandalone = STANDALONE_ROUTES.includes(location.pathname);

  // scroll to top + close overlays on route change; toggle body class for menu page
  useEffect(() => {
    window.scrollTo(0, 0);
    setNavOpen(false);
    document.body.classList.toggle("menu-page", location.pathname === "/menu");
  }, [location.pathname]);

  if (isStandalone) {
    return (
      <Routes>
        <Route path="/order-display" element={<OrderDisplay />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    );
  }

  return (
    <>
      <Header onOpenMobileNav={() => setNavOpen(true)} />
      <MobileDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/pickup" element={<Pickup />} />
          <Route path="/visit" element={<Visit />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
      <ScrollTopButton />
    </>
  );
}
