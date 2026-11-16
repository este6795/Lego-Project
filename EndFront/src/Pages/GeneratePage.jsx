import "./GeneratePage.css";
import { useNavigate } from "react-router-dom";

import Navbar from "../Components/Navbar";
import BuildPreview from "../Components/BuildPreview";
import BuildPipeline from "../Components/BuildPipeline";

export default function GeneratePage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar />

      <main className="generate-page">
        <button
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        <div className="generate-header">
          <h1>Generating your LEGO Build</h1>

          <p>
            Watch each stage of the build process as
            your model is transformed into LEGO
            instructions.
          </p>
        </div>

        <section className="generate-content">
          <BuildPreview />
          <BuildPipeline />
        </section>
      </main>
    </>
  );
}