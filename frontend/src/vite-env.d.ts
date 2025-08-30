/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CONTRACT_ADDRESS: string
  readonly VITE_RPC_URL: string
  readonly VITE_FAKE_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}