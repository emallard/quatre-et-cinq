// Inspiration :
//
// adapted from http://nehe.gamedev.net/tutorial/arcball_rotation/19003/
// http://stackoverflow.com/questions/1171849/finding-quaternion-representing-the-rotation-from-one-vector-to-another
module qec
{

    export class arcball
    {
        perp = vec3.create();
        tmpPt1 = vec3.create();
        tmpPt2 = vec3.create();


        getRotationFrom2dPoints(viewportWidth:number, viewportHeight:number, sphereRadiusInPixels:number, startXY:Float32Array, endXY:Float32Array, result:Float32Array)
        {
            this.map2DToSphere(viewportWidth, viewportHeight, sphereRadiusInPixels, startXY, this.tmpPt1);
            this.map2DToSphere(viewportWidth, viewportHeight, sphereRadiusInPixels, endXY, this.tmpPt2);
            this.getRotation(this.tmpPt1, this.tmpPt2, result);
        }


        map2DToSphere(viewportWidth:number, viewportHeight:number, sphereRadiusInPixels:number, screenXY:Float32Array, result:Float32Array)
        {
            var dx = screenXY[0] - (viewportWidth/2);
            var dy = (viewportHeight-screenXY[1]) - (viewportHeight/2);

            //length of the vector to the point from the center
            var length = Math.sqrt((dx * dx) + (dy * dy));

            //If the point is mapped outside of the sphere... (length > radius squared)
            if (length > sphereRadiusInPixels)
            {
                //Return the point on sphere at z=0
                result[0] = dx/length*sphereRadiusInPixels;
                result[1] = dy/length*sphereRadiusInPixels;
                result[2] = 0.0;
                //console.log("not sphere");
            }
            //Else it's on the inside
            else
            {
                //Return a vector to a point mapped inside the sphere
                result[0] = dx;
                result[1] = dy;
                result[2] = Math.sqrt(sphereRadiusInPixels*sphereRadiusInPixels - (dx*dx + dy*dy));
                //console.log("sphere");
            }
        }


        //return quaternion equivalent to rotation between 2 3D points
        getRotation(startPoint:Float32Array, endPoint:Float32Array, result:Float32Array)
        {
            var perp = this.perp;
            vec3.cross(perp, startPoint, endPoint);

            //Compute the length of the perpendicular vector
            if (vec3.length(perp) > 0.00001)    //if its non-zero
            {
                // http://stackoverflow.com/questions/1171849/finding-quaternion-representing-the-rotation-from-one-vector-to-another
                //
                // Quaternion q;
                // vector a = crossproduct(v1, v2)
                // q.xyz = a;
                // q.w = sqrt((v1.Length ^ 2) * (v2.Length ^ 2)) + dotproduct(v1, v2)

                
                result[0] = perp[0];
                result[1] = perp[1];
                result[2] = perp[2];

                result[3] = vec3.length(startPoint)*vec3.length(endPoint) + vec3.dot(startPoint, endPoint);
                quat.normalize(result, result);
            }
            else
            {
                //The begin and end vectors coincide, so return an identity transform
                result[0] = 0;
                result[1] = 0;
                result[2] = 0;
                result[3] = 1;
            }
            
        }
    }
}