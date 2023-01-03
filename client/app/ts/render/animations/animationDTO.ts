module qec {

    export class animationDTO {
        start: number;
        end: number;
        scenes: scSceneDTO[] = [];
        scenesObjectsByName: { [key: string]: any }[] = [];
        segments: sdAnimationSegmentDTO[] = [];
        noColor: boolean;
    }

    export class sdAnimationSegmentDTO {
        t0: number;
        dto0: any;

        t1: number;
        dto1: any;

        parameters: string[];
    }
}