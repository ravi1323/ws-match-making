import { Validation } from "../config/interface.config.js";

export const validatePlayGame = (data: any) : Validation => {
    const errors = {
        deviceId: [],
        entryFee: []
    }

    if (!data.deviceId || data.deviceId === '') errors.deviceId.push("'deviceId' is required.")
    if (!data.entryFee || data.entryFee === '') errors.entryFee.push("'entryFee' is required.")
    else if (!Number.isInteger(data.entryFee)) errors.entryFee.push("'entryFee' is not a number.")

    if (
        errors.deviceId.length > 0 ||
        errors.entryFee.length > 0
    ) {
        Object.keys(errors).map( (key: string, index: number) : void => {
            if (errors[key].length < 1) delete errors[key];
        })
        return {
            valid: false,
            errors: errors
        }
    } else return {
        valid: true
    }
}