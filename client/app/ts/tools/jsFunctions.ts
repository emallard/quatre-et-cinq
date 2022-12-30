

function MathClamp(n: number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
};

if (!Array.prototype.find) {
    Array.prototype.find = function (predicate) {
        if (this == null) {
            throw new TypeError('Array.prototype.find called on null or undefined');
        }
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }
        var list = Object(this);
        var length = list.length >>> 0;
        var thisArg = arguments[1];
        var value;

        for (var i = 0; i < length; i++) {
            value = list[i];
            if (predicate.call(thisArg, value, i, list)) {
                return value;
            }
        }
        return undefined;
    };
}


interface Array<T> {
    find(predicate: (search: T) => boolean): T;
}


function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function vec3ToArray(out: number[], a: Float32Array) {
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
}

function mat4Array(a: Float32Array): number[] {
    var b: number[] = new Array(a.length);
    for (var i = 0; i < a.length; ++i)
        b[i] = a[i];
    return b;
}

function mat4Identity(): number[] {
    return mat4Array(mat4.identity(mat4.create()));
}

function mat4Translate(x: number, y: number, z: number): number[] {
    return mat4Array(mat4.fromTranslation(mat4.create(), vec3.fromValues(x, y, z)));
}

function vec3TransformMat4RotOnly(out, a, m) {
    var x = a[0], y = a[1], z = a[2],
        w = m[3] * x + m[7] * y + m[11] * z + m[15];
    w = w || 1.0;
    out[0] = (m[0] * x + m[4] * y + m[8] * z/* + m[12]*/) / w;
    out[1] = (m[1] * x + m[5] * y + m[9] * z/* + m[13]*/) / w;
    out[2] = (m[2] * x + m[6] * y + m[10] * z/* + m[14]*/) / w;
    return out;
};

function float32ArrayToString(a: Float32Array) {
    var s = '' + a[0];
    for (var i = 1; i < a.length; ++i) {
        s += ',' + a[i];
    }
    return s;
}

function fmod(a: number, b: number): number {
    var m = a % b
    if (a < 0)
        m *= -1;
    //if (m < 0) m+=b; 
    return m;
}

function mix(x: number, y: number, a: number) {
    return (x * (1 - a) + y * a);
}
function mixclamp(x: number, y: number, a: number) {
    if (a < 0)
        return x;
    if (a > 1)
        return y;
    return mix(x, y, a);
}