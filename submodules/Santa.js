let Elf = require('./Elf.js'),
	request = require('request'),
	dgram = require('dgram')
;

// Santa is the main controller
/**
 * 
 * @param {*} gpioPins - An array of pins to use. Pins can also be objects consisting of {pin:(int)pin, min:(float)min_power, max:(float)max_power} 
 * @param {*} sqlOptions - See sql.js
 */
const Santa = function( gpioPins, sqlOptions ){

	let Conf = require('../index.js').config;

	let th = this;
	this.express = require('express');
	this.app = this.express();
	this.server = require('http').createServer(this.app);
	this.io = require('socket.io')(this.server);
	this.sql = require('./sql.js')(sqlOptions);
	this.elves = [];

	// Adds a self-elf to simplify the GPIO pin randomizer
	if( !Conf.nogpio )
		this.elves.push( new Elf( gpioPins, false, this ) );

	

	// Setup DB
	this.sql.createTable().then(function(){

		console.log("Logging & Settings enabled");
		th.pushLog(true);
		setInterval(function(){
			th.pushLog();
		}, 10000); // Log every 10 sec
		th.init();
		
	})
	.catch(function( err ){
		
		console.error("Unable to initialize", err);

	});


	
	// Log data, requires enableSqlLogging
	this.log = {
		quests : 0,						// Quests completed since last log push
		notes : 0,						// Notes played since last log push
		keysHitTotal : 0,				// Total keys hit all time
		questsCompletedTotal : 0,		// Total quests completed all time
		hourly : [],					// Notes hit on an hourly basis. Requires MYSQL connection
	};

	// Initialize
	this.init = function( ){
		
		if( !Conf.nosocket ){

			let io = this.io;
			// IO connected
			io.on('connection', function( socket ){

				// Debug output
				socket.on('debug', function( msg ){ console.log("Socket debug", msg); });
				
				// Data is an array of note objects with {oct:(int)octave, key:(int)key}
				socket.on('note', function( data ){

					for( let i=0; i<data.length; ++i )
						th.flashSingle();
					
					++th.log.notes;
					th.onNotePlayed( +data.octave, +data.key );

				});
				
				// Data is the string ID of the achievement unlocked
				socket.on('achievement', function( data ){

					th.flashAll();
					th.onQuestCompleted();
					++th.log.quests;

				});
				
				// Update the active user count
				socket.on('disconnect', function(){

					io.sockets.emit('users_count', io.engine.clientsCount);

				});
				
				// returns statistics
				socket.on('stats', function( name, response ){
					
					response(th.log);

				});
				
				
				io.sockets.emit('users_count', io.engine.clientsCount);
				
			});

		}

		if( !Conf.nohost ){

			this.app.use(this.express.static( __dirname+"/../client"));
			this.server.listen(Conf.port, function(){
				
				console.log("Server online on port "+Conf.port+"!");

			});

		}

		this.scanForElves();

	};

	// Updates the log
	this.pushLog = function( force ){

		let q = this.log.quests,			// quests completed since last push
			n = this.log.notes				// num notes pressed since last push
		;
		
		this.log.quests = 0;
		this.log.notes = 0;
		
		let queries = [];

		// Notes have been pressed
		if(n)
			queries.push(this.sql.addRecord("key", n));

		// Quests have been completed
		if(q)
			queries.push(this.sql.addRecord("quest", q));

		// Nothing has changed, do not refresh
		if( !queries.length && !force )
			return;
		
		// Refresh data
		Promise.all(queries)
		.then(function(){

			// Get total hits
			th.sql.getSumByTypes()
			.then(function( data ){

				th.log.keysHitTotal = data.key;
				th.log.questsCompletedTotal = data.quest;


			})
			.catch(function(err){
				console.error("Unable to fetch totals", err);
			});

			th.sql.getHourly()
			.then(function( data ){

				th.log.hourly = data;

			})
			.catch(function(err){
				console.error("Unable to fetch history", err);
			});


		})
		.catch(function( err ){
			console.error("SQL errors: ", err);
		});
		

	};


	this.scanForElves = function(){

		console.log("Scanning network for elves");
		let promises = [];

		let ips = this.getLocalIPs();
		for( let ip of ips ){
			
			ip = ip.split('.');
			ip.pop();
			promises = promises.concat( this.scanIpRange(ip.join('.')) );
			
		}

		Promise.all(promises).then(function( data ){

			data = data.filter(function( val ){
				return val !== false;
			});

			console.log("Found", data.length, "elves!");
			for( let elf of data )
				th.elves.push(elf);

		}).catch(function(e){
			console.error(e);
		});

	};

	// Lamp functionality
	this.flashAll = function(){

		let lamps = this.getLamps();
		for( let lamp of lamps )
			lamp.twinkle();

	};

	this.flashSingle = function(){

		let lamps = this.getLamps();
		lamps.sort(function( a, b ){
			
			let now = Date.now();
			if( 
				a.lastTrigger === b.lastTrigger || 
				( now > a.lastTrigger+2000 && now > b.lastTrigger+2000 )
			)return Math.round(Math.random())*2-1;

			return a.lastTrigger < b.lastTrigger ? -1 : 1;

		});

		let rand = lamps[0];
		
		rand.flash();

	};

	// Returns Lamp objects of all elves
	this.getLamps = function(){

		let out = [];
		for( let elf of this.elves )
			out = out.concat(elf.lamps);
		return out;

	};


	// NETSCAN

	// Scans a base ip such as 192.168.0
	this.scanIpRange = function( base ){

		let promises = [];
		for( let i = 0; i<256; ++i )
			promises.push(this.makeScanRequest(base+"."+i));
		
		return promises;

	};

	// Makes a request on our port to find an elf
	this.makeScanRequest = function( ip ){

		return new Promise(function( res, rej ){
			
			request({
				url : "http://"+ip+':'+Conf.port,
				timeout : 3000
			}, function( error, response, body){

				if( error )
					return res(false);

				let b = false;
				try{
					b = JSON.parse(body);
				}catch( err ){
					b = false;
				}

				if( typeof b === 'object' && +b.elf_ready )
					return res( new Elf(b.pins, ip, th) );
					
				res(false);

			});

		});

	};

	// Gets networks we're connected to
	this.getLocalIPs = function(){

		let os = require('os');
		let ifaces = os.networkInterfaces();

		let out = [];

		Object.keys(ifaces).forEach(function( ifname ){

			let alias = 0;

			ifaces[ifname].forEach(function (iface) {

				// skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
				if( 'IPv4' !== iface.family || iface.internal !== false )
					return;

				if( alias >= 1 )
					out.push(iface.address);
				// this interface has only one ipv4 adress
				else
					out.push(iface.address);

				++alias;

			});

		});

		// make unique
		return out.filter(function(el, index, arr) {
			return index == out.indexOf(el);
		});
		
	};


	// Events
	this.onNotePlayed = function( octave, key ){};
	this.onQuestCompleted = function(){};

	return this;

};

module.exports = Santa;
