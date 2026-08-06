/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENV: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_SKYLARK_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
