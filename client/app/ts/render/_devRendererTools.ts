module qec {

    export class devRendererTools {

        static createLights(isDirectional: boolean, camTarget: Float32Array): ilight[] {
            if (isDirectional) {
                let lightDto = new directionalLightDTO();
                lightDto.direction = [1, 1, -1];
                lightDto.intensity = 1;

                let light = new directionalLight();
                light.createFrom(lightDto);

                return [light];
            }
            else {
                let lights = [];
                {
                    let lightDto = new spotLightDTO()
                    let dist = 300;
                    lightDto.direction = [1, 1, -1];
                    lightDto.position = [
                        camTarget[0] - dist * lightDto.direction[0],
                        camTarget[1] - dist * lightDto.direction[1],
                        camTarget[2] - dist * lightDto.direction[2]];
                    lightDto.intensity = 0.8;

                    let light = new spotLight();
                    light.createFrom(lightDto);
                    lights.push(light);
                }
                {
                    let lightDto = new spotLightDTO()
                    let dist = 300;
                    lightDto.direction = [-1, 1, -1];
                    lightDto.position = [
                        camTarget[0] - dist * lightDto.direction[0],
                        camTarget[1] - dist * lightDto.direction[1],
                        camTarget[2] - dist * lightDto.direction[2]];
                    lightDto.intensity = 0.1;

                    let light = new spotLight();
                    light.createFrom(lightDto);
                    lights.push(light);
                }
                return lights;
            }
        }

        static createGrid(camTarget: Float32Array): signedDistance {
            let transform = mat4.create();
            mat4.identity(transform);
            mat4.translate(transform, transform, vec3.fromValues(camTarget[0], camTarget[1], 0));
            let grid = new sdGrid();
            grid.createFrom({
                type: sdGridDTO.TYPE,
                size: 10,
                thickness: 0.5,
                material: {
                    type: materialDTO.TYPE,
                    diffuse: [1, 1, 1]
                },
                transform: transform
            });
            return grid;
        }
    }
}