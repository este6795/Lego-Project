import ColorPicker from "./ColorPicker";
import { useNavigate } from "react-router-dom";
function BuildOptionsPanel() {
const navigate = useNavigate();
  return (
    <div className="build-options-panel">
      <h2>Build Options</h2>

      <div className="option-group">
        <label>Model Size</label>
        <select defaultValue="Medium">
          <option value="Small">Small</option>
          <option value="Medium">Medium</option>
          <option value="Large">Large</option>
        </select>
      </div>

      <div className="option-group">
        <label>Build Type</label>
        <select defaultValue="Hollow shell">
          <option value="Solid">Solid</option>
          <option value="Hollow shell">Hollow shell</option>
        </select>
      </div>

      <div className="option-group">
        <label>Detail Level</label>
        <select defaultValue="Medium">
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
      </div>

      <div className="option-group">
        <label>Primary Color</label>
        <ColorPicker />
      </div>

      <div className="image-placeholder">
        <p className="placeholder-title">Image Input</p>

        <p className="placeholder-text">
          Future feature - text input is the MVP.
        </p>
      </div>

      <button onClick={() => navigate("/generate")}>
        Generate LEGO Build
      </button>
    </div>
  );
}

export default BuildOptionsPanel;
