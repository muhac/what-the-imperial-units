import React, { useState, useEffect, useRef, useCallback } from 'react';
import './styles/neumorphism.css';

import {
    Unit,
    MetricUnit,
    ImperialUnit,
    unitCategories,
} from './lib/units';
import {
    i18n,
    Lang,
} from './lib/translations';
import {
    getInitialLang,
    handleLangChange,
    convert,
    generateMetricPlaceholder,
    generateImperialPlaceholder,
    findClosestRatioUnit,
    getUrlParams,
    updateUrl,
} from './lib/utils';
import type { UnitInputProps } from './types';

// Language options constant
const LANGUAGE_OPTIONS = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
    { value: 'es', label: 'Español' },
    { value: 'pt', label: 'Português' },
    { value: 'zh', label: '中文 (简体)' },
    { value: 'zh-TW', label: '中文 (繁體)' },
    { value: 'ja', label: '日本語' },
    { value: 'ko', label: '한국어' },
    { value: 'hi', label: 'हिन्दी' },
    { value: 'ru', label: 'Русский' },
];

/**
 * Unit input component with smart caret positioning and single-option handling
 */
const UnitInput: React.FC<UnitInputProps> = ({
    value,
    unit,
    placeholder,
    label,
    options,
    onValueChange,
    onUnitChange,
    onFocus,
    onBlur,
    unitLabels,
    inputState,
    inputId,
    selectId,
}) => {
    const [showCaret, setShowCaret] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const hideCaretTimer = useRef<NodeJS.Timeout | null>(null);

    const getInputClassName = () => {
        const baseClass = 'neumorphic-input';
        const caretClass = showCaret ? 'show-caret' : 'hide-caret';

        switch (inputState) {
            case 'focused':
                return `${baseClass} input-focused ${caretClass}`;
            case 'active':
                return `${baseClass} input-active ${caretClass}`;
            case 'transitioning-out':
                return `${baseClass} input-transitioning-out ${caretClass}`;
            default:
                return `${baseClass} ${caretClass}`;
        }
    };

    // Check caret position
    const checkCaretPosition = useCallback(() => {
        const input = inputRef.current;
        if (!input) {
            setShowCaret(false);
            return;
        }

        // Hide caret if no value
        if (!value) {
            setShowCaret(false);
            return;
        }

        // For number input, selectionStart might be unreliable, use workaround
        let caretPosition = 0;
        try {
            // Try to get selection position
            if (input.selectionStart !== null) {
                caretPosition = input.selectionStart;
            } else {
                // If selectionStart unavailable, use alternative method
                // Temporarily set to text type to get caret position
                const originalType = input.type;
                input.type = 'text';
                caretPosition = input.selectionStart || 0;
                input.type = originalType;
            }
        } catch (e) {
            // If error, default to show caret
            caretPosition = 1;
        }

        const textLength = value.length;

        // Clear previous hide timer
        if (hideCaretTimer.current) {
            clearTimeout(hideCaretTimer.current);
            hideCaretTimer.current = null;
        }

        // Smart logic: show caret immediately at beginning and middle, delay hide at end
        if (caretPosition >= 0 && caretPosition < textLength) {
            // At beginning and middle: immediately show caret
            setShowCaret(true);
        } else if (caretPosition >= textLength) {
            // At end: delay 2 seconds then hide caret
            setShowCaret(true); // First show caret
            hideCaretTimer.current = setTimeout(() => {
                setShowCaret(false);
                hideCaretTimer.current = null;
            }, 1800); // Hide after 2 seconds
        } else {
            // Other cases: immediately hide
            setShowCaret(false);
        }
    }, [value]);

    // Listen to caret position changes
    useEffect(() => {
        checkCaretPosition();
    }, [checkCaretPosition]);

    // Cleanup timer
    useEffect(() => {
        return () => {
            if (hideCaretTimer.current) {
                clearTimeout(hideCaretTimer.current);
            }
        };
    }, []);

    const handleKeyUp = () => {
        setTimeout(checkCaretPosition, 10);
    };

    const handleClick = () => {
        setTimeout(checkCaretPosition, 10);
    };

    const isSingleOption = options.length === 1;

    return (
        <div className="form-group">
            <label className="form-label">{label}</label>
            <input
                ref={inputRef}
                id={inputId}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                className={getInputClassName()}
                value={value || ''}
                placeholder={placeholder}
                onChange={(e) => onValueChange(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyUp={handleKeyUp}
                onClick={handleClick}
            />
            {isSingleOption ? (
                // Single option: display as static text, avoid dropdown arrow and list
                <select disabled
                    id={selectId}
                    className="neumorphic-select neumorphic-select-disabled"
                    value={unit}
                    onChange={(e) => onUnitChange(e.target.value as Unit)}
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt} id={`${selectId}-${opt}`}>
                            {unitLabels[opt]}
                        </option>
                    ))}
                </select>
            ) : (
                <select
                    id={selectId}
                    className="neumorphic-select"
                    value={unit}
                    onChange={(e) => onUnitChange(e.target.value as Unit)}
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt} id={`${selectId}-${opt}`}>
                            {unitLabels[opt]}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};

type CategoryKey = keyof typeof unitCategories;

// Initialize state with URL parameters on first load
const initializeFromUrl = () => {
    const urlParams = getUrlParams();

    // Determine category
    const category = (urlParams.category && Object.keys(unitCategories).includes(urlParams.category))
        ? urlParams.category as CategoryKey
        : 'length';

    const categoryData = unitCategories[category];

    // Determine units
    const metricUnit = (urlParams.metricUnit && categoryData.metric.includes(urlParams.metricUnit as MetricUnit))
        ? urlParams.metricUnit as MetricUnit
        : categoryData.metric[0];

    const imperialUnit = (urlParams.imperialUnit && categoryData.imperial.includes(urlParams.imperialUnit as ImperialUnit))
        ? urlParams.imperialUnit as ImperialUnit
        : categoryData.imperial[0];

    // Determine values and state
    let metricValue = '';
    let imperialValue = '';
    let lastUpdated: 'metric' | 'imperial' = 'imperial';
    let blueField: 'metric' | 'imperial' | null = null;
    let hasUserInput = false;

    if (urlParams.value && urlParams.valueUnit) {
        const fullValueUnit = urlParams.valueUnit === 'm' ? 'metric' :
                             urlParams.valueUnit === 'i' ? 'imperial' : urlParams.valueUnit;

        if (fullValueUnit === 'metric') {
            metricValue = urlParams.value;
            lastUpdated = 'metric';
            blueField = 'metric';
            imperialValue = convert(urlParams.value, metricUnit, imperialUnit);
            hasUserInput = true;
        } else if (fullValueUnit === 'imperial') {
            imperialValue = urlParams.value;
            lastUpdated = 'imperial';
            blueField = 'imperial';
            metricValue = convert(urlParams.value, imperialUnit, metricUnit);
            hasUserInput = true;
        }
    }

    return {
        category,
        metricUnit,
        imperialUnit,
        metricValue,
        imperialValue,
        lastUpdated,
        blueField,
        hasUserInput
    };
};

const App: React.FC = () => {
    // Initialize all state from URL parameters
    const initialState = initializeFromUrl();

    const [metricValue, setMetricValue] = useState<string>(initialState.metricValue);
    const [metricUnit, setMetricUnit] = useState<MetricUnit>(initialState.metricUnit);
    const [imperialValue, setImperialValue] = useState<string>(initialState.imperialValue);
    const [imperialUnit, setImperialUnit] = useState<ImperialUnit>(initialState.imperialUnit);
    const [lastUpdated, setLastUpdated] = useState<'metric' | 'imperial'>(initialState.lastUpdated);
    const [focusedField, setFocusedField] = useState<'metric' | 'imperial' | null>(null);
    const [activeTab, setActiveTab] = useState<CategoryKey>(initialState.category);

    // Single state variable: which box is blue
    const [blueField, setBlueField] = useState<'metric' | 'imperial' | null>(initialState.blueField);
    // Track which field is transitioning to white
    const [transitioningField, setTransitioningField] = useState<'metric' | 'imperial' | null>(null);
    // Track which field just got focus (for controlling blue animation)
    const [justFocused, setJustFocused] = useState<'metric' | 'imperial' | null>(null);

    // Timer for canceling blue box delayed clear
    const clearBlueTimer = useRef<NodeJS.Timeout | null>(null);

    // Auto-unit selection feature states
    const [hasUserInput, setHasUserInput] = useState<boolean>(initialState.hasUserInput);
    const [hasAutoChanged, setHasAutoChanged] = useState<boolean>(false);

    // Mobile sticky positioning states
    const [metricSticky, setMetricSticky] = useState<boolean>(false);
    const metricInputRef = useRef<HTMLDivElement>(null);
    const imperialInputRef = useRef<HTMLDivElement>(null);
    const conversionContainerRef = useRef<HTMLDivElement>(null);

    const [lang, setLang] = useState<Lang>(getInitialLang);
    const t = i18n[lang];

    // Update HTML lang attribute when language changes
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    // Initialize language from URL parameters on component mount
    useEffect(() => {
        const urlParams = getUrlParams();
        // Set language if provided
        if (urlParams.lang && Object.keys(i18n).includes(urlParams.lang as Lang)) {
            setLang(urlParams.lang as Lang);
        }
    }, []); // Only run once on mount

    // Update URL when state changes (but not on initial load)
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        // Skip URL update during initial component mount
        if (!isInitialized) {
            setIsInitialized(true);
            return;
        }

        // Determine which value to save based on lastUpdated
        let valueToSave = '';
        let valueUnit: 'metric' | 'imperial' | undefined = undefined;

        if (lastUpdated === 'metric' && metricValue) {
            valueToSave = metricValue;
            valueUnit = 'metric';
        } else if (lastUpdated === 'imperial' && imperialValue) {
            valueToSave = imperialValue;
            valueUnit = 'imperial';
        }

        updateUrl({
            category: activeTab,
            metricUnit: metricUnit,
            imperialUnit: imperialUnit,
            value: valueToSave || undefined,
            valueUnit: valueUnit,
            lang: lang
        });
    }, [activeTab, metricUnit, imperialUnit, metricValue, imperialValue, lastUpdated, lang, isInitialized]);

    // Placeholders
    const metricPlaceholder = generateMetricPlaceholder(metricUnit, imperialUnit);
    const imperialPlaceholder = generateImperialPlaceholder(imperialUnit, metricUnit);

    // Direction: imperial -> metric
    useEffect(() => {
        if (lastUpdated === 'imperial' && focusedField === 'imperial') {
            setMetricValue(convert(imperialValue, imperialUnit, metricUnit));
        }
    }, [imperialValue, imperialUnit, metricUnit, lastUpdated, focusedField]);

    // Direction: metric -> imperial
    useEffect(() => {
        if (lastUpdated === 'metric' && focusedField === 'metric') {
            setImperialValue(convert(metricValue, metricUnit, imperialUnit));
        }
    }, [metricValue, metricUnit, imperialUnit, lastUpdated, focusedField]);

    /**
     * Handle focus changes:
     * - Cancel any pending "blue to white" timer to avoid race condition
     * - If switching input boxes, old blue box transitions, new one becomes blue with focused animation
     * - Only clear values if any box already has content, avoid deleting just-entered values
     */
    useEffect(() => {
        if (focusedField) {
            // 1. Cancel possible delayed clear
            if (clearBlueTimer.current) {
                clearTimeout(clearBlueTimer.current);
                clearBlueTimer.current = null;
                setTransitioningField(null);
            }

            // 2. Update blue box
            if (blueField !== focusedField) {
                if (blueField && blueField !== focusedField) {
                    setTransitioningField(blueField);
                }
                setBlueField(focusedField);
                setJustFocused(focusedField);

                if (metricValue !== '' || imperialValue !== '') {
                    setMetricValue('');
                    setImperialValue('');
                }
            }
        }
    }, [focusedField, blueField, metricValue, imperialValue]);

    /**
     * When both input boxes are empty and unfocused, fade out blue box after 800ms
     */
    useEffect(() => {
        if (focusedField === null && metricValue === '' && imperialValue === '' && blueField) {
            setTransitioningField(blueField);
            clearBlueTimer.current = setTimeout(() => {
                setBlueField(null);
                setTransitioningField(null);
                clearBlueTimer.current = null;
            }, 800); // Match animation duration
        }
    }, [focusedField, metricValue, imperialValue, blueField]);

    // Clear justFocused marker
    useEffect(() => {
        if (justFocused) {
            const timer = setTimeout(() => setJustFocused(null), 600);
            return () => clearTimeout(timer);
        }
    }, [justFocused]);

    // Clear transitioningField, can auto-end even if canceled externally
    useEffect(() => {
        if (transitioningField) {
            const timer = setTimeout(() => setTransitioningField(null), 800);
            return () => clearTimeout(timer);
        }
    }, [transitioningField]);

    // Mobile sticky positioning logic
    useEffect(() => {
        const handleScroll = () => {
            // Only apply on mobile screens
            if (window.innerWidth > 1024) {
                setMetricSticky(false);
                return;
            }

            const metricElement = metricInputRef.current;
            const imperialElement = imperialInputRef.current;
            const containerElement = conversionContainerRef.current;

            if (!metricElement || !imperialElement || !containerElement) return;

            const metricRect = metricElement.getBoundingClientRect();
            const imperialRect = imperialElement.getBoundingClientRect();

            // Check if metric input would be pushed out of viewport top
            const shouldBeSticky = metricRect.top < -24 && imperialRect.top > 0;
            const floatingHeight = 84;

            // Check if imperial input is close enough to start pushing out the floating input
            // Start transition when imperial input is about to reach the floating container's bottom
            const shouldUnstick = imperialRect.top <= floatingHeight;

            if (shouldUnstick) {
                setMetricSticky(false);
            } else if (shouldBeSticky) {
                setMetricSticky(true);
            } else if (metricRect.top >= 0) {
                setMetricSticky(false);
            }
        };

        const handleResize = () => {
            if (window.innerWidth > 1024) {
                setMetricSticky(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const handleTabChange = (key: CategoryKey) => {
        setActiveTab(key);
        setMetricUnit(unitCategories[key].metric[0]);
        setImperialUnit(unitCategories[key].imperial[0]);
        setMetricValue('');
        setImperialValue('');
        setLastUpdated('imperial');
        setBlueField(null);
        // Reset auto-change tracking when switching tabs
        setHasUserInput(false);
        setHasAutoChanged(false);
    };

    // Calculate input state based on color state
    const getInputState = (field: 'metric' | 'imperial'): 'normal' | 'focused' | 'active' | 'transitioning-out' => {
        if (transitioningField === field) return 'transitioning-out';
        if (blueField === field) return justFocused === field ? 'focused' : 'active';
        if (focusedField === field) return 'focused';
        return 'normal';
    };

    const renderCategory = (cat: CategoryKey) => (
        <div className="conversion-wrapper">
            <div className="conversion-container" ref={conversionContainerRef}>
                {/* Metric */}
                <div ref={metricInputRef} className="metric-input-wrapper">
                    <UnitInput
                        label={t.metricLabel}
                        value={metricValue}
                        unit={metricUnit}
                        placeholder={metricPlaceholder}
                        options={unitCategories[cat].metric}
                        onValueChange={(val) => {
                            setMetricValue(val);
                            setLastUpdated('metric');
                            // Mark that user has input values
                            if (val.trim() !== '') {
                                setHasUserInput(true);
                            }
                        }}
                        onUnitChange={(u) => {
                            const newUnit = u as MetricUnit;

                            // Auto-change imperial unit to closest ratio if:
                            // 1. User hasn't input any values yet
                            // 2. This is the first time changing any unit
                            if (!hasUserInput && !hasAutoChanged) {
                                const closestImperialUnit = findClosestRatioUnit(newUnit, unitCategories[cat].imperial);
                                setImperialUnit(closestImperialUnit as ImperialUnit);
                                setHasAutoChanged(true);
                            }

                            setMetricUnit(newUnit);
                            setLastUpdated('metric');
                            if (blueField === 'metric') {
                                // Use the potentially auto-changed imperial unit for conversion
                                const targetImperialUnit = !hasUserInput && !hasAutoChanged
                                    ? findClosestRatioUnit(newUnit, unitCategories[cat].imperial)
                                    : imperialUnit;
                                setImperialValue(convert(metricValue, newUnit as Unit, targetImperialUnit));
                            } else if (blueField === 'imperial') {
                                setMetricValue(convert(imperialValue, imperialUnit, newUnit as Unit));
                            } else {
                                setMetricValue('');
                                setImperialValue('');
                            }
                        }}
                        onFocus={() => setFocusedField('metric')}
                        onBlur={() => setFocusedField(null)}
                        unitLabels={t.unitLabels}
                        inputState={getInputState('metric')}
                        inputId={`metric-input-${cat}`}
                        selectId={`metric-select-${cat}`}
                    />
                </div>

                <div className="conversion-arrow"></div>

                {/* Imperial */}
                <div ref={imperialInputRef} className="imperial-input-wrapper">
                    <UnitInput
                        label={t.imperialLabel}
                        value={imperialValue}
                        unit={imperialUnit}
                        placeholder={imperialPlaceholder}
                        options={unitCategories[cat].imperial}
                        onValueChange={(val) => {
                            setImperialValue(val);
                            setLastUpdated('imperial');
                            // Mark that user has input values
                            if (val.trim() !== '') {
                                setHasUserInput(true);
                            }
                        }}
                        onUnitChange={(u) => {
                            const newUnit = u as ImperialUnit;

                            // Auto-change metric unit to closest ratio if:
                            // 1. User hasn't input any values yet
                            // 2. This is the first time changing any unit
                            if (!hasUserInput && !hasAutoChanged) {
                                const closestMetricUnit = findClosestRatioUnit(newUnit, unitCategories[cat].metric);
                                setMetricUnit(closestMetricUnit as MetricUnit);
                                setHasAutoChanged(true);
                            }

                            setImperialUnit(newUnit);
                            setLastUpdated('imperial');
                            if (blueField === 'imperial') {
                                // Use the potentially auto-changed metric unit for conversion
                                const targetMetricUnit = !hasUserInput && !hasAutoChanged
                                    ? findClosestRatioUnit(newUnit, unitCategories[cat].metric)
                                    : metricUnit;
                                setMetricValue(convert(imperialValue, newUnit as Unit, targetMetricUnit));
                            } else if (blueField === 'metric') {
                                setImperialValue(convert(metricValue, metricUnit, newUnit as Unit));
                            } else {
                                setMetricValue('');
                                setImperialValue('');
                            }
                        }}
                        onFocus={() => setFocusedField('imperial')}
                        onBlur={() => setFocusedField(null)}
                        unitLabels={t.unitLabels}
                        inputState={getInputState('imperial')}
                        inputId={`imperial-input-${cat}`}
                        selectId={`imperial-select-${cat}`}
                    />
                </div>
            </div>
        </div>
    );

    return (
        <div className="app-container">
            {/* Floating/Sticky Metric Input - Simplified */}
            <div className={`floating-metric-container ${metricSticky ? '' : 'floating-metric-container-hide'}`}>
                <div className="floating-input-wrapper">
                    <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        className={`neumorphic-input ${getInputState('metric') === 'focused' ? 'input-focused' :
                            getInputState('metric') === 'active' ? 'input-active' :
                            getInputState('metric') === 'transitioning-out' ? 'input-transitioning-out' : ''}`}
                        value={metricValue || ''}
                        placeholder={metricPlaceholder}
                        onChange={(e) => {
                            setMetricValue(e.target.value);
                            setLastUpdated('metric');
                            if (e.target.value.trim() !== '') {
                                setHasUserInput(true);
                            }
                        }}
                        onFocus={() => setFocusedField('metric')}
                        onBlur={() => setFocusedField(null)}
                    />
                </div>
            </div>

            <div className="neumorphic-card">
                <div className="card-header">
                    <h1 className="card-title">{t.cardTitle}</h1>
                    <select
                        className="language-selector language-selector-desktop"
                        value={lang}
                        onChange={(e) => handleLangChange(e.target.value as Lang, setLang)}
                    >
                        {LANGUAGE_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>

                <div className="tabs-container">
                    <div className="tab-nav">
                        {Object.keys(unitCategories).map((key) => (
                            <button
                                key={key}
                                id={`tab-${key}`}
                                className={`tab-button ${activeTab === key ? 'active' : ''}`}
                                onClick={() => handleTabChange(key as CategoryKey)}
                            >
                                {t.tabs[key as CategoryKey]}
                            </button>
                        ))}
                    </div>

                    {renderCategory(activeTab)}
                </div>

                {/* Info Card */}
                <div className="info-card">
                    <h3>💡 {t.infoCard.title}</h3>
                    <p>{t.infoCard.description}</p>
                    {t.infoCard.github && (
                        <p style={{ marginTop: '0.5rem' }}>
                            {t.infoCard.githubLabel && `${t.infoCard.githubLabel} `}
                            <a
                                href={t.infoCard.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: 'inherit', textDecoration: 'underline' }}
                            >
                                {t.infoCard.github}
                            </a>
                        </p>
                    )}
                </div>

                {/* Mobile Language Selector */}
                <div className="language-selector-mobile-container">
                    <select
                        className="language-selector language-selector-mobile"
                        value={lang}
                        onChange={(e) => handleLangChange(e.target.value as Lang, setLang)}
                    >
                        {LANGUAGE_OPTIONS.map(({ value, label }) => (
                            <option key={value} value={value}>{label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default App;
