export default function Navbar() {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <span className="brand">Meridian</span>
        <nav className="nav-links">
          <a href="#features">Product</a>
          <a href="#security">Security</a>
          <a href="#integrations">Integrations</a>
          <a href="#pricing">Pricing</a>
          <a href="#contact">Company</a>
        </nav>
        <div className="navbar-cta">
          <a className="btn btn-ghost" href="#contact">Sign in</a>
          <a className="btn btn-primary" href="#contact">Get started</a>
        </div>
      </div>
    </header>
  );
}
