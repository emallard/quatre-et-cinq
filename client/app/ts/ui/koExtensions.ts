
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


var events = ['tap', 'doubletap', 'press', 'pinch', 'pan', 'panstart', 'panmove', 'panend', 'pinchstart', 'pinchmove', 'pinchend'];

ko.utils.arrayForEach(events, function (eventName) {
    ko.bindingHandlers[eventName] = {
        init: function (element, valueAccessor, allBindingsAccessor, viewModel) {
            if (element.hammer == null) {
                element.hammer = new Hammer(element);
                element.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
            }

            var hammer = element.hammer;
            var value = valueAccessor();
            hammer.on(eventName, function (e) {
                value.call(viewModel, e);
            });
        }
    }
});