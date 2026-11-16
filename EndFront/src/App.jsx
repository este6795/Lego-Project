import { BrowserRouter, Routes, Route } from "react-router-dom";

import CreatePage from "./Pages/CreatePage";
import GeneratePage from "./Pages/GeneratePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CreatePage />} />
        <Route path="/generate" element={<GeneratePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;