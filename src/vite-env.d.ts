/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOONG_API_KEY: string
  readonly VITE_GHN_TOKEN: string
  readonly VITE_GHN_SHOP_ID: string
  readonly VITE_GHTK_TOKEN: string
  readonly VITE_AHAMOVE_TOKEN: string
  readonly VITE_LALAMOVE_API_KEY: string
  readonly VITE_LALAMOVE_API_SECRET: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
