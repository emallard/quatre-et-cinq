module qec {
    export class signedDistanceConverter {

        static squareSvg = `
<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg
   width="16"
   height="16"
   viewBox="0 0 4.2333333 4.2333333"
   version="1.1"
   id="svg5"
   xmlns="http://www.w3.org/2000/svg">
    <rect
       style="fill:#000000;stroke-width:0.418745;-inkscape-stroke:none;stop-color:#000000"
       id="rect846"
       width="4.4"
       height="4.4"
       x="-0.1"
       y="-0.1" />
</svg>
`;
        static squareSrc(): string {
            return "data:image/svg+xml;base64," + btoa(signedDistanceConverter.squareSvg);
        }

        toProfileAxis(sd: sdFields1DTO, target: sdFields2DTO): sdFields2DTO {

            let profile: partProfileDTO = {
                profileSrc: signedDistanceConverter.squareSrc(),
                profileBounds: [0, 0, 1, 1]
            };

            let result: sdFields2DTO = {
                type: sdFields2DTO.TYPE,
                svgId: sd.svgId,
                top: sd.top,

                profile: profile,
                profileOrigin: target.profileOrigin,
                profileAxis: target.profileAxis,

                material: sd.material,
                transform: sd.transform,
            }
            return result;
        }

        toBorder(sd1: sdFields1, target: sdFields2Border): sdFields2Border {
            return null;
        }
    }
}