import { Link } from "react-router";
import { useAuth } from "../../hooks/useAuth";
import "./HomePage.css";

function HomePage() {
  const { user } = useAuth();
  return (
    <div className="home">
      <section className="home-hero">
        <span className="home-eyebrow">Built for job seekers</span>
        <h1 className="home-title">
          Know if your resume matches the job before you apply
        </h1>
        <div className="home-title-divider" />
        <p className="home-subtitle">
          Upload your resume and a job description to get a match score, see
          which skills you're missing, and get clear feedback on how to close
          the gap.
        </p>
        {!user && (
          <>
            <div className="home-actions">
              <Link to="/register" className="button">
                Register
              </Link>
              <Link to="/login" className="button button-secondary">
                Login
              </Link>
            </div>
            <p className="home-actions-hint">
              New to Resume Parser? Register to try it out.
            </p>
            <p className="home-actions-hint">
              Already have an account? Log in.
            </p>
          </>
        )}
      </section>

      <section className="home-highlight">
        <div className="home-highlight-panel">
          <h2>Upload once, analyze anytime</h2>
          <p>
            Save your resume and reuse it for as many job descriptions as you
            want. Every analysis is saved to your history, so you can track how
            you're improving over time.
          </p>
        </div>
        <div className="home-highlight-panel">
          <h2>See exactly what's missing</h2>
          <p>
            Get a match score plus a breakdown of the skills and keywords the
            job description asks for that your resume doesn't cover yet, so you
            know exactly what to fix.
          </p>
        </div>
      </section>

      <section className="home-features">
        <h2 className="home-features-title">
          Everything you need to apply with confidence
        </h2>
        <div className="feature-grid">
          <div className="feature-card">
            <h3>Upload your resume</h3>
            <p>Bring your resume in and keep it on file for future analyses.</p>
          </div>
          <div className="feature-card">
            <h3>Paste a job description</h3>
            <p>Drop in any job posting to compare it against your resume.</p>
          </div>
          <div className="feature-card">
            <h3>Get a match score</h3>
            <p>
              See how well your resume lines up with what the role is asking
              for.
            </p>
          </div>
          <div className="feature-card">
            <h3>Find missing skills</h3>
            <p>
              Know which required skills and keywords aren't showing up on your
              resume.
            </p>
          </div>
          <div className="feature-card">
            <h3>Track your history</h3>
            <p>
              Look back at every analysis you've run and see how you're
              trending.
            </p>
          </div>
          <div className="feature-card">
            <h3>Build your profile</h3>
            <p>Keep your skills, experience, and education in one place.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
