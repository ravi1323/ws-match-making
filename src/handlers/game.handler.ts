import WebSocket from 'ws';
import { makeResponse } from '../helpers/response.helper.js';
import { deleteTable, getPlayer, getTable, setPlayer, setTable } from '../helpers/redis.helpers.js';
import { validatePlayGame } from '../middlewares/game.middleware.js';
import { MatchMakeData, Player, Table, Validation } from '../config/interface.config.js';
import { CONSTANTS } from '../config/constant.config.js';
import { v4 } from 'uuid'

export const playGame = async (data : any, wss: WebSocket.Server<WebSocket.WebSocket>, ws: WebSocket.WebSocket, eventName: string) : Promise<void> => {
    return new Promise(async (resolve, reject) => {
        try {

            /**
             * validate the playload,
             * REQUIRED : deviceId, entryFee
             */
            const isValid : Validation = validatePlayGame(data);
            if (!isValid.valid) {
                ws.send(makeResponse(isValid.errors));
            } else {

                /**
                 * is player exist or not.
                 */
                const player : Player = await getPlayer(data.deviceId);
                if (player) {

                    const tableData = await tryMatchMake({
                        entryFee: data.entryFee.toString(),
                        deviceId: data.deviceId
                    }, player);

                    global.logger.info("found player");
                    global.logger.info(tableData);

                    ws.send(makeResponse(tableData));
                    resolve()

                } else {

                    /**
                     * create new player
                     */
                    let newPlayer : Player = {
                        deviceId: data.deviceId,
                        tableId: "",
                        createdAt: new Date()
                    }

                    newPlayer = await setPlayer(newPlayer);
                    const tableData = await tryMatchMake({
                        entryFee: data.entryFee.toString(),
                        deviceId: data.deviceId
                    }, newPlayer);

                    global.logger.info("not found player");
                    global.logger.info(tableData);

                    ws.send(makeResponse(tableData));
                    resolve()
                }
            }

        } catch(e) {
            global.logger.error(e);
            ws.send(makeResponse({
                msg: `something went wrong : ${e.message}`
            }))
        }
    });
}

export const tryMatchMake = async (data: MatchMakeData, player: Player) : Promise<Table> => {
    return new Promise(async (resolve, reject) => {
        try {

            if (player.tableId === '') {

                /**
                 * check for one player space in playing mode Table
                 * TGP:[entryFee]
                 */
                let playingTable : Table = await getTable(data.entryFee);
                if (playingTable) {

                    playingTable.players.push(player);
                    playingTable = await setTable(playingTable);

                    if (!playingTable) reject(new Error('failed updating playingTable :: 1'));
                    else {
                        if (playingTable.players.length === CONSTANTS.GAME.MAX_PLAYER_PER_MATCH) {

                            /**
                             * delete the TGP:[entryFee] and set copy with TGP:[tableId]
                             */
                            playingTable = await deleteTable(playingTable.entryFee.toString());
                            if (!playingTable) reject(new Error('failed deleting playingTable :: 1'));

                            /**
                             * creating TGP:[tableId]
                             */
                            const fixedTable : Table = await setTable(playingTable, false, true);
                            resolve(fixedTable);

                        } else {
                            resolve(playingTable);
                        }
                    }


                } else {

                    /**
                     * check for one player space in empty waiting table.
                     */
                    let emptyTable : Table = await getTable(data.entryFee, true);
                    if (emptyTable) {

                        emptyTable.players.push(player);
                        emptyTable = await setTable(emptyTable, true);

                        if (!emptyTable) reject(new Error("failed updating emptyTable 1"));

                        /**
                         * check emptyTable is full or not,
                         */
                        if (emptyTable.players.length === CONSTANTS.GAME.MIN_PLAYER_TO_START) {

                            /**
                             * delete ET:[entryFee] and create TGP:[entryFee]
                             */
                            emptyTable = await deleteTable(emptyTable.entryFee.toString(), true);
                            if (!emptyTable) reject(new Error("failed deleting emptyTable 2"));

                            const newPlayingTable : Table = await setTable({
                                ...emptyTable,
                                isWaiting: false
                            });
                            if (!newPlayingTable) reject(new Error("failed creating newPlayingTable 1"));

                            resolve(newPlayingTable);

                        } else resolve(emptyTable);

                    } else {
                        /**
                         * create new empty table and set player on waitingMode.
                         */
                        const newTableId = v4();
                        let newEmptyTable : Table = {
                            entryFee: parseInt(data.entryFee, 10),
                            tableId: newTableId,
                            players: [player],
                            createdAt: new Date(),
                            isWaiting: true
                        }

                        newEmptyTable = await setTable(newEmptyTable, true);
                        if (!newEmptyTable) reject(new Error("failed creating new emptyTable 1"));
                        resolve(newEmptyTable);
                    }

                }

            } else {

                /**
                 * find table using tableId
                 */
                let fixedTable: Table = await getTable(player.tableId);
                if (fixedTable) {

                    resolve(fixedTable);

                } else {

                    // CODE_DUPLICATION __START : player.tableId === ''
                    /**
                     * check for one player space in playing mode Table
                     * TGP:[entryFee]
                     */
                    let playingTable : Table = await getTable(data.entryFee);
                    if (playingTable) {

                        playingTable.players.push(player);
                        playingTable = await setTable(playingTable);

                        if (!playingTable) reject(new Error('failed updating playingTable :: 1'));
                        else {
                            if (playingTable.players.length === CONSTANTS.GAME.MAX_PLAYER_PER_MATCH) {

                                /**
                                 * delete the TGP:[entryFee] and set copy with TGP:[tableId]
                                 */
                                playingTable = await deleteTable(playingTable.entryFee.toString());
                                if (!playingTable) reject(new Error('failed deleting playingTable :: 1'));

                                /**
                                 * creating TGP:[tableId]
                                 */
                                const fixedTable : Table = await setTable(playingTable, false, true);
                                resolve(fixedTable);

                            } else {
                                resolve(playingTable);
                            }
                        }


                    } else {

                        /**
                         * check for one player space in empty waiting table.
                         */
                        let emptyTable : Table = await getTable(data.entryFee, true);
                        if (emptyTable) {

                            emptyTable.players.push(player);
                            emptyTable = await setTable(emptyTable, true);

                            if (!emptyTable) reject(new Error("failed updating emptyTable 1"));

                            /**
                             * check emptyTable is full or not,
                             */
                            if (emptyTable.players.length === CONSTANTS.GAME.MIN_PLAYER_TO_START) {

                                /**
                                 * delete ET:[entryFee] and create TGP:[entryFee]
                                 */
                                emptyTable = await deleteTable(emptyTable.entryFee.toString(), true);
                                if (!emptyTable) reject(new Error("failed deleting emptyTable 2"));

                                const newPlayingTable : Table = await setTable({
                                    ...emptyTable,
                                    isWaiting: false
                                });
                                if (!newPlayingTable) reject(new Error("failed creating newPlayingTable 1"));

                                resolve(newPlayingTable);

                            } else resolve(emptyTable);

                        } else {
                            /**
                             * create new empty table and set player on waitingMode.
                             */
                            const newTableId = v4();
                            let newEmptyTable : Table = {
                                entryFee: parseInt(data.entryFee, 10),
                                tableId: newTableId,
                                players: [player],
                                createdAt: new Date(),
                                isWaiting: true
                            }

                            newEmptyTable = await setTable(newEmptyTable, true);
                            if (!newEmptyTable) reject(new Error("failed creating new emptyTable 1"));
                            resolve(newEmptyTable);
                        }

                    }
                    // CODE_DUPLICATION __END : player.tableId === ''
                }


            }

        } catch(e) {
            global.logger.error(e);
            reject(e);
        }
    })
}