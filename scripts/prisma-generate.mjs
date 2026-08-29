// `prisma generate`, but tolerate a Windows file-lock (EPERM renaming the query
// engine) when a client is already generated — common when an editor or a dev
// server is holding the file open.
import { execSync } from "node:child_process";
import { existsSync } from "node:fs";

try {
  execSync("npx --no-install prisma generate", { stdio: "inherit" });
} catch (err) {
  const generated = existsSync("node_modules/.prisma/client/index.js");
  if (generated) {
    console.warn(
      "prisma-generate: `prisma generate` failed but a client already exists — continuing.",
    );
  } else {
    throw err;
  }
}
