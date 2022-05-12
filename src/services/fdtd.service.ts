import * as WebSocket from "ws";
import os from "os";
import addon from "napi-addon-fdtd";

import {
  LAB_1D,
  LAB_2D,
  LAB_2D_INTERFERENCE,
} from "../../constants/data-type.constants";

import {
  CLOSE,
  CONTINUE,
  PAUSE,
  START,
} from "../../constants/ws-event.constants";

import {

  DataDimension,
  DataToReturn,
  InitDataObject,
  MessageFromClient,
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
let clientData: InitDataObject;

type sendType = {
  data: any;
  cb?: (err?: Error) => void;
};

type stepMessageType = { step: number };


export const onMessage = async (
  messageJSON: WebSocket.Data,
  send: sendType
): Promise<void> => {
  const message: MessageFromClient | stepMessageType = JSON.parse(
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
        message.type === "1D"
          ? newInterval1D(true, send, clientData)
          : newInterval2D(true, send, clientData);
        break;

      case PAUSE:
        clearInterval(intervalId);
        console.log("pause sending data");
        break;

      case CONTINUE:
        // newInterval(false, send, clientData);
        message.type === "1D"
          ? newInterval1D(false, send, clientData)
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
    console.log("~~ clientStep ~~", lastClientReceivedStep);
    console.log("** serverStep **", lastServerSendedStep);
  }
};

const startSendingDataInit = (
  message: MessageFromClient
): InitDataObject => {
  // Unpacking request data.
  const currentDataType: DataDimension = message.type;

  let returnDataNumber: number;

  let rows;
  let cols;

  // const srcPositionRelateive = message.

  switch (currentDataType) {
    case LAB_1D:
      console.log("===== 1D =====");
      rows = message.materialMatrix?.flat().length;
      break;

    case LAB_2D:
      console.log("===== 2D =====");
      rows = message.materialMatrix?.length;
      break;

    default:
      rows = 1;
      
  }

  cols = rows;

  returnDataNumber = message.dataToReturn || 0;

  return {
    condition: message.condition,
    materialMatrix: message.materialMatrix?.flat(),
    eps: message.materials.map(material => material.eps),
    mu: message.materials.map(material => material.mu),
    sigma: message.materials.map(material => material.sigma),
    rows,
    dataToReturn: returnDataNumber,
    srcPositionRelativeSet: (message.srcPositionRelative.map(src => [src.x, src.y])).flat() || [0, 0],
  };
};

async function sleep(ms: number) {
  let timeoutId: NodeJS.Timeout;
  await new Promise((resolve) => {
    timeoutId = setTimeout(resolve, ms);
  });
  clearTimeout(timeoutId);
}

async function newInterval2D(reload: boolean, send, clientData: InitDataObject) {
  clearInterval(intervalId);


  // console.log(clientData)

  // Milliseconds.
  const TIME_INTERVAL_2D = 400;
  const SLEEP_TIME = 500;

  // Initial data request.
  let data = addon.getData2D(
    clientData.condition,
    reload,
    clientData.materialMatrix,
    clientData.rows,
    clientData.eps,
    clientData.mu,
    clientData.sigma,
    clientData.dataToReturn,
    clientData.srcPositionRelativeSet,
  );

  const stepsPerInterval = 2;
  const reloadInInterval = false;
  intervalId = setInterval(async () => {
    const calculateAndSendNextLayer = async () => {
      for (let j = 0; j < stepsPerInterval; ++j) {
        data = addon.getData2D(
          clientData.condition,
          reloadInInterval,
          clientData.materialMatrix,
          clientData.rows,
          clientData.eps,
          clientData.mu,
          clientData.sigma,
          clientData.dataToReturn,
          clientData.srcPositionRelativeSet,
        );
      }

      lastServerSendedStep = data.timeStep;
      const dataToClient = {
        dataX: data.dataX,
        dataY: data.dataY,
        dataVal: data.dataEz,
        // dataVal: data[clientData.returnDataStr],
        step: data.timeStep,
        row: data.rows,
        col: data.cols,
        max: data.max,
        min: data.min,
      };
      testMemoryUsage();
      send(JSON.stringify(dataToClient));
    };

    // Waiting for synchronization between server and clent.
    // while
    // if (lastClientReceivedStep < lastServerSendedStep) {
      // sleep(SLEEP_TIME);
    // }
    calculateAndSendNextLayer();
  }, TIME_INTERVAL_2D);
}

async function newInterval1D(reload: boolean, send, clientData: InitDataObject) {
  clearInterval(intervalId);

  const TIME_INTERVAL_1D = 300;

  // const srcPosition = clientData.srcPositionRelativeSet;
  // const srcPosition = 0.2;


  const condition = [1, 10, 1];
  const eps = [1, 1.2];
  const materialSize = 2;
  const sigma = [0, 0.04];
  const srcPosition = [0.4, 0.8];

  let data = addon.getData1D(condition, true, eps, materialSize, srcPosition, sigma);

  // Initial data request.
  // let data = addon.getData1D(
  //   clientData.condition || [1, 10, 1],
  //   reload,
  //   clientData.refractionMatrix,
  //   clientData.rows,
  //   srcPosition,
  //   clientData.omegaMatrix
  //   // clientData.returnDataNumber
  // );

  const stepsPerInterval = 3;
  const reloadInInterval = false;

  intervalId = setInterval(async () => {
    for (let j = 0; j < stepsPerInterval; ++j) {
      // data = addon.getData1D(
      //   clientData.condition,
      //   reloadInInterval,
      //   clientData.refractionMatrix,
      //   clientData.rows,
      //   srcPosition,
      //   clientData.omegaMatrix
      // );
      data = addon.getData1D(condition, reloadInInterval, eps, materialSize, srcPosition, sigma);
    }

    lastServerSendedStep = data.currentTick;
    const dataToClient = {
      dataX: data.dataX,
      dataY: data.dataHy,
      step: data.currentTick,
      col: data.col,
    };

    // testMemoryUsage();
    send(JSON.stringify(dataToClient));
  }, TIME_INTERVAL_1D);
}
