module qec {

    export class borderUpdater extends updaterBase {
        sd: sdFields2Border;

        dto0: partBorderDTO;
        dto1: partBorderDTO;

        interpolator = new dfColumnInterpolatorBorder();

        constructor(
            sd: sdFields2Border,
            dto0: partBorderDTO,
            dto1: partBorderDTO
        ) {
            super();
            this.sd = sd;
            this.dto0 = dto0;
            this.dto1 = dto1;
            if (this.dto0 == null || this.dto0.borderSrc == null || this.dto0.borderBounds == null)
                throw new Error('wrong dto0 type');
            if (this.dto1 == null || this.dto1.borderSrc == null || this.dto1.borderBounds == null)
                throw new Error('wrong dto1 type');
            if (!(this.sd instanceof sdFields2Border))
                throw new Error('wrong sd type');
        }

        override start(done: () => void): void {

            this.interpolator.start(
                this.dto0.borderSrc, this.dto0.borderBounds,
                this.dto1.borderSrc, this.dto1.borderBounds, done);
        }


        override update(t: number): void {
            let r = (t - this.t0) / (this.t1 - this.t0);
            r = 0.5 - 0.5 * Math.cos(r * Math.PI);
            console.log(r);
            this.interpolator.update(r);

            this.sd.border.borderTexture = this.interpolator.df.floatTexture;
            this.sd.border.borderTextureUpdated = true;
        }

        override stop(): void {
        }
    }

}