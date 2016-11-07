module qec {

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

    export class hardwareShaderText
    {
        expl: hardwareSignedDistanceExplorer;

        generateDistance()
        {
            console.log('generateDistance');
            
            var shader = '';
            var hsdArray = this.expl.array;
            
            shader += 'uniform mat4 u_inverseTransforms[' + hsdArray.length + '];\n\n'

            var count = this.expl.getSdFieldsCount();
            shader +=  count == 0 ? '' :
                'uniform sampler2D u_topTextures[' + count +'];\n' +
                'uniform sampler2D u_profileTextures[' + count + '];\n' +
                'uniform vec4 u_topBounds[' + count +'];\n' +
                'uniform vec4 u_profileBounds[' + count + '];\n\n';

            for (var i=hsdArray.length-1; i>=0; --i)
            {
                shader += this.generateOneDistance(hsdArray[i]);
                shader += '\n\n';
            }
                
            shader += 
              'float getDist(vec3 pos) { return getDist_0(pos); }\n';

            return shader;
        }

        generateOneDistance(hsd:hardwareSignedDistance)
        {
            var sd = hsd.sd;

            console.log('generateOneDistance ' + hsd.index);
            if (sd instanceof sdUnion)
            {
                var array = sd.array;
                var concat = '  float d=666.0;\n';
                for (var j=0; j < array.length; ++j)
                {
                    var childHsd = this.expl.getHsd(array[j]);
                    concat += '  d = opU(d, getDist_' + childHsd.index  + '(pos));\n';
                }

                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n' + concat
                +'  return d;'
                +'\n}';
            }
            if (sd instanceof sdFields)
            {
                var m = mat4.create();
                sd.getInverseTransform(m);
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n  return sdFields_(pos,'
                +'\n    u_topTextures['+hsd.sdFieldIndex+'],'
                +'\n    u_profileTextures['+hsd.sdFieldIndex+'],'
                +'\n    u_topBounds['+hsd.sdFieldIndex+'],'
                +'\n    u_profileBounds['+hsd.sdFieldIndex+'],'
                +'\n    u_inverseTransforms['+hsd.index+']'
                +'\n  );}';
            }
            if (sd instanceof sdBox)
            {
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n  return sdBox(pos, ' + vec3.str(sd.halfSize) + ');'
                +'\n}';
            }

            if (sd instanceof sdSphere)
            {
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n  return sdSphere(pos, ' + sd.radius + ', u_inverseTransforms[' + hsd.index + ']);'
                +'\n}';
            }
            if (sd instanceof sdPlane)
            {
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n  return sdPlane(pos, ' + vec3.str(sd.normal) + ');'
                +'\n}';
            }

            return '';
        }

        generateColor():string
        {
            console.log('generateColor');
            
            var shader = '';
            var hsdArray = this.expl.array;
            
            shader += '\n\nuniform vec3 u_diffuses[' + hsdArray.length + '];\n\n'

            console.log(hsdArray[0]);

            for (var i=hsdArray.length-1; i>=0; --i)
            {
                shader += this.generateOneColor(hsdArray[i]);
                shader += '\n\n';
            }
            shader += 
              'vec3 getColor(vec3 pos) { return getColor_0(pos); }\n';

            return shader;
        }

        generateOneColor(hsd:hardwareSignedDistance):string
        {
            var sd = hsd.sd;

            var fakePos = vec3.create();
            if (sd instanceof sdUnion)
            {
                var array = sd.array;
                var concat = '  float d=666.0;\n  float d2;  vec3 color;\n';
                for (var j=0; j < array.length; ++j)
                {
                    var childHsd = this.expl.getHsd(array[j]);
                    concat += '  d2 = getDist_' + childHsd.index + '(pos);\n'
                    + '  if (d2 < d) { d = d2; color = getColor_'+ childHsd.index + '(pos);}\n'
                }

                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                +'\n' + concat
                +'  return color;'
                +'\n}';
            }
            else
            {
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) { return u_diffuses[' + hsd.index + ']; }'
            }
        }

    }
}