export default function BuildPreview() {
  return (
    <div className="preview-card">
      <div className="preview-header">
        <h3>Live model preview</h3>

        <button className="viewer-btn">
          Voxel stage
        </button>
      </div>

      <div className="preview-grid">
        <div className="lego-model">
          <div className="brick yellow"></div>
          <div className="brick yellow"></div>

          <div className="brick blue"></div>
          <div className="brick blue"></div>
          <div className="brick blue"></div>
          <div className="brick blue"></div>

          <div className="brick red"></div>
          <div className="brick yellow"></div>
          <div className="brick yellow"></div>
          <div className="brick red"></div>

          <div className="brick red"></div>
          <div className="brick blue"></div>
          <div className="brick blue"></div>
          <div className="brick blue"></div>
          <div className="brick red"></div>

          <div className="brick black"></div>
          <div className="brick black"></div>
        </div>
      </div>

      <p className="preview-note">
        Voxel grid is the bridge between the STL mesh
        and the LEGO packing algorithm.
      </p>
    </div>
  );
}