// UI-side copy of the backend contract (docs/superpowers/plans/2026-10-25-uxie-backend.md, Task 1),
// trimmed to what the interface reads, plus optional fields only the scripted demo fills in.

export type AvatarId = 'lola' | 'mika' | 'ava' | 'dev' | 'grace'
export type Severity = 'blocker' | 'major' | 'minor'
export type Friction = { severity: Severity; description: string; element?: string; measured?: string }
export type AvatarStatus = 'queued' | 'running' | 'done' | 'unverified' | 'gave_up' | 'failed' | 'stopped'
export type RunStatus = 'running' | 'stopping' | 'finished'
export type StepRef = { avatarId: AvatarId; n: number }

// Demo-only hints for the fake Brightside preview; a real run sends a screenshot instead.
export type SiteTarget =
  | '' | 'navLogo' | 'navProduct' | 'navPricing' | 'navSignin' | 'navSignup' | 'heroCta' | 'heroPlay'
  | 'chart' | 'pricing' | 'footer' | 'cookieAccept' | 'cookieReject' | 'cookieClose' | 'navMenu' | 'invisible'
export type Preview = { target?: SiteTarget; overlay?: '' | 'cookie'; scroll?: 0 | 1 | 2; press?: string }

export type Step = {
  avatarId: AvatarId; n: number; url: string; title: string; label: string
  screenshot: string | null; friction: Friction[]; executorError?: string; at: string
  narration?: string // demo only: first-person think-aloud
  preview?: Preview // demo only
}

export type Issue = {
  id: string; severity: Severity; avatarIds: AvatarId[]; pageUrl: string; stepRefs: StepRef[]
  screenshot: string | null; element?: string; description: string; principle?: string; fixPrompt: string
  title?: string; quotes?: Partial<Record<AvatarId, string>>; preview?: Preview // demo only
}
export type Recommendation = { title: string; why: string; avatarIds: AvatarId[]; issueIds: string[]; principle?: string }
export type AvatarNote = { avatarId: AvatarId; note: string }
export type Report = {
  runId: string; goal: string; url: string; partial: boolean; principlesSource: 'loaded' | 'pending'
  overallScore: number | null; unableToRateReason?: string; assessment: string
  avatarNotes: AvatarNote[]; recommendations: Recommendation[]; issues: Issue[]
  succeeded: number; total: number; medianSteps: number; worstBlocker?: string
  avatars: { avatarId: AvatarId; status: AvatarStatus; steps: number; seconds: number }[]
}
export type RunEvent =
  | { type: 'step'; step: Step }
  | { type: 'avatar_status'; avatarId: AvatarId; status: AvatarStatus; reason?: string }
  | { type: 'run_status'; status: RunStatus }
  | { type: 'report'; report: Report }
export type RunRequest = { url: string; goal: string; avatarIds: AvatarId[] }

export interface RunClient {
  start(req: RunRequest): Promise<{ runId: string }>
  events(runId: string, on: (e: RunEvent) => void): () => void
  stop(runId: string): Promise<void>
  setSpeed?(speed: number): void
}
