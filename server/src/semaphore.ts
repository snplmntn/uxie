export function semaphore(n:number): <T>(fn:()=>Promise<T>)=>Promise<T> {
  let active = 0
  const waiting: (()=>void)[] = []
  return async fn => {
    if (active >= n) await new Promise<void>(r => waiting.push(r))
    else active++
    try { return await fn() }
    finally { const next = waiting.shift(); if (next) next(); else active-- }
  }
}
