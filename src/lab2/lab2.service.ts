import * as express from "express";
//const EventEmitter = require('events')
import { EventEmitter } from 'events';

const addon = require('napi-addon-fdtd');

const emitter = new EventEmitter();

export class Lab2Service {

  private intervalId = null;

  public connectWebSocket = (req: express.Request, res: express.Response) => {
    res.writeHead(200, {
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    })
    console.log("connected to lab2 websocket")
    emitter.on('newData', ({ dataX, dataY, dataEz, dataHy, dataHx, dataEnergy, step, row, col }) => {
      res.write(`data: ${JSON.stringify(
        {
          dataX,
          dataY,
          dataEz,
          dataHy,
          dataHx,
          dataEnergy,
          step,
          row,
          col
        })} \n\n`);
    })

    req.on("close", function() {
      // Breaks the interval loop on client disconnected
      if(this.intervalId) {
        clearInterval(this.intervalId);
        console.log('App closed. Interval cleared');
      }
    });
  }

  public nextLayer = ((req: express.Request, res: express.Response) => {
    let { lambda, beamsize, n1, reload, type } = req.body;

    // Closing previous interval.
    this.stopInterval();
    this.newInterval([lambda, beamsize, n1], reload);

    res.status(200)
    res.json({ lambda, beamsize, n1 })
  })

  public pause = ((req: express.Request, res: express.Response) => {
    this.stopInterval();
    res.status(200);
    res.json({ message: "Data sending paused" });
  })

  private stopInterval = () => {
    if(this.intervalId ) {
      clearInterval(this.intervalId);
      console.log('Interval cleared');
    }
  }

  private newInterval = async ( condition, reload = true) => {
    let data = await addon.getFDTD_3D_INTERFERENCE(condition, reload);

    this.intervalId = setInterval(async () => {
      for(let j = 0; j < 10; ++j){
        data = await addon.getFDTD_3D_INTERFERENCE(condition, false);
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

      emitter.emit('newData', data);
    }, 500)
  }
}