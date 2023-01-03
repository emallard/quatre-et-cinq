module qec {

    export class updaterBase {
        id: string;
        t0: number;
        t1: number;
        start(done: () => void) { done(); }
        update(t: number) { }
        stop() { }
    }



    export class zUpdater extends updaterBase {
    }

    export class cameraUpdater {

    }

    export class lightUpdater {
    }

}