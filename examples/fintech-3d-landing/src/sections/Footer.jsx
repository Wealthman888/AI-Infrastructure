export default function Footer() {
  return (
    <footer className="footer">
      <span>© {new Date().getFullYear()} Meridian Financial Technologies, Inc.</span>
      <div className="footer-links">
        <a href="#">Privacy</a>
        <a href="#">Terms</a>
        <a href="#">Status</a>
      </div>
    </footer>
  );
}
