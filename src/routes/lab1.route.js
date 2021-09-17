const express = require('express');
const addon = require('napi-addon-fdtd');

const EventEmitter = require('events')
const emitter = new EventEmitter();

const lab1Router = express.Router();
let intervalId = null;

lab1Router.get('/connect', (req, res) => {
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
        if(intervalId) {
            clearInterval(intervalId);
            console.log('App closed. Interval cleared');
        }

    });
})

lab1Router.post('/nextLayer', ((req, res) => {
    let { lambda, tau, n1, reload, type } = req.body;

    stopInterval();
    newIntervalLab1([lambda, tau, n1], reload);

    res.status(200)
    res.json({ lambda, tau, n1 })
}))

lab1Router.get('/pause', ((req, res) => {
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

const newIntervalLab1 = async ( condition, reload = true) => {

    let data = await addon.getFDTD_2D(condition, reload);
    emitter.emit('newDataLab1', data);

    intervalId = setInterval(async () => {
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


module.exports = lab1Router;