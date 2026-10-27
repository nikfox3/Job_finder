// Next.js also compiles this file for the edge runtime, which can't load SQLite.
// The NEXT_RUNTIME check must wrap the import so the Node-only code is left out there.
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./instrumentation-node");
  }
}
