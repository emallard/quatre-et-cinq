module qec {

    export class sceneLoader {
        load(dto: any): any {
            if (Array.isArray(dto)) {
                return dto.map(x => this.load(x));
            }

            switch (dto['type']) {
                case cameraDTO.TYPE: return new camera().createFrom(dto);
                case sdFields1DTO.TYPE: return new sdFields1().createFrom(dto);
                case sdFields2DTO.TYPE: return new sdFields2().createFrom(dto);
                case sdFields2BorderDTO.TYPE: return new sdFields2Border().createFrom(dto);
                case sdFields2ProfileBorderDTO.TYPE: return new sdFields2ProfileBorder().createFrom(dto);
                case sdFields2RadialDTO.TYPE: return new sdFields2Radial().createFrom(dto);
                case sdFields2SkeletonDTO.TYPE: return new sdFields2Skeleton().createFrom(dto);
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