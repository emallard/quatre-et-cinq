module qec {

    export class directionalLightDTO
    {
        type:string;
        direction:number[];
        intensity:number;
    }

    export class directionalLight implements ilight
    {
        direction = vec3.create();
        intensity = 0.5;

        createFrom(dto:directionalLightDTO)
        {
            vec3FromArray(this.direction, dto.direction);
            this.intensity = dto.intensity;

            vec3.normalize(this.direction, this.direction);
        }
    }
}