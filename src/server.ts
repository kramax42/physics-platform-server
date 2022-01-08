const ws = require("ws");

//const addon = require('napi-addon-fdtd');
var addon = require("../../napi-addon-fdtd/build/Release/napi-addon-fdtd.node");

import { CONTINUE, PAUSE, START, CLOSE } from "../constants/ws-event.constants";

import {
  LAB_1_2D,
  LAB_2_3D,
  LAB_3_INTERFERENCE,
  LAB_4_DIFRACTION,
} from "../constants/data-type.constants";

import {
  dataToReturnType,
  dataType,
  InitDataObjectType,
  startMessageType,
} from "../types/types";

const port = 5000;

let intervalId;

const startSendingDataInit = (
  message: startMessageType
): InitDataObjectType => {

  // Unpacking request data.
  const currentDataType: dataType = message.type;

  let returnDataNumber: number;

  let getData;
  let dataToReturn: dataToReturnType;

  switch (currentDataType) {
    
    case LAB_1_2D:
      getData = addon.getFdtd2D;
      break;

    case LAB_2_3D:
      getData = addon.getFDTD_3D;
      break;

    case LAB_3_INTERFERENCE:
      getData = addon.getFDTD_3D_INTERFERENCE;
      break;

    case LAB_4_DIFRACTION:
      getData = addon.getFDTD_3D_DIFRACTION;
      dataToReturn = message.dataToReturn;
      switch (dataToReturn) {

        case "Ez":
          returnDataNumber = 0;
          break;

        case "Hy":
          returnDataNumber = 1;
          break;

        case "Hx":
          returnDataNumber = 2;
          break;

        case "Energy":
          returnDataNumber = 3;
          break;

        default:
          returnDataNumber = 0;
      }
      break;
  }

  return {
    condition: message.condition,
    currentDataType,
    refractionMatrix: message.matrix.flat(),
    refractionMatrixRows: message.matrix.length,
    returnDataNumber,
    dataToReturn,
    returnDataStr: "data" + dataToReturn,
    getData,
  };
};

// Websocket server entry point.
const wss = new ws.Server(
  {
    port,
  },
  () => console.log(`Server started on ${port}`)
);

let obj: InitDataObjectType;

// Websocket handlers.
wss.on("connection", function connection(ws) {
  ws.on("message", async function (messageJSON) {
    const message: startMessageType = JSON.parse(messageJSON);

    switch (message.event) {
      case START:
        // Clear previous process.
        clearInterval(intervalId);
        console.log("start sending data");
        obj = startSendingDataInit(message);
        newInterval(true, ws.send.bind(ws), obj);
        break;

      case PAUSE:
        clearInterval(intervalId);
        console.log("pause sending data");
        break;

      case CONTINUE:
        newInterval(false, ws.send.bind(ws), obj);
        console.log("continue sending data");
        break;

      case CLOSE:
        clearInterval(intervalId);
        console.log("stop sending data | connection closed");
        break;

      default:
        clearInterval(intervalId);
        console.log("Wrong request data!");
    }
  });
});

// Milliseconds.
const TIME_INTERVAL = 650;

async function newInterval(reload: boolean, send, obj?: InitDataObjectType) {
  intervalId = null;

  // Initial data request.
  let data = await obj.getData(
    obj.condition,
    reload,
    obj.refractionMatrix,
    obj.refractionMatrixRows,
    obj.returnDataNumber
  );

  const stepsPerInterval = 5;
  const reloadInInterval = false;
  intervalId = setInterval(async () => {

    for (let j = 0; j < stepsPerInterval; ++j) {
      data = await obj.getData(
        obj.condition,
        reloadInInterval,
        obj.refractionMatrix,
        obj.refractionMatrixRows,
        obj.returnDataNumber
      );
    }

    const dataToClient = {
      dataX: data.dataX,
      dataY: data.dataY,
      dataVal: data[obj.returnDataStr],
      step: data.currentTick,
      row: data.row,
      col: data.col,
    };
    send(JSON.stringify(dataToClient));
  }, TIME_INTERVAL);
}
