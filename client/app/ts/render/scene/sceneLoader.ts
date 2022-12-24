module qec {

    export class sceneLoader {
        load(dto: any): any {
            if (Array.isArray(dto)) {
                return dto.map(x => this.load(x));
            }

            switch (dto['type']) {
                case cameraDTO.TYPE: return new camera().createFrom(dto); break;
                case sdFields1DTO.TYPE: return new sdFields1().createFrom(dto); break;
                case sdFields2DTO.TYPE: return new sdFields2().createFrom(dto); break;
                case sdFields2BorderDTO.TYPE: return new sdFields2Border().createFrom(dto); break;
                case sdFields2ProfileBorderDTO.TYPE: return new sdFields2ProfileBorder().createFrom(dto); break;
                case sdFields2RadialDTO.TYPE: return new sdFields2Radial().createFrom(dto); break;
                default:
                    throw new Error(`unknown scene dto type : ${dto['type']}`);
            }
        }
    }
    /*
    export class scene {

        sdArray: signedDistance[];
        lights: ilight[] = [];
        camera: camera = new camera();
    }
    */
}