function Process () {

	this.viewModel = {
	    firstName: ko.observable('James'),
	    lastName: ko.observable('Lanzon'),
        design: {
            raysJewellery: function (element) {
                console.log(element)
            }
        }
	}

	this.fullName = ko.pureComputed(function () {
	    return this.viewModel.firstName() + ' ' + this.viewModel.lastName() 
	}, this)

	this.init()
	this.showName()
}

Process.prototype.init = function () {
	ko.applyBindings(this.viewModel)
}

Process.prototype.showName = function () {
	console.log(this.fullName())
}

