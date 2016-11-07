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

function vec3FromArray(out: Float32Array, a:number[])
{
    for (var i=0; i < a.length; ++i)
        out[i] = a[i];
}

function mat4FromArray(out: Float32Array, a:number[])
{
    for (var i=0; i < a.length; ++i)
        out[i] = a[i];
}