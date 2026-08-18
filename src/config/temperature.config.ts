export interface TemperatureStageConfig {
  stage: number;
  temperature: number;
  thermometerLevel: number;
  thermometerColor: string;
  sunScale: number;
  sunCenterColor: string;
  sunRayColor: string;
  sunSaturation: number;
  claudyScale: number;
  claudyGrayscale: number;
  claudyBrightness: number;
  claudyContrast: number;
}

export const TEMPERATURE_STAGES: Record<number, TemperatureStageConfig> = {
  1: {
    stage: 1,
    temperature: 28,
    thermometerLevel: 45,
    thermometerColor: '#22c55e', // Green
    sunScale: 1.0,
    sunCenterColor: '#f59e0b', // Yellow-orange
    sunRayColor: '#facc15', // Golden yellow
    sunSaturation: 100,
    claudyScale: 1.0,
    claudyGrayscale: 0,
    claudyBrightness: 100,
    claudyContrast: 100,
  },
  2: {
    stage: 2,
    temperature: 30,
    thermometerLevel: 60,
    thermometerColor: '#eab308', // Yellow
    sunScale: 1.0,
    sunCenterColor: '#f97316', // Orange
    sunRayColor: '#fbbf24', // Orange-yellow
    sunSaturation: 110,
    claudyScale: 1.08,
    claudyGrayscale: 15,
    claudyBrightness: 96,
    claudyContrast: 102,
  },
  3: {
    stage: 3,
    temperature: 32,
    thermometerLevel: 75,
    thermometerColor: '#f97316', // Orange
    sunScale: 1.0,
    sunCenterColor: '#ea580c', // Dark orange
    sunRayColor: '#f97316', // Orange
    sunSaturation: 125,
    claudyScale: 1.17,
    claudyGrayscale: 40,
    claudyBrightness: 90,
    claudyContrast: 108,
  },
  4: {
    stage: 4,
    temperature: 34,
    thermometerLevel: 92,
    thermometerColor: '#ef4444', // Red
    sunScale: 1.0,
    sunCenterColor: '#dc2626', // Red-orange
    sunRayColor: '#ea580c', // Deep orange
    sunSaturation: 140,
    claudyScale: 1.28,
    claudyGrayscale: 75,
    claudyBrightness: 80,
    claudyContrast: 115,
  },
};
