import { BrowserRouter, Route, Routes } from "react-router";
import ResetPasswordPage from "./pages/ResetPasswordPage/ResetPasswordPage";
import ResetPasswordConfirmPage from "./pages/ResetPasswordPage/ResetPasswordConfirmPage";
import LoginPage from "./pages/LoginPage/LoginPage";
import Layout from "./components/common/Layout/Layout";
import HomePage from "./pages/HomePage/HomePage";
import NotFoundPage from "./pages/NotFoundPage/NotFoundPage";
import ResultsPage from "./pages/ResultsPage/ResultsPage";
import ProfilePage from "./pages/ProfilePage/ProfilePage";
import SkillBankPage from "./pages/SkillBankPage/Skillbankpage";
import UploadPage from "./pages/UploadPage/UploadPage";
import RegisterPage from "./pages/RegisterPage/RegisterPage";
import AnalysisHistoryPage from "./pages/AnalysisHistoryPage/AnalysisHistoryPage";
import "./App.css";
import AuthProvider from "./context/AuthProvider";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
            <Route
              path="reset-password/:uid/:token"
              element={<ResetPasswordConfirmPage />}
            />
            <Route path="upload" element={<UploadPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="skills" element={<SkillBankPage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="results/:id" element={<ResultsPage />} />
            <Route path="*" element={<NotFoundPage />} />
            <Route path="history" element={<AnalysisHistoryPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
