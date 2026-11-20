import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, sep } from "node:path";

const root = process.cwd();
const port = Number(process.env.PORT || 5173);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname
    );
    let filePath = normalize(join(root, pathname));
    if (!filePath.startsWith(root + sep) && filePath !== root) {
      res.writeHead(403).end("Forbidden");
      return;
    }
    if (pathname.endsWith("/")) filePath = join(filePath, "index.html");

    const data = await readFile(filePath);
    res.writeHead(200, {
      "content-type": TYPES[extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store",
    });
    res.end(data);
  } catch {
    res.writeHead(404).end("Not found");
  }
}).listen(port, () => {
  console.log(`Serving ${root}`);
  console.log(`  Vanilla demo: http://localhost:${port}/demo/`);
  console.log(`  React demo:   http://localhost:${port}/examples/react-demo/`);
});
