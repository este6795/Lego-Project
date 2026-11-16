export default function ProgressBar({
  progress,
  label,
}) {
  return (
    <div className="progress-container">
      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`,
          }}
        ></div>
      </div>

      <p className="progress-label">
        {label}
      </p>
    </div>
  );
}