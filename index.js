// Base Configuration
const Conf = {
	nohost : false,			// Santa: Do not host the website. Allows you to host the website for the HTML5 app elsewhere. Default false
							// Elf: Disable support for automated elf finding
	nosocket : false,		// SANTA ONLY: Do not accept socket connections. Allows you to host only the website on this device if you wish. Default false
	nogpio : false,			// SANTA ONLY: Do not use the GPIOs on the santa device
	port : 8080,
	idle_timeout : 30,		// Seconds before the lamps start to flash idly. Any value <= 0 will block it
};

// Submodules
const santa = require('./submodules/Santa.js'),
	elf = require('./submodules/Elf.js'),
	lamp = require('./submodules/Lamp.js')
;

// Exports
module.exports = {
	Santa : santa,
	Elf : elf,
	configure : function( options ){
		for( let i in options ){
			if( Conf.hasOwnProperty(i) )
				Conf[i] = options[i];
		}
	},
	config : Conf
};
