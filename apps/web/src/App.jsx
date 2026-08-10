import { useEffect } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Nav from './components/Nav.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Booking from './pages/Booking.jsx';
import Confirmation from './pages/Confirmation.jsx';
import Gallery from './pages/Gallery.jsx';
import Policies from './pages/Policies.jsx';
import FAQ from './pages/FAQ.jsx';
import Story from './pages/Story.jsx';
import ManageBooking from './pages/ManageBooking.jsx';

// Scroll to the top on navigation, or to an anchor when a hash is present.
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}

function NotFound() {
  return (
    <>
      <div className="center-state">
        <p className="eyebrow">404</p>
        <h2>This page wandered off into the forest.</h2>
        <p className="muted">The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>Back to home</Link>
      </div>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/book" element={<Booking />} />
          <Route path="/confirmation/:id" element={<Confirmation />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/story" element={<Story />} />
          <Route path="/manage" element={<ManageBooking />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  );
}
