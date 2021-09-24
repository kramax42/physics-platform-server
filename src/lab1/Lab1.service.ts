import * as express from "express";

const addon = require('napi-addon-fdtd');

const EventEmitter = require('events')
const emitter = new EventEmitter();

export class Lab1Service {

  private intervalId = null;
  // constructor() {
  // }

  public connectWebSocket = (req: express.Request, res: express.Response) => {
    res.writeHead(200, {
      'Connection': 'keep-alive',
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    })
    console.log("connected")
    emitter.on('newDataLab1', ({dataX, dataY, step, row, col}) => {
      res.write(`data: ${JSON.stringify(
        {
          dataX,
          dataY,
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
    let { lambda, tau, n1, reload, type } = req.body;

    this.stopInterval();
    this.newIntervalLab1([lambda, tau, n1], reload);

    res.status(200)
    res.json({ lambda, tau, n1, type })
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

  private newIntervalLab1 = async ( condition, reload = true) => {

    let data = await addon.getFDTD_2D(condition, reload);
    emitter.emit('newDataLab1', data);

    this.intervalId = setInterval(async () => {
      data = await addon.getFDTD_2D(condition, false);
      data = {
        dataX: data.dataX,
        dataY: data.dataY,
        step: data.currentTick,
        row: 1,
        col: data.col}

      emitter.emit('newDataLab1', data);
    }, 100)
  }


}