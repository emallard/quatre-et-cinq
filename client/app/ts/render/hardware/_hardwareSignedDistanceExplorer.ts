module qec
{
    export class hardwareSignedDistance
    {
        sd: signedDistance;
        index:number;
    }

    
    export class hardwareSignedDistanceExplorer
    {
        array:hardwareSignedDistance[] = [];
        recCount:number;

        hdFields2Count:number;
        hdFields2RadialCount:number;

        explore(sd: signedDistance)
        {
            this.recCount = 0;
            this.hdFields2Count = 0;
            this.hdFields2RadialCount = 0;
            this.array = [];    
            this.exploreRec(sd);
        }

        private exploreRec(sd: signedDistance)
        {
            // stop if (signedDistance already explored)
            if (this.getHsd(sd) != null)
                return;
            
            let hsd: hardwareSignedDistance;
            
            this.array.push(hsd);
            hsd.sd = sd;
            hsd.index = this.recCount;
            this.recCount++;

            /*
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
            */
        }

        getHsd(sd: signedDistance)
        {
            var found = this.array.find(hsd => hsd.sd == sd);
            return found;
        }
    }
}