import { spawn } from "node:child_process";
import { cp, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const standalone = resolve(root, ".next/standalone");

await mkdir(resolve(standalone, ".next"), { recursive: true });
await cp(resolve(root, ".next/static"), resolve(standalone, ".next/static"), {
  recursive: true,
  force: true,
});
await cp(resolve(root, "public"), resolve(standalone, "public"), {
  recursive: true,
  force: true,
});

const server = spawn(process.execPath, [resolve(standalone, "server.js")], {
  cwd: standalone,
  env: process.env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
