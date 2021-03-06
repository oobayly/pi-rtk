# pi-rtk
The files and instructions to get a rtklib RTK base station running on a Raspberry Pi

## Hardware requirements
- Raspberry Pi Model b (I've used a Pi3)
- 8GB Micro SD card (I've used a Sandisk MAX ENDURANCE card)
- U-blox GPS module that supports RXM-RAWX output (I've used a Neo-M8T)
- 4g USB dongle (Huawei Unlocked E3372h)

## Prerequisites
Seeing as the Pi will most likely operate as a headless server, I've opted to setup everything from the get-go via SSH.

- A knowledge of the Linux (Raspberry Pi OS is based on Debian) command line interface (CLI)
- An SSH client [PuTTY is a good one for Windows](https://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html)

## Initial setup

1. Download Raspberyy Pi OS Lite from the [Raspberry Pi website](https://www.raspberrypi.org/software/operating-systems/#raspberry-pi-os-32-bit)
2. Write the image to the SD card
3. Enable the SSH server by adding an empty file called `ssh` (no extension) to the `/boot` (small) partition on the SD card
4. Insert the SD card, connect the Pi to your router/switch and power the Pi up
5. Connect to the Pi - the name of the computer will be `raspberrypi` with a username of `pi` and password of `raspberry`

## Raspberry Pi configuration
Configure the following using `sudo rasbpi-config`

1. Under **System Options**, connect to your Wireless LAN, change the password and change the Hostname to something other than `raspberrypi`.
2. Under **Performance Options**, reduce the GPU Memory to the minimum (16MB) as it'll be headless.
3. Under **Localisation Options**, set your Timezone and Keyboard.
4. If you plan on adding a display to the GPIO header, eable SPI and I2C under **Interface Options**.
5. Finish and reboot

If you don't want to use the user `pi`, then you should add yourself to all the groups that the `pi` user is a member of:
``` bash
sudo usermod -a -G adm,dialout,cdrom,sudo,audio,video,plugdev,games,users,input,netdev,gpio,i2c,spi <username>
````

## Install Packages
The GPSD server for Debian Buster is quite an old version which doesn't fully support u-blox. So the Backports needs to be added to the package sources:
``` bash
echo "deb http://deb.debian.org/debian buster-backports main" | tee --append /etc/apt/sources.list
sudo apt-get update
```

If `apt-get update` returns an error saying *"The following signatures couldn't be verified..."*, then you need to install each of the keys referenced:
``` bash
Err:2 http://deb.debian.org/debian buster-backports InRelease
  The following signatures couldn't be verified because the public key is not available: NO_PUBKEY 04EE7237B7D453EC NO_PUBKEY 648ACFD622F3D138

sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 40976EAF437D05B5
sudo apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 648ACFD622F3D138
```

Update all packages, and then install all the required packages:
``` bash
sudo apt-get dist-upgrade
sudo apt-get install dnsutils lsof screen vim tree telnet tcpdump git gfortran gpsd/buster-backports
```

Install Node.js 14
``` bash
curl -fsSL https://deb.nodesource.com/setup_14.x | sudo -E bash -
sudo apt-get install nodejs
```

## Configure GPSD
# Devices gpsd should collect to at boot time.
# They need to be read/writeable, either by user gpsd or the group dialout.
# localhost:4000 provides the multiplexed GNSS serial stream
# localhost:4001 provides the corrected rover stream
DEVICES="tcp://localhost:4000 tcp://localhost:4001"

# Other options you want to pass to gpsd
GPSD_OPTIONS=""

# Automatically hot add/remove USB GPS devices via gpsdctl
# This is disabled so GPSD doesn't take control of the GNSS serial device
USBAUTO="false"
```

## Clone repositories
The [RTKLIB fork by rtklibexplorer](https://github.com/rtklibexplorer/RTKLIB) is optimised for *"single and dual frequency low cost GPS receivers, especially u-blox receivers"*, but has not Debian package, so will need to be cloned. This repro should also be cloned.
``` bash
mkdir -p ~/src
cd ~/src
git clone https://github.com/rtklibexplorer/RTKLIB
git clone https://github.com/oobayly/pi-rtk
```

### Build and install RTKLIB
As of 21 April 2021 there's a [bug in RTKLIB](https://github.com/rtklibexplorer/RTKLIB/issues/38) where the `rtkrcv` doesn't start if run with a telnet interface. [This PR](https://github.com/rtklibexplorer/RTKLIB/pull/56) fixes the issue, so a patch needs to be applied.

``` bash
cd ~/src/RTKLIB
patch -p0 < ~/src/pi-rtk/patches/rtklib-patch-38.diff
cd ~/src/RTKLIB/app/consapp/
make
sudo make install
```

### Install pi-rtk package
The pi-rtk package install itself into `/opt/pi-rtk`, and will do the following:
- Install systemd service files
  - `pi-rtk-multiplex` - Allows multiple applications to read from a single GNSS serial port
  - `pi-rtk-base` - Operates the system as an RTK base station that can provide data to an NTRIP Caster
  - `pi-rtk-rover` - Operates the system as an RTK rover
  - `pi-rtk-http` - A HTTP server that allows a user to view the status of the station
- Install configuration files int `/etc/pi-rtk`
- Install cronjobs for the ubx/RINEX `pi-rtk-multiplex` service

The Nodejs HTTP server needs to be built before installation
``` bash
cd ~/src/pi-rtk/
npm --prefix pi-rtk-http install
npm --prefix pi-rtk-http run build
sudo ./install.sh
```

## Configuration
