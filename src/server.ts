import * as WebSocket from "ws";

import express from "express";
import * as http from "http";

import { onClose, onMessage } from "./fdtd/fdtd.service";
import { documentaion } from "./documentation";

const port = process.env.PORT || 5001;

const app = express();


// Http server handlers.
app.get("/docs", (req, res) =>
  res.send(documentaion)
);

const httpServer: http.Server = app.listen(port, () =>
  console.log(`Server started on ${port} in ${process.env.NODE_ENV} mode`)
);

// Websocket server entry point.
const wsServer = new WebSocket.Server({
  server: httpServer,
});

// Websocket handlers.
wsServer.on("connection", (wsClient) => {
  wsClient.on("message", async function (messageJSON) {
    onMessage(messageJSON, wsClient.send.bind(wsClient));
  });

  wsClient.on("close", function () {
    console.log("Client disconnected.");
    onClose();
  });
});
