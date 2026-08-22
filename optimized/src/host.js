  return {
    apply(ctx) {
      const harness = ctx.get('harness')
      if (harness !== undefined) {
        harness.handle('theme-customizer.ping', async () => ({ ok: true, at: Date.now() }))
      }
    },
  }