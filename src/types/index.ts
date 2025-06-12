// Re-export all types from lib files for easy access
export type { Unit, MetricUnit, ImperialUnit } from '../lib/units';
export type { Lang } from '../lib/translations';

// Import types for local usage
import type { Unit } from '../lib/units';

// Component specific types
export interface UnitInputProps {
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

// URL parameter types
export interface UrlParams {
    category?: string;
    metricUnit?: string;
    imperialUnit?: string;
    value?: string;
    valueUnit?: 'metric' | 'imperial';
    lang?: string;
}

// App state types
export type InputFieldType = 'metric' | 'imperial';
export type UpdateType = 'metric' | 'imperial';
