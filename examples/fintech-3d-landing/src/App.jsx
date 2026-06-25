import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import Features from './sections/Features';
import Stats from './sections/Stats';
import Integrations from './sections/Integrations';
import Testimonials from './sections/Testimonials';
import Pricing from './sections/Pricing';
import CTA from './sections/CTA';
import Footer from './sections/Footer';
import './App.css';

export default function App() {
  return (
    <div className="page">
      <Navbar />
      <Hero />
      <Features />
      <Stats />
      <Integrations />
      <Testimonials />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}
