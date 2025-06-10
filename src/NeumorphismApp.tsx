import React, { useState, useEffect } from 'react';
import './neumorphism.css';

import {
    Unit,
    MetricUnit,
    ImperialUnit,
    baseMap,
    unitCategories,
    fToC,
    cToF,
} from './units';
import {
    i18n,
    Lang,
} from './translations';

// Placeholder factor
const getPlaceholderFactor = (from: Unit, to: Unit): number => {
    const infoFrom = baseMap[from];
    const infoTo = baseMap[to];
    if (infoFrom.category !== infoTo.category || infoFrom.category === 'temperature') return NaN;
    return infoFrom.factor / infoTo.factor;
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
}

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
}) => (
    <div className="form-group">
        <label className="form-label">{label}</label>
        <input
            type="number"
            className="neumorphic-input"
            value={value || ''}
            placeholder={placeholder}
            onChange={(e) => onValueChange(e.target.value)}
            onFocus={onFocus}
            onBlur={onBlur}
        />
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
    </div>
);

type CategoryKey = keyof typeof unitCategories;

const NeumorphismApp: React.FC = () => {
    const [metricValue, setMetricValue] = useState<string>('');
    const [metricUnit, setMetricUnit] = useState<MetricUnit>('centimeters');
    const [imperialValue, setImperialValue] = useState<string>('');
    const [imperialUnit, setImperialUnit] = useState<ImperialUnit>('inch');
    const [lastUpdated, setLastUpdated] = useState<'metric' | 'imperial'>('imperial');
    const [focusedField, setFocusedField] = useState<'metric' | 'imperial' | null>(null);
    const [activeTab, setActiveTab] = useState<CategoryKey>('length');

    const getInitialLang = (): Lang => {
        const p = new URLSearchParams(window.location.search).get('lang');
        return (p && Object.keys(i18n).includes(p) ? p : 'en') as Lang;
    };

    const [lang, setLang] = useState<Lang>(getInitialLang);
    const t = i18n[lang];

    const handleLangChange = (newLang: Lang) => {
        setLang(newLang);
        const url = new URL(window.location.href);
        url.searchParams.set('lang', newLang);
        window.history.replaceState(null, '', url.toString());
    };

    // Placeholders
    const metricPlaceholder =
        metricUnit === 'celsius' && imperialUnit === 'fahrenheit'
            ? '°C → °F: (°C × 9/5) + 32'
            : (() => {
                const f = getPlaceholderFactor(metricUnit, imperialUnit);
                return isNaN(f)
                    ? ''
                    : `1 ${i18n.abbr.unitLabels[metricUnit]} = ${f.toFixed(2)} ${i18n.abbr.unitLabels[imperialUnit]}`;
            })();

    const imperialPlaceholder =
        imperialUnit === 'fahrenheit' && metricUnit === 'celsius'
            ? '°F → °C: (°F - 32) × 5/9'
            : (() => {
                const f = getPlaceholderFactor(imperialUnit, metricUnit);
                return isNaN(f)
                    ? ''
                    : `1 ${i18n.abbr.unitLabels[imperialUnit]} = ${f.toFixed(2)} ${i18n.abbr.unitLabels[metricUnit]}`;
            })();

    // Unified conversion
    const convert = (value: string, from: Unit, to: Unit): string => {
        const num = parseFloat(value);
        if (isNaN(num)) return '';
        if (from === 'fahrenheit' && to === 'celsius') return fToC(num).toFixed(2);
        if (from === 'celsius' && to === 'fahrenheit') return cToF(num).toFixed(2);
        const infoFrom = baseMap[from];
        const infoTo = baseMap[to];
        if (infoFrom.category !== infoTo.category) return '';
        const result = (num * infoFrom.factor) / infoTo.factor;
        return result.toFixed(2);
    };

    useEffect(() => {
        if (lastUpdated === 'imperial' && focusedField === 'imperial') {
            setMetricValue(convert(imperialValue, imperialUnit, metricUnit));
        }
    }, [imperialValue, imperialUnit, metricUnit, lastUpdated, focusedField]);

    useEffect(() => {
        if (lastUpdated === 'metric' && focusedField === 'metric') {
            setImperialValue(convert(metricValue, metricUnit, imperialUnit));
        }
    }, [metricValue, metricUnit, imperialUnit, lastUpdated, focusedField]);

    const handleTabChange = (key: CategoryKey) => {
        setActiveTab(key);
        setMetricUnit(unitCategories[key].metric[0]);
        setImperialUnit(unitCategories[key].imperial[0]);
        setMetricValue('');
        setImperialValue('');
    };

    const renderCategory = (cat: CategoryKey) => (
        <div className="conversion-wrapper">
            <div className="conversion-container">
                <UnitInput
                    label={t.metricLabel}
                    value={metricValue}
                    unit={metricUnit}
                    placeholder={metricPlaceholder}
                    options={unitCategories[cat].metric}
                    onValueChange={(val) => {
                        setMetricValue(val);
                        setLastUpdated('metric');
                    }}
                    onUnitChange={(u) => {
                        setMetricUnit(u as MetricUnit);
                        setLastUpdated('metric');
                        if (metricValue) setImperialValue(convert(metricValue, u as Unit, imperialUnit));
                    }}
                    onFocus={() => setFocusedField('metric')}
                    onBlur={() => setFocusedField(null)}
                    unitLabels={t.unitLabels}
                />

                <div className="conversion-arrow"></div>

                <UnitInput
                    label={t.imperialLabel}
                    value={imperialValue}
                    unit={imperialUnit}
                    placeholder={imperialPlaceholder}
                    options={unitCategories[cat].imperial}
                    onValueChange={(val) => {
                        setImperialValue(val);
                        setLastUpdated('imperial');
                    }}
                    onUnitChange={(u) => {
                        setImperialUnit(u as ImperialUnit);
                        setLastUpdated('imperial');
                        if (imperialValue) setMetricValue(convert(imperialValue, u as Unit, metricUnit));
                    }}
                    onFocus={() => setFocusedField('imperial')}
                    onBlur={() => setFocusedField(null)}
                    unitLabels={t.unitLabels}
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
                        className="language-selector"
                        value={lang}
                        onChange={(e) => handleLangChange(e.target.value as Lang)}
                    >
                        <option value="en">English</option>
                        <option value="fr">Français</option>
                        <option value="es">Español</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                        <option value="ko">한국어</option>
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
                    <h3>💡 {lang === 'zh' ? '转换提示' : lang === 'ja' ? '変換のヒント' : lang === 'ko' ? '변환 팁' : lang === 'fr' ? 'Conseils de conversion' : lang === 'es' ? 'Consejos de conversión' : 'Conversion Tips'}</h3>
                    <p>
                        {lang === 'zh'
                            ? '这个应用帮助您在公制和英制单位之间进行精确转换。选择不同的类别标签来转换长度、重量、体积、温度、面积或速度单位。实时双向转换让您可以在任一侧输入数值，另一侧会自动显示转换结果。'
                            : lang === 'ja'
                            ? 'このアプリは、メートル法とヤード・ポンド法の単位を正確に変換するのに役立ちます。異なるカテゴリタブを選択して、長さ、重量、体積、温度、面積、速度の単位を変換できます。リアルタイム双方向変換により、どちらの側に数値を入力しても、もう一方の側に変換結果が自動的に表示されます。'
                            : lang === 'ko'
                            ? '이 앱은 미터법과 야드파운드법 단위 간의 정확한 변환을 도와줍니다. 다양한 카테고리 탭을 선택하여 길이, 무게, 부피, 온도, 면적, 속도 단위를 변환할 수 있습니다. 실시간 양방향 변환으로 어느 쪽에 숫자를 입력하든 다른 쪽에 변환 결과가 자동으로 표시됩니다.'
                            : lang === 'fr'
                            ? 'Cette application vous aide à convertir avec précision entre les unités métriques et impériales. Sélectionnez différents onglets de catégorie pour convertir les unités de longueur, poids, volume, température, superficie et vitesse. La conversion bidirectionnelle en temps réel vous permet de saisir des valeurs de chaque côté et affiche automatiquement les résultats de conversion de l\'autre côté.'
                            : lang === 'es'
                            ? 'Esta aplicación te ayuda a convertir con precisión entre unidades métricas e imperiales. Selecciona diferentes pestañas de categoría para convertir unidades de longitud, peso, volumen, temperatura, área y velocidad. La conversión bidireccional en tiempo real te permite ingresar valores en cualquier lado y mostrar automáticamente los resultados de conversión en el otro lado.'
                            : 'This app helps you accurately convert between metric and imperial units. Select different category tabs to convert length, weight, volume, temperature, area, and speed units. Real-time bidirectional conversion allows you to input values on either side and automatically displays conversion results on the other side.'
                        }
                    </p>
                </div>
            </div>
        </div>
    );
};

export default NeumorphismApp;
