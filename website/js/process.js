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
	// makeBindings.call(this)
	ko.applyBindings(viewModel)
}

Process.prototype.registerElement = function(element) {
	$(element).tooltip()
	return true
};

function showName () {
	console.log(fullName())
}

