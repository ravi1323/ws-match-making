import { CONSTANTS } from "../config/constant.config.js"
import { Validation } from "../config/interface.config.js"

export const validateNewEvent = (data: any) : Validation => {
    const errors = {
        en: []
    }

    if (!data.en || data.en === '') errors.en.push("'en' is required.")
    else if (!Object.keys(CONSTANTS.SOCKET.EVENTS.REQUEST).includes(data.en)) errors.en.push("'en' is not valid.")

    if (
        errors.en.length > 0
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