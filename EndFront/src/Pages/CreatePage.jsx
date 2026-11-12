import Navbar from "../components/Navbar";
import HeroSection from "../components/HeroSection";
import PromptPanel from "../components/PromptPanel";
import BuildOptionsPanel from "../components/BuildOptionsPanel";
import PipelineStepper from "../components/PipelineStepper";

import "./CreatePage.css";

function CreatePage() {
  return (
    <div className="create-page">
      <Navbar />

      <HeroSection />

      <div className="builder-layout">
        <PromptPanel />
        <BuildOptionsPanel />
      </div>

      <PipelineStepper />
    </div>
  );
}

export default CreatePage;