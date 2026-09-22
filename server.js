// Локальный сервер без сторонних зависимостей. Запуск: npm start.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleChat } from "./server/chat-api.js";
const root = fileURLToPath(new URL("./dist/", import.meta.url));
const port = Number(process.env.PORT || 5173);
http
  .createServer(async (request, response) => {
    try {
      if (request.url.split("?")[0].startsWith("/api/chat")) {
        const chunks = [];
        let length = 0;
        for await (const chunk of request) {
          length += chunk.length;
          if (length > 60000) {
            response.writeHead(413);
            response.end(JSON.stringify({ error: "Запрос слишком большой." }));
            return;
          }
          chunks.push(chunk);
        }
        const apiRequest = new Request(
          `http://127.0.0.1:${port}${request.url}`,
          {
            method: request.method,
            headers: request.headers,
            ...(request.method === "POST"
              ? { body: Buffer.concat(chunks) }
              : {}),
          },
        );
        const result = await handleChat(apiRequest, process.env);
        response.writeHead(result.status, Object.fromEntries(result.headers));
        response.end(await result.text());
        return;
      }
      const pathname = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      const file = path.resolve(
        root,
        "." + (pathname === "/" ? "/index.html" : pathname),
      );
      if (
        !file.startsWith(root) ||
        file.startsWith(path.join(root, "server"))
      ) {
        response.writeHead(403);
        response.end();
        return;
      }
      const data = await readFile(file);
      const types = {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
      };
      response.setHeader(
        "Content-Type",
        (types[path.extname(file)] || "application/octet-stream") +
          "; charset=utf-8",
      );
      response.end(data);
    } catch {
      response.writeHead(404);
      response.end("Not found");
    }
  })
  .listen(port, "127.0.0.1", () =>
    console.log(`Калькулятор: http://127.0.0.1:${port}`),
  );
