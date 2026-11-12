function PromptPanel() {
  const tags = [
    "Simple shapes",
    "Symmetrical",
    "No tiny details",
  ];

  return (
    <div className="prompt-panel">
      <h2>What do you want to build?</h2>

      <textarea
        className="prompt-textarea"
        placeholder="Build me a small futuristic spaceship with a thick body, two wings, and simple engines. Keep the shape blocky enough to convert cleanly into LEGO."
      />

      <div className="prompt-tags">
        {tags.map((tag) => (
          <button
            key={tag}
            className={`tag ${
              tag === "Simple shapes" ? "active" : ""
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="info-banner">
        💡 AI will first turn this into structured JSON,
        then generate OpenSCAD code.
      </div>
    </div>
  );
}

export default PromptPanel;