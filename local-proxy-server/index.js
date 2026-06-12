const http = require("http");
const httpProxy = require("http-proxy");

const clientPort = process.env.CLIENT_PORT || 5173;
const clientHost = process.env.CLIENT_HOST || "localhost";
const clientProtocol = process.env.CLIENT_PROTOCOL || "http";

const serverPort = process.env.SERVER_PORT || 3001;
const serverHost = process.env.SERVER_HOST || "localhost";
const serverProtocol = process.env.SERVER_PROTOCOL || "http";

const catalystListenPort = process.env.X_ZOHO_CATALYST_LISTEN_PORT || 3002;

const clientTarget = `${clientProtocol}://${clientHost}:${clientPort}`;
const serverTarget = `${serverProtocol}://${serverHost}:${serverPort}`;

const proxyHandler = httpProxy.createProxyServer({
  ws: true,
  changeOrigin: true,
  xfwd: true,
});

proxyHandler.on("error", (err, req, res) => {
  console.error("Proxy error:", err.message);
  res.writeHead(502, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ code: "FAILURE", message: "Service unavailable" }));
});

proxyHandler.on("proxyRes", (proxyRes, req) => {
  const origin = req.headers["origin"];
  if (origin) {
    proxyRes.headers["access-control-allow-origin"] = origin;
    proxyRes.headers["access-control-allow-credentials"] = "true";
  }
});

const proxyServer = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers["origin"] || "*";
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
      "Access-Control-Allow-Headers":
        req.headers["access-control-request-headers"] ||
        "Content-Type, Authorization",
    });
    res.end();
    return;
  }

  if (req.url.startsWith("/api")) {
    proxyHandler.web(req, res, { target: serverTarget });
  } else {
    proxyHandler.web(req, res, { target: clientTarget });
  }
});

proxyServer.on("error", (err, req, res) => {
  console.error("Proxy error:", err.message);
  res.writeHead(502, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Service unavailable", details: err.message }));
});

proxyServer.on("upgrade", (req, socket, head) => {
  proxyHandler.ws(req, socket, head, { target: clientTarget });
});

proxyServer.listen(catalystListenPort, () => {
  console.log(`Proxy listening on port ${catalystListenPort}`);
  console.log(`  → /api/* → ${serverTarget}`);
  console.log(`  → /*    → ${clientTarget}`);
});
