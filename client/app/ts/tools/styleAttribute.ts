module qec {

    export class styleAttribute
    {
        static setField(styleStr: string, key:string, value:string) : string
        {
            var parts = styleStr.split(";");
            var parts2 = [];
            var index = -1;
            for (var i=0;i < parts.length;i++) {
                var subParts = parts[i].split(':');
                parts2[i] = [subParts[0],subParts[1]];
                if (subParts[0] == key)
                {
                    //console.log('style : key at ' + i);
                    index = i;
                }
            }

            if (index != -1)
            {
                parts2[index][0] = key;
                parts2[index][1] = value;
            }
            else
                parts2.push([key, value]);
            
            var result = '';
            for (var i=0;i < parts2.length;i++) {
                result += parts2[i][0] + ':' + parts2[i][1] + ';';
            }

            //console.log(result);
            return result;
        }
    }
}