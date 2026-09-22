// Собирает самодостаточный Worker: публичные файлы встроены как строки.
import { readFile, writeFile, mkdir } from "node:fs/promises";
const publicFiles = [
  "index.html",
  "styles.css",
  "engine.js",
  "catalog.js",
  "app.js",
  "themes.js",
  "chat.js",
  "lessons.js",
];
const assets = Object.fromEntries(
  await Promise.all(
    publicFiles.map(async (name) => [
      "/" + name,
      await readFile(new URL("./dist/" + name, import.meta.url), "utf8"),
    ]),
  ),
);
const api = await readFile(
  new URL("./server/chat-api.js", import.meta.url),
  "utf8",
);
const worker =
  api.replace("export async function handleChat", "async function handleChat") +
  "\nconst assets=" +
  JSON.stringify(assets) +
  `;\nexport default { async fetch(request, env) {
const url=new URL(request.url);
if(url.pathname==='/api/chat'||url.pathname==='/api/chat/status')return handleChat(request,env);
if(!['GET','HEAD'].includes(request.method))return new Response('Method not allowed',{status:405});
const name=url.pathname==='/'?'/index.html':url.pathname;
if(!Object.hasOwn(assets,name))return new Response('Not found',{status:404});
const type=name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':'text/html';
return new Response(request.method==='HEAD'?null:assets[name],{headers:{'Content-Type':type+'; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'}});
}};`;
await mkdir(new URL("./dist/server/", import.meta.url), { recursive: true });
await writeFile(new URL("./dist/server/index.js", import.meta.url), worker);
console.log("Worker собран: dist/server/index.js");
