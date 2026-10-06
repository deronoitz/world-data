async function loadEnv(url: string | undefined, key: string | undefined) {
  vi.resetModules()
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", url)
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", key)
  return import("../env")
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe("supabase env", () => {
  it("is configured when both the URL and key are set", async () => {
    expect(await loadEnv("https://x.supabase.co", "pk")).toMatchObject({
      SUPABASE_URL: "https://x.supabase.co",
      SUPABASE_KEY: "pk",
      isSupabaseConfigured: true,
    })
  })

  it("is not configured when either is missing", async () => {
    expect(await loadEnv(undefined, undefined)).toMatchObject({
      SUPABASE_URL: "",
      SUPABASE_KEY: "",
      isSupabaseConfigured: false,
    })
    expect((await loadEnv("https://x.supabase.co", undefined)).isSupabaseConfigured).toBe(false)
  })
})
