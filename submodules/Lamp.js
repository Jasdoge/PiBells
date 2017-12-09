const dgram = require('dgram');

// Helper class
/*
	Elf is the parent object, or undefined if this is a dedicated elf
	Pin is the int nr of the gpio to use, can also be an object with { pin:(int)pin, min:(float)min_pwm, max:(float)max_pwm }

*/
const Lamp = function( elf, pin ){
	
	let Conf = require('../index.js').config;
	let th = this;
	
	const FADE_MS = 1000;
	const FADE_FPS = 60;
	const TWINKLE_SPEED = 250; // Time to make a full flash
	
	this.elf = elf;
	this.pin = pin;
	
	// For host
	this.lastTrigger = 0;

	// For localhost
	this.controller = null;
	this.fadeTimer = null;
	this.twinkling = false;
	this.twinkleStep = 0;
	this.twinkleInterval = null;
	this.min = 0.05;
	this.max = 1;
	this.intensity = this.min;

	if( typeof pin === "object" ){

		this.pin = 0;
		if( pin.hasOwnProperty('pin') )
			this.pin = +pin.pin;
		if( pin.hasOwnProperty('min') )
			this.min = Math.max(+pin.min, 0);
		if( pin.hasOwnProperty('max') )
			this.max = Math.min(+pin.max, 1);

		this.intensity = this.min;

	}

	this.twinkle = function(){

		// Standalone elf
		if( !this.elf.ip ){

			th.twinkling = true;
			th.twinkleStep = 0;
			clearTimeout(this.twinkleInterval);
			clearTimeout(this.fadeTimer);

			this.twinkleInterval = setInterval(function(){
				
				th.twinkleStep += Math.PI*2/(FADE_FPS*TWINKLE_SPEED/1000);
				th.intensity = ((Math.sin(th.twinkleStep)+1)/2)*0.75+0.25;
				th.write();

			}, 1000/FADE_FPS);

			this.fadeTimer = setTimeout(function(){
				
				clearTimeout(th.twinkleInterval);
				th.twinkling = false;
				th.startFade();

			}, 3000);

		}
		// Santa elf
		else
			this.triggerUDPLamp('twinkle');


	};

	this.flash = function(){

		if( this.twinkling )
			return;

		this.lastTrigger = Date.now();
		// Localhost
		if( !this.elf.ip ){
			
			clearTimeout(this.fadeTimer);
			clearInterval(this.fadeTimer);

			this.intensity = this.max;
			this.fadeTimer = setTimeout(function(){
				th.startFade();
			}, 500);

			this.write();

		}
		// Send UDP request to elf slave
		else
			this.triggerUDPLamp('flash');

	};

	this.triggerUDPLamp = function( type ){

		let url = this.elf.ip,
			message = new Buffer(JSON.stringify({
				elf_flash : type,
				pin : this.pin
			})),
			client = dgram.createSocket('udp4')
		;

		client.send( message, 0, message.length, Conf.port, url, function(err, bytes){

			if( err )
				console.error("UDP Send error", err);

			client.close();

		});

	};

	this.startFade = function(){

		this.fadeTimer = setInterval(function(){
			th.fade();
		}, 1000/FADE_FPS);

	};

	this.write = function(){
		this.controller.pwmWrite(Math.round(this.intensity*255));
	};

	this.fade = function(){


		this.intensity -= (this.max-this.min)/(FADE_FPS*FADE_MS/1000);
		if( this.intensity <= this.min ){
			
			this.intensity = this.min;
			clearTimeout(this.fadeTimer);

		}

		this.write();

	};


	// Ini
	if( this.elf && !this.elf.ip ){

		this.controller = new this.elf.Gpio( Math.round(this.pin), { mode:this.elf.Gpio.OUTPUT });
		this.write();

	}

};

module.exports = Lamp;
