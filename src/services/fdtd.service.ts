import * as WebSocket from "ws";
import os from "os";
import addon from "napi-addon-fdtd";

import {
  LAB_2D,
  LAB_3D,
  LAB_3D_INTERFERENCE,
} from "../../constants/data-type.constants";

import {
  CLOSE,
  CONTINUE,
  PAUSE,
  START,
} from "../../constants/ws-event.constants";

import {
  dataToReturnType,
  dataType,
  InitDataObjectType,
  startMessageType,
} from "../../types/types";

function testMemoryUsage() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(
    `The script uses approximately ${Math.round(used * 100) / 100} MB`
  );
  console.log(`Free memory: ${Math.round(os.freemem() / 1024 / 1024 * 100) / 100} MB`);
  console.log(`Total memory: ${Math.round(os.totalmem() / 1024 / 1024 * 100) / 100} MB`);
}

// Global variables.
let intervalId;
let lastClientReceivedStep = 0;
let lastServerSendedStep = 0;
let clientData: InitDataObjectType;

type sendType = {
  data: any;
  cb?: (err?: Error) => void;
};

type stepMessageType = { step: number };


export const onMessage = async (
  messageJSON: WebSocket.Data,
  send: sendType
): Promise<void> => {
  const message: startMessageType | stepMessageType = JSON.parse(
    messageJSON.toString()
  );

  // const message = JSON.parse(messageJSON.toString());
  if ("event" in message) {
    switch (message.event) {
      case START:
        // Clear previous process.
        clearInterval(intervalId);
        console.log("start sending data");
        clientData = startSendingDataInit(message);
        lastClientReceivedStep = 0;
        lastServerSendedStep = 0;
        message.type !== "2D"
          ? newInterval3D(true, send, clientData)
          : newInterval2D(true, send, clientData);
        break;

      case PAUSE:
        clearInterval(intervalId);
        console.log("pause sending data");
        break;

      case CONTINUE:
        // newInterval(false, send, clientData);
        message.type !== "2D"
          ? newInterval3D(false, send, clientData)
          : newInterval2D(false, send, clientData);
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
  } else if ("step" in message) {
    lastClientReceivedStep = message.step || 0;
    console.log("~~~~~~~~~~~~~~~");
    console.log("~~clientStep---", lastClientReceivedStep);
    console.log("**serverStep---", lastServerSendedStep);
  }
};

const startSendingDataInit = (
  message: startMessageType
): InitDataObjectType => {
  // Unpacking request data.
  const currentDataType: dataType = message.type;

  let returnDataNumber: number;

  let dataToReturn: dataToReturnType;

  let refractionMatrixRows;

  // const sourcePositionRelateive = message.

  switch (currentDataType) {
    case LAB_2D:
      console.log("2d!!!!!!!");
      refractionMatrixRows = message.matrix?.flat().length;
      break;

    case LAB_3D:
      console.log("3d!!!!!!!");
      refractionMatrixRows = message.matrix?.length;
      break;

    case LAB_3D_INTERFERENCE:
      console.log("INTERFERNCE");
      refractionMatrixRows = message.matrix?.length;
      break;
  }

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

  return {
    condition: message.condition,
    currentDataType,
    refractionMatrix: message.matrix?.flat(),
    omegaMatrix: message.omegaMatrix?.flat(),
    refractionMatrixRows,
    returnDataNumber,
    dataToReturn,
    returnDataStr: "data" + dataToReturn,
    sourcePositionRelative: message.sourcePositionRelative || { x: 0, y: 0 },
  };
};

async function sleep(ms: number) {
  let timeoutId: NodeJS.Timeout;
  await new Promise((resolve) => {
    timeoutId = setTimeout(resolve, ms);
  });
  clearTimeout(timeoutId);
}

async function newInterval3D(reload: boolean, send, clientData?: InitDataObjectType) {
  clearInterval(intervalId);

  // Milliseconds.
  const TIME_INTERVAL_3D = 1000;
  const SLEEP_TIME = 500;

  // Initial data request.
  let data = addon.getData3D(
    clientData.condition,
    reload,
    clientData.refractionMatrix,
    clientData.refractionMatrixRows,
    clientData.returnDataNumber
    // clientData.omegaMatrix,
  );

  const stepsPerInterval = 5;
  const reloadInInterval = false;
  intervalId = setInterval(async () => {
    const calculateAndSendNextLayer = async () => {
      for (let j = 0; j < stepsPerInterval; ++j) {
        data = addon.getData3D(
          clientData.condition,
          reloadInInterval,
          clientData.refractionMatrix,
          clientData.refractionMatrixRows,
          clientData.returnDataNumber
          // clientData.omegaMatrix,
        );
      }

      lastServerSendedStep = data.currentTick;
      const dataToClient = {
        dataX: data.dataX,
        dataY: data.dataY,
        dataVal: data[clientData.returnDataStr],
        step: data.currentTick,
        row: data.row,
        col: data.col,
        max: data.max,
        min: data.min,
      };
      testMemoryUsage();
      send(JSON.stringify(dataToClient));
    };

    // Waiting for synchronization between server and clent.
    // while
    if (lastClientReceivedStep < lastServerSendedStep) {
      sleep(SLEEP_TIME);
    }
    calculateAndSendNextLayer();
  }, TIME_INTERVAL_3D);
}

async function newInterval2D(reload: boolean, send, clientData: InitDataObjectType) {
  clearInterval(intervalId);

  const TIME_INTERVAL_2D = 500;

  const sourcePosition = [clientData.sourcePositionRelative.x || 0, 0.5];
  // const sourcePosition = 0.2;

  // Initial data request.
  let data = addon.getData2D(
    clientData.condition || [1, 10, 1],
    reload,
    clientData.refractionMatrix,
    clientData.refractionMatrixRows,
    sourcePosition,
    clientData.omegaMatrix
    // clientData.returnDataNumber
  );

  const stepsPerInterval = 18;
  const reloadInInterval = false;

  intervalId = setInterval(async () => {
    for (let j = 0; j < stepsPerInterval; ++j) {
      data = addon.getData2D(
        clientData.condition,
        reloadInInterval,
        clientData.refractionMatrix,
        clientData.refractionMatrixRows,
        sourcePosition,
        clientData.omegaMatrix
      );
    }

    lastServerSendedStep = data.currentTick;
    const dataToClient = {
      dataX: data.dataX,
      dataY: data.dataHy,
      step: data.currentTick,
      col: data.col,
    };
    testMemoryUsage();
    send(JSON.stringify(dataToClient));
  }, TIME_INTERVAL_2D);
}
