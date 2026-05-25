import { careerData as defaultCareerData, fgValues as defaultFGValues } from '../data/careers';

const CAREERS_CACHE_KEY = 'dgep_custom_career_data';
const FG_CACHE_KEY = 'dgep_custom_fg_values';
const INSS_FATORES_CACHE_KEY = 'dgep_custom_inss_fatores';

export interface FGValuesType {
  FG4: number;
  FG5: number;
  FG6: number;
  FG7: number;
  FG8: number;
}

export interface CareerDataType {
  [careerKey: string]: {
    [band: string]: number;
  };
}

export interface FatoresINSSData {
  referenceMonthYear: string;
  fatoresText: string;
}

export const defaultFatoresINSS: FatoresINSSData = {
  referenceMonthYear: '',
  fatoresText: ''
};

// Global cache to serve sync calls
let settingsCache = {
  fatoresINSS: defaultFatoresINSS,
  careers: defaultCareerData,
  fgs: defaultFGValues as FGValuesType
};

// Sync with backend & LocalStorage fallback for high resilience on static hosts
async function persistSettings() {
  try {
    localStorage.setItem(CAREERS_CACHE_KEY, JSON.stringify(settingsCache.careers));
    localStorage.setItem(FG_CACHE_KEY, JSON.stringify(settingsCache.fgs));
    localStorage.setItem(INSS_FATORES_CACHE_KEY, JSON.stringify(settingsCache.fatoresINSS));
  } catch (lsErr) {
    console.error('Failed to save settings to localStorage cache', lsErr);
  }

  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsCache),
    });
  } catch (err) {
    console.error('Failed to sync settings with server, using local storage cache fallback', err);
  }
}

// Called once on App init
export async function loadSettingsFromServer(): Promise<void> {
  // First load from localStorage to have immediate values and support static hosts
  try {
    const localCareers = localStorage.getItem(CAREERS_CACHE_KEY);
    if (localCareers) settingsCache.careers = JSON.parse(localCareers);
    
    const localFGs = localStorage.getItem(FG_CACHE_KEY);
    if (localFGs) settingsCache.fgs = JSON.parse(localFGs);
    
    const localFatores = localStorage.getItem(INSS_FATORES_CACHE_KEY);
    if (localFatores) settingsCache.fatoresINSS = JSON.parse(localFatores);
  } catch (e) {
    console.error('Error loading settings local cache', e);
  }

  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      
      // Merge server settings if they exist and are valid
      if (data.fatoresINSS && (data.fatoresINSS.referenceMonthYear || data.fatoresINSS.fatoresText)) {
        settingsCache.fatoresINSS = data.fatoresINSS;
      }
      if (data.careers && Object.keys(data.careers).length > 0) {
        settingsCache.careers = data.careers;
      }
      if (data.fgs && data.fgs.FG4 > 0) {
        settingsCache.fgs = data.fgs;
      }
    }
  } catch (err) {
    console.error('Error fetching settings from server, using local storage cache', err);
  }
}

// Get helper for Career Salary Data
export function getSavedCareerData(): CareerDataType {
  return settingsCache.careers;
}

// Save helper for Career Salary Data
export function saveCareerData(data: CareerDataType): void {
  settingsCache.careers = data;
  persistSettings();
}

// Get helper for FG values
export function getSavedFGValues(): FGValuesType {
  return settingsCache.fgs;
}

// Save helper for FG values
export function saveFGValues(values: FGValuesType): void {
  settingsCache.fgs = values;
  persistSettings();
}

// Get helper for Fatores INSS
export function getSavedFatoresINSS(): FatoresINSSData {
  return settingsCache.fatoresINSS;
}

// Save helper for Fatores INSS
export function saveFatoresINSS(data: FatoresINSSData): void {
  settingsCache.fatoresINSS = data;
  persistSettings();
}

// Reset all values to initial defaults from careers.ts (but keep Fatores de Conversão intact)
export function resetSettingsToDefaults(): void {
  settingsCache.careers = defaultCareerData;
  settingsCache.fgs = defaultFGValues as FGValuesType;
  persistSettings();
}
