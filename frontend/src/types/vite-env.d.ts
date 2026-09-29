/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_WS_BASE_URL: string;
  readonly VITE_DATA_MODE: 'simulation' | 'live';
  readonly VITE_API_DEBUG: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
