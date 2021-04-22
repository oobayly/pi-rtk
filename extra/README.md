# Extra Information

## ZTE MF823
Unlike newer 4g USB devices, the ZTE MD823 4G/LTE isn't exposed as a simple ethernet device. The benefit of this is that you *might* receive a public IP from the network rather than a carrier-grade NAT'd address.

The simplest method to get it working is to use Network Manager, but with some caveats:
- Don't allow Network-Manager to control `eth0` and `wlan0`

### Configuration
``` bash
sudo apt-get install network-manager
```

Edit `/etc/NetworkManager/NetworkManager.conf` and add the following configuration section.
``` config
[keyfile]
unmanaged-devices=interface-name:eth0;interface-name:wlan0
```

Add a new connection to `/etc/NetworkManager/system-connections/`. In my case I use Hutchison 3g, so I've called it `3 Internet`.
``` config
[connection]
id=3 Internet
uuid=1ca3f66c-94e8-4199-a203-afe1e1b4a4f1
type=gsm
timestamp=1619091039

[gsm]
apn=3internet
number=*99#
password-flags=1

[ipv4]
dns-search=
method=auto

[ipv6]
addr-gen-mode=stable-privacy
dns-search=
ip6-privacy=0
method=auto
```

Ensure the connection file is only readable by `root`:
``` bash
sudo chmod 600 /etc/NetworkManager/system-connections/*
```

Finally, you probably want the interface to autostart:
``` bash
sudo nmcli connection modify 3\ Internet connection.autoconnect yes
```
