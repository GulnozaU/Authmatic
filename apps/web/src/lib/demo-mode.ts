export function isDemoFixtureMode(): boolean {
  const v = process.env.DEMO_FIXTURE_MODE?.trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}
