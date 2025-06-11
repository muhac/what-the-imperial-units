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
                    className="neumorphic-select neumorphic-select-disabled"
                    value={unit}
                    onChange={(e) => onUnitChange(e.target.value as Unit)}
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {unitLabels[opt]}
                        </option>
                    ))}
                </select>
            ) : (
                <select
                    className="neumorphic-select"
                    value={unit}
                    onChange={(e) => onUnitChange(e.target.value as Unit)}
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
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

    const [lang, setLang] = useState<Lang>(getInitialLang);
    const t = i18n[lang];

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
     * - 若有正在等待的“蓝框变白”计时器则取消，以免 race condition
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
     * 当两个输入框都为空且失焦时，800 ms 后让蓝框淡出
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
            <div className="conversion-container">
                {/* Metric */}
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
                />

                <div className="conversion-arrow"></div>

                {/* Imperial */}
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
                />
            </div>
        </div>
    );

    return (
        <div className="app-container">
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
                        <option value="zh-tw">中文 (繁體)</option>
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
                        <option value="zh-tw">中文 (繁體)</option>
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
