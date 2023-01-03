module qec {

    export class thicknessUpdater extends updaterBase {
        sd: sdFields1;
        thickness0: number;
        thickness1: number;

        constructor(
            sd: sdFields1,
            thickness0: number,
            thickness1: number,
        ) {
            super();
            this.sd = sd;
            this.thickness0 = thickness0;
            this.thickness1 = thickness1;
            if (!(this.sd instanceof sdFields1))
                throw new Error('wrong sd type');
        }

        override update(t: number): void {
            let r = (t - this.t0) / (this.t1 - this.t0);
            this.sd.setThickness(mix(this.thickness0, this.thickness1, r));
        }

        override stop(): void {
            this.sd.setThickness(this.thickness1);
        }
    }

}