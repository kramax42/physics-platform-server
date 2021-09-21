const express = require('express');
const addon = require('napi-addon-fdtd');

const EventEmitter = require('events')
const emitter = new EventEmitter();

const lab2Router = express.Router();
let intervalId = null;

lab2Router.get('/connect', (req, res) => {
    res.writeHead(200, {
        'Connection': 'keep-alive',
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
    })
    console.log("connected")
    emitter.on('newDataLab2', ({dataX, dataY, dataEz, dataHy, dataHx, dataEnergy, step, row, col}) => {
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
        if(intervalId) {
            clearInterval(intervalId);
            console.log('App closed. Interval cleared');
        }

    });
})

lab2Router.post('/nextLayer', ((req, res) => {
    let { lambda, beamsize, n1, reload, type } = req.body;

    // Closing previous interval.
    stopInterval();
    newIntervalLab2([lambda, beamsize, n1], reload);
    // let data = await addon.getFDTD_3D(condition, reload);
    // for(let j = 0; j < 100; ++j){
    //     data = await addon.getFDTD_3D(condition, false);
    // }
    // emitter.emit('newDataLab2', data);

    res.status(200)
    res.json({ lambda, beamsize, n1 })
}))

lab2Router.get('/pause', ((req, res) => {
    stopInterval();
    res.status(200);
    res.json({ message: "Data sending paused" });
}))

const stopInterval = () => {
    if( intervalId ) {
        clearInterval(intervalId);
        console.log('Interval cleared');
    }
}

const newIntervalLab2 = async ( condition, reload = true) => {


    let data = await addon.getFDTD_3D_INTERFERENCE(condition, reload);
    //emitter.emit('newDataLab2', data);

    intervalId = setInterval(async () => {
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

        emitter.emit('newDataLab2', data);
    }, 500)
}

module.exports = lab2Router;
