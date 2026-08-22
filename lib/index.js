// dsh-theme-customizer host entry (ESM).
// Minimal host half: only a ping RPC used for health checks.
export function apply(ctx) {
  const harness = ctx.get('harness')
  if (harness !== undefined) {
    harness.handle('theme-customizer.ping', async () => ({ ok: true, at: Date.now() }))
  }
}
