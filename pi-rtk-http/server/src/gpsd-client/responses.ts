import { FixStatus, TpvMode } from "./enumerations";
import { Device, Satellite } from "./models";

export interface GpsdResponse {
  class: "POLL" | "TPV" | "SKY" | "GST" | "ATT" | "TOFF" | "PPS" | "OSC" | "VERSION" | "RAW" | "DEVICES"
}

// https://gpsd.gitlab.io/gpsd/gpsd_json.html#_devices
export interface DevicesResponse extends GpsdResponse {
  class: "DEVICES",
  devices: Device[],
  remote?: string
}

// https://gpsd.gitlab.io/gpsd/gpsd_json.html#_poll
export interface PollResponse extends GpsdResponse {
  class: "POLL",
  time: number,
  active: boolean,
  tpv: TpvResponse[],
  sky: SkyResponse[]
}

// https://gpsd.gitlab.io/gpsd/gpsd_json.html#_sky
export interface SkyResponse extends GpsdResponse {
  class: "SKY",
  device?: string,
  time?: Date | string,
  gdop?: number,
  hdop?: number,
  pdop?: number,
  tdop?: number,
  vdop?: number,
  xdop?: number,
  ydop?: number,
  nSat?: number,
  uSat?: number,
  satellites: Satellite[]
}

// https://gpsd.gitlab.io/gpsd/gpsd_json.html#_tpv
export interface TpvResponse extends GpsdResponse {
  device?: string,
  mode: TpvMode
  status?: FixStatus,
  time?: Date | string,
  altHAE?: number,
  altMSL?: number,
  alt?: number,
  climb?: number,
  datum?: string,
  depth?: number,
  dpgsAge?: number,
  dgpsSta?: number,
  epc?: number,
  epd?: number,
  eph?: number,
  eps?: number,
  ept?: number,
  epx?: number,
  epy?: number,
  epv?: number,
  geoidSep?: number,
  lat?: number,
  leapseconds?: number,
  lon?: number,
  track?: number,
  magtrack?: number,
  magvar?: number,
  speed?: number,
  ecefx?: number
  ecefy?: number
  ecefz?: number
  // And more...
}

// https://gpsd.gitlab.io/gpsd/gpsd_json.html#_version
export interface VersionResponse extends GpsdResponse {
  class: "VERSION",
  release: string,
  rev: string,
  proto_major: number,
  proto_minor: number,
  remote?: string
}
