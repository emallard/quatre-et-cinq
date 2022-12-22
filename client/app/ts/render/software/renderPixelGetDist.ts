module qec {

    export class renderPixelGetDist
    {
        getDistFields = new renderPixelGetDistFields();
        getDistPrimitives = new renderPixelGetDistPrimitives();

        generateGetDist(array:signedDistance[]) : (pos:Float32Array) => number
        {
            let distAndColor = this.generateGetDistAndColor(array);
            return x => distAndColor(x, null);
        }

        generateGetColor(array:signedDistance[]) : (pos:Float32Array, col:Float32Array) => void
        {
            let distAndColor = this.generateGetDistAndColor(array);
            return (x,y) => { distAndColor(x, y); }
        }

        generateGetDistAndColor(array:signedDistance[]) : (pos:Float32Array, col:Float32Array) => number
        {
            console.log('generate get dist');
            let inner: ((pos:Float32Array, d:number, col:Float32Array) => number)[] = [];
            for (let sd of array)
            {
                if (sd instanceof sdFields1)
                {
                    let captured:sdFields1 = sd;
                    inner.push((x,y,z) => this.getDistFields.getDistFields1(captured, x, y, z));
                }
                else if (sd instanceof sdFields2)
                {
                    let captured:sdFields2 = sd;
                    inner.push((x,y,z) => this.getDistFields.getDistFields2(captured, x, y, z));
                }
                else if (sd instanceof sdFields2Radial)
                {
                    let captured:sdFields2Radial = sd;
                    inner.push((x,y,z) => this.getDistFields.getDistFields2Radial(captured, x, y, z));
                }
                else if (sd instanceof sdFields2Border)
                {
                    let captured:sdFields2Border = sd;
                    inner.push((x,y,z) => this.getDistFields.getDistFields2Border(captured, x, y, z));
                }
                else if (sd instanceof sdFields2ProfileBorder)
                {
                    let captured:sdFields2ProfileBorder = sd;
                    inner.push((x,y,z) => this.getDistFields.getDistFields2ProfileBorder(captured, x, y, z));
                }
                else if (sd instanceof sdGrid)
                {
                    let captured:sdGrid = sd;
                    inner.push((x,y,z) => this.getDistPrimitives.getDistGrid(captured, x, y, z));
                }
                else
                {
                    throw new Error("Not Implemented");
                }
            }
            return (pos, col) => this.getUnionDist(pos, col, inner);
        }

        getUnionDist(pos:Float32Array, col:Float32Array, inner: ((pos:Float32Array, d:number, col:Float32Array) => number)[]) : number
        {
            let d = 66666;
            for (let f of inner)
            {
                d = f(pos, d, col);
            }
            return d;
        }
    }
}