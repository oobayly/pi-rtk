import express from "express";
import * as http from "http";
import { env } from "process";
import serveIndex from "serve-index";
import WebSocket, { Data, Server } from 'ws';
import * as dotenv from "dotenv";

import { GpsdClient } from "./gpsd-client";

// ==========================
// Interfaces
// ==========================
interface Message {
  type: "command" | "error" | "gpsd" | "info" | "ping",
  data?: unknown
}

interface CommandMessage extends Message {
  type: "command",
  command: "devices"
}

interface ErrorMessage extends Message {
  type: "error",
  message: string
}

// ==========================
// Declarations
// ==========================

// Configure environment
dotenv.config();

const listenPort = env.NODE_PORT || 5000;
const gpsdHost = env.GPSD_HOST || "localhost";
const cachePath = env.DATA_PATH;
const app = express();
const server = http.createServer(app);
const wss = new Server({ server });
const gpsd = new GpsdClient({
  host: gpsdHost
});

// ==========================
// Methods
// ==========================
function broadcastMessage(message: Message): void {
  wss.clients.forEach((ws) => {
    sendMessage(ws, message);
  });
}

function handleCommand(_command: CommandMessage): Message {
  switch (_command.command) {
    case "devices":
      gpsd.devices();

      break;
    default:
      return { type: "error", message: "Invalid command." } as ErrorMessage;
  }

  return {
    type: "info",
    data: null
  }
}

function handleRequest(ws: WebSocket, data: Data) {
  let request: Message;
  let response: Message | null = null;

  if (typeof data !== "string") {
    response = { type: "error", message: "Invalid message." } as ErrorMessage;
  }

  try {
    request = JSON.parse(data as string);
  } catch (e: unknown) {
    response = { type: "error", message: "Invalid message." } as ErrorMessage;

    return;
  }

  if (!response) {
    switch (request.type) {
      case "command":
        response = handleCommand(request as CommandMessage);

        break;
      case "ping":
        response = { type: "ping" };

        break;
      default:
        response = { type: "error", message: `'${request.type}' is not a valid request type.` } as ErrorMessage;
    }
  }

  sendMessage(ws, response);
}

function sendMessage(ws: WebSocket, message: Message): void {
  ws.send(
    JSON.stringify(message),
    (error) => {
      if (error) {
        console.error(error);
      }
    }
  );
}

// ==========================
// Handlers
// ==========================
gpsd.on("socket.connect", () => {
  gpsd.watch({
    json: true,
    nmea: false
  });
});

gpsd.on("socket.disconnect", () => {
  // console.log("socket.disconnect");
});

gpsd.on("socket.error", (_e) => {
  console.log("Reconnecting in 5 seconds.");
  setTimeout(() => {
    gpsd.connect();
  }, 5000);
});

gpsd.on("packet.VERSION", (version) => {
  broadcastMessage({
    type: "gpsd",
    data: version
  });
});

gpsd.on("packet.DEVICES", (devices) => {
  broadcastMessage({
    type: "gpsd",
    data: devices
  });
});

gpsd.on("packet.SKY", (sky) => {
  broadcastMessage({
    type: "gpsd",
    data: sky
  });
});

gpsd.on("packet.TPV", (tpv) => {
  broadcastMessage({
    type: "gpsd",
    data: tpv
  });
});

gpsd.on("packet.POLL", (poll) => {
  broadcastMessage({
    type: "gpsd",
    data: poll
  });
});

wss.on("connection", (ws) => {
  if (!gpsd.isConnected) {
    gpsd.connect();
  } else {
    gpsd.devices();
  }

  ws.on("close", () => {
    // If there are no more clients, then disconnect from GPSD to save resources
    if (wss.clients.size === 0) {
      gpsd.disconnect();
    }
  });

  ws.on("message", (data) => handleRequest(ws, data));
});

// Serve the static content in public
app.use(
  "/",
  express.static("public")
);
if (cachePath) {
  // Serve the rinex files
  app.use(
    "/data",
    express.static(cachePath),
    serveIndex(cachePath)
  );
}

console.log(`GPSD is on ${gpsdHost}`);
console.log(`pi-rtk-http is listening on ${listenPort}`);
server.listen(listenPort);
