**Please note that the icons used are only free for personal use**

# PiBells

PiBells is a node application that lets users play a piano mini game, causing your christmas decorations to light up whenever a key is hit.

## Prerequisites:

* An up to date NodeJS
* pigpio installed
* Ability to wire your decorations without damaging the pi
* Ability to set up a domain and port forward to your raspberry pi (optional)
* Git

## Install a Santa

Santa is a master raspberry which controls lights of its own, and can also control lights of elves. Each install can have exactly one santa, and up to 254 elves.

1. cd to your home directory: `cd`
2. Clone the git repo `git clone https://github.com/Jasdoge/PiBells`
3. Edit test.js
4. All you have to do here is set up which GPIO pins you want to tie to the lamps. You'll have to wire the lights up with transistors (or any other way that can supply more power) as not to damage the pi unless you intend on controlling 1-2 LEDs per pin. I use this for reference for pi zero and 3: 
![raspberry pi b+ and 0 pinout](https://docs.microsoft.com/en-us/windows/iot-core/media/pinmappingsrpi/rp2_pinout.png)
5. The pins can be either an integer specifying the pin (orange boxes in image above), or an object with {pin:(int)GPIO_nr, min:(float)idle, max:(float)active} - Min is the PWM percentage between 0 and 1 and allows you to use brightness while the LED is idle. Default is 0.05, Max lets you limit how bright it goes when active, default is 1.
6. Run the node script with super user permissions: `sudo node test`

If everything works alright, it will start up.

## Using the app

