**Please note that the icons used are only free for personal use**

# PiBells

PiBells is a node application that lets users play a piano mini game, causing your christmas decorations to light up whenever a key is hit.

## Prerequisites:

* An up to date NodeJS
* pigpio installed
* Ability to wire your decorations without damaging the pi
* Ability to set up a domain and port forward to your raspberry pi (Optional)
* Git
* MySQL installed for stats (so you can see if anyone has been using your app). Default db, username, and password = `pibells`


## Install a Santa

Santa is a master raspberry which controls lights of its own, and can also control lights of elves. Each install can have exactly one santa, and up to 254 elves.

1. cd to your home directory: `cd`
2. Clone the git repo `git clone https://github.com/Jasdoge/PiBells`
3. Edit test.js
4. All you have to do here is set up which GPIO pins you want to tie to the lamps. You'll have to wire the lights up with transistors (or any other way that can supply more power) as not to damage the pi unless you intend on controlling 1-2 LEDs per pin. I use this for reference for pi zero and 3: 
![raspberry pi b+ and 0 pinout](https://docs.microsoft.com/en-us/windows/iot-core/media/pinmappingsrpi/rp2_pinout.png)
5. The pins can be either an integer specifying the pin (orange boxes in image above), or an object with `{pin:(int)GPIO_nr, min:(float)idle, max:(float)active}` - Min is the PWM percentage between 0 and 1 and allows you to use brightness while the LED is idle. Default is 0.05, Max lets you limit how bright it goes when active, default is 1.
6. Run the node script with super user permissions: `sudo node test`

If everything works alright, it will start up.

## Using the app

The santa will spawn a webserver and socket server on port 8080 by default. You can use the app locally by typing in `ip a`, and looking for the local IP (usually something like 192.168.0.x). Simply load this IP followed by :8080 ex `http://192.168.0.199:8080` in a browser on any device. 

If loading it in a mobile browser, you also get the option of adding the app to home screen and run in standalone app mode.

## Elves

An elf is another raspberry pi which controls lights in another part of the house or if you need more GPIO pins. **Currently elves MUST be on the same network as the santa, such as the same router.**

1. Follow step 1 and 2 of installing a santa.
2. Edit test_elf.js
3. The pins are set up the same way as the santa were.
4. Run `sudo node test_elf`
5. Close your santa script (ctrl+c) and restart ex: `sudo node test`. Santa will scan the entire local network (192.168.x.\*) for elves and hopefully find it.

## Running as a service

With raspbian you can run PiBells as a service. 
1. Navigate to /etc/systemd/system ex: `cd /etc/systemd/system` 
2. Create a new text document by typing `sudo nano pibells.service`
3. Paste the following:
<pre>
[Unit]
Description=Christmas Bells in Jasdoge's Window
After=network.target

[Service]
ExecStart=/usr/local/bin/node /home/pi/PiBells/test
Restart=always
#Environment=NODE_ENV=production
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=pibells

[Install]
WantedBy=multiuser.target
</pre>
Note that you will want to change a few settings, such as:
* Description
* ExecStart (if you installed PiBells or node elsewhere)

4. Enable it by `sudo systemctl enable pibells`
5. Start it by `sudo service pibells start`
Stop it by `sudo service pibells stop`

## Configuration
See the wiki.
