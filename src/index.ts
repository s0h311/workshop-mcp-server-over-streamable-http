import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import z from "zod";

const server = new McpServer({
  name: "mcp-server",
  version: "0.0.0",
});

server.registerTool(
  "search-something",
  {
    description: "Search something",
  },
  async () => {
    const response = await fetch("");

    const text = await response.text();

    return {
      content: [
        {
          type: "text",
          text,
        },
      ],
    };
  }
);

const app = express();
app.use(express.json());

// sessionId -> StreamableHTTPServerTransport
const registeredTransports = new Map<string, StreamableHTTPServerTransport>();

app.post("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string;

  const transport = getTransport(sessionId, req.body);

  if (transport) {
    await transport.handleRequest(req, res, req.body);
  } else {
    res.sendStatus(400);
  }
});

app.get("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string;

  const transport = getTransport(sessionId, req.body);

  if (transport) {
    await transport.handleRequest(req, res, req.body);
  } else {
    res.sendStatus(400);
  }
});

app.delete("/mcp", async (req, res) => {
  const sessionId = req.headers["mcp-session-id"] as string;

  const transport = getTransport(sessionId, req.body);

  if (transport) {
    await transport.handleRequest(req, res, req.body);
  } else {
    res.sendStatus(400);
  }
});

app.listen(8080);

function getTransport(
  sessionId: string | undefined,
  requestBody: unknown
): StreamableHTTPServerTransport | null {
  if (sessionId && registeredTransports.has(sessionId)) {
    return registeredTransports.get(sessionId) ?? null;
  }

  if (!sessionId && isInitializeRequest(requestBody)) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => crypto.randomUUID(),
      onsessioninitialized: (sessionId) => {
        registeredTransports.set(sessionId, transport);
      },
    });

    transport.onclose = () => {
      if (transport.sessionId) {
        registeredTransports.delete(transport.sessionId);
      }
    };

    server.connect(transport);

    return transport;
  }

  return null;
}
