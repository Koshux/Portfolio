function Process () {

	this.viewModel = {
	    firstName: ko.observable('James'),
	    lastName: ko.observable('Lanzon'),
        design: {
            raysJewellery: function (element) {
            }
        }
	}

	this.fullName = ko.pureComputed(function () {
	    return this.viewModel.firstName() + ' ' + this.viewModel.lastName() 
	}, this)

	this.init()
	this.showName()
}

<<<<<<< HEAD
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
=======
Process.prototype.init = function () {
	ko.applyBindings(this.viewModel)
}

Process.prototype.showName = function () {
	console.log(this.fullName())
>>>>>>> 5a985e9bda8f8950307e8467ca736b2b470932b6
}

