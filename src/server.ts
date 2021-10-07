// import App from './app';
// import Lab1Controller from "./lab1/lab1.controller";
// import Lab2Controller from "./lab2/lab2.controller";
//
// const PORT = process.env.PORT || 5000;
//
// const app = new App([
//     new Lab1Controller(),
//     new Lab2Controller(),
//   ],
//   PORT,
// );
//
// app.listen();
//

const ws = require('ws');

const addon = require('napi-addon-fdtd');

let intervalId;
let condition: number[];

type dataType = "2D" | "3D" | "INTERFERENCE" | "DIFRACTION";
let currentDataType: dataType;

let getData;

const wss = new ws.Server({
  port: 5000,
}, () => console.log(`Server started on 5000`))

wss.on('connection', function connection(ws) {
  ws.on('message', async function (message) {
    message = JSON.parse(message)
    switch (message.event) {
      case 'start':
        console.log('start sending data')
        condition = message.condition;
        currentDataType = message.type;
        switch (currentDataType) {
          case "2D":
            getData = addon.getFDTD_2D;
            break;
          case "3D":
            getData = addon.getFDTD_3D;
            break;
          case "INTERFERENCE":
            getData = addon.getFDTD_3D_INTERFERENCE;
            break;
          case "DIFRACTION":
            getData = addon.getFDTD_3D_DIFRACTION;
            break;
        }
        newInterval( true, ws.send.bind(ws));
        break;
      case 'pause':
        clearInterval(intervalId)
        console.log('pause sending data')
        break;
      case 'continue':
        newInterval(false, ws.send.bind(ws));
        console.log('continue sending data')
        break;
    }
  })

  ws.on("close", () => {
    console.log('stop sending data | connection closed')
  })
})

function broadcastMessage(message, id=1) {
  wss.clients.forEach(client => {
    client.send(JSON.stringify(message))
  })
}

// interface

async function newInterval(reload: boolean, send) {
  intervalId = null;
  let data = await getData(condition, reload);

  intervalId = setInterval(async () => {
    for(let j = 0; j < 15; ++j){
      data = await getData(condition, false);
    }
    data = {
      dataX: data.dataX,
      dataY: data.dataY,
      dataEz: data.dataEz,
      dataHy: data.dataHy,
      dataHx: data.dataHx,
      dataEnergy: data.dataEnergy,
      step: data.currentTick,
      row: data.row,
      col: data.col}
    send(JSON.stringify(data))
  }, 250)
}
