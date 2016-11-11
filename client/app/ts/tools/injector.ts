module qec
{
    export function inject(f):any
    {
        var i:any = {};
        i.__inject = f;
        return i;
    }

    export function injectFunc(f):any
    {
        var i:any = {};
        i.__injectFunc = f;
        return i;
    }

    export function injectNew(f):any
    {
        var i:any = {};
        i.__injectNew = f;
        return i;
    }

    export class injector
    {
        doLog = false;
        typeFunctionToString(typeFunction):string
        {
            var s:string = "" + typeFunction;
            return s.slice(0, s.indexOf('('));
        }

        singleInstances2:any = [];
        findSingleInstance(typeFunction:any)
        {
            var found = undefined;
            this.singleInstances2.forEach(s =>
            {
                if (s[0] === typeFunction)
                {
                    //console.log("single instance found : " + this.typeFunctionToString(typeFunction));
                    found = s[1];
                }
            });
            return found;
        }
        insertSingleInstance(typeFunction, instance)
        {
            //console.log("single instance push : " + this.typeFunctionToString(typeFunction));
            this.singleInstances2.push([typeFunction, instance]);
        }


        injectFunc(owner:any, propertyName:string, injPlaceHolder:any):any
        {
            var typeFunction = injPlaceHolder.__injectFunc;
            owner[propertyName] = () =>
            {
                return this.create(typeFunction, true);
            }
        }

        inject(owner:any, propertyName:string, injPlaceHolder:any):any
        {
            var propertyTypeFunction = injPlaceHolder.__inject;
            owner[propertyName] = this.create(propertyTypeFunction);
        }

        injectNew(owner:any, propertyName:string, injPlaceHolder:any):any
        {
            var propertyTypeFunction = injPlaceHolder.__injectNew;
            owner[propertyName] = this.create(propertyTypeFunction, true);
        }

        create(typeFunction:any, forceNew ?:boolean):any
        {
            var s:string = "" + typeFunction;

            if (this.doLog)
            {
                console.log("inject " + s.slice(0, s.indexOf('(')));
            }


            if (typeFunction == undefined)
            {
                console.log("Error inject");
            }


            var o:any;
            if (forceNew == true)
            {
                o = new typeFunction();
            }
            else
            {
                var o = this.findSingleInstance(typeFunction);
                if (o == undefined)
                {
                    o = new typeFunction();
                    this.insertSingleInstance(typeFunction, o);
                }
                else
                {
                    return o;
                }
            }



            for(var propertyName in o)
            {
                if (o.hasOwnProperty(propertyName))
                {
                    var propertyValue:any = o[propertyName];
                    if (propertyValue != undefined)
                    {
                        if(propertyValue.__inject != undefined)
                        {
                            this.inject(o, propertyName, propertyValue);
                        }

                        if (propertyValue != undefined
                            && propertyValue.__injectFunc != undefined)
                        {
                            this.injectFunc(o, propertyName, propertyValue);
                        }

                        if (propertyValue != undefined
                            && propertyValue.__injectNew != undefined)
                        {
                            this.injectNew(o, propertyName, propertyValue);
                        }
                    }
                }
            }

            if (o.afterInject != undefined)
            {
                o.afterInject();
            }

            return o;
        }

    }


    class testA
    {
        static idCount = 0;
        id:number;
        constructor()
        {
            this.id = testA.idCount++;
        }

    }


    interface interfaceB
    {
        log():string;
    }

    class testB1 implements interfaceB
    {
        singleInstanceA:testA = inject(testA);
        newA:testA;

        createa:()=>testA = injectFunc(testA);

        afterInject()
        {
            this.newA = this.createa();
        }

        log():string
        {
            return "singleInstanceA:" + this.singleInstanceA.id + "   newA:"+this.newA.id;
        }

    }
    class testB2 implements interfaceB
    {
        log():string
        {
            return "testB2";
        }
    }


    export class injector2Test
    {
        doTestSingleInstanceAndInjectFunc()
        {

            var injector = new injector();
            var x = injector.create(testB1);
            var y = injector.create(testB1);

            console.log("x: " + x.log());
            console.log("y: " + y.log());
/*
            injector.injectProperties(b1);

            var b2 = new testB();
            injector.injectProperties(b2);

            console.log("1: " + b1.a.id);
            console.log("2: " + b2.a.id);
            */
        }

        doTestScope()
        {
            /*
            var injector = new injector2();
            injector.setScope(testB1, "ScopeB");
            injector.singleInstanceByScope(testA, "ScopeB");

            var x = injector.create(testB1);
            var y = injector.create(testB1);

            console.log("x: " + x.log());
            console.log("y: " + y.log());
            */
        }
    }
}