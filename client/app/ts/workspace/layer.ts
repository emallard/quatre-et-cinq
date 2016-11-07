module qec {

    export class layer
    {

        userTopCanvas = document.createElement('canvas');
        userProfileCanvas = document.createElement('canvas');

        top = new distanceFieldCanvas();
        profile = new distanceFieldCanvas();
        material = vec4.create();

        color =  vec4.create(); // couleur de l'onglet
        hole = false;
    }

} 