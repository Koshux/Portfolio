function Process () {

	var viewModel = {
	    firstName: ko.observable('James'),
	    lastName: ko.observable('Lanzon')
	}

	var fullName = ko.pureComputed(function () {
	    return viewModel.firstName() + ' ' + viewModel.lastName() 
	}, this)

	this.init()
	showName()
}

Process.prototype.init = function() {
	ko.applyBindings(viewModel)
}

function showName () {
	console.log(fullName())
}

