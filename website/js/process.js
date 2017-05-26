function Process () {

	this.viewModel = {
	    firstName: ko.observable('James'),
	    lastName: ko.observable('Lanzon')
	}

	this.fullName = ko.pureComputed(function () {
	    return viewModel.firstName() + ' ' + viewModel.lastName() 
	}, this)

	this.init()
	showName()
}

Process.prototype.init = function () {
	ko.applyBindings(viewModel)
}

Process.prototype.showName = function () {
	console.log(fullName())
}

