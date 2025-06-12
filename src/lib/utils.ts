import { Unit, MetricUnit, ImperialUnit, baseMap, fToC, cToF } from './units';
import { i18n, Lang } from './translations';

// Placeholder factor calculation
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

    for (const targetUnit of targetUnits) {
        const targetInfo = baseMap[targetUnit];
        if (sourceInfo.category !== targetInfo.category) continue;

        // For temperature, use specific logic
        if (sourceInfo.category === 'temperature') {
            return targetUnits[0]; // Just return the first one for temperature
        }

        // Calculate the ratio (how many target units equal 1 source unit)
        const ratio = sourceInfo.factor / targetInfo.factor;
        const normalizedRatio = ratio > 1 ? ratio : 1 / ratio; // Get the larger value for comparison

        if (normalizedRatio < closestRatio) {
            closestRatio = normalizedRatio;
            closestUnit = targetUnit;
        }
    }

    return closestUnit;
};

// Language utilities
export const getInitialLang = (): Lang => {
    const urlParam = new URLSearchParams(window.location.search).get('lang');
    return (urlParam && Object.keys(i18n).includes(urlParam) ? urlParam : 'en') as Lang;
};

export const handleLangChange = (newLang: Lang, setLang: (lang: Lang) => void) => {
    setLang(newLang);
    const url = new URL(window.location.href);
    url.searchParams.set('lang', newLang);
    window.history.replaceState(null, '', url.toString());
};

// Unified conversion function
export const convert = (value: string, from: Unit, to: Unit): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '';

    // Special case for temperature conversions
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
    const factor = getPlaceholderFactor(metricUnit, imperialUnit);
    return isNaN(factor)
        ? ''
        : `1 ${i18n['abbr'].unitLabels[metricUnit]} = ${factor.toFixed(2)} ${i18n['abbr'].unitLabels[imperialUnit]}`;
};

export const generateImperialPlaceholder = (imperialUnit: ImperialUnit, metricUnit: MetricUnit): string => {
    if (imperialUnit === 'fahrenheit' && metricUnit === 'celsius') {
        return '(°C × 9/5) + 32';
    }
    const factor = getPlaceholderFactor(imperialUnit, metricUnit);
    return isNaN(factor)
        ? ''
        : `1 ${i18n['abbr'].unitLabels[imperialUnit]} = ${factor.toFixed(2)} ${i18n['abbr'].unitLabels[metricUnit]}`;
};

// URL parameter utilities with i18n mapping
const getCategoryFromUrl = (urlCategory: string): string => {
    // Find category by URL abbreviation using i18n['url'].tabs (case insensitive)
    const fullCategory = Object.keys(i18n['url'].tabs).find(
        key => i18n['url'].tabs[key].toLowerCase() === urlCategory.toLowerCase()
    );
    return fullCategory || urlCategory;
};

const getCategoryForUrl = (category: string): string => {
    // Use i18n['url'].tabs for shortened category names
    return i18n['url'].tabs[category] || category;
};

const getUnitFromUrl = (urlUnit: string): Unit | '' => {
    // Find unit by URL abbreviation using i18n['url'].unitLabels (case insensitive)
    const allUnits = Object.keys(i18n['url'].unitLabels) as Unit[];
    return allUnits.find(unit => i18n['url'].unitLabels[unit].toLowerCase() === urlUnit.toLowerCase()) || urlUnit as Unit;
};

const getUnitForUrl = (unit: Unit): string => {
    // Use i18n['url'].unitLabels for shortened unit names
    return i18n['url'].unitLabels[unit] || unit;
};

export const getUrlParams = () => {
    const params = new URLSearchParams(window.location.search);
    const rawCategory = params.get('c') || 'len';
    const rawMetricUnit = params.get('m') || '';
    const rawImperialUnit = params.get('i') || '';

    const parsedCategory = getCategoryFromUrl(rawCategory);
    const parsedMetricUnit = getUnitFromUrl(rawMetricUnit);
    const parsedImperialUnit = getUnitFromUrl(rawImperialUnit);

    return {
        category: parsedCategory,
        metricUnit: parsedMetricUnit,
        imperialUnit: parsedImperialUnit,
        value: params.get('v') || '',
        valueUnit: params.get('u') || '', // 'm' for metric or 'i' for imperial
        lang: params.get('lang') || ''
    };
};

export const updateUrl = (params: {
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
