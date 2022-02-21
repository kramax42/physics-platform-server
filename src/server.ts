import * as WebSocket from 'ws';

import express from 'express';
import * as http from "http"


import { onMessage } from './services/fdtd-data.service';
 
const port = process.env.PORT || 5001;

const app = express()
// const httpServer: http.Server = new http.Server(app)

app.get('/', (req,res) => res.send((`<pre>
LabName:        Params:
------------------------------------------------------------------

2D:             ( [lambda, tau, refractive_index], reload )
3D:             ( [lambda, tau, beamsize], reload )
INTERFERENCE:   ( [lambda, tau, beamsize], reload )
DIFRACTION:     ( [lambda, tau, beamsize], reload, matrix, matrixSize, dataReturnType ) -- 4 - data return type('Ez' = 0 | 'Hy' = 1 |'Hx' = 2 |'Energy' = 3)
--------------------------------------------------------------

synchronize step:    ( step: number )
</pre>`)))

const httpServer: http.Server = app.listen(port, () => console.log(`Server started on ${port}`))

// Websocket server entry point.
const wsServer = new WebSocket.Server(
  {
    server: httpServer
  }
);



// Websocket handlers.
wsServer.on("connection", wsClient => {
  wsClient.on("message", async function(messageJSON) {
    onMessage(messageJSON, wsClient.send.bind(wsClient));
  });
});



// const  SERVER_URL="ws://physics-platform-server.herokuapp.com/"