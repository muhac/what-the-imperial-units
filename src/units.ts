// Unit definitions, conversion factors, and categories

// Imperial units
type ImperialUnit =
    | 'inch'
    | 'foot'
    | 'yard'
    | 'mile'
    | 'ounce'
    | 'pound'
    | 'gallon'
    | 'fahrenheit'
    | 'square_feet'
    | 'acres'
    | 'miles_per_hour';

// Metric units
type MetricUnit =
    | 'centimeters'
    | 'meters'
    | 'kilometers'
    | 'grams'
    | 'kilograms'
    | 'liters'
    | 'celsius'
    | 'square_meters'
    | 'hectares'
    | 'kilometers_per_hour';

// Union of all units
type Unit = ImperialUnit | MetricUnit;

export const baseMap: Record<Unit, { factor: number; category: string }> = {
    // Length
    inch: {factor: 0.0254, category: 'length'},
    foot: {factor: 0.3048, category: 'length'},
    yard: {factor: 0.9144, category: 'length'},
    mile: {factor: 1609.34, category: 'length'},
    centimeters: {factor: 0.01, category: 'length'},
    meters: {factor: 1, category: 'length'},
    kilometers: {factor: 1000, category: 'length'},
    // Weight
    ounce: {factor: 0.0283495, category: 'weight'},
    pound: {factor: 0.453592, category: 'weight'},
    grams: {factor: 0.001, category: 'weight'},
    kilograms: {factor: 1, category: 'weight'},
    // Volume
    liters: {factor: 1, category: 'volume'},
    gallon: {factor: 3.78541, category: 'volume'},
    // Temperature
    celsius: {factor: 1, category: 'temperature'},
    fahrenheit: {factor: 1, category: 'temperature'},
    // Area
    square_meters: {factor: 1, category: 'area'},
    hectares: {factor: 10000, category: 'area'},
    square_feet: {factor: 0.092903, category: 'area'},
    acres: {factor: 4046.86, category: 'area'},
    // Speed
    kilometers_per_hour: {factor: 0.277778, category: 'speed'}, // m/s base
    miles_per_hour: {factor: 0.44704, category: 'speed'},
};

export const fToC = (f: number) => (f - 32) * (5 / 9);
export const cToF = (c: number) => c * (9 / 5) + 32;


// Categories grouping for UI selection
export const unitCategories = {
    length: {
        metric: ['centimeters', 'meters', 'kilometers'] as MetricUnit[],
        imperial: ['inch', 'foot', 'yard', 'mile'] as ImperialUnit[],
    },
    weight: {
        metric: ['grams', 'kilograms'] as MetricUnit[],
        imperial: ['ounce', 'pound'] as ImperialUnit[],
    },
    volume: {
        metric: ['liters'] as MetricUnit[],
        imperial: ['gallon'] as ImperialUnit[],
    },
    temperature: {
        metric: ['celsius'] as MetricUnit[],
        imperial: ['fahrenheit'] as ImperialUnit[],
    },
    area: {
        metric: ['square_meters', 'hectares'] as MetricUnit[],
        imperial: ['square_feet', 'acres'] as ImperialUnit[],
    },
    speed: {
        metric: ['kilometers_per_hour'] as MetricUnit[],
        imperial: ['miles_per_hour'] as ImperialUnit[],
    },
};

export type {ImperialUnit, MetricUnit, Unit};
