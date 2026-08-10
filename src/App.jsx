import { useState, useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import MobileDrawer from "./components/MobileDrawer";
import CartDrawer from "./components/CartDrawer";
import ScrollTopButton from "./components/ScrollTopButton";
import Home from "./pages/Home";
import About from "./pages/About";
import Menu from "./pages/Menu";
import Pickup from "./pages/Pickup";
import Visit from "./pages/Visit";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";

export default function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  // scroll to top + close overlays on route change; toggle body class for menu page
  useEffect(() => {
    window.scrollTo(0, 0);
    setCartOpen(false);
    setNavOpen(false);
    document.body.classList.toggle("menu-page", location.pathname === "/menu");
  }, [location.pathname]);

  return (
    <>
      <Header
        onOpenCart={() => setCartOpen(true)}
        onOpenMobileNav={() => setNavOpen(true)}
      />
      <MobileDrawer open={navOpen} onClose={() => setNavOpen(false)} />
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/pickup" element={<Pickup />} />
          <Route path="/visit" element={<Visit />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/checkout" element={<Checkout />} />
        </Routes>
      </main>
      <Footer />
      <ScrollTopButton />
    </>
  );
}
