import Navbar from './sections/Navbar';
import Hero from './sections/Hero';
import Features from './sections/Features';
import Stats from './sections/Stats';
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
      <CTA />
      <Footer />
    </div>
  );
}
