module qec
{
    export class hardwareSignedDistance
    {
        sd: signedDistance;
        index:number;
        sdFieldIndex = -1;
        //shaderText:string;
    }

    
    export class hardwareSignedDistanceExplorer
    {

        array:hardwareSignedDistance[] = [];
        recCount:number;
        sdFieldsCount:number;

        explore(sd: signedDistance)
        {
            this.recCount = 0;
            this.sdFieldsCount = 0;
            this.array = [];    
            this.exploreRec(sd);
        }

        private exploreRec(sd: signedDistance)
        {
            // stop if (signedDistance already explored)
            if (this.getHsd(sd) != null)
                return;
            
            var hsd = new hardwareSignedDistance();
            this.array.push(hsd);

            hsd.sd = sd;
            hsd.index = this.recCount;
            this.recCount++;

            if (sd instanceof sdFields)
            {
                hsd.sdFieldIndex = this.sdFieldsCount;
                this.sdFieldsCount++;
            }
            else if (sd instanceof sdUnion)
            {
                for (var i=0; i < sd.array.length; ++i)
                    this.exploreRec(sd.array[i]);
            }
            else if (sd instanceof sdSubtraction)
            {
                for (var i=0; i < sd.array.length; ++i)
                    this.exploreRec(sd.array[i]);
            }
            else if (sd instanceof sdIntersection)
            {
                for (var i=0; i < sd.array.length; ++i)
                    this.exploreRec(sd.array[i]);
            }
            else if (sd instanceof sdBorder)
            {
                this.exploreRec(sd.sd);
            }
        }

        getSdFieldsCount():number {
            var c = 0;
            for (var i=0; i < this.array.length; ++i)
                if (this.array[i].sd instanceof sdFields)
                    c++;
            return c;
        }

        getHsd(sd: signedDistance)
        {
            var found = this.array.find(hsd => hsd.sd == sd);
            return found;
        }
    }
}