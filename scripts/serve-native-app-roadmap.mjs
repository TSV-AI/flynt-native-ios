import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const scriptsDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = join(scriptsDirectory, "..");
const dashboardPath = join(projectDirectory, "tools", "native-app-roadmap.html");
const statusPath = join(projectDirectory, "PROJECT_STATUS.md");
const port = Number.parseInt(process.env.FLYNT_NATIVE_STATUS_PORT ?? "3275", 10);

if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error("FLYNT_NATIVE_STATUS_PORT must be an integer between 1024 and 65535.");
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "127.0.0.1"}`);

    if (url.pathname === "/" || url.pathname === "/index.html") {
      const page = await readFile(dashboardPath);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(page);
      return;
    }

    if (url.pathname === "/status") {
      const status = await readFile(statusPath);
      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type": "text/markdown; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      });
      response.end(status);
      return;
    }

    if (url.pathname === "/favicon.ico") {
      response.writeHead(204);
      response.end();
      return;
    }

    response.writeHead(404, {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    response.end("Not found");
  } catch (error) {
    console.error(error);
    response.writeHead(500, {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    });
    response.end("Native app roadmap could not be loaded.");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`FLYNT native app roadmap: http://127.0.0.1:${port}`);
});
