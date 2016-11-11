module qec  
{

    interface exExample
    {
        title:string;
        create:() =>any;
    }
    var allExamples:exExample[] = [];

    export function pushExample(title:string, f:()=>any)
    {
        allExamples.push({title:title, create:f });
    }

    export function getExamples()
    {
        return allExamples;
    }

    export function createExample(title:string):any
    {
        var found = allExamples.find((x) => x.title === title)
        return found.create();
    }
}