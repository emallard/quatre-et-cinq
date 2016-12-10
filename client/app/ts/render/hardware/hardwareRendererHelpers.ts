module qec {

    export class hardwareShaderText
    {
        generateDistance(expl: hardwareSignedDistanceExplorer, packer:texturePacker)
        {
            console.log('generateDistance');
            
            var shader = '';
            var hsdArray = expl.array;
            
            shader += 'uniform mat4 u_inverseTransforms[' + hsdArray.length + '];\n\n'

            var count = expl.getSdFieldsCount();
            
            /*
            shader +=  count == 0 ? '' :
                'uniform sampler2D u_topTextures[' + count +'];\n' +
                'uniform sampler2D u_profileTextures[' + count + '];\n' +
                'uniform vec4 u_topBounds[' + count +'];\n' +
                'uniform vec4 u_profileBounds[' + count + '];\n'+
                '\n';
            */
            
            shader +=  count == 0 ? '' :
                'uniform sampler2D u_floatTextures[' + packer.allBigTextures.length +'];\n' +
                'uniform int  u_topTextureIndex[' + count +'];\n' +
                'uniform int  u_profileTextureIndex[' + count +'];\n' +
                'uniform vec4 u_topTextureSpriteBounds[' + count +'];\n' +
                'uniform vec4 u_profileTextureSpriteBounds[' + count +'];\n' +
                'uniform vec4 u_topBounds[' + count +'];\n' +
                'uniform vec4 u_profileBounds[' + count + '];\n'+
                '\n';
            
            // declare functions
            for (var i=hsdArray.length-1; i>=0; --i)
            {
                shader += 'float getDist_' + i + '(vec3 pos);\n';
            }
            shader += '\n';

            // implementations
            for (var i=hsdArray.length-1; i>=0; --i)
            {
                shader += this.generateOneDistance(expl, packer, hsdArray[i]);
                shader += '\n\n';
            }
                
            shader += 
              'float getDist(vec3 pos) { return getDist_0(pos); }\n';

            return shader;
        }

        generateOneDistance(expl: hardwareSignedDistanceExplorer, packer:texturePacker, hsd:hardwareSignedDistance)
        {
            var sd = hsd.sd;

            console.log('generateOneDistance ' + hsd.index);
            
            if (sd instanceof sdFields)
            {
                var m = mat4.create();
                sd.getInverseTransform(m);
                // TODO suppr
                /*
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n  return sdFields_(pos,'
                +'\n    u_topTextures['+hsd.sdFieldIndex+'],'
                +'\n    u_profileTextures['+hsd.sdFieldIndex+'],'
                +'\n    u_topBounds['+hsd.sdFieldIndex+'],'
                +'\n    u_profileBounds['+hsd.sdFieldIndex+'],'
                +'\n    u_inverseTransforms['+hsd.index+']'
                +'\n  );}';
                */

                var topTextureIndex = packer.getTextureIndex(sd.topTexture);
                var profileTextureIndex = packer.getTextureIndex(sd.profileTexture);

                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n  return sdFieldsWithSprites_(pos,'
                +'\n    u_floatTextures['+topTextureIndex+'],'
                +'\n    u_floatTextures['+profileTextureIndex+'],'
                +'\n    u_topTextureSpriteBounds['+hsd.sdFieldIndex+'],'
                +'\n    u_profileTextureSpriteBounds['+hsd.sdFieldIndex+'],'
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
            if (sd instanceof sdGrid)
            {
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n  return sdGrid(pos, ' + vec3.str(sd.size) + ', ' + sd.thickness + ');'
                +'\n}';
            }
            if (sd instanceof sdBorder)
            {
                var childHsd = expl.getHsd(sd.sd);
                var concat = '\n  float d = getDist_' + childHsd.index + '(pos);';
                concat +=  '\n  return opBorder(d, ' + sd.borderIn + ');'
                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                + concat
                +'\n}';
            }
            if (sd instanceof sdUnion)
            {
                var array = sd.array;
                var concat = '  float d=666.0;\n';
                for (var j=0; j < array.length; ++j)
                {
                    var childHsd = expl.getHsd(array[j]);
                    concat += '  d = opU(d, getDist_' + childHsd.index  + '(pos));\n';
                }

                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n' + concat
                +'  return d;'
                +'\n}';
            }
            if (sd instanceof sdSubtraction)
            {
                var array = sd.array;
                var concat = '  float d=666.0;\n';
                
                var childHsd0 = expl.getHsd(array[0]);
                var childHsd1 = expl.getHsd(array[1]);
                concat += '  d = opS(getDist_' + childHsd0.index  + '(pos), getDist_' + childHsd1.index  + '(pos));\n';

                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n' + concat
                +'  return d;'
                +'\n}';
            }
            if (sd instanceof sdIntersection)
            {
                var array = sd.array;
                var concat = '  float d=-666.0;\n';
                for (var j=0; j < array.length; ++j)
                {
                    var childHsd = expl.getHsd(array[j]);
                    concat += '  d = opI(d, getDist_' + childHsd.index  + '(pos));\n';
                }

                return 'float getDist_' + hsd.index + '(vec3 pos) { '
                +'\n' + concat
                +'  return d;'
                +'\n}';
            }

            return '';
        }

        generateColor(expl: hardwareSignedDistanceExplorer):string
        {
            console.log('generateColor');
            
            var shader = '';
            var hsdArray = expl.array;
            
            shader += '\n\nuniform vec3 u_diffuses[' + hsdArray.length + '];\n\n'
            
            for (var i=hsdArray.length-1; i>=0; --i)
            {
                shader += 'vec3 getColor_' + i + '(vec3 pos);\n';
            }
            shader += '\n';

            for (var i=hsdArray.length-1; i>=0; --i)
            {
                shader += this.generateOneColor(expl, hsdArray[i]);
                shader += '\n\n';
            }
            shader += 
              'vec3 getColor(vec3 pos) { return getColor_0(pos); }\n';

            return shader;
        }

        generateOneColor(expl: hardwareSignedDistanceExplorer, hsd:hardwareSignedDistance):string
        {
            var sd = hsd.sd;

            var fakePos = vec3.create();
            if (sd instanceof sdUnion)
            {
                var array = sd.array;
                var concat = '  float d=666.0;\n  float d2;  vec3 color;\n';
                for (var j=0; j < array.length; ++j)
                {
                    var childHsd = expl.getHsd(array[j]);
                    concat += '  d2 = getDist_' + childHsd.index + '(pos);\n'
                    + '  if (d2 < d) { d = d2; color = getColor_'+ childHsd.index + '(pos);}\n'
                }

                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                +'\n' + concat
                +'  return color;'
                +'\n}';
            }
            else if (sd instanceof sdSubtraction)
            {
                var array = sd.array;
                var concat = '  float d=666.0;\n  float d2;  vec3 color;\n';
            
                var childHsd = expl.getHsd(array[0]);
                concat += '  d2 = getDist_' + childHsd.index + '(pos);\n'
                + '  if (d2 < d) { d = d2; color = getColor_'+ childHsd.index + '(pos);}\n'

                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                +'\n' + concat
                +'  return color;'
                +'\n}';
            }
            else if (sd instanceof sdIntersection)
            {
                var childHsd = expl.getHsd(sd.array[0]);
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                +'\n' + 'return getColor_'+ childHsd.index + '(pos);'
                //+'  return color;'
                +'\n}';
            }
            else if (sd instanceof sdBorder)
            {
                var childHsd = expl.getHsd(sd.sd);
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) {'
                +'\n' + 'return getColor_'+ childHsd.index + '(pos);'
                //+'  return color;'
                +'\n}';
            }
            else
            {
                return 'vec3 getColor_' + hsd.index + '(vec3 pos) { return u_diffuses[' + hsd.index + ']; }'
            }
        }

        generateLight(count:number) : string
        {
            var shader = '';
            
            shader += '\n\nuniform vec3 u_lightPositions[' + count + '];\n\n'
            shader += '\n\nuniform float u_lightIntensities[' + count + '];\n\n'
            
            shader += 'vec3 getLight(int shadows, vec3 col, vec3 pos, vec3 normal, vec3 rd) { \n'
            shader += '    vec3 result = vec3(0.0,0.0,0.0);\n'
            for (var i=0; i < count; ++i)
            {
                shader += '    result = result + applyLight(u_lightPositions['+i+'], u_lightIntensities['+i+'], shadows, col, pos, normal, rd);\n';
            }
            shader += '    return result;\n}\n\n';

            return shader;
        }
    }
}