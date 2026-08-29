// Makes sure .env exists and has DATABASE_URL + SESSION_SECRET.
// Runs automatically before dev / build / start. Idempotent and silent when
// everything is already set.

import {
  existsSync,
  readFileSync,
  writeFileSync,
  copyFileSync,
} from "node:fs";
import { randomBytes } from "node:crypto";

const ENV = ".env";
const EXAMPLE = ".env.example";

if (!existsSync(ENV)) {
  if (existsSync(EXAMPLE)) copyFileSync(EXAMPLE, ENV);
  else writeFileSync(ENV, 'DATABASE_URL="file:./dev.db"\n');
}

let env = readFileSync(ENV, "utf8");

function get(name) {
  const m = env.match(new RegExp(`^${name}="?([^"\\n]*)"?$`, "m"));
  return m ? m[1] : "";
}
function set(name, value) {
  const line = `${name}="${value}"`;
  const re = new RegExp(`^${name}=.*$`, "m");
  env = re.test(env) ? env.replace(re, line) : env.replace(/\s*$/, "") + `\n${line}\n`;
}

if (!get("DATABASE_URL")) set("DATABASE_URL", "file:./dev.db");
if (!get("SESSION_SECRET")) {
  set("SESSION_SECRET", randomBytes(32).toString("hex"));
  console.log("ensure-env: generated a new SESSION_SECRET in .env");
}

writeFileSync(ENV, env);
