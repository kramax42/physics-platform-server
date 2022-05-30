import * as WebSocket from 'ws';

import express from 'express';
import * as http from "http"


import { onClose, onMessage } from './services/fdtd.service';
 
const port = process.env.PORT || 5001;

const app = express()
// const httpServer: http.Server = new http.Server(app)

app.get('/', (req,res) => res.send((`<pre>
LabName:        Params:
------------------------------------------------------------------

getData1D: (
  [omega, tau],
  reload,
  material vector,
  size ,
  epsilin array,
  mu array,
  sigma array,
  relative source position array )

getData2D: (
   [lambda, beamsize],
   reload,
   material matrix (flat),
   size (size x size),
   epsilin array,
   mu array,
   sigma array,
   data return type(number)   ('Ez' = 0 | 'Hy' = 1 |'Hx' = 2 |'Energy' = 3),
   relative source position array )

--------------------------------------------------------------

synchronize step:    ( step: number )
</pre>`)))

const httpServer: http.Server = app.listen(port, () => console.log(`Server started on ${port} in ${process.env.NODE_ENV} mode`))

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

  wsClient.on('close', function() {
    console.log('Client disconnected.');
    onClose();
  });
  
});



// const  SERVER_URL="ws://physics-platform-server.herokuapp.com/"