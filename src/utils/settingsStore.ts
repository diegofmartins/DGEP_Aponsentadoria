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

// Sync with backend
async function persistSettings() {
  try {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settingsCache),
    });
  } catch (err) {
    console.error('Failed to sync settings', err);
  }
}

// Called once on App init
export async function loadSettingsFromServer(): Promise<void> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      let migrated = false;
      
      if (data.fatoresINSS) settingsCache.fatoresINSS = data.fatoresINSS;
      else {
        // migrate local
        const local = localStorage.getItem(INSS_FATORES_CACHE_KEY);
        if (local) {
          settingsCache.fatoresINSS = JSON.parse(local);
          migrated = true;
          localStorage.removeItem(INSS_FATORES_CACHE_KEY);
        }
      }

      if (data.careers) settingsCache.careers = data.careers;
      else {
        const local = localStorage.getItem(CAREERS_CACHE_KEY);
        if (local) {
          settingsCache.careers = JSON.parse(local);
          migrated = true;
          localStorage.removeItem(CAREERS_CACHE_KEY);
        }
      }

      if (data.fgs) settingsCache.fgs = data.fgs;
      else {
        const local = localStorage.getItem(FG_CACHE_KEY);
        if (local) {
          settingsCache.fgs = JSON.parse(local);
          migrated = true;
          localStorage.removeItem(FG_CACHE_KEY);
        }
      }

      if (migrated) {
         await persistSettings();
      }
    }
  } catch (err) {
    console.error('Error fetching settings', err);
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
