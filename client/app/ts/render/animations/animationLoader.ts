module qec {

    export class animationLoader {

        load(json: string, done: (x: animationDTO) => void) {

            console.log('animationLoader: load');

            let dto = JSON.parse(json);
            let run = new runAll();
            let scenes: scSceneDTO[] = [];

            console.log('animationLoader: scenes ' + dto.scenes.join(', '));
            for (let i = 0; i < dto.scenes.length; ++i) {
                let url = dto.scenes[i];
                let captured_i = i;
                run.push(_done => {
                    new svgSceneLoader().loadUrl(url, x => {
                        scenes[captured_i] = x;
                        _done();
                    });
                });
            }
            run.run(() => {
                this.loadSegments(scenes, dto, done);
            });
        }

        loadSegments(scenes: scSceneDTO[], json: any, done: (x: animationDTO) => void) {
            console.log('animationLoader: loadAnims');

            let segments = json.segments;
            let anim = new animationDTO();
            if (json.noColor != undefined)
                anim.noColor = json.noColor;
            anim.start = json.start;
            anim.end = json.end;
            anim.scenes.push(...scenes);

            for (let scene of scenes) {
                let dic: { [key: string]: any } = {};
                let allDtos = getAllSignedDistances.getAllDTO(scene.dtos);
                for (let a of allDtos) {
                    if (a.svgId != undefined)
                        dic[a.svgId] = a;
                }
                anim.scenesObjectsByName.push(dic);
            }

            for (let seg of segments) {
                let segment = new sdAnimationSegmentDTO();
                segment.t0 = seg[0];
                segment.t1 = seg[1];
                segment.dto0 = anim.scenesObjectsByName[0][seg[2]];
                segment.dto1 = anim.scenesObjectsByName[1][seg[2]];
                if (segment.dto0 == null)
                    throw new Error(`not found in scene ${seg[2]}`);
                if (segment.dto1 == null)
                    throw new Error(`not found in scene ${seg[2]}`);
                segment.parameters = seg[3];
                if (!Array.isArray(seg[3]))
                    segment.parameters = [seg[3]];

                anim.segments.push(segment)
            }
            done(anim);
        }
    }
}