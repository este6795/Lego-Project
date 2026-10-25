import { useRef, useState } from "react";
import { useNavigate } from "react-router";
import { uploadResume } from "../../services/resumeService";
import "./UploadPage.css";

const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_JOB_LENGTH = 10000;

function validateFile(file) {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (!isPdf) return "Only PDF files are supported.";
  if (file.size > MAX_FILE_SIZE)
    return `File is too large (max ${MAX_FILE_SIZE_MB} MB).`;
  return null;
}

function formatSize(bytes) {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function UploadPage() {
  const [file, setFile] = useState(null);
  const [jobPosting, setJobPosting] = useState("");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  function selectFile(selected) {
    if (!selected) return;
    const problem = validateFile(selected);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setFile(selected);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files[0]);
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current.click();
    }
  }

  function removeFile() {
    setFile(null);
    inputRef.current.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);
    try {
      const result = await uploadResume(file, jobPosting.trim());
      navigate(`/results/${result.analysis_id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="upload-page">
      <h1>Upload a resume</h1>
      <form className="upload-form" onSubmit={handleSubmit}>
        <div
          className={`dropzone${dragging ? " dropzone-active" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current.click()}
          onKeyDown={handleKeyDown}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,application/pdf"
            hidden
            onChange={(e) => selectFile(e.target.files[0])}
          />
          {file ? (
            <p className="dropzone-file">
              <strong>{file.name}</strong> ({formatSize(file.size)})
            </p>
          ) : (
            <>
              <p className="dropzone-title">Drag and drop your resume here</p>
              <p className="dropzone-hint">{`or click to choose a file · PDF, max size ${MAX_FILE_SIZE_MB} MB`}</p>
            </>
          )}
        </div>
        {file && (
          <button type="button" className="link-button" onClick={removeFile}>
            Remove file
          </button>
        )}

        <label className="job-label" htmlFor="job-posting">
          Job posting <span className="optional">(optional)</span>
        </label>
        <textarea
          id="job-posting"
          className="job-input"
          placeholder="Paste the job description you're targeting to see how well your resume matches."
          value={jobPosting}
          maxLength={MAX_JOB_LENGTH}
          onChange={(e) => setJobPosting(e.target.value)}
          rows={8}
        />
        <p className="char-count">
          {jobPosting.length.toLocaleString()} /{" "}
          {MAX_JOB_LENGTH.toLocaleString()}
        </p>

        <button type="submit" disabled={!file || loading}>
          {loading ? "Uploading…" : "Analyze"}
        </button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}

export default UploadPage;
