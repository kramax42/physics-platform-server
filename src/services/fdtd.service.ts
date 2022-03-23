import * as WebSocket from 'ws';
import * as addon from 'napi-addon-fdtd';

import { LAB_2D, LAB_3D, LAB_3D_INTERFERENCE } from '../../constants/data-type.constants';
import { CLOSE, CONTINUE, PAUSE, START } from '../../constants/ws-event.constants';
import { dataToReturnType, dataType, InitDataObjectType, startMessageType } from '../../types/types';


let intervalId;
let obj: InitDataObjectType;
let lastClientReceivedStep = 0;
let lastServerSendedStep = 0;

type sendType = {
    data: any;
     cb?: (err?: Error) => void}

type stepMessageType = {step: number};

export const onMessage  = async (messageJSON: WebSocket.Data, send: sendType): Promise<void> => {
    const message: startMessageType | stepMessageType = JSON.parse(messageJSON.toString());

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
      console.log("serverStep---", lastServerSendedStep);
    }
  }


  const startSendingDataInit = (
    message: startMessageType
  ): InitDataObjectType => {
  
    // Unpacking request data.
    const currentDataType: dataType = message.type;
  
    let returnDataNumber: number;
  
    let getData;
    let dataToReturn: dataToReturnType;
  
    switch (currentDataType) {
      
      case LAB_2D:
        console.log("2d!!!!!!!")
        getData = addon.getData2D;
        // newInterval = newInterval2D;
        break;
  
      case LAB_3D:
        console.log("3d!!!!!!!")
        getData = addon.getData3D;
        break;
        case LAB_3D_INTERFERENCE:
          console.log("INTERFERNCE")
        getData = addon.getFDTD_3D_INTERFERENCE;
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
      refractionMatrixRows: message.matrix?.flat().length,
      returnDataNumber,
      dataToReturn,
      returnDataStr: "data" + dataToReturn,
      getData,
    };
  };
  
  
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
  

async function newInterval3D(reload: boolean, send, obj?: InitDataObjectType) {
  clearInterval(intervalId);

  // Milliseconds.
  const TIME_INTERVAL_3D = 450;
  const SLEEP_TIME = 300;

  // Initial data request.
  let data =  obj.getData(
    obj.condition,
    reload,
    obj.refractionMatrix,
    obj.refractionMatrixRows,
    obj.returnDataNumber
  );

  const stepsPerInterval = 5;
  const reloadInInterval = false;
  intervalId = setInterval(async () => {

    const calculateAndSendNextLayer = async () => {
    for (let j = 0; j < stepsPerInterval; ++j) {
      data =  obj.getData(
        obj.condition,
        reloadInInterval,
        obj.refractionMatrix,
        obj.refractionMatrixRows,
        obj.returnDataNumber
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
    };
    send(JSON.stringify(dataToClient));
  }

  // Waiting for synchronization between server and clent.
  while(lastClientReceivedStep < lastServerSendedStep) {
      sleep(SLEEP_TIME);
  } 
  calculateAndSendNextLayer();
  }, TIME_INTERVAL_3D);
}


async function newInterval2D(reload: boolean, send, obj: InitDataObjectType) {
    clearInterval(intervalId);
  
    console.log(obj)


    const TIME_INTERVAL_2D = 70;

    const eps0 = 4.85418e-12;
    const epsilonVectorSize = 8;
    const epsilonVector = Array(epsilonVectorSize).fill(eps0);
    epsilonVector[4] = eps0*3;
    epsilonVector[6] = eps0*3;

    const getData = addon.getData2D;

    // Initial data request.
    let data = await getData(
      obj.condition || [1,10,1],
      reload,
      obj.refractionMatrix,
      obj.refractionMatrixRows,
      // obj.returnDataNumber
    );
  
    const stepsPerInterval = 1;
    const reloadInInterval = false;
    
    intervalId = setInterval(async () => {
  
      for (let j = 0; j < stepsPerInterval; ++j) {
        data = await getData(
          obj.condition,
          reloadInInterval,
          obj.refractionMatrix || epsilonVector,
          obj.refractionMatrixRows || epsilonVectorSize,
          );
      }
  
      lastServerSendedStep = data.currentTick;
      const dataToClient = {
        dataX: data.dataX,
        dataY: data.dataHy,
        step: data.currentTick,
        col: data.col,
      };
      send(JSON.stringify(dataToClient));
    }, TIME_INTERVAL_2D);
  }