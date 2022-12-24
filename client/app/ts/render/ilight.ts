module qec {

    export function instanceOfLight(object: any): object is ilight {
        return 'isLight' in object
    }

    export interface ilight {
        isLight: boolean;
    }
}