module qec {
    export class index3
    {
        start(element:HTMLElement)
        {
            var dfCanvas = new distanceFieldCanvas();
            var dfCanvas2 = new distanceFieldCanvas();
            dfCanvas2.initSquare(512, 0.5, 1, 1);
            dfCanvas.computeDistanceFieldFromSrcs('data/cubeTop.png',1, 1, () =>
            {
                dfCanvas.debugInfoInCanvas();
                document.getElementById('debug').appendChild(dfCanvas.canvas);
                dfCanvas2.debugInfoInCanvas();
                document.getElementById('debug').appendChild(dfCanvas2.canvas);
                
            });
        }

        start2(element:HTMLElement)
        {
            var dfCanvas = new distanceFieldCanvas();
            var dfCanvas2 = new distanceFieldCanvas();
            dfCanvas.computeDistanceFieldFromSrcs('data/cubeTop.png',1, 1, () =>
            {
                
                dfCanvas2.computeDistanceFieldFromSrcs('data/cubeProfile.png',1, 1, () =>
                {
                    dfCanvas.debugInfoInCanvas();
                    document.getElementById('debug').appendChild(dfCanvas.canvas);
                    dfCanvas2.debugInfoInCanvas();
                    document.getElementById('debug').appendChild(dfCanvas2.canvas);
                        
                });
            });
        }
    }
}