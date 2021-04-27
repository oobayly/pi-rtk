interface RinexLink {
  name: string;
  href: string;
}

export const RinexLinks: RinexLink[] = [
  { name: "Station Files", href: "/data" },
  { name: "OSI Active GNSS Data", href: "https://www.osi.ie/services/geodetic-services/active-gnss-data/" },
  { name: "OSGB RINEX data", href: "https://www.ordnancesurvey.co.uk/gps/os-net-rinex-data/" }
];
