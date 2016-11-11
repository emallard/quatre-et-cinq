
ko.bindingHandlers['element']=
{
    init:function(element, valueAccessor, allBindingsAccessor, viewModel)
    {
        valueAccessor()(element);
    }
};