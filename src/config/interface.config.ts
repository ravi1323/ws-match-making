export interface Validation {
    valid: boolean;
    errors?: object;
}

export interface Player {
    deviceId: string,
    tableId: string,
    createdAt: Date
}

export interface Table {
    entryFee: number,
    tableId: string,
    players: Player[],
    createdAt: Date,
    isWaiting: boolean
}

export interface MatchMakeData {
    deviceId: string,
    entryFee: string
}