//Program starts here
import { BrowserRouter, Routes, Route } from "react-router-dom";
import './App.css';
import LoginPage from './pages/LoginPage';
import ClassPage from "./pages/ClassPage";
import RegisterPage from './pages/RegisterPage';
import AppDownloadPage from "./pages/AppDownloadPage";
import ClassDetailsPage from "./pages/ClassDetailsPage";
import AddClassPage from "./pages/AddClassPage";
import JoinClassPage from "./pages/joinClassPage";
import EnterCodePage from "./pages/EnterCodePage";  
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/classes" element={<ClassPage />} />
        <Route path="/classes/:classId" element={<ClassDetailsPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/download" element={<AppDownloadPage />} />
        <Route path="/addClass" element={<AddClassPage />} />
        <Route path="/joinClass" element={<JoinClassPage />} />
        <Route path="/verification" element={<EnterCodePage />} />
        <Route path="/forgotpassword" element={<ForgotPasswordPage />} />
        <Route path="/changepassword" element={<ChangePasswordPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;