export interface UnifiedSimulation {
  id: string; // Unique identifier (e.g. UUID or timestamp)
  nome: string;
  matricula: string;
  sexo: 'M' | 'F' | '';
  dataNascimento: string; // YYYY-MM-DD
  
  // Carreira
  ingressoCmc: string; // YYYY-MM-DD
  ingressoCargoAtual: string; // YYYY-MM-DD
  cargo: string;
  selectedCareer: string; 
  careerLevel: 'M' | 'S'; // Nível Médio ou Superior (para proventos)
  selectedLevel: string; // Faixa atual (e.g. 'I', 'II', 'VI')
  
  // Adicionais e FGs
  lastAtsConcession: string; // YYYY-MM-DD
  lastAtsNumber: number;
  fgRows: { start: string; end: string; nivel: string }[];
  stimulusRows: { tipo: string; start: string; end: string }[];
  
  // Contribuições e Proventos
  historicalData: string; // Text string for past salaries
  needsUpdate: boolean; // Flag if values need to be updated with INSS factors
  incorporacoes: { tipo: string; years: number; months: number; days: number; valor: string; needsUpdate?: boolean }[];
  
  // Tempos
  diasAverbadosINSS: number;
  diasAverbadosSP: number;
  diasAfastamento: number;
  extensionMonths: number; // Trabalhar mais X meses
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'dgep_unified_simulations';
const DRAFT_KEY = 'dgep_unified_draft';

import { 
  getFirestoreSimulations, 
  writeFirestoreSimulation, 
  deleteFirestoreSimulation 
} from './firebase';

// Run migration on init
export async function initMigration(): Promise<void> {
  const localSaved = localStorage.getItem(STORAGE_KEY);
  if (localSaved) {
    try {
      const localSims: UnifiedSimulation[] = JSON.parse(localSaved);
      if (localSims.length > 0) {
        console.log(`Migrating ${localSims.length} simulations from localStorage to Firestore...`);
        const promises = localSims.map(sim => writeFirestoreSimulation(sim));
        await Promise.all(promises);
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (err) {
      console.error('Error migrating local simulations', err);
    }
  }
}

// Get all saved simulations
export async function getSavedSimulations(): Promise<UnifiedSimulation[]> {
  try {
    return await getFirestoreSimulations();
  } catch (e) {
    console.error('Error fetching unified simulations from firestore', e);
    return [];
  }
}

// Save a simulation
export async function saveSimulation(sim: UnifiedSimulation): Promise<void> {
  try {
    sim.updatedAt = new Date().toISOString();
    await writeFirestoreSimulation(sim);
  } catch (e) {
    console.error('Error saving simulation to firestore', e);
    throw e;
  }
}

// Delete a simulation
export async function deleteSimulation(id: string): Promise<void> {
  try {
    await deleteFirestoreSimulation(id);
  } catch (e) {
    console.error('Error deleting simulation from firestore', e);
    throw e;
  }
}

// Get the current draft
export function getDraftSimulation(): UnifiedSimulation | null {
  const draft = localStorage.getItem(DRAFT_KEY);
  if (draft) {
    try {
      return JSON.parse(draft);
    } catch (e) {
      console.error('Error parsing draft simulation', e);
    }
  }
  return null;
}

// Save draft
export function saveDraftSimulation(draft: UnifiedSimulation): void {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
}

// Clear draft
export function clearDraftSimulation(): void {
  localStorage.removeItem(DRAFT_KEY);
}

export function createNewSimulation(): UnifiedSimulation {
  return {
    id: Date.now().toString(),
    nome: '',
    matricula: '',
    sexo: '',
    dataNascimento: '',
    ingressoCmc: '',
    ingressoCargoAtual: '',
    cargo: '',
    selectedCareer: 'assistente_administrativo',
    careerLevel: 'M',
    selectedLevel: 'I',
    lastAtsConcession: '',
    lastAtsNumber: 0,
    fgRows: [],
    stimulusRows: [],
    historicalData: '',
    needsUpdate: true,
    incorporacoes: [],
    diasAverbadosINSS: 0,
    diasAverbadosSP: 0,
    diasAfastamento: 0,
    extensionMonths: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
