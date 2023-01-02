module qec {

    export class getAllSignedDistances {

        static getAll(sd: signedDistance): signedDistance[] {
            let results = [];
            getAllSignedDistances.getRec(sd, results);
            return results;
        }

        static getRec(sd: signedDistance, result: signedDistance[]) {
            result.push(sd);
            if (sd instanceof sdUnion) {
                for (let a of sd.array)
                    this.getRec(a, result);
            }
            else if (sd instanceof sdSubtraction) {
                getAllSignedDistances.getRec(sd.A, result);
                getAllSignedDistances.getRec(sd.B, result);
            }
        }
    }
}