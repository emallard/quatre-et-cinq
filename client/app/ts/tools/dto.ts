module qec {
    export interface canCreate<T>
    {
        createFrom(t:T);
    }

    export class createdDTO<T, U>
    {
        dto:T;
        instance:U;
    }
}

function vec2FromArray(out: Float32Array, a:number[])
{
    for (var i=0; i < 2; ++i)  out[i] = a[i];
}

function vec3FromArray(out: Float32Array, a:number[])
{
    for (var i=0; i < 3; ++i) out[i] = a[i];
}

function vec4FromArray(out: Float32Array, a:number[])
{
    for (var i=0; i < 4; ++i) out[i] = a[i];
}

function mat4FromArray(out: Float32Array, a:number[])
{
    for (var i=0; i < 16; ++i) out[i] = a[i];
}

function float32ArrayToArray(fta:Float32Array) : number[]
{
    var out:number[] = [];
    for (var i=0; i < fta.length; ++i)
        out[i] = fta[i];
    return out;
}