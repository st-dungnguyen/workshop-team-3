/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEMO_MODE: string;
  readonly VITE_GAME_VARIANT: string;
  readonly VITE_CAMPAIGN_ID: string;
  readonly VITE_SKYLARK_BASE_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_X_SKYLARK_TOKEN: string;
  readonly VITE_ENV: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
