import { useCallback, useState, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf"; // thank you react-pdf...
import { getToken } from "../../services/tokenStorage";

import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const FIT_HEIGHT_QUERY = "(min-width: 901px)";
const PAGE_BORDER = 2;

export default function ResumeViewer({ fileUrl }) {
  const [numPages, setNumPages] = useState(0);
  const [aspectRatio, setAspectRatio] = useState(0);
  const [box, setBox] = useState({ width: 0, height: 0, fitHeight: false });
  const options = useMemo(
    () => ({ httpHeaders: { Authorization: `Token ${getToken()}` } }),
    [],
  );
  const file = useMemo(
    () => ({ url: fileUrl, ...options }),
    [fileUrl, options],
  );

  const measureContainer = useCallback((element) => {
    if (!element) return;

    const measure = () => {
      const next = {
        width: element.clientWidth,
        height: element.clientHeight,
        fitHeight: window.matchMedia(FIT_HEIGHT_QUERY).matches,
      };
      setBox((previous) =>
        previous.width === next.width &&
        previous.height === next.height &&
        previous.fitHeight === next.fitHeight
          ? previous
          : next,
      );
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, []);

  async function handleLoadSuccess(pdf) {
    setNumPages(pdf.numPages);
    const firstPage = await pdf.getPage(1);
    const { width, height } = firstPage.getViewport({ scale: 1 });
    setAspectRatio(width / height);
  }

  const heightFromWidth = (box.width - PAGE_BORDER) / aspectRatio;
  const pageHeight =
    aspectRatio && box.width
      ? Math.floor(
          box.fitHeight
            ? Math.min(box.height - PAGE_BORDER, heightFromWidth)
            : heightFromWidth,
        )
      : 0;

  return (
    <div className="resume-viewer">
      <div className="resume-viewer-frame" ref={measureContainer}>
        <Document
          file={file}
          suspense={false}
          onLoadSuccess={handleLoadSuccess}
          loading={<p className="resume-viewer-message">Loading resume…</p>}
          error={
            <p className="resume-viewer-message error">
              Couldn't load the resume preview.
            </p>
          }
        >
          {pageHeight > 0 &&
            Array.from({ length: numPages }, (_, index) => (
              <Page
                key={index + 1}
                pageNumber={index + 1}
                height={pageHeight}
                className="resume-viewer-page"
              />
            ))}
        </Document>
      </div>
    </div>
  );
}
