module qec {

    export class topView {

        
        setElement(elt:Element)
        {
            // register on mouse move
            // register on mouse click
            //var elt = document.getElementsByClassName('.renderContainer')[0];
            //elt = elt.firstElementChild;
            elt.addEventListener('mousemove', (e) => this.onMouseMove(e));
            elt.addEventListener('mousedown', (e) => this.onMouseDown(e))
            elt.addEventListener('mouseup', (e) => this.onMouseUp(e))
        }

        setLayer(layerData)
        {
            
        }

        onMouseMove(e:Event)
        {
            // update layerDataProfileDistanceField
            // or move camera
        }

        onMouseDown(e:Event)
        {
            console.log('onMouseDown');
        }

        onMouseUp(e:Event)
        {
            console.log('onMouseUp');
        }
    }
}