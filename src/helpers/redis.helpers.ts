import { CONSTANTS } from "../config/constant.config.js";
import { Player, Table } from "../config/interface.config.js";
import { redisClient } from "../services/redis.service.js";

export const getPlayer = async (deviceId: string) : Promise<Player> => {
    return new Promise(async (resolve, reject) => {
        try {

            const KEY = `${CONSTANTS.REDIS.PLAYER_PREFIX}:${deviceId}`;
            const player = await redisClient.get(KEY);
            const resolve_data = player ? JSON.parse(player) : null;
            resolve(resolve_data);

        } catch(e) {
            global.logger.error(e);
            reject(e);
        }
    })
}

export const setPlayer = async (player: Player) : Promise<Player> => {
    return new Promise(async (resolve, reject) => {
        try {

            const KEY = `${CONSTANTS.REDIS.PLAYER_PREFIX}:${player.deviceId}`;
            const status = await redisClient.set(KEY, JSON.stringify(player));
            const resolve_data = status === 'OK' ? player : null;
            resolve(resolve_data);

        } catch(e) {
            global.logger.error(e);
            reject(e);
        }
    })
}

export const deletePlayer = async (deviceId: string) : Promise<Player> => {
    return new Promise(async (resolve, reject) => {
        try {

            const KEY = `${CONSTANTS.REDIS.PLAYER_PREFIX}:${deviceId}`;
            let player = await redisClient.get(KEY);
            if (player) {
                await redisClient.del(KEY);
                resolve(player);
            } else resolve(null);

        } catch(e) {
            global.logger.error(e);
            reject(e);
        }
    })
}

export const getTable = async (tableIdOrEntryFee: string, isEmptyTable: boolean = false) : Promise<Table> => {
    return new Promise(async (resolve, reject) => {
        try {
            let KEY : string = isEmptyTable ? `${CONSTANTS.REDIS.ET_TABLE_PREFIX}:${tableIdOrEntryFee}` : `${CONSTANTS.REDIS.TABLE_PREFIX}:${tableIdOrEntryFee}`;

            const table = await redisClient.get(KEY);
            const resolve_data = table ? JSON.parse(table) : null
            resolve(resolve_data)

        } catch(e) {
            global.logger.error(e);
            reject(e);
        }
    })
}

export const setTable = async (table: Table, isEmptyTable: boolean = false, withTableId: boolean = false) : Promise<Table> => {
    return new Promise(async (resolve, reject) => {
        try {
            let KEY : string = isEmptyTable ? `${CONSTANTS.REDIS.ET_TABLE_PREFIX}:${table.entryFee}` : `${CONSTANTS.REDIS.ET_TABLE_PREFIX}:${withTableId ? table.tableId : table.entryFee}`;
            global.logger.info(KEY);
            const status = await redisClient.set(KEY, JSON.stringify(table));
            const resolve_data = status === 'OK' ? table : null;
            resolve(resolve_data);

        } catch(e) {
            global.logger.error(e)
            reject(e);
        }
    })
}

export const deleteTable = async (tableIdOrEntryFee: string, isEmptyTable: boolean = false) : Promise<Table> => {
    return new Promise(async (resolve, reject) => {
        try {

            let KEY : string = isEmptyTable ? `${CONSTANTS.REDIS.ET_TABLE_PREFIX}:${tableIdOrEntryFee}` : `${CONSTANTS.REDIS.TABLE_PREFIX}:${tableIdOrEntryFee}`;

            const foundTable = await getTable(tableIdOrEntryFee, isEmptyTable);
            if (foundTable) {
                await redisClient.del(KEY);
                resolve(foundTable);
            } else resolve(null);

        } catch(e) {
            global.logger.error(e);
            reject(e);
        }
    })
}