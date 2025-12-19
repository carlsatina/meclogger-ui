/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_API?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_FACEBOOK_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
