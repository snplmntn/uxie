export type AvatarId = 'lola'|'mika'|'ava'|'dev'|'grace'
export type Severity = 'blocker'|'major'|'minor'
export type Box = { x:number; y:number; width:number; height:number }
export type BrowserConfig = {
  viewport: { width:number; height:number }
  device?: string               // Playwright devices key, 'iPhone 15' for Mika
  touch?: boolean               // Mika: element actions use tap()
  zoom?: number                 // Lola: CSS zoom on documentElement, 2
  reducedMotion?: boolean
  keyboardOnly?: boolean        // Ava: key presses only
  noScreenshot?: boolean        // Ava: model gets tree + text only
}
export type Judgment = {
  name:string; type:'predicate'|'score'; instructions:string
  levels?: { label:string; description:string }[]
  frictionWhen:(value:number)=>boolean; severity:Severity; description:string
}
export type InteractionConstraints = {
  activationMode:'standard-desktop'|'touch'|'keyboard'
  allowedKeys?:string[]; pointer?:boolean; hover?:boolean; rightClick?:boolean
  coordinateFallback?:boolean; injectMissedTaps?:boolean
  targetMustAppearInProvidedInputs?:boolean; modelReceivesScreenshot?:boolean
  cookieChoice?:'reject-optional-or-necessary-only'; neverAcceptOptionalCookies?:boolean
  neverEnterPersonalData?:boolean
  focusIndicatorInspection?:string
}
export type Avatar = { id:AvatarId; name:string; age:number; tagline:string; whatChanges:string; bio:string; persona:string; browser:BrowserConfig; interactionConstraints:InteractionConstraints; giveUpAfter:number; judgments:Judgment[] }
export type Action =
  | { kind:'click'; ref:string; label:string }
  | { kind:'scroll'; direction:'up'|'down' }
  | { kind:'press'; key:string }
  | { kind:'done' } | { kind:'give_up' }
export type Candidate = { value:string; description:string; action:Action }
export type Friction = { severity:Severity; description:string; element?:string; box?:Box; measured?:string }
export type Step = {
  avatarId:AvatarId; n:number; url:string; title:string; action:Action; label:string; focused?:string
  screenshot:string|null; treeExcerpt?:string; box?:Box
  friction:Friction[]; executorError?:string; interruption?:string
  confidence:number; judgments:Record<string,number>; goalReached:number; at:string
}
export type AvatarStatus = 'queued'|'running'|'done'|'unverified'|'gave_up'|'failed'|'stopped'
export type AvatarRun = { avatarId:AvatarId; status:AvatarStatus; steps:Step[]; reason?:string; startedAt:string; endedAt?:string }
export type RunStatus = 'running'|'stopping'|'finished'
export type StepRef = { avatarId:AvatarId; n:number }
export type Issue = { id:string; severity:Severity; avatarIds:AvatarId[]; pageUrl:string; stepRefs:StepRef[]; screenshot:string|null; treeExcerpt?:string; element?:string; box?:Box; description:string; principle?:string; fixPrompt:string }
export type Recommendation = { title:string; why:string; avatarIds:AvatarId[]; issueIds:string[]; principle?:string }
export type AvatarNote = { avatarId:AvatarId; note:string }
export type Report = {
  runId:string; goal:string; url:string; partial:boolean; principlesSource:'loaded'|'pending'
  overallScore:number|null; unableToRateReason?:string; assessment:string
  avatarNotes:AvatarNote[]; recommendations:Recommendation[]; issues:Issue[]
  succeeded:number; total:number; medianSteps:number; worstBlocker?:string
  avatars:{ avatarId:AvatarId; status:AvatarStatus; steps:number; seconds:number }[]
}
export type Run = { id:string; url:string; goal:string; status:RunStatus; startedAt:string; avatars:Record<string,AvatarRun>; report?:Report }
export type RunEvent =
  | { type:'step'; step:Step }
  | { type:'avatar_status'; avatarId:AvatarId; status:AvatarStatus; reason?:string }
  | { type:'run_status'; status:RunStatus }
  | { type:'report'; report:Report }
