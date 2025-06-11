                        import React, { useState, useEffect, useRef, useCallback } from 'react';
import './neumorphism.css';

import {
    Unit,
    MetricUnit,
    ImperialUnit,
    unitCategories,
} from './units';
import {
    i18n,
    Lang,
} from './translations';
import {
    getInitialLang,
    handleLangChange,
    convert,
    generateMetricPlaceholder,
    generateImperialPlaceholder,
    findClosestRatioUnit,
} from './App';

// URL parameter utilities with i18n mapping
const getCategoryFromUrl = (urlCategory: string): string => {
    // Find category by URL abbreviation using i18n.url.tabs (case insensitive)
    const fullCategory = Object.keys(i18n.url.tabs).find(
        key => i18n.url.tabs[key].toLowerCase() === urlCategory.toLowerCase()
    );
    return fullCategory || urlCategory;
};

const getCategoryForUrl = (category: string): string => {
    // Use i18n.url.tabs for shortened category names
    return i18n.url.tabs[category] || category;
};

const getUnitFromUrl = (urlUnit: string): Unit | '' => {
    // Find unit by URL abbreviation using i18n.url.unitLabels (case insensitive)
    const allUnits = Object.keys(i18n.url.unitLabels) as Unit[];
    return allUnits.find(unit => i18n.url.unitLabels[unit].toLowerCase() === urlUnit.toLowerCase()) || urlUnit as Unit;
};

const getUnitForUrl = (unit: Unit): string => {
    // Use i18n.url.unitLabels for shortened unit names
    return i18n.url.unitLabels[unit] || unit;
};

const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    return {
        category: getCategoryFromUrl(params.get('c') || 'len'),
        metricUnit: getUnitFromUrl(params.get('m') || ''),
        imperialUnit: getUnitFromUrl(params.get('i') || ''),
        value: params.get('v') || '',
        valueUnit: params.get('u') || '', // 'm' for metric or 'i' for imperial
        lang: params.get('lang') || ''
    };
};

const updateUrl = (params: {
    category?: string;
    metricUnit?: string;
    imperialUnit?: string;
    value?: string;
    valueUnit?: 'metric' | 'imperial';
    lang?: string;
}) => {
    const urlParams = new URLSearchParams();

    // Put lang first
    if (params.lang) urlParams.set('lang', params.lang);
    if (params.category) urlParams.set('c', getCategoryForUrl(params.category));
    if (params.metricUnit) urlParams.set('m', getUnitForUrl(params.metricUnit as Unit));
    if (params.imperialUnit) urlParams.set('i', getUnitForUrl(params.imperialUnit as Unit));
    if (params.value) {
        urlParams.set('v', params.value);
        if (params.valueUnit) urlParams.set('u', params.valueUnit === 'metric' ? 'm' : 'i');
    }

    const newUrl = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
};

interface UnitInputProps {
    value: string;
    unit: Unit;
    placeholder: string;
    label: string;
    options: Unit[];
    onValueChange: (val: string) => void;
    onUnitChange: (u: Unit) => void;
    onFocus: () => void;
    onBlur: () => void;
    unitLabels: Record<Unit, string>;
    inputState: 'normal' | 'focused' | 'active' | 'transitioning-out';
    inputId?: string;
    selectId?: string;
}

/**
 * 单个输入组件
 * 如果 options 只有 1 个，则不渲染 <select>，而是渲染一个纯文字标签，
 * 并隐藏下拉小三角，从而避免多余的点击和箭头动画。
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

    // 检查光标位置
    const checkCaretPosition = useCallback(() => {
        const input = inputRef.current;
        if (!input) {
            setShowCaret(false);
            return;
        }

        // 如果没有值，隐藏光标
        if (!value) {
            setShowCaret(false);
            return;
        }

        // 对于number input，selectionStart可能不可靠，我们使用一个变通方法
        let caretPosition = 0;
        try {
            // 尝试获取selection位置
            if (input.selectionStart !== null) {
                caretPosition = input.selectionStart;
            } else {
                // 如果selectionStart不可用，使用其他方法
                // 临时设置为text类型来获取光标位置
                const originalType = input.type;
                input.type = 'text';
                caretPosition = input.selectionStart || 0;
                input.type = originalType;
            }
        } catch (e) {
            // 如果出错，默认显示光标
            caretPosition = 1;
        }

        const textLength = value.length;

        // 清除之前的延迟隐藏定时器
        if (hideCaretTimer.current) {
            clearTimeout(hideCaretTimer.current);
            hideCaretTimer.current = null;
        }

        // 智能逻辑：在开头和中间立即显示光标，末尾延迟隐藏
        if (caretPosition >= 0 && caretPosition < textLength) {
            // 在开头和中间：立即显示光标
            setShowCaret(true);
        } else if (caretPosition >= textLength) {
            // 在末尾：延迟2秒后隐藏光标
            setShowCaret(true); // 先显示光标
            hideCaretTimer.current = setTimeout(() => {
                setShowCaret(false);
                hideCaretTimer.current = null;
            }, 1900); // 2秒后隐藏
        } else {
            // 其他情况：立即隐藏
            setShowCaret(false);
        }

        // 调试输出（可以移除）
        // console.log('Debug - Value:', value, 'Caret position:', caretPosition, 'Text length:', textLength, 'At end:', caretPosition >= textLength);
    }, [value]);

    // 监听光标位置变化
    useEffect(() => {
        checkCaretPosition();
    }, [checkCaretPosition]);

    // 清理定时器
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
                // 只有一个候选单位时，显示为静态文本，避免出现下拉箭头和列表
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

const NeumorphismApp: React.FC = () => {
    // console.log('NeumorphismApp component loaded');

    const [metricValue, setMetricValue] = useState<string>('');
    const [metricUnit, setMetricUnit] = useState<MetricUnit>('centimeters');
    const [imperialValue, setImperialValue] = useState<string>('');
    const [imperialUnit, setImperialUnit] = useState<ImperialUnit>('inch');
    const [lastUpdated, setLastUpdated] = useState<'metric' | 'imperial'>('imperial');
    const [focusedField, setFocusedField] = useState<'metric' | 'imperial' | null>(null);
    const [activeTab, setActiveTab] = useState<CategoryKey>('length');

    // 单一状态变量：哪个框是蓝色的
    const [blueField, setBlueField] = useState<'metric' | 'imperial' | null>(null);
    // 跟踪哪个字段正在过渡到白色
    const [transitioningField, setTransitioningField] = useState<'metric' | 'imperial' | null>(null);
    // 跟踪哪个字段刚刚获得焦点（用于控制变蓝动画）
    const [justFocused, setJustFocused] = useState<'metric' | 'imperial' | null>(null);

    // 用于取消蓝色框延迟清除的定时器
    const clearBlueTimer = useRef<NodeJS.Timeout | null>(null);

    // Auto-unit selection feature states
    const [hasUserInput, setHasUserInput] = useState<boolean>(false);
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

    // Initialize state from URL parameters on component mount
    useEffect(() => {
        const urlParams = getUrlParams();

        // Set language if provided
        if (urlParams.lang && Object.keys(i18n).includes(urlParams.lang as Lang)) {
            setLang(urlParams.lang as Lang);
        }

        // Set category if provided and valid
        if (urlParams.category && Object.keys(unitCategories).includes(urlParams.category)) {
            setActiveTab(urlParams.category as CategoryKey);

            // Set units if provided and valid for the category
            const categoryData = unitCategories[urlParams.category as CategoryKey];
            if (urlParams.metricUnit && categoryData.metric.includes(urlParams.metricUnit as MetricUnit)) {
                setMetricUnit(urlParams.metricUnit as MetricUnit);
            } else {
                setMetricUnit(categoryData.metric[0]);
            }

            if (urlParams.imperialUnit && categoryData.imperial.includes(urlParams.imperialUnit as ImperialUnit)) {
                setImperialUnit(urlParams.imperialUnit as ImperialUnit);
            } else {
                setImperialUnit(categoryData.imperial[0]);
            }

            // Set value if provided (only one value with its unit type)
            if (urlParams.value && urlParams.valueUnit) {
                // Convert abbreviated value unit back to full name
                const fullValueUnit = urlParams.valueUnit === 'm' ? 'metric' :
                                     urlParams.valueUnit === 'i' ? 'imperial' : urlParams.valueUnit;

                if (fullValueUnit === 'metric') {
                    setMetricValue(urlParams.value);
                    setLastUpdated('metric');
                    setBlueField('metric');
                    // Calculate imperial value
                    const targetImperialUnit = urlParams.imperialUnit && categoryData.imperial.includes(urlParams.imperialUnit as ImperialUnit)
                        ? urlParams.imperialUnit as ImperialUnit
                        : categoryData.imperial[0];
                    const targetMetricUnit = urlParams.metricUnit && categoryData.metric.includes(urlParams.metricUnit as MetricUnit)
                        ? urlParams.metricUnit as MetricUnit
                        : categoryData.metric[0];
                    setImperialValue(convert(urlParams.value, targetMetricUnit, targetImperialUnit));
                } else if (fullValueUnit === 'imperial') {
                    setImperialValue(urlParams.value);
                    setLastUpdated('imperial');
                    setBlueField('imperial');
                    // Calculate metric value
                    const targetImperialUnit = urlParams.imperialUnit && categoryData.imperial.includes(urlParams.imperialUnit as ImperialUnit)
                        ? urlParams.imperialUnit as ImperialUnit
                        : categoryData.imperial[0];
                    const targetMetricUnit = urlParams.metricUnit && categoryData.metric.includes(urlParams.metricUnit as MetricUnit)
                        ? urlParams.metricUnit as MetricUnit
                        : categoryData.metric[0];
                    setMetricValue(convert(urlParams.value, targetImperialUnit, targetMetricUnit));
                }
                setHasUserInput(true);
            }
        }
    }, []); // Only run once on mount

    // Update URL when state changes
    useEffect(() => {
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
    }, [activeTab, metricUnit, imperialUnit, metricValue, imperialValue, lastUpdated, lang]);

    // console.log('NeumorphismApp current state:', {
    //     metricUnit,
    //     imperialUnit,
    //     hasUserInput,
    //     hasAutoChanged,
    //     activeTab
    // });

    // Placeholders - using imported functions from App.tsx
    const metricPlaceholder = generateMetricPlaceholder(metricUnit, imperialUnit);
    const imperialPlaceholder = generateImperialPlaceholder(imperialUnit, metricUnit);

    // 方向：imperial -> metric
    useEffect(() => {
        if (lastUpdated === 'imperial' && focusedField === 'imperial') {
            setMetricValue(convert(imperialValue, imperialUnit, metricUnit));
        }
    }, [imperialValue, imperialUnit, metricUnit, lastUpdated, focusedField]);

    // 方向：metric -> imperial
    useEffect(() => {
        if (lastUpdated === 'metric' && focusedField === 'metric') {
            setImperialValue(convert(metricValue, metricUnit, imperialUnit));
        }
    }, [metricValue, metricUnit, imperialUnit, lastUpdated, focusedField]);

    /**
     * 处理 focus 变化：
     * - 若有正在等待的"蓝框变白"计时器则取消，以免 race condition
     * - 如切换输入框，则旧蓝框进入过渡，新的设为蓝框并触发一次 focused 动画
     * - 仅在任意框已有内容时才清空，避免刚输入的值被误删
     */
    useEffect(() => {
        if (focusedField) {
            // 1. 取消可能存在的延迟清除
            if (clearBlueTimer.current) {
                clearTimeout(clearBlueTimer.current);
                clearBlueTimer.current = null;
                setTransitioningField(null);
            }

            // 2. 更新蓝框
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
     * 当两个输入框都为空且失焦时，800 ms 后让蓝框淡出
     */
    useEffect(() => {
        if (focusedField === null && metricValue === '' && imperialValue === '' && blueField) {
            setTransitioningField(blueField);
            clearBlueTimer.current = setTimeout(() => {
                setBlueField(null);
                setTransitioningField(null);
                clearBlueTimer.current = null;
            }, 800); // 与动画时长一致
        }
    }, [focusedField, metricValue, imperialValue, blueField]);

    // 清理 justFocused 标记
    useEffect(() => {
        if (justFocused) {
            const timer = setTimeout(() => setJustFocused(null), 600);
            return () => clearTimeout(timer);
        }
    }, [justFocused]);

    // 清理 transitioningField，如果外部提前取消也能自动结束
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

    // 根据颜色状态计算输入框状态
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

                            // console.log('Metric unit change:', {
                            //     newUnit,
                            //     hasUserInput,
                            //     hasAutoChanged,
                            //     category: cat
                            // });

                            // Auto-change imperial unit to closest ratio if:
                            // 1. User hasn't input any values yet
                            // 2. This is the first time changing any unit
                            if (!hasUserInput && !hasAutoChanged) {
                                const closestImperialUnit = findClosestRatioUnit(newUnit, unitCategories[cat].imperial);
                                // console.log('Auto-changing imperial unit from', imperialUnit, 'to', closestImperialUnit);
                                setImperialUnit(closestImperialUnit as ImperialUnit);
                                setHasAutoChanged(true);
                            } else {
                                // console.log('Not auto-changing because:', {
                                //     hasUserInput,
                                //     hasAutoChanged
                                // });
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

                            // console.log('Imperial unit change:', {
                            //     newUnit,
                            //     hasUserInput,
                            //     hasAutoChanged,
                            //     category: cat
                            // });

                            // Auto-change metric unit to closest ratio if:
                            // 1. User hasn't input any values yet
                            // 2. This is the first time changing any unit
                            if (!hasUserInput && !hasAutoChanged) {
                                const closestMetricUnit = findClosestRatioUnit(newUnit, unitCategories[cat].metric);
                                // console.log('Auto-changing metric unit from', metricUnit, 'to', closestMetricUnit);
                                setMetricUnit(closestMetricUnit as MetricUnit);
                                setHasAutoChanged(true);
                            } else {
                                // console.log('Not auto-changing because:', {
                                //     hasUserInput,
                                //     hasAutoChanged
                                // });
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
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="es">Español</option>
                        <option value="pt">Português</option>
                        <option value="zh">中文 (简体)</option>
                        <option value="zh-TW">中文 (繁體)</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                        <option value="hi">हिन्दी</option>
                        <option value="ru">Русский</option>
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
                </div>

                {/* Mobile Language Selector */}
                <div className="language-selector-mobile-container">
                    <select
                        className="language-selector language-selector-mobile"
                        value={lang}
                        onChange={(e) => handleLangChange(e.target.value as Lang, setLang)}
                    >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="es">Español</option>
                        <option value="pt">Português</option>
                        <option value="zh">中文 (简体)</option>
                        <option value="zh-TW">中文 (繁體)</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
                        <option value="hi">हिन्दी</option>
                        <option value="ru">Русский</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

export default NeumorphismApp;
