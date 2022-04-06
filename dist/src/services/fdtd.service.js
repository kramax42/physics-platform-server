"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
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
exports.onMessage = void 0;
const addon = __importStar(require("napi-addon-fdtd"));
const data_type_constants_1 = require("../../constants/data-type.constants");
const ws_event_constants_1 = require("../../constants/ws-event.constants");
let intervalId;
let obj;
let lastClientReceivedStep = 0;
let lastServerSendedStep = 0;
const onMessage = async (messageJSON, send) => {
    const message = JSON.parse(messageJSON.toString());
    // const message = JSON.parse(messageJSON.toString());
    if ("event" in message) {
        switch (message.event) {
            case ws_event_constants_1.START:
                // Clear previous process.
                clearInterval(intervalId);
                console.log("start sending data");
                obj = startSendingDataInit(message);
                lastClientReceivedStep = 0;
                lastServerSendedStep = 0;
                message.type !== '2D'
                    ? newInterval3D(true, send, obj)
                    : newInterval2D(true, send, obj);
                break;
            case ws_event_constants_1.PAUSE:
                clearInterval(intervalId);
                console.log("pause sending data");
                break;
            case ws_event_constants_1.CONTINUE:
                // newInterval(false, send, obj);
                message.type !== '2D'
                    ? newInterval3D(false, send, obj)
                    : newInterval2D(false, send, obj);
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
    }
    else if ("step" in message) {
        lastClientReceivedStep = (message.step) || 0;
        console.log('~~~~~~~~~~~~~~~');
        console.log("~~clientStep---", lastClientReceivedStep);
        console.log("serverStep---", lastServerSendedStep);
    }
};
exports.onMessage = onMessage;
const startSendingDataInit = (message) => {
    var _a, _b, _c, _d, _e;
    // Unpacking request data.
    const currentDataType = message.type;
    let returnDataNumber;
    let getData;
    let dataToReturn;
    let refractionMatrixRows;
    // const sourcePositionRelateive = message.
    switch (currentDataType) {
        case data_type_constants_1.LAB_2D:
            console.log("2d!!!!!!!");
            getData = addon.getData2D;
            // newInterval = newInterval2D;
            refractionMatrixRows = (_a = message.matrix) === null || _a === void 0 ? void 0 : _a.flat().length;
            break;
        case data_type_constants_1.LAB_3D:
            console.log("3d!!!!!!!");
            getData = addon.getData3D;
            refractionMatrixRows = (_b = message.matrix) === null || _b === void 0 ? void 0 : _b.length;
            break;
        case data_type_constants_1.LAB_3D_INTERFERENCE:
            console.log("INTERFERNCE");
            getData = addon.getFDTD_3D_INTERFERENCE;
            refractionMatrixRows = (_c = message.matrix) === null || _c === void 0 ? void 0 : _c.length;
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
        refractionMatrix: (_d = message.matrix) === null || _d === void 0 ? void 0 : _d.flat(),
        omegaMatrix: (_e = message.omegaMatrix) === null || _e === void 0 ? void 0 : _e.flat(),
        refractionMatrixRows,
        returnDataNumber,
        dataToReturn,
        returnDataStr: "data" + dataToReturn,
        getData,
        sourcePositionRelative: message.sourcePositionRelative || { x: 0, y: 0 },
    };
};
function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
async function newInterval3D(reload, send, obj) {
    clearInterval(intervalId);
    // Milliseconds.
    const TIME_INTERVAL_3D = 450;
    const SLEEP_TIME = 300;
    console.log(obj);
    // Initial data request.
    let data = obj.getData(obj.condition, reload, obj.refractionMatrix, obj.refractionMatrixRows, obj.returnDataNumber, obj.omegaMatrix);
    const stepsPerInterval = 5;
    const reloadInInterval = false;
    intervalId = setInterval(async () => {
        const calculateAndSendNextLayer = async () => {
            for (let j = 0; j < stepsPerInterval; ++j) {
                data = obj.getData(obj.condition, reloadInInterval, obj.refractionMatrix, obj.refractionMatrixRows, obj.returnDataNumber, obj.omegaMatrix);
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
        };
        // Waiting for synchronization between server and clent.
        while (lastClientReceivedStep < lastServerSendedStep) {
            sleep(SLEEP_TIME);
        }
        calculateAndSendNextLayer();
    }, TIME_INTERVAL_3D);
}
async function newInterval2D(reload, send, obj) {
    clearInterval(intervalId);
    const TIME_INTERVAL_2D = 70;
    const eps0 = 4.85418e-12;
    const epsilonVectorSize = 8;
    const epsilonVector = Array(epsilonVectorSize).fill(eps0);
    epsilonVector[4] = eps0 * 3;
    epsilonVector[6] = eps0 * 3;
    const getData = addon.getData2D;
    const sourcePosition = [obj.sourcePositionRelative.x || 0, 0.5];
    //  console.log(sourcePosition);
    // Initial data request.
    let data = await getData(obj.condition || [1, 10, 1], reload, obj.refractionMatrix, obj.refractionMatrixRows, sourcePosition, obj.omegaMatrix);
    const stepsPerInterval = 1;
    const reloadInInterval = false;
    intervalId = setInterval(async () => {
        for (let j = 0; j < stepsPerInterval; ++j) {
            data = await getData(obj.condition, reloadInInterval, obj.refractionMatrix, obj.refractionMatrixRows, sourcePosition, obj.omegaMatrix);
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
//# sourceMappingURL=fdtd.service.js.map