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


        static getAllDTO(dtos: any[]): any[] {
            let results = [];
            for (let dto of dtos) {
                getAllSignedDistances.getRecDTO(dto, results);
            }
            return results;
        }

        static getRecDTO(dto: any, result: any[]) {
            result.push(dto);
            if (dto.type == sdUnionDTO.TYPE) {
                for (let a of dto.array)
                    this.getRecDTO(a, result);
            }
            else if (dto.type == sdSubtractionDTO.TYPE) {
                getAllSignedDistances.getRecDTO(dto.a, result);
                getAllSignedDistances.getRecDTO(dto.b, result);
            }
        }
    }
}