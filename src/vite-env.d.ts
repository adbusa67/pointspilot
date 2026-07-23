/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API key for the AwardPilot chatbot's language model. */
  readonly VITE_LLM_API_KEY?: string;
  /** OpenAI-compatible base URL, e.g. https://api.openai.com/v1 */
  readonly VITE_LLM_BASE_URL?: string;
  /** Model id, e.g. gpt-4o */
  readonly VITE_LLM_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
