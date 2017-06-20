function Process () {

	this.viewModel = {
	    firstName: ko.observable('James'),
	    lastName: ko.observable('Lanzon')
	}

	this.fullName = ko.pureComputed(function () {
	    return this.viewModel.firstName() + ' ' + this.viewModel.lastName() 
	}, this)

	this.init()	
	showName.call(this)
	
}

Process.prototype.init = function() {
}

Process.prototype.registerElement = function (element) {
	$(element).tooltip({ placement: 'bottom'})
	return true
};

function showName () {
	console.log(this.fullName())
}


ko.applyBindings(new Process())
