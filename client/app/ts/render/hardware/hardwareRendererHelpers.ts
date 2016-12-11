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
                shader += 'float getDist2_' + i + '(vec3 pos, vec3 rd);\n';
            }
            shader += '\n';

            // implementations
            for (var i=hsdArray.length-1; i>=0; --i)
            {
                shader += this.generateOneDistance(expl, packer, hsdArray[i], false);
                shader += '\n\n';
                shader += this.generateOneDistance(expl, packer, hsdArray[i], true);
                shader += '\n\n';
            }
                
            shader += 'float getDist(vec3 pos) { return getDist_0(pos); }\n';
            shader += 'float getDist2(vec3 pos, vec3 rd) { return getDist2_0(pos, rd); }\n';

            return shader;
        }

        generateOneDistance(expl: hardwareSignedDistanceExplorer, packer:texturePacker, hsd:hardwareSignedDistance, isDist2:boolean)
        {
            var sd = hsd.sd;

            console.log('generateOneDistance ' + hsd.index);
            
            if (sd instanceof sdFields)
            {
                var m = mat4.create();
                sd.getInverseTransform(m);

                var topTextureIndex = packer.getTextureIndex(sd.topTexture);
                var profileTextureIndex = packer.getTextureIndex(sd.profileTexture);

                var text = this.getDistSignature(hsd.index, isDist2) + ' { ';
                if (!isDist2)
                    text += '\n  return sdFieldsWithSprites1_(pos,';
                else
                    text += '\n  return sdFieldsWithSprites2_(pos, rd,';
                text += ''
                +'\n    u_floatTextures['+topTextureIndex+'],'
                +'\n    u_floatTextures['+profileTextureIndex+'],'
                +'\n    u_topTextureSpriteBounds['+hsd.sdFieldIndex+'],'
                +'\n    u_profileTextureSpriteBounds['+hsd.sdFieldIndex+'],'
                +'\n    u_topBounds['+hsd.sdFieldIndex+'],'
                +'\n    u_profileBounds['+hsd.sdFieldIndex+'],'
                +'\n    u_inverseTransforms['+hsd.index+']'
                +'\n  );}';

                return text;
            }
            if (sd instanceof sdBox)
            {
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                +'\n  return sdBox(pos, ' + vec3.str(sd.halfSize) + ');'
                +'\n}';
            }

            if (sd instanceof sdSphere)
            {
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                +'\n  return sdSphere(pos, ' + sd.radius + ', u_inverseTransforms[' + hsd.index + ']);'
                +'\n}';
            }
            if (sd instanceof sdPlane)
            {
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                +'\n  return sdPlane(pos, ' + vec3.str(sd.normal) + ');'
                +'\n}';
            }
            if (sd instanceof sdGrid)
            {
                return this.getDistSignature(hsd.index, isDist2) + ' { '
                +'\n  return sdGrid(pos, ' + vec3.str(sd.size) + ', ' + sd.thickness + ');'
                +'\n}';
            }
            if (sd instanceof sdBorder)
            {
                var childHsd = expl.getHsd(sd.sd);
                var concat = '\n  float d = ' + this.getDistCall(childHsd.index, isDist2) + ';';
                concat +=  '\n  return opBorder(d, ' + sd.borderIn + ');'
                return this.getDistSignature(hsd.index, isDist2) + ' { '
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
                    concat += '  d = opU(d, ' + this.getDistCall(childHsd.index, isDist2) + ');\n';
                }

                return this.getDistSignature(hsd.index, isDist2) + ' { '
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
                concat += '  d = opS(' + + this.getDistCall(childHsd0.index, isDist2) + ',' + + this.getDistCall(childHsd1.index, isDist2) + ');\n';

                return this.getDistSignature(hsd.index, isDist2) + ' { '
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
                    concat += '  d = opI(d, ' + + this.getDistCall(childHsd.index, isDist2) + ');\n';
                }

                return this.getDistSignature(hsd.index, isDist2) + ' { '
                +'\n' + concat
                +'  return d;'
                +'\n}';
            }

            return '';
        }

        getDistSignature(index:number, isDist2: boolean):string
        {
            if (!isDist2)
                return 'float getDist_' +index + '(vec3 pos)';
            else
                return 'float getDist2_' +index + '(vec3 pos, vec3 rd)';
        }

        getDistCall(index:number, isDist2: boolean):string
        {
            if (!isDist2)
                return 'getDist_' + index  + '(pos)';
            else
                return 'getDist2_' + index  + '(pos, rd)';
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