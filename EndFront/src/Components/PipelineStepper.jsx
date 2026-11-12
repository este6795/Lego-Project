function PipelineStepper() {
  const steps = [
    "Prompt",
    "JSON",
    "OpenSCAD",
    "STL",
    "Voxels",
    "LEGO",
    "LDraw",
  ];

  return (
    <div className="pipeline-container">
      <span className="pipeline-label">Pipeline:</span>

      <div className="pipeline-steps">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`pipeline-step ${
              index === 0 ? "active-step" : ""
            }`}
          >
            {step}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PipelineStepper;