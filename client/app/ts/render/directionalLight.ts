module qec {

    export class directionalLightDTO
    {
        type:string;
        position:number[];
        direction:number[];
        intensity:number;
    }

    export class directionalLight implements ilight
    {
        position = vec3.create();
        direction = vec3.create();
        intensity = 1;

        createFrom(dto:directionalLightDTO)
        {
            vec3FromArray(this.position, dto.position);
            vec3FromArray(this.direction, dto.direction);
            this.intensity = dto.intensity;

            vec3.normalize(this.direction, this.direction);
        }
    }
}