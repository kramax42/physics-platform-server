const ws = require("ws");
//const addon = require('napi-addon-fdtd');
// var addon = require("../../napi-addon-fdtd/build/Release/napi-addon-fdtd.node");
var addon = require("../build-addon/Release/napi-addon-fdtd.node");
// import * as addon from "../build-addon/Release/napi-addon-fdtd.node";
// import { CONTINUE, PAUSE, START, CLOSE } from "../constants/ws-event.constants";
const START = 'start';
const PAUSE = 'pause';
const CONTINUE = 'continue';
const CLOSE = 'close';
const LAB_2D = '2D';
const LAB_3D = '3D';
const LAB_3D_INTERFERENCE = 'INTERFERENCE';
const port = process.env.PORT || 5001;
let intervalId;
const startSendingDataInit = (message) => {
    var _a, _b;
    // Unpacking request data.
    const currentDataType = message.type;
    let returnDataNumber;
    let getData;
    let dataToReturn;
    switch (currentDataType) {
        case LAB_2D:
            getData = addon.getFdtd2D;
            break;
        case LAB_3D:
            console.log("3d!!!!!!!");
            getData = addon.getFDTD_3D_DIFRACTION;
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
            break;
        case LAB_3D_INTERFERENCE:
            console.log("INTERFERNCE");
            getData = addon.getFDTD_3D_INTERFERENCE;
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
            break;
    }
    return {
        condition: message.condition,
        currentDataType,
        refractionMatrix: (_a = message.matrix) === null || _a === void 0 ? void 0 : _a.flat(),
        refractionMatrixRows: (_b = message.matrix) === null || _b === void 0 ? void 0 : _b.length,
        returnDataNumber,
        dataToReturn,
        returnDataStr: "data" + dataToReturn,
        getData,
    };
};
// Websocket server entry point.
const wss = new ws.Server({
    port,
}, () => console.log(`Server started on ${port}`));
let obj;
// Websocket handlers.
wss.on("connection", function connection(ws) {
    ws.on("message", async function (messageJSON) {
        const message = JSON.parse(messageJSON);
        switch (message.event) {
            case START:
                // Clear previous process.
                clearInterval(intervalId);
                console.log("start sending data");
                obj = startSendingDataInit(message);
                newInterval(true, ws.send.bind(ws), obj);
                break;
            case PAUSE:
                clearInterval(intervalId);
                console.log("pause sending data");
                break;
            case CONTINUE:
                newInterval(false, ws.send.bind(ws), obj);
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
    });
});
// Milliseconds.
const TIME_INTERVAL = 650;
async function newInterval(reload, send, obj) {
    intervalId = null;
    // Initial data request.
    let data = await obj.getData(obj.condition, reload, obj.refractionMatrix, obj.refractionMatrixRows, obj.returnDataNumber);
    const stepsPerInterval = 5;
    const reloadInInterval = false;
    intervalId = setInterval(async () => {
        for (let j = 0; j < stepsPerInterval; ++j) {
            data = await obj.getData(obj.condition, reloadInInterval, obj.refractionMatrix, obj.refractionMatrixRows, obj.returnDataNumber);
        }
        const dataToClient = {
            dataX: data.dataX,
            dataY: data.dataY,
            dataVal: data[obj.returnDataStr],
            step: data.currentTick,
            row: data.row,
            col: data.col,
        };
        send(JSON.stringify(dataToClient));
    }, TIME_INTERVAL);
}
//# sourceMappingURL=server.js.map