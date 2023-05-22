import pinoms from 'pino-multi-stream';
import * as PinoLogger from 'pino';
import fs from 'fs';
import {dirname, join} from 'path'
import { fileURLToPath } from 'url';
import WebSocket, { WebSocketServer } from 'ws';
import dotenv from 'dotenv'
import { createServer } from 'https';
import bufferUtil from 'bufferutil';
import crypto from 'crypto'
import { wssHandler } from './handlers/wss.handler.js';
import { connectToRedis } from './services/redis.service.js';

dotenv.config();

process.env.TZ = "Asia/Calcutta";

const fileName = fileURLToPath(import.meta.url);
const dirName = dirname(fileName);


/**
 * register logger for development env...
 */
const streams = [
    { stream: process.stdout },
    { stream: fs.createWriteStream(join(dirName, '../logs/info.log'), { flags: 'a' }) },
]


const logger = PinoLogger.pino({
    level: process.env.PINO_LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true
        }
    }
}, pinoms.multistream(streams));

PinoLogger.destination(join(dirName, '../logs/info.log'))
global.logger = logger;

connectToRedis().then(() => {
    const server = createServer({
        key: fs.readFileSync(join(dirName, '../ssl/new/artoon.key'), 'utf-8'),
        cert: fs.readFileSync(join(dirName, '../ssl/new/artoon.crt'), 'utf-8')
    });
    
    
    const wss = new WebSocketServer({ server });
    
    wss.on('connection', function connection(ws, req) {
        global.logger.info(req.socket.remoteAddress)
        ws.on('error', console.error);
    
        ws.on('message', (data) => wssHandler(JSON.parse(data.toString('utf8')), wss, ws));
    
        ws.on('close', (code, reason) => {
            global.logger.info(code)
            global.logger.info(reason)
        })
    });
    
    server.listen(parseInt(process.env.PORT, 10) || 8080, () => global.logger.info(`https server listening on port : ${parseInt(process.env.PORT, 10) || 8080}`));
}).catch(e => {
    global.logger.error(e);
})


// * Error Handle ....
process
    .on('unhandledRejection', (response, p) => {
        logger.error(response);
        logger.error(p);

    })
    .on('uncaughtException', (err) => {
        logger.error(err);
    });