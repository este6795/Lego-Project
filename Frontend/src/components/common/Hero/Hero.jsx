import "./Hero.css";

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1 className="hero-title">
          Analyze your resume to find the job for you
        </h1>

        <p className="hero-subtitle">
          A tool to analyze your resume and help you discover the best job opportunities.
        </p>
      </div>

      {/* If your design includes an image, we can add it here */}
      {/* <div className="hero-image">
        <img src="/path/to/your/image.png" alt="Hero visual" />
      </div> */}
    </section>
  );
}

