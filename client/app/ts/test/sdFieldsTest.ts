module qec
{
    export class sdFieldsTest
    {

        test()
        {
            this.distanceFieldSameSizeAsCanvas();
            console.log(this.testName + ' : OK');

            this.distanceFieldSmallerThanCanvas();
            console.log(this.testName + ' : OK');

            this.distanceFieldSameSizeAsCanvas_WithMargin();
            console.log(this.testName + ' : OK');
        }

        distanceFieldSameSizeAsCanvas()
        {
            this.testName = 'DistanceFieldSameSizeAsCanvas';
            var canvas = this.getRectInCanvas();

            var dfCanvas = new distanceFieldCanvas();
            dfCanvas.setDistanceFieldMaxSize(1000, 1000);

            var bounds = vec4.fromValues(5, 5, 1005, 405);
            dfCanvas.drawUserCanvasForTop(canvas, bounds, 0);
            
            this.assertEqual(dfCanvas.distanceField.M, 1000, "df width");
            this.assertEqual(dfCanvas.distanceField.N, 400, "df height");

            this.assertDist(dfCanvas, 199, 200, 1);
            this.assertDist(dfCanvas, 200, 200, 0);
            this.assertDist(dfCanvas, 201, 200, -1);

            this.assertDist(dfCanvas, 500, 99,  1);
            this.assertDist(dfCanvas, 500, 100, 0);
            this.assertDist(dfCanvas, 500, 101, -1);
        }

        distanceFieldSmallerThanCanvas()
        {
            this.testName = 'DistanceFieldSmallerThanCanvas';
            var canvas = this.getRectInCanvas();

            var dfCanvas = new distanceFieldCanvas();
            dfCanvas.setDistanceFieldMaxSize(100, 100);

            var bounds = vec4.fromValues(5, 5, 1005, 405);
            dfCanvas.drawUserCanvasForTop(canvas, bounds, 0);
            
            this.assertEqual(dfCanvas.distanceField.M, 100, "df width");
            this.assertEqual(dfCanvas.distanceField.N, 40, "df height");

            this.assertDist(dfCanvas, 19, 20,  10);
            this.assertDist(dfCanvas, 20, 20,  0);
            this.assertDist(dfCanvas, 21, 20, -10);

            this.assertDist(dfCanvas, 50,  9,  10);
            this.assertDist(dfCanvas, 50, 10,  0);
            this.assertDist(dfCanvas, 50, 11, -10);
        }

        distanceFieldSameSizeAsCanvas_WithMargin()
        {
            this.testName = 'DistanceFieldSameSizeAsCanvas_WithMargin';
            var canvas = this.getRectInCanvas();

            var dfCanvas = new distanceFieldCanvas();
            dfCanvas.setDistanceFieldMaxSize(1200, 1200);

            var bounds = vec4.fromValues(5, 5, 1005, 405);
            dfCanvas.drawUserCanvasForTop(canvas, bounds, 100);
            
            this.assertEqual(dfCanvas.distanceField.M, 1200, "df width");
            this.assertEqual(dfCanvas.distanceField.N, 600, "df height");

            this.assertArrayEqual(dfCanvas.totalBounds, [-95, -95, 1105, 505], "total bounds");

            this.assertDist(dfCanvas, 299, 300, 1);
            this.assertDist(dfCanvas, 300, 300, 0);
            this.assertDist(dfCanvas, 301, 300, -1);

            this.assertDist(dfCanvas, 600, 199,  1);
            this.assertDist(dfCanvas, 600, 200, 0);
            this.assertDist(dfCanvas, 600, 201, -1);        
        }

        private getRectInCanvas() : HTMLCanvasElement
        {
            var topCanvas = document.createElement('canvas');
            topCanvas.width = 1000;
            topCanvas.height = 400;
            var ctx = topCanvas.getContext('2d');
            ctx.fillStyle = 'black';
            ctx.fillRect(200,100,600,200);
            return topCanvas;
        }

        testName = "";
        assertDist(dfCanvas:distanceFieldCanvas, i:number, j:number, expected:number)
        {
            var v = dfCanvas.distanceField.getD(i, j);
            if (v != expected)
                console.log(this.testName, '['+i+','+j+']' + ' v: ', v ,' expected : ', expected);
        }

        assertEqual(v:number, expected:number, comment:string)
        {
            if (v != expected)
                console.log(this.testName, 'v: ', v ,' expected : ', expected, comment);
        }

        assertArrayEqual(v:Float32Array, expected:number[], comment:string)
        {
            var ok = true;
            for (var i=0; i < v.length; ++i)
                ok = ok && (v[i] == expected[i]);

            if (!ok)
                console.log(this.testName, 'v: ', float32ArrayToString(v) ,' expected : ', expected, comment);
        }

        

    }
}