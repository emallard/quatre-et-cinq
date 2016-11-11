
ko.bindingHandlers['element']=
{
    init:function(element, valueAccessor, allBindingsAccessor, viewModel)
    {
        valueAccessor()(element);
    }
};


ko.bindingHandlers['setElement']=
{
    init:function(element, valueAccessor, allBindingsAccessor, viewModel)
    {
        var fct = valueAccessor();
        fct.call(viewModel,element);
    }
};

