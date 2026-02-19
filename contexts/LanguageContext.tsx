import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { resolveTranslation, SupportedLanguage } from './i18n';

type Language = SupportedLanguage;

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [language, setLanguageState] = useState<Language>(() => {
        const saved = localStorage.getItem('nexusLanguage');
        return (saved as Language) || 'en';
    });

    const API_URL = import.meta.env.VITE_API_BASE_URL || '';

    const persistLanguagePreference = useCallback(async (lang: Language) => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            await fetch(`${API_URL}/api/personalization/preferences`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ preferredLanguage: lang }),
            });
        } catch (error) {
            console.error('Failed to persist language preference:', error);
        }
    }, [API_URL]);

    const setLanguage = useCallback((lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('nexusLanguage', lang);
        persistLanguagePreference(lang);
    }, [persistLanguagePreference]);

    useEffect(() => {
        const syncLanguageFromProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) return;

            try {
                const response = await fetch(`${API_URL}/api/personalization/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (!response.ok) return;

                const payload = await response.json();
                const profileLanguage = payload?.data?.preferredLanguage;
                if (profileLanguage && ['en', 'mr', 'hi'].includes(profileLanguage) && profileLanguage !== language) {
                    setLanguageState(profileLanguage as Language);
                    localStorage.setItem('nexusLanguage', profileLanguage);
                }
            } catch (error) {
                console.error('Failed to sync language preference:', error);
            }
        };

        syncLanguageFromProfile();
    }, [API_URL]); // Run once on mount

    const t = useCallback((key: string, params?: Record<string, string | number>) => (
        resolveTranslation(language, key, params)
    ), [language]);

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
