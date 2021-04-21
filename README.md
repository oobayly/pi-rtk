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

sudo apt-get install screen vim git gpsd/buster-backports
```
