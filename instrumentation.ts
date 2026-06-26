/** Next.js startup hook — boots the WhatsApp scheduler in the Node runtime. */
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./src/lib/scheduler");
    startScheduler();
  }
}
