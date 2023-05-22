import { CONSTANTS } from "../config/constant.config.js";
import { Validation } from "../config/interface.config.js"
import { makeResponse } from "../helpers/response.helper.js";
import { validateNewEvent } from "../middlewares/wss.middleware.js"
import WebSocket from 'ws';
import { playGame } from "./game.handler.js";

var handler = {}

handler[`${CONSTANTS.SOCKET.EVENTS.REQUEST.PLAY_GAME}`] = async (data: any, wss: WebSocket.Server<WebSocket.WebSocket>, ws: WebSocket.WebSocket, eventName) => await playGame(data, wss, ws, eventName)

export const wssHandler = (data : object, wss: WebSocket.Server<WebSocket.WebSocket>, ws: WebSocket.WebSocket) => {
    const isValid : Validation = validateNewEvent(data);

    if (!isValid.valid) {
        ws.send(makeResponse(isValid.errors));
    } else {
        let eventName = data['en']
        handler[eventName](data, wss, ws, eventName);
    }
}