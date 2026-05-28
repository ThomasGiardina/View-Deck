import { Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AuthScreen from "./components/AuthScreen";
import DiscoverView from "./components/DiscoverView";
import DetailView from "./components/DetailView";
import MyListsView from "./components/MyListsView";
import SettingsView from "./components/SettingsView";
import ProtectedRoute from "./components/ProtectedRoute";
import { LanguageProvider } from "./services/LanguageContext";

export default function App() {
  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[var(--theme-bg)] text-[var(--theme-text)]">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/40 via-transparent to-transparent" />
        <Header />
        <main className="relative mx-auto max-w-7xl px-6 py-8">
          <Routes>
            <Route path="/" element={<Navigate to="/discover" replace />} />
            <Route path="/login" element={<AuthScreen mode="login" />} />
            <Route path="/register" element={<AuthScreen mode="register" />} />
            <Route path="/discover" element={<DiscoverView />} />
            <Route path="/detail/:imdbId" element={<DetailView />} />
            <Route path="/settings" element={<SettingsView />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/mylists" element={<MyListsView />} />
            </Route>
            <Route path="*" element={<Navigate to="/discover" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
