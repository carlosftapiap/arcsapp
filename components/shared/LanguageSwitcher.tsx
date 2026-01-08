'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown } from 'lucide-react';

const languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'zh-CN', name: '中文', flag: '🇨🇳' },
];

interface LanguageSwitcherProps {
    variant?: 'light' | 'dark';
    dropdownDirection?: 'up' | 'down';
}

export default function LanguageSwitcher({ variant = 'light', dropdownDirection = 'down' }: LanguageSwitcherProps) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLanguageChange = (langCode: string) => {
        // Replace the current locale in the path with the new one
        const segments = pathname.split('/');
        segments[1] = langCode; // The locale is always the first segment after /
        const newPath = segments.join('/');

        router.push(newPath);
        setIsOpen(false);
    };

    const isDark = variant === 'dark';
    const dropdownPositionClass = dropdownDirection === 'up'
        ? 'bottom-full mb-2'
        : 'top-full mt-2';

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm ${isDark
                    ? 'text-gray-200 bg-gray-700 border border-gray-600 hover:bg-gray-600 hover:border-gray-500'
                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                    }`}
                aria-label="Select language"
            >
                <Globe size={18} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                <span>{currentLanguage.flag}</span>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-400'}`} />
            </button>

            {isOpen && (
                <div className={`absolute right-0 ${dropdownPositionClass} w-48 rounded-xl shadow-xl z-50 overflow-hidden ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                    }`}>
                    <div className="py-1">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors duration-150 ${lang.code === locale
                                    ? isDark
                                        ? 'bg-blue-900/50 text-blue-300 font-semibold'
                                        : 'bg-blue-50 text-blue-700 font-semibold'
                                    : isDark
                                        ? 'text-gray-300 hover:bg-gray-700'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-xl">{lang.flag}</span>
                                <span>{lang.name}</span>
                                {lang.code === locale && (
                                    <span className="ml-auto">
                                        <svg className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
