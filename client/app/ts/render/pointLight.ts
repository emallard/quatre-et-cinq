module qec {


    export class pointLightDTO {
        type: string;
        position: number[];
    }

    export class pointLight implements ilight {
        isLight = true;
        position = vec3.create();
        createFrom(dto: pointLightDTO) {
            vec3FromArray(this.position, dto.position);
        }
    }
}