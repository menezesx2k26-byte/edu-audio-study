import { loadLibrary } from "../src/library.mjs";
import { validateRelease } from "../src/release-gate.mjs";
try {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 2 || args[0] !== "--topics"))
    throw new Error("Usage: validate-all.mjs [--topics Esp01,Por01]");
  const library = await loadLibrary();
  const report = validateRelease({
    ...library,
    requestedTopicIds: args[1]?.split(","),
  });
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = report.allowed ? 0 : 2;
} catch (e) {
  console.error(e.message);
  process.exitCode = 1;
}
