/*eslint-env browser*/
/*eslint-env jquery */
/*global utm */

$(document).ready(() => {
  const DEVICES = {
    "tcp://localhost:4000": { name: "Raw GNSS" },
    "tcp://localhost:4001": { name: "Rover" }
  };
  const TPV_MODE = ["Unknown", "No Fix", "2d Fix", "3d Fix"];
  const FIX_STATUS = ["Unknown", "Normal", "DGPS", "RTK Fix", "RTK Float", "DR", "GNSS DR", "Time", "Simulated", "P(Y)"];
  const GNSS_ID = ["GPS", undefined, "Galileo", "Beidou", undefined, "QZSS", "GLONASS"];

  const gpsd = {
    devices: [],
    sky: {},
    tpv: {}
  };

  /** The path of the current device. */
  let currentDevice = null;
  const container = $("#gnssInfo").hide();
  let ws;

  // ========================
  // Properties
  // ========================

  // ========================
  // Methods
  // ========================

  const main = () => {
    connect();

    $("#satellites").hide();
    $("#navLinkConnect").show().click(() => connect());
    $("#navLinkDisconnect").hide().click(() => ws.close());
    $("#navLinkDevices").click(onReloadDevicesClick);

    $("#satView").satView();
  }

  const connect = () => {
    ws = new WebSocket(`ws://${document.location.host}`);

    ws.onopen = onWsOpen;
    ws.onclose = onWsClose;
    ws.onmessage = onWsMessage;
  };

  const populateDevices = (data) => {
    const devices = data.devices.map((dev) => {
      dev.name = DEVICES[dev.path]?.name || "Other";

      if (dev.driver) {
        dev.name += ` (${dev.driver})`;
      }

      return dev;
    });

    gpsd.devices = devices;

    // If the previously selected device is in the new list, then use it, otherwise use the first device
    const currentIndex = devices.findIndex((x) => x.path === currentDevice);

    currentDevice = devices[currentIndex == -1 ? 0 : currentIndex]?.path;

    // Populate the menu with the available devices
    $("#navbarDevices ~ div .devices-container")
      .empty()
      .append(devices.map((dev) => {
        const item = $("<a>", {
          "class": "dropdown-item",
          href: "#"
        })
          .text(dev.name)
          .data("device", dev.path)
          .click(onDeviceClick)
          ;

        return item;
      }));
  };

  const redraw = () => {
    const device = gpsd.devices.find((x) => x.path === currentDevice) || {};
    const sky = gpsd.sky[currentDevice] || {};
    const tpv = gpsd.tpv[currentDevice] || {};
    const { name } = device;
    const status = [TPV_MODE[tpv?.mode], FIX_STATUS[tpv?.status]].filter((x) => !!x).join(" - ");

    if (name) {
      container.show();
    } else {
      container.hide()
    }

    if (tpv && sky) {
      container.find(".row-error").hide();
      container.find(".row-info").show();
      $("#satellites").show();
    } else {
      container.find(".row-error").show();
      container.find(".row-info").hide();
      $("#satellites").hide();
    }

    // Fix info
    container.find(".gnss-name").text(name);
    container.find(".col-date").text(tpv?.time?.toUTCString());
    container.find(".col-mode").text(status);
    container.find(".col-lat").text(tpv?.lat ?? "-");
    container.find(".col-lon").text(tpv?.lon ?? "-");
    container.find(".col-alt").text(tpv?.altHAE ?? "-");

    // if (tpv?.lat && tpv?.lon) {
    //   const latlon = new utm.LatLon(tpv.lat, tpv.lon);
    //   const coords = latlon.toUtm();

    //   console.log(
    //     Math.round(1000 * (coords.easting % 1)),
    //     Math.round(1000 * (coords.northing % 1))
    //   );
    //   // const utm = new LatLon(tpv.lat, tpv.lon)
    // }

    // Satellites table
    redrawSatellites(sky?.satellites);
  };

  const redrawSatellites = (satellites) => {
    satellites = (satellites || []).filter((x) => x.ss);

    $("#satView").data("satView").updateSatellites(satellites);

    $("#tableSat tbody")
      .empty()
      .append(satellites.map((item) => {
        return $("<tr>")
          .append($("<td>", { text: item.PRN }))
          .append($("<td>", { text: item.el }))
          .append($("<td>", { text: item.az }))
          .append($("<td>", { text: item.ss }))
          ;
      }));
  }

  // ========================
  // Event handlers
  // ========================

  const onDeviceClick = (e) => {
    currentDevice = $(e.target).data("device");

    redraw();
  };

  const onReloadDevicesClick = (_e) => {
    ws.send(JSON.stringify({ type: "command", command: "devices" }));
  }

  const onWsClose = () => {
    $("#navLinkConnect").show();
    $("#navLinkDisconnect").hide();
  };

  const onWsMessage = (message) => {
    let data;
    try {
      data = JSON.parse(message.data);
    } catch (e) {
      console.error(e);

      return;
    }

    if (data.type === "gpsd") {
      const gpsdClass = data.data["class"];
      const { device } = data.data;
      const { sky, tpv } = gpsd;

      if (gpsdClass === "DEVICES") {
        populateDevices(data.data);
      } else if (gpsdClass === "SKY") {
        const { satellites } = data.data;

        if (satellites) {
          satellites.forEach((item) => {
            item.constellation = GNSS_ID[item.gnssid] || "Unknown";
          });
        }

        sky[device] = data.data;
      } else if (gpsdClass === "TPV") {
        if (typeof data.data.time === "string") {
          data.data.time = new Date(data.data.time);
        }

        tpv[device] = data.data;
        // } else if (found) {
        //   if (gpsdClass === "SKY") {
        //     found.sky = data.data;

        //     if (found.sky?.satellites) {
        //       found.sky.satellites.forEach((item) => {
        //         item.constellation = GNSS_ID[item.gnssid] || "Unknown";
        //       });
        //     }
        //   } else if (gpsdClass === "TPV") {
        //     found.tpv = data.data;
        //   }

        //   if (found.clearId) {
        //     window.clearTimeout(found.clearId);
        //   }

        //   found.clearId = window.setTimeout(() => {
        //     console.log(`Data has expired for ${found.name}`)

        //     found.sky = null;
        //     found.tpv = null;

        //     redraw();
        //   }, 5000);

        //   redraw();
      }

      redraw();
    }
  };

  const onWsOpen = () => {
    $("#navLinkConnect").hide();
    $("#navLinkDisconnect").show();
  }

  main();
});

