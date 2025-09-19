// Gestion du stockage local pour l'application

const STORAGE_KEYS = {
  BONS: 'tracability_bons',
  CHAUFFEURS: 'tracability_chauffeurs',
  VEHICULES: 'tracability_vehicules',
  ANOMALIES: 'tracability_anomalies',
  SETTINGS: 'tracability_settings'
};

export class StorageService {
  static get<T>(key: string, defaultValue: T): T {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  static set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  static remove(key: string): void {
    localStorage.removeItem(key);
  }

  static clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
}

export const KEYS = STORAGE_KEYS;