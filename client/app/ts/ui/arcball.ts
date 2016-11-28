// adapted from http://nehe.gamedev.net/tutorial/arcball_rotation/19003/

module qec
{

    export class arcball
    {
        StVec = vec3.create();
        EnVec = vec3.create();
        AdjustWidth:number;
        AdjustHeight:number;
        TempPt = vec2.create();

        sphereFactor = 0.777;

        setBounds(NewWidth:number, NewHeight:number)
        {
            //Set adjustment factor for width/height
            this.AdjustWidth = 1.0 / ((NewWidth - 1.0) * 0.5);
            this.AdjustHeight = 1.0 / ((NewHeight - 1.0) * 0.5);
        }

        _mapToSphere(NewPt:Float32Array, NewVec:Float32Array)
        {
            var TempPt = this.TempPt;
            //Copy paramter into temp point
            vec2.copy(TempPt, NewPt);

            //Adjust point coords and scale down to range of [-1 ... 1]
            TempPt[0] = (TempPt[0] * this.AdjustWidth) - 1.0;
            TempPt[1] = 1.0 - (TempPt[1] * this.AdjustHeight);

            //Compute the square of the length of the vector to the point from the center
            var length = (TempPt[0] * TempPt[0]) + (TempPt[1] * TempPt[1]);

            //If the point is mapped outside of the sphere... (length > radius squared)
            if (length > this.sphereFactor*this.sphereFactor)
            {
                //Compute a normalizing factor (radius / sqrt(length))
                var norm = 1.0 / Math.sqrt(length);

                //Return the "normalized" vector, a point on the sphere
                NewVec[0] = TempPt[0] * norm;
                NewVec[1] = TempPt[1] * norm;
                NewVec[2] = 0.0;
                //console.log("not sphere");
            }
            else    //Else it's on the inside
            {
                //Return a vector to a point mapped inside the sphere sqrt(radius squared - length)
                NewVec[0] = TempPt[0];
                NewVec[1] = TempPt[1];
                NewVec[2] = Math.sqrt(this.sphereFactor*this.sphereFactor - length);
                //console.log("sphere");
            }
        }


        //Mouse down
        click(NewPt:Float32Array)
        {
            //Map the point to the sphere
            this._mapToSphere(NewPt, this.StVec);
        }

        //Mouse drag, calculate rotation
        drag(NewPt:Float32Array, NewRot:Float32Array)
        {
            //Map the point to the sphere
            this._mapToSphere(NewPt, this.EnVec);

            //Return the quaternion equivalent to the rotation
            if (NewRot)
            {
                var Perp = vec3.create();

                //Compute the vector perpendicular to the begin and end vectors
                vec3.cross(Perp, this.StVec, this.EnVec);

                //Compute the length of the perpendicular vector
                if (vec3.length(Perp) > 0.00001)    //if its non-zero
                {

                    //We're ok, so return the perpendicular vector as the transform after all
                    NewRot[0] = Perp[0];
                    NewRot[1] = Perp[1];
                    NewRot[2] = Perp[2];
                    //In the quaternion values, w is cosine (theta / 2), where theta is rotation angle
                    //NewRot[3] = vec3.dot(this.StVec, this.EnVec);

                    // '1 +' comes from :
                    // http://stackoverflow.com/questions/1171849/finding-quaternion-representing-the-rotation-from-one-vector-to-another
                    NewRot[3] = this.sphereFactor*this.sphereFactor + vec3.dot(this.StVec, this.EnVec);

                }
                else                                    //if its zero
                {
                    //The begin and end vectors coincide, so return an identity transform
                    NewRot[0] = 0;
                    NewRot[1] = 0;
                    NewRot[2] = 0;
                    NewRot[3] = 1;
                }
            }
        }
    }
}