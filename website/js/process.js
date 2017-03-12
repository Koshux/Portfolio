var viewModel = {
    firstName: ko.observable('James'),
    lastName: ko.observable('Lanzon')
}

var fullName = ko.pureComputed(function () {
    return viewModel.firstName() + ' ' + viewModel.lastName() 
}, this)


console.log(fullName())

ko.applyBindings(viewModel)
