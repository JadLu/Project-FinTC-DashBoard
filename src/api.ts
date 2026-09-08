// src/api.ts

// The Fusion staging API sends no CORS headers for localhost. In dev we rewrite
// its origin to the `/fusion` path so the request goes through the Vite proxy
// (see vite.config.ts); in a production build the absolute URL is used as-is.
const FUSION_ORIGIN = 'https://stg-orch-api.abafusion.ai';
const proxied = (raw: string): string =>
  import.meta.env.DEV && raw?.startsWith(FUSION_ORIGIN)
    ? `/fusion${raw.slice(FUSION_ORIGIN.length)}`
    : raw;

const FUSION_URL = proxied(import.meta.env.VITE_FUSION_VALIDATE_URL);
const FUSION_STAGIAIRE_URL = proxied(import.meta.env.VITE_FUSION_STAGIAIRE_URL);

// --- Step validation (Fusion Phase 2 v3) --------------------------------------

export interface ValidatePayload {
  case_id: string;
  step_id: number;
  action: 'validate' | 'block';
  actor: string;
  note?: string;
  decision?: string;                 // e.g. 'CONTINUE', 'EXTEND', 'DONE'
  details?: Record<string, unknown>; // role-specific structured data
  encadrant_ref?: string;            // Matricule de l'encadrant (Fixer objectifs step only)
}

export interface ValidateResponse {
  ok: boolean;
  error?: string;
  step_id?: number;
  new_status?: string;
  decision?: string | null;          // echoed back by Fusion
  case_status?: string;
  actor?: string;
  encadrant_assigned?: string | null; // set by Fusion when encadrant_ref was applied
}

export async function validateStep(payload: ValidatePayload): Promise<ValidateResponse> {
  try {
    const response = await fetch(FUSION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let data: (ValidateResponse & { message?: string }) = { ok: false };
    try {
      data = await response.json();
    } catch {
      // non-JSON body (e.g. async ack with empty body) — status decides the outcome
    }

    if (response.status === 403) {
      return { ok: false, error: 'You do not own this step' };
    }
    if (response.status === 404) {
      return { ok: false, error: 'Step not found' };
    }
    if (response.status === 422) {
      return { ok: false, error: data.error || 'Invalid decision for this role' };
    }
    if (!response.ok) {
      return { ok: false, error: data.error || `Request failed (HTTP ${response.status})` };
    }
    if (data.error) {
      return { ok: false, error: data.error };
    }

    // Fusion may answer synchronously ({ ok, new_status, decision, ... }) or just
    // acknowledge receipt ({ message: "Request received" }) and process async.
    return { ...data, ok: true, decision: data.decision ?? payload.decision };
  } catch (error) {
    return { ok: false, error: `Network error: ${error}` };
  }
}

// --- Case intake (Fusion Phase 1 webhook) ------------------------------------

export interface CreateCasePayload {
  person_ref: string;         // Matricule
  full_name: string;          // Nom complet
  email: string;
  journey_type: 'probation' | 'renewal' | 'offboarding';
  start_date: string;         // YYYY-MM-DD
  contract_end_date?: string; // YYYY-MM-DD (optional)
}

export interface CreateCaseResponse {
  ok?: boolean;
  case_id?: string;
  error?: string;
  /** true when Fusion only acknowledged receipt and will process the case asynchronously */
  pending?: boolean;
}

export async function createCase(payload: CreateCasePayload): Promise<CreateCaseResponse> {
  try {
    const response = await fetch(FUSION_STAGIAIRE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    let data: (CreateCaseResponse & { message?: string }) = {};
    try {
      data = await response.json();
    } catch {
      // non-JSON body (e.g. empty 200/error page) — fall through to status handling
    }

    if (response.status === 409) {
      return { ok: false, error: data.error || 'A case already exists for this person and journey' };
    }
    if (!response.ok) {
      return { ok: false, error: data.error || `Request failed (HTTP ${response.status})` };
    }
    if (data.error) {
      return { ok: false, error: data.error };
    }

    // The webhook returns `{ case_id }` when it processes synchronously, or just
    // `{ message: "Request received" }` when the Fusion workflow runs async.
    return { ok: true, case_id: data.case_id, pending: !data.case_id };
  } catch (error) {
    return { ok: false, error: `Network error: ${error}` };
  }
}
