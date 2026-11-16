import StatusBadge from "./StatusBadge";
import ProgressBar from "./ProgressBar";

const steps = [
  {
    title: "Understanding prompt",
    subtitle: "JSON ready",
    status: "complete",
  },
  {
    title: "Generating OpenSCAD",
    subtitle: "SCAD model ready",
    status: "complete",
  },
  {
    title: "Creating STL mesh",
    subtitle: "Geometry exported",
    status: "complete",
  },
  {
    title: "Voxelizing model",
    subtitle: "Mapping target cells",
    status: "running",
  },
  {
    title: "Packing LEGO pieces",
    subtitle: "Waiting",
    status: "waiting",
  },
  {
    title: "Generating LDraw",
    subtitle: "Waiting",
    status: "waiting",
  },
];

export default function BuildPipeline() {
  return (
    <div className="pipeline-card">
      <h3 className="pipeline-title">
        Build pipeline
      </h3>

      <div className="pipeline-steps">
        {steps.map((step) => (
          <div
            key={step.title}
            className={`pipeline-step ${
              step.status === "running"
                ? "active-step"
                : ""
            }`}
          >
            <div
              className={`status-dot ${step.status}`}
            ></div>

            <div className="step-content">
              <h4>{step.title}</h4>
              <p>{step.subtitle}</p>
            </div>

            <StatusBadge
              status={step.status}
            />
          </div>
        ))}
      </div>

      <ProgressBar
        progress={60}
        label="About 60% complete"
      />
    </div>
  );
}