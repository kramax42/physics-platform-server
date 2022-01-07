const ws = require("ws");

//const addon = require('napi-addon-fdtd');
var addon = require("../../napi-addon-fdtd/build/Release/napi-addon-fdtd.node");

import { CONTINUE, PAUSE, START, CLOSE } from "../constants/ws-event.constants";

let intervalId;
let condition: number[];

import {
  LAB_1_2D,
  LAB_2_3D,
  LAB_3_INTERFERENCE,
  LAB_4_DIFRACTION,
} from "../constants/data-type.constants";

type dataType = "2D" | "3D" | "INTERFERENCE" | "DIFRACTION";
let currentDataType: dataType;
let refractionMatrix: number[];
let refractionMatrixRows: number;

type eventTypes = "start" | "pause" | "continue" | "close";

type startMessageType = {
  event: eventTypes;
  type: dataType;
  dataToReturn: dataToReturnType;
  condition: number[];
  matrix: number[][];
};

let getData;

let tempReturnData: number;
type dataToReturnType = "Ez" | "Hy" | "Hx" | "Energy";
let dataToReturn: dataToReturnType = "Ez";

const port = 5000;

const wss = new ws.Server(
  {
    port,
  },
  () => console.log(`Server started on ${port}`)
);

wss.on("connection", function connection(ws) {
  ws.on("message", async function (messageJSON) {
    const message: startMessageType = JSON.parse(messageJSON);
    switch (message.event) {
      case START:
        // Clear previous process.
        clearInterval(intervalId);
        console.log("start sending data");

        condition = message.condition;
        currentDataType = message.type;
        refractionMatrix = message.matrix.flat();
        refractionMatrixRows = message.matrix.length;
        console.log("refractionMatrix: ", refractionMatrix);

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
                tempReturnData = 0;
                break;
              case "Hy":
                tempReturnData = 1;
                break;
              case "Hx":
                tempReturnData = 2;
                break;
              case "Energy":
                tempReturnData = 3;
                break;
              default:
                tempReturnData = 0;
            }
            break;
        }
        newInterval(true, ws.send.bind(ws));
        break;
      case PAUSE:
        clearInterval(intervalId);
        console.log("pause sending data");
        break;
      case CONTINUE:
        newInterval(false, ws.send.bind(ws));
        console.log("continue sending data");
        break;
      case CLOSE:
        clearInterval(intervalId);
        // addon.clearFDTD_2D_data();
        console.log("stop sending data | connection closed");

        break;
    }
  });
});

// Milliseconds.
const TIME_INTERVAL = 500;

async function newInterval(reload: boolean, send) {
  intervalId = null;

  let data = await getData(
    condition,
    reload,
    refractionMatrix,
    refractionMatrixRows,
    tempReturnData
  );

  const stepsPerInterval = 5;
  intervalId = setInterval(async () => {
    for (let j = 0; j < stepsPerInterval; ++j) {
      data = await getData(
        condition,
        false,
        refractionMatrix,
        refractionMatrixRows,
        tempReturnData
      );
    }

    // console.log("data.dataX", data.dataX);
    // console.log(data["data" + dataToReturn]);
    // console.log("data.row", data.row);
    // console.log("refractionMatrixRows", refractionMatrixRows);

    data = {
      dataX: data.dataX,
      dataY: data.dataY,
      dataVal: data["data" + dataToReturn],
      step: data.currentTick,
      row: data.row,
      col: data.col,
    };
    send(JSON.stringify(data));
  }, TIME_INTERVAL);
}
