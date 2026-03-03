export interface ClientSettings {
  renderDistance: number;
  quality: 'low' | 'medium' | 'high';
  showShadows: boolean;
  mode: 'survival' | 'creative';
}

const DEFAULT_SETTINGS: ClientSettings = {
  renderDistance: 2,
  quality: 'medium',
  showShadows: true,
  mode: 'survival'
};

const SETTINGS_KEY = 'bloxcraft-client-settings-v1';

export function loadSettings(): ClientSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ClientSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: ClientSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
