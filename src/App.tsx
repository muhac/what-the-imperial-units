import React, {useState, useEffect} from 'react';
import {Input, Select, Form, Card, Typography, Row, Col, Tabs} from 'antd';
import './App.css';

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

const {Option} = Select;
const {Title} = Typography;
const {TabPane} = Tabs;

// Placeholder factor
export const getPlaceholderFactor = (from: Unit, to: Unit): number => {
    const infoFrom = baseMap[from];
    const infoTo = baseMap[to];
    if (infoFrom.category !== infoTo.category || infoFrom.category === 'temperature') return NaN;
    return infoFrom.factor / infoTo.factor;
};

// Find the unit with the closest ratio in the target unit list
export const findClosestRatioUnit = (sourceUnit: Unit, targetUnits: Unit[]): Unit => {
    const sourceInfo = baseMap[sourceUnit];
    let closestUnit = targetUnits[0];
    let closestRatio = Infinity;

    // console.log('Finding closest ratio unit for:', sourceUnit, 'in', targetUnits);
    // console.log('Source info:', sourceInfo);

    for (const targetUnit of targetUnits) {
        const targetInfo = baseMap[targetUnit];
        if (sourceInfo.category !== targetInfo.category) continue;

        // For temperature, use specific logic
        if (sourceInfo.category === 'temperature') {
            // console.log('Temperature category, returning first unit:', targetUnits[0]);
            return targetUnits[0]; // Just return the first one for temperature
        }

        // Calculate the ratio (how many target units equal 1 source unit)
        const ratio = sourceInfo.factor / targetInfo.factor;
        const normalizedRatio = ratio > 1 ? ratio : 1 / ratio; // Get the larger value for comparison

        // console.log(`Checking ${targetUnit}: ratio=${ratio}, normalized=${normalizedRatio}, current closest=${closestRatio}`);

        if (normalizedRatio < closestRatio) {
            closestRatio = normalizedRatio;
            closestUnit = targetUnit;
            // console.log(`New closest unit: ${targetUnit} with ratio ${normalizedRatio}`);
        }
    }

    // console.log('Final closest unit:', closestUnit);
    return closestUnit;
};

// Utility functions
export const getInitialLang = (): Lang => {
    const p = new URLSearchParams(window.location.search).get('lang');
    return (p && Object.keys(i18n).includes(p) ? p : 'en') as Lang;
};

export const handleLangChange = (newLang: Lang, setLang: (lang: Lang) => void) => {
    setLang(newLang);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLang);
    window.history.replaceState(null, '', url.toString());
};

// Unified conversion
export const convert = (value: string, from: Unit, to: Unit): string => {
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

// Placeholder generators
export const generateMetricPlaceholder = (metricUnit: MetricUnit, imperialUnit: ImperialUnit): string => {
    if (metricUnit === 'celsius' && imperialUnit === 'fahrenheit') {
        return '(°F - 32) × 5/9';
    }
    const f = getPlaceholderFactor(metricUnit, imperialUnit);
    return isNaN(f)
        ? ''
        : `1 ${i18n['abbr'].unitLabels[metricUnit]} = ${f.toFixed(2)} ${i18n['abbr'].unitLabels[imperialUnit]}`;
};

export const generateImperialPlaceholder = (imperialUnit: ImperialUnit, metricUnit: MetricUnit): string => {
    if (imperialUnit === 'fahrenheit' && metricUnit === 'celsius') {
        return '(°C × 9/5) + 32';
    }
    const f = getPlaceholderFactor(imperialUnit, metricUnit);
    return isNaN(f)
        ? ''
        : `1 ${i18n['abbr'].unitLabels[imperialUnit]} = ${f.toFixed(2)} ${i18n['abbr'].unitLabels[metricUnit]}`;
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
    <Form layout="vertical">
        <Form.Item label={label}>
            <Input
                type="number"
                value={value || undefined}
                placeholder={placeholder}
                onChange={(e) => onValueChange(e.target.value)}
                onFocus={onFocus}
                onBlur={onBlur}
            />
        </Form.Item>
        <Form.Item>
            <Select value={unit} onChange={(val) => onUnitChange(val as Unit)} style={{width: '100%'}}>
                {options.map((opt) => (
                    <Option key={opt} value={opt}>
                        {unitLabels[opt]}
                    </Option>
                ))}
            </Select>
        </Form.Item>
    </Form>
);

type CategoryKey = keyof typeof unitCategories;

const App: React.FC = () => {
    // console.log('App component loaded');

    const [metricValue, setMetricValue] = useState<string>('');
    const [metricUnit, setMetricUnit] = useState<MetricUnit>('centimeters');
    const [imperialValue, setImperialValue] = useState<string>('');
    const [imperialUnit, setImperialUnit] = useState<ImperialUnit>('inch');
    const [lastUpdated, setLastUpdated] = useState<'metric' | 'imperial'>('imperial');
    const [focusedField, setFocusedField] = useState<'metric' | 'imperial' | null>(null);

    // Track if user has input any values (to disable auto-changes after input)
    const [hasUserInput, setHasUserInput] = useState<boolean>(false);
    // Track which units have been auto-changed for the first time
    const [autoChangedUnits, setAutoChangedUnits] = useState<Set<string>>(new Set());

    const [lang, setLang] = useState<Lang>(getInitialLang);
    const t = i18n[lang];

    // console.log('Current state:', {
    //     metricUnit,
    //     imperialUnit,
    //     hasUserInput,
    //     autoChangedUnits: Array.from(autoChangedUnits)
    // });

    // Placeholders
    const metricPlaceholder = generateMetricPlaceholder(metricUnit, imperialUnit);
    const imperialPlaceholder = generateImperialPlaceholder(imperialUnit, metricUnit);

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

    const handleTabChange = (key: string) => {
        const cat = key as CategoryKey;
        setMetricUnit(unitCategories[cat].metric[0]);
        setImperialUnit(unitCategories[cat].imperial[0]);
        setMetricValue('');
        setImperialValue('');
        // Reset auto-change tracking when switching tabs
        setHasUserInput(false);
        setAutoChangedUnits(new Set());
    };

    const renderCategory = (cat: CategoryKey) => (
        <Row gutter={16}>
            <Col span={12}>
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
                        const unitKey = `metric-${newUnit}`;

                        // console.log('Metric unit change:', {
                        //     newUnit,
                        //     unitKey,
                        //     hasUserInput,
                        //     autoChangedUnits: Array.from(autoChangedUnits),
                        //     category: cat
                        // });

                        // Auto-change imperial unit to closest ratio if:
                        // 1. User hasn't input any values yet
                        // 2. This is the first time changing to this unit
                        if (!hasUserInput && !autoChangedUnits.has(unitKey)) {
                            const closestImperialUnit = findClosestRatioUnit(newUnit, unitCategories[cat].imperial);
                            // console.log('Auto-changing imperial unit from', imperialUnit, 'to', closestImperialUnit);
                            setImperialUnit(closestImperialUnit as ImperialUnit);
                            setAutoChangedUnits(prev => new Set(prev).add(unitKey));
                        } else {
                            // console.log('Not auto-changing because:', {
                            //     hasUserInput,
                            //     alreadyChanged: autoChangedUnits.has(unitKey)
                            // });
                        }

                        setMetricUnit(newUnit);
                        setLastUpdated('metric');
                        if (metricValue) {
                            // Use the potentially auto-changed imperial unit for conversion
                            const targetImperialUnit = !hasUserInput && !autoChangedUnits.has(unitKey)
                                ? findClosestRatioUnit(newUnit, unitCategories[cat].imperial)
                                : imperialUnit;
                            setImperialValue(convert(metricValue, newUnit as Unit, targetImperialUnit));
                        }
                    }}
                    onFocus={() => setFocusedField('metric')}
                    onBlur={() => setFocusedField(null)}
                    unitLabels={t.unitLabels}
                />
            </Col>
            <Col span={12}>
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
                        const unitKey = `imperial-${newUnit}`;

                        // console.log('Imperial unit change:', {
                        //     newUnit,
                        //     unitKey,
                        //     hasUserInput,
                        //     autoChangedUnits: Array.from(autoChangedUnits),
                        //     category: cat
                        // });

                        // Auto-change metric unit to closest ratio if:
                        // 1. User hasn't input any values yet
                        // 2. This is the first time changing to this unit
                        if (!hasUserInput && !autoChangedUnits.has(unitKey)) {
                            const closestMetricUnit = findClosestRatioUnit(newUnit, unitCategories[cat].metric);
                            // console.log('Auto-changing metric unit from', metricUnit, 'to', closestMetricUnit);
                            setMetricUnit(closestMetricUnit as MetricUnit);
                            setAutoChangedUnits(prev => new Set(prev).add(unitKey));
                        } else {
                            // console.log('Not auto-changing because:', {
                            //     hasUserInput,
                            //     alreadyChanged: autoChangedUnits.has(unitKey)
                            // });
                        }

                        setImperialUnit(newUnit);
                        setLastUpdated('imperial');
                        if (imperialValue) {
                            // Use the potentially auto-changed metric unit for conversion
                            const targetMetricUnit = !hasUserInput && !autoChangedUnits.has(unitKey)
                                ? findClosestRatioUnit(newUnit, unitCategories[cat].metric)
                                : metricUnit;
                            setMetricValue(convert(imperialValue, newUnit as Unit, targetMetricUnit));
                        }
                    }}
                    onFocus={() => setFocusedField('imperial')}
                    onBlur={() => setFocusedField(null)}
                    unitLabels={t.unitLabels}
                />
            </Col>
        </Row>
    );

    return (
        <div className="App">
            <Card
                title={
                    <Row justify="space-between" align="middle">
                        <Col><Title level={2}>{t.cardTitle}</Title></Col>
                        <Col>
                            <Select value={lang} onChange={(v) => handleLangChange(v as Lang, setLang)} style={{width: 120}}>
                                <Option value="en">English</Option>
                                <Option value="fr">Français</Option>
                                <Option value="es">Español</Option>
                                <Option value="zh">中文</Option>
                                <Option value="ja">日本語</Option>
                                <Option value="ko">한국어</Option>
                            </Select>
                        </Col>
                    </Row>
                }
                style={{maxWidth: 800, margin: '40px auto'}}
            >
                <Tabs defaultActiveKey="length" onChange={handleTabChange}>
                    {Object.entries(unitCategories).map(([key]) => (
                        <TabPane key={key} tab={t.tabs[key as CategoryKey]}>
                            {renderCategory(key as CategoryKey)}
                        </TabPane>
                    ))}
                </Tabs>
            </Card>
        </div>
    );
};

export default App;
