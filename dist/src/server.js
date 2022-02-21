"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const addon = __importStar(require("napi-addon-fdtd"));
const ws_event_constants_1 = require("../constants/ws-event.constants");
const data_type_constants_1 = require("../constants/data-type.constants");
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
        case data_type_constants_1.LAB_2D:
            getData = addon.getFdtd2D;
            break;
        case data_type_constants_1.LAB_3D:
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
        case data_type_constants_1.LAB_3D_INTERFERENCE:
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
const wss = new ws_1.Server({
    port,
}, () => console.log(`Server started on ${port}`));
let obj;
// Websocket handlers.
wss.on("connection", function connection(ws) {
    ws.on("message", async function (messageJSON) {
        const message = JSON.parse(messageJSON);
        switch (message.event) {
            case ws_event_constants_1.START:
                // Clear previous process.
                clearInterval(intervalId);
                console.log("start sending data");
                obj = startSendingDataInit(message);
                newInterval(true, ws.send.bind(ws), obj);
                break;
            case ws_event_constants_1.PAUSE:
                clearInterval(intervalId);
                console.log("pause sending data");
                break;
            case ws_event_constants_1.CONTINUE:
                newInterval(false, ws.send.bind(ws), obj);
                console.log("continue sending data");
                break;
            case ws_event_constants_1.CLOSE:
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
// const  SERVER_URL="ws://physics-platform-server.herokuapp.com/"
//# sourceMappingURL=server.js.map