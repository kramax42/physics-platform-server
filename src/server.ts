 import App from './app';
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

//const addon = require('napi-addon-fdtd');
var addon = require('../../napi-addon-fdtd/build/Release/napi-addon-fdtd.node');

let intervalId;
let condition: number[];


import { LAB_1_2D, LAB_2_3D, LAB_3_INTERFERENCE, LAB_4_DIFRACTION,} from '../constants/data-type.constants';

type dataType = "2D" | "3D" | "INTERFERENCE" | "DIFRACTION";
let currentDataType: dataType;

type eventTypes = 'start' | 'pause' | 'continue';

type startMessageType = {
  event: eventTypes,
  type: dataType,
  dataToReturn: dataToReturnType,
  condition: number[],
}

let getData;

type dataToReturnType = "Ez" | "Hy" | "Hx" | "Energy";
let dataToReturn: dataToReturnType = "Ez";

const wss = new ws.Server({
  port: 5000,
}, () => console.log(`Server started on 5000`))

wss.on('connection', function connection(ws) {
  ws.on('message', async function (messageJSON) {
    const message: startMessageType = JSON.parse(messageJSON)
    switch (message.event) {
      case 'start':
        console.log('start sending data')
        condition = message.condition;
        currentDataType = message.type;
        switch (currentDataType) {
          case LAB_1_2D:
            getData = addon.getFDTD_2D;
            break;
          case LAB_2_3D:
            getData = addon.getFDTD_3D;
            break;
          case LAB_3_INTERFERENCE:
            getData = addon.getFDTD_3D_INTERFERENCE;
            break;
          case LAB_4_DIFRACTION:
            getData = addon.getFDTD_3D_DIFRACTION;
            dataToReturn = message.dataToReturn
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

// function broadcastMessage(message, id=1) {
//   wss.clients.forEach(client => {
//     client.send(JSON.stringify(message))
//   })
// }

// interface

// Milliseconds.
const TIME_INTERVAL = 800;

async function newInterval(reload: boolean, send) {
  intervalId = null;

  const tempMatrix = [1, 2, 1, 1];
  const tempMatrixSize = 2;
  const tempReturnData = 3;

  let data = await getData(condition, reload, tempMatrix, tempMatrixSize, tempReturnData);

  intervalId = setInterval(async () => {
    for(let j = 0; j < 3; ++j){
      data = await getData(condition, false, tempMatrix, tempMatrixSize, tempReturnData);
    }

    data = {
      dataX: data.dataX,
      dataY: data.dataY,
      dataVal: data["data"+dataToReturn],
      // dataEz: data.dataEz,
      // dataHx: data.dataHx,
      // dataEnergy: data.dataEnergy,
      step: data.currentTick,
      row: data.row,
      col: data.col}
    send(JSON.stringify(data))
  }, TIME_INTERVAL)
}
