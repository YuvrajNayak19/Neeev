import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
// Set API_PORT to run the API somewhere other than 4000; Vite's proxy follows it.
const env = { ...process.env, ...(process.env.API_PORT ? { PORT: process.env.API_PORT } : {}) };
const children = [
  spawn(npm, ["run", "dev:client"], { stdio: "inherit", shell: process.platform === "win32", env }),
  spawn(npm, ["run", "dev:server"], { stdio: "inherit", shell: process.platform === "win32", env }),
];

let shuttingDown = false;

function stop(code = 0) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) child.kill("SIGTERM");
  }
  process.exitCode = code;
}

for (const child of children) {
  child.on("error", (error) => {
    console.error(error);
    stop(1);
  });
  child.on("exit", (code) => {
    if (!shuttingDown) stop(code ?? 1);
  });
}

process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());