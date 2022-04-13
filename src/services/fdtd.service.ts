import * as WebSocket from 'ws';
import * as addon from 'napi-addon-fdtd';

import { LAB_2D, LAB_3D, LAB_3D_INTERFERENCE } from '../../constants/data-type.constants';
import { CLOSE, CONTINUE, PAUSE, START } from '../../constants/ws-event.constants';
import { dataToReturnType, dataType, InitDataObjectType, startMessageType } from '../../types/types';

var os = require('os');



let memoryAll = 0;

function testMemoryUsage() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  // console.log(`all memory ${memoryAll} MB`);
  // console.log(`Free mem ${Math.round(os.freemem() * 100) / 100} MB`);
  // console.log(`Total mem ${Math.round(os.totalmem() * 100) / 100} MB`);
  

}


let intervalId;
let lastClientReceivedStep = 0;
let lastServerSendedStep = 0;

type sendType = {
    data: any;
     cb?: (err?: Error) => void}

type stepMessageType = {step: number};


export const onMessage  = async (messageJSON: WebSocket.Data, send: sendType): Promise<void> => {
    const message: startMessageType | stepMessageType = JSON.parse(messageJSON.toString());

    let obj: InitDataObjectType;

    // const message = JSON.parse(messageJSON.toString());
    if("event" in message) {
    switch (message.event) {
      case START:
        // Clear previous process.
        clearInterval(intervalId);
        console.log("start sending data");
        obj = startSendingDataInit(message);
        lastClientReceivedStep = 0;
        lastServerSendedStep = 0;
        message.type !== '2D' 
          ? newInterval3D(true, send, obj)
          : newInterval2D(true, send, obj)
        
        break;

      case PAUSE:
        clearInterval(intervalId);
        console.log("pause sending data");
        break;

      case CONTINUE:
        // newInterval(false, send, obj);
        message.type !== '2D' 
          ? newInterval3D(false, send, obj)
          : newInterval2D(false, send, obj)
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
  }
  else if ("step" in message) {
      lastClientReceivedStep = (message.step) || 0;
      console.log('~~~~~~~~~~~~~~~')
      console.log("~~clientStep---", lastClientReceivedStep);
      console.log("**serverStep---", lastServerSendedStep);
    }
  }


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
        console.log("2d!!!!!!!")
        refractionMatrixRows = message.matrix?.flat().length;
        break;
  
      case LAB_3D:
        console.log("3d!!!!!!!")
        refractionMatrixRows = message.matrix?.length;
        break;

      case LAB_3D_INTERFERENCE:
        console.log("INTERFERNCE")
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
      sourcePositionRelative: message.sourcePositionRelative || {x: 0, y:0},
    };
  };
  
  
async function sleep(ms: number) {
    let timeoutId: NodeJS.Timeout;
    await new Promise((resolve) => {
    timeoutId = setTimeout(resolve, ms);
  });
  clearTimeout(timeoutId);
}
  

async function newInterval3D(reload: boolean, send, obj?: InitDataObjectType) {
  clearInterval(intervalId);

  // Milliseconds.
  const TIME_INTERVAL_3D = 1000;
  const SLEEP_TIME = 500;
  
  

  // Initial data request.
  let data = addon.getData3D(
    obj.condition,
    reload,
    obj.refractionMatrix,
    obj.refractionMatrixRows,
    obj.returnDataNumber,
    obj.omegaMatrix,
  );

  const stepsPerInterval = 5;
  const reloadInInterval = false;
  intervalId = setInterval(async () => {

    const calculateAndSendNextLayer = async () => {
    for (let j = 0; j < stepsPerInterval; ++j) {
      data = addon.getData3D(
        obj.condition,
        reloadInInterval,
        obj.refractionMatrix,
        obj.refractionMatrixRows,
        obj.returnDataNumber,
        obj.omegaMatrix,
      );
    }

    lastServerSendedStep = data.currentTick;
    const dataToClient = {
      dataX: data.dataX,
      dataY: data.dataY,
      dataVal: data[obj.returnDataStr],
      step: data.currentTick,
      row: data.row,
      col: data.col,
      max: data.max,
      min: data.min,
    };
    testMemoryUsage()
    send(JSON.stringify(dataToClient));
  }

  // Waiting for synchronization between server and clent.
  // while
  if(lastClientReceivedStep < lastServerSendedStep) {
      sleep(SLEEP_TIME);
  } 
  calculateAndSendNextLayer();
  }, TIME_INTERVAL_3D);
}


async function newInterval2D(reload: boolean, send, obj: InitDataObjectType) {
    clearInterval(intervalId);
  
    const TIME_INTERVAL_2D = 500;

    const sourcePosition = [obj.sourcePositionRelative.x || 0, 0.5];
  
    // Initial data request.
    let data = addon.getData2D(
      obj.condition || [1,10,1],
      reload,
      obj.refractionMatrix,
      obj.refractionMatrixRows,
      sourcePosition,
      obj.omegaMatrix,
      // obj.returnDataNumber
    );
  
    const stepsPerInterval = 10;
    const reloadInInterval = false;
    
    intervalId = setInterval(async () => {
  
      for (let j = 0; j < stepsPerInterval; ++j) {
        data = addon.getData2D(
          obj.condition,
          reloadInInterval,
          obj.refractionMatrix,
          obj.refractionMatrixRows,
          sourcePosition,
          obj.omegaMatrix,
          );
      }
  
      lastServerSendedStep = data.currentTick;
      const dataToClient = {
        dataX: data.dataX,
        dataY: data.dataHy,
        step: data.currentTick,
        col: data.col,
      };
      testMemoryUsage()
      send(JSON.stringify(dataToClient));
    }, TIME_INTERVAL_2D);
  }