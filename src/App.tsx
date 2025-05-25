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
    const [metricValue, setMetricValue] = useState<string>('');
    const [metricUnit, setMetricUnit] = useState<MetricUnit>('centimeters');
    const [imperialValue, setImperialValue] = useState<string>('');
    const [imperialUnit, setImperialUnit] = useState<ImperialUnit>('inch');
    const [lastUpdated, setLastUpdated] = useState<'metric' | 'imperial'>('imperial');
    const [focusedField, setFocusedField] = useState<'metric' | 'imperial' | null>(null);

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

    const handleTabChange = (key: string) => {
        const cat = key as CategoryKey;
        setMetricUnit(unitCategories[cat].metric[0]);
        setImperialUnit(unitCategories[cat].imperial[0]);
        setMetricValue('');
        setImperialValue('');
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
                            <Select value={lang} onChange={(v) => handleLangChange(v as Lang)} style={{width: 120}}>
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
