// i18n - Internationalization Module
const fs = require('fs');
const path = require('path');

class I18n {
    constructor() {
        this.currentLang = 'tr';
        this.translations = {};
        this.availableLanguages = ['tr', 'en', 'de'];
        this.loadAllLanguages();
    }

    loadAllLanguages() {
        this.availableLanguages.forEach(lang => {
            try {
                const filePath = path.join(__dirname, 'locales', `${lang}.json`);
                const content = fs.readFileSync(filePath, 'utf8');
                this.translations[lang] = JSON.parse(content);
            } catch (e) {
                console.error(`Failed to load language: ${lang}`, e);
            }
        });
    }

    setLanguage(lang) {
        if (this.translations[lang]) {
            this.currentLang = lang;
            localStorage.setItem('nova-language', lang);
            this.updateUI();
            return true;
        }
        return false;
    }

    t(key) {
        return this.translations[this.currentLang]?.[key] || key;
    }

    getDateLocale() {
        const localeMap = {
            'tr': 'tr-TR',
            'en': 'en-US',
            'de': 'de-DE'
        };
        return localeMap[this.currentLang] || 'tr-TR';
    }

    updateUI() {
        // Update all data-i18n elements
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            el.textContent = this.t(key);
        });

        // Update all data-i18n-placeholder elements
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.t(key);
        });

        // Update all data-i18n-title elements
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            el.title = this.t(key);
        });

        // Update all data-i18n-value elements (for buttons with data-value)
        document.querySelectorAll('[data-i18n-value]').forEach(el => {
            const key = el.getAttribute('data-i18n-value');
            el.textContent = this.t(key);
            el.setAttribute('data-value', this.t(key));
        });

        // Update HTML lang attribute
        document.documentElement.lang = this.currentLang;

        // Dispatch event for other components
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { lang: this.currentLang }
        }));
    }

    loadSavedLanguage() {
        const saved = localStorage.getItem('nova-language');
        if (saved && this.translations[saved]) {
            this.currentLang = saved;
        }
        this.updateUI();
    }
}

const i18n = new I18n();
module.exports = i18n;
