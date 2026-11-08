/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_VAPID_PUBLIC_KEY: string;
  readonly VITE_SINGLE_FILE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
