
ko.bindingHandlers['element'] =
    {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            valueAccessor()(element);
        }
    };


ko.bindingHandlers['setElement'] =
    {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var fct = valueAccessor();
            fct.call(viewModel, element);
        }
    };

//var Hammer: any;


var events = ['tap', 'doubletap', 'press', 'pinch', 'pan', 'panstart', 'panmove', 'panend',
    'pan2start', 'pan2move', 'pan2end',
    'pinchstart', 'pinchmove', 'pinchend'];

ko.utils.arrayForEach(events, function (eventName) {
    ko.bindingHandlers[eventName] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            if (element.hammer == null) {
                /*
                element.hammer = new Hammer(element);
                element.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
                element.hammer.get('pinch').set({ enable: true });
                element.hammer.add(new Hammer.Pan({ event: "pan2", pointers: 2 }));
                element.hammer.get('pan2').recognizeWith('pinch');
                element.hammer.get('pinch').requireFailure('pan2');
                */
                const mc = new Hammer.Manager(element);
                element.hammer = mc;
                const tap = new Hammer.Tap({
                    event: 'tap',
                    pointers: 1,
                });
                const oneFingerPan = new Hammer.Pan({
                    event: 'pan',
                    direction: Hammer.DIRECTION_ALL,
                    pointers: 1,
                });
                // similar, but 2 pointers & different event name:
                const twoFingerPan = new Hammer.Pan({
                    event: 'pan2',
                    direction: Hammer.DIRECTION_ALL,
                    pointers: 2,
                });
                /*
                const pinch = new Hammer.Pinch({
                    event: 'pinch',
                });
                // NOTE: recognize the pinch & 2 finger pan together
                twoFingerPan.recognizeWith(pinch);
                pinch.recognizeWith(twoFingerPan);
                */
                mc.add([oneFingerPan, twoFingerPan, tap]);
            }

            var hammer = element.hammer;
            var value = valueAccessor();
            hammer.on(eventName, function (e) {
                value.call(viewModel, e);
            });
        }
    }
});