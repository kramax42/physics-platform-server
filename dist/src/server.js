"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = __importStar(require("ws"));
const express_1 = __importDefault(require("express"));
const fdtd_service_1 = require("./services/fdtd.service");
const port = process.env.PORT || 5001;
const app = (0, express_1.default)();
// const httpServer: http.Server = new http.Server(app)
app.get('/', (req, res) => res.send((`<pre>
LabName:        Params:
------------------------------------------------------------------

getData2D:             ( [lambda, tau, refractive_index], reload )
INTERFERENCE:   ( [lambda, beamsize], reload )
getData3D:     ( [lambda, beamsize], reload, matrix, matrixSize, dataReturnType ) -- 4 - data return type('Ez' = 0 | 'Hy' = 1 |'Hx' = 2 |'Energy' = 3)
--------------------------------------------------------------

synchronize step:    ( step: number )
</pre>`)));
const httpServer = app.listen(port, () => console.log(`Server started on ${port}`));
// Websocket server entry point.
const wsServer = new WebSocket.Server({
    server: httpServer
});
// Websocket handlers.
wsServer.on("connection", wsClient => {
    wsClient.on("message", async function (messageJSON) {
        (0, fdtd_service_1.onMessage)(messageJSON, wsClient.send.bind(wsClient));
    });
});
// const  SERVER_URL="ws://physics-platform-server.herokuapp.com/"
//# sourceMappingURL=server.js.map