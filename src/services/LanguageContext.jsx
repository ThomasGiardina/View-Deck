import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loadPrefs, savePrefs } from "./storage.js";
import { STRINGS } from "../data/i18n.js";

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("es");
  const [orderBy, setOrderBy] = useState("addedAt");

  useEffect(() => {
    const prefs = loadPrefs();
    setLanguage(prefs.language || "es");
    setOrderBy(prefs.orderBy || "addedAt");
  }, []);

  useEffect(() => {
    savePrefs({ orderBy, language });
  }, [orderBy, language]);

  const strings = useMemo(() => STRINGS[language], [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, orderBy, setOrderBy, strings }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within a LanguageProvider");
  return context;
}
