const pibells = require('./index.js');

const elf = new pibells.Elf( [
	4,
	17,
	18,
	{pin:27, min:0.4},
	{pin:22, min:0.3},
]);

