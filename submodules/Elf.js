const Lamp = require('./Lamp.js'),
	dgram = require('dgram')
;

// Elf is used to trigger the lamps
// Santa is added automatically when this is created through santa
const Elf = function( pins, ip, santa ){

	let Conf = require('../index.js').config;
	let th = this;
	this.santa = santa;
	this.ip = ip;
	this.lamps = [];

	// Used only when ip is falsy (this should control lamps)
	this.Gpio = null;
	
	this.ini = function(){

		// This elf was run locally, so we'll need pigpio
		if( !this.ip ){
			
			this.Gpio = require("pigpio").Gpio;
			
			// This is a standalone elf, we'll need a santa to tell it what to do
			if( !santa ){

				this.makeSearchable();
				this.enableUDP();

			}

		}

		// Setup the pins
		if( Array.isArray(pins) ){
			
			this.lamps = [];
			for( let pin of pins )
				this.lamps.push( new Lamp( this, pin ) );

		}

	};

	// Starts accepting HTTP requests to find this
	this.makeSearchable = function(){

		let express = require('express');
		let app = express();

		app.listen(Conf.port, function(){
			
			console.log("Elf is now discoverable on port "+Conf.port+"!");

		});

		// Respond elf_ready to HTTP requests
		app.get('/', function( req, res ){

			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({
				elf_ready : 1,
				pins : th.lamps.map(function( lamp ){
					return lamp.pin;
				})
			}));

		});

	};

	// Starts accepting UDP requests to trigger the lamps
	this.enableUDP = function(){

		let server = dgram.createSocket('udp4');
		server.on('listening', function(){

			let address = server.address();
			console.log("Elf is now listening to UDP on port "+address.port);

		});

		server.on('message', function( message, remote ){

			let msg = false;
			try{
				msg = JSON.parse(message);
			}
			catch(e){ msg = false; }

			if( typeof msg === 'object' && msg.hasOwnProperty('elf_flash') ){

				let pin = +msg.pin;
				for( let lamp of th.lamps ){

					if( lamp.pin === pin ){

						if( msg.elf_flash === 'twinkle')
							lamp.twinkle();
						else
							lamp.flash();

						return;
					}

				}

			}

		});

		server.bind(Conf.port);



	};

	this.ini();
	
};

module.exports = Elf;