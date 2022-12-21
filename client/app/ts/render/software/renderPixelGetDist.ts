module qec {

    export class renderPixelGetDist
    {
        getDistFields = new renderPixelGetDistFields();
        getDistPrimitives = new renderPixelGetDistPrimitives();

        generateGetDist(array:signedDistance[]) : (Float32Array) => number
        {
            console.log('generate get dist');
            let inner: ((Float32Array, number) => number)[] = [];
            for (let sd of array)
            {
                if (sd instanceof sdFields1)
                {
                    let captured:sdFields1 = sd;
                    inner.push((x,y) => this.getDistFields.getDistFields1(captured, x, y));
                }
                else if (sd instanceof sdFields2)
                {
                    let captured:sdFields2 = sd;
                    inner.push((x,y) => this.getDistFields.getDistFields2(captured, x, y));
                }
                else if (sd instanceof sdFields2Radial)
                {
                    let captured:sdFields2Radial = sd;
                    inner.push((x,y) => this.getDistFields.getDistFields2Radial(captured, x, y));
                }
                else if (sd instanceof sdFields2Border)
                {
                    let captured:sdFields2Border = sd;
                    inner.push((x,y) => this.getDistFields.getDistFields2Border(captured, x, y));
                }
                else if (sd instanceof sdFields2ProfileBorder)
                {
                    let captured:sdFields2ProfileBorder = sd;
                    inner.push((x,y) => this.getDistFields.getDistFields2ProfileBorder(captured, x, y));
                }
                else if (sd instanceof sdGrid)
                {
                    let captured:sdGrid = sd;
                    inner.push((x,y) => this.getDistPrimitives.getDistGrid(captured, x, y));
                }
                else
                {
                    throw new Error("Not Implemented");
                }
            }
            return pos => this.getUnionDist(pos, inner);
        }

        getUnionDist(pos:Float32Array, inner: ((Float32Array, number) => number)[]) : number
        {
            let d = 66666;
            for (let f of inner)
            {
                d = f(pos, d);
            }
            return d;
        }
    }
}