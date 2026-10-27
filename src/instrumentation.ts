// Keeps the job feed fresh while the app is running: once at startup, then every few hours.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.CAREER_OPS_NO_AUTO_REFRESH) return;
  const { refreshJobs } = await import("./lib/ingest");
  const run = () => refreshJobs().catch((e) => console.error("Job refresh failed:", e));
  setTimeout(run, 5_000);
  setInterval(run, 3 * 60 * 60 * 1000);
}
