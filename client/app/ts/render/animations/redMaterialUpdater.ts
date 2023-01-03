module qec {

    export class redMaterialUpdater extends updaterBase {
        sd: signedDistance;
        constructor(sd: signedDistance) {
            super();
            this.sd = sd;
        }

        override start(done: () => void): void {
            this.sd.getMaterial(null).setDiffuse(1, 0.5, 0.5);
            done();
        }

        override stop(): void {
            this.sd.getMaterial(null).setDiffuse(1, 1, 1);
        }
    }
}