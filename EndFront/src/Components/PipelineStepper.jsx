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
    <div className="pipeline-container1">
      <span className="pipeline-label1">Pipeline:</span>

      <div className="pipeline-steps1">
        {steps.map((step, index) => (
          <div
            key={step}
            className={`pipeline-step1 ${
              index === 0 ? "active-step1" : ""
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