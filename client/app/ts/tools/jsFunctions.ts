

function MathClamp (n:number, min: number, max: number) {
    return Math.min(Math.max(n, min), max);
};

if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
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
    find(predicate: (search: T) => boolean) : T;
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

function vec3ToArray(out:number[], a:Float32Array)
{
    out[0] = a[0];
    out[1] = a[1];
    out[2] = a[2];
}

function mat4Array(a:Float32Array):number[]
{
    var b:number[] = new Array(a.length);
    for (var i=0; i < a.length; ++i)
        b[i] = a[i];
    return b;
}

function mat4Identity() : number[]
{
    return mat4Array(mat4.identity(mat4.create()));
}

function mat4Translate(x:number, y:number, z:number) : number[]
{
    return mat4Array(mat4.fromTranslation(mat4.create(), vec3.fromValues(x,y,z)));
}

function float32ArrayToString(a:Float32Array)
{
    var s = '' + a[0];
    for (var i=1; i < a.length; ++i)
    {
      s += ',' + a[i];
    }
    return s;
}

function fmod(a:number, b:number):number
{
    var m = a%b
    if (a<0)
        m *= -1;
    //if (m < 0) m+=b; 
    return m;
}