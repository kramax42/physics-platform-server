import * as WebSocket from 'ws';
import * as addon from 'napi-addon-fdtd';

import { LAB_2D, LAB_3D, LAB_3D_INTERFERENCE } from '../../constants/data-type.constants';
import { CLOSE, CONTINUE, PAUSE, START } from '../../constants/ws-event.constants';
import { dataToReturnType, dataType, InitDataObjectType, startMessageType } from '../../types/types';

var os = require('os');



let memoryAll = 0;

function testMemoryUsage() {
  const used = process.memoryUsage().heapUsed / 1024 / 1024;
  memoryAll += used;
  console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
  console.log(`all memory ${memoryAll} MB`);
  console.log(`Free mem ${Math.round(os.freemem() * 100) / 100} MB`);
  console.log(`Total mem ${Math.round(os.totalmem() * 100) / 100} MB`);
  

}


let intervalId;
let lastClientReceivedStep = 0;
let lastServerSendedStep = 0;

type sendType = {
    data: any;
     cb?: (err?: Error) => void
    }

type stepMessageType = {step: number};


export const onMessage  = async (messageJSON: WebSocket.Data, send): Promise<void> => {
    const message: startMessageType | stepMessageType = JSON.parse(messageJSON.toString());


    // const message = JSON.parse(messageJSON.toString());
    if("event" in message) {
        clearInterval(intervalId);
        console.log("start sending data");
        lastClientReceivedStep = 0;
        lastServerSendedStep = 0;



        const condition = [1, 10]

        let reload = true;
        let data = addon.getData3D(condition, reload, [1,2,1,1], 2, 0);
      
        // Milliseconds.
        const TIME_INTERVAL_3D = 500;
        const stepsPerInterval = 8;
        intervalId = setInterval(async () => {

        reload = false;
        // for (let j = 0; j < 150; ++j) {
        //   //eps, epsSize
        //   data = addon.getData3D(condition, reload, [1,2,1,1], 2, 0);
        // }

        for (let j = 0; j < stepsPerInterval; ++j) {
          data =  addon.getData3D(
            message.condition,
            reload,
            [4,5,6,7],
            2,
            0,
          );
        }
        const dataToClient = {
          dataX: data.dataX,
          dataY: data.dataY,
          dataVal: data["dataEz"],
          step: data.currentTick,
          row: data.row,
          col: data.col,
          max: data.max,
          min: data.min,
        };
        testMemoryUsage()
        send(JSON.stringify(dataToClient));
      }, TIME_INTERVAL_3D)

  }
}

  
  
  
