function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <div className="logo-grid">
          <span className="square red"></span>
          <span className="square yellow"></span>
          <span className="square blue"></span>
          <span className="square green"></span>
        </div>

        <h2>AI LEGO Builder</h2>
      </div>

      <div className="navbar-links">
        <a href="/">Create</a>
        <a href="/">My Builds</a>
        <a href="/">How it works</a>

        <button className="prototype-btn">
          Prototype
        </button>
      </div>
    </nav>
  );
}

export default Navbar;