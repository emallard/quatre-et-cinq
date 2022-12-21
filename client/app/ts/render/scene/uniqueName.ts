
module qec {


    export class uniqueName
    {
        private static id:number = 0;
        static new(): string
        {
            return ''+uniqueName.id++;
        }
    }
}