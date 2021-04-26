import { GnssId } from "./enumerations";

export interface ClientOptions {
  host?: string,
  port?: number,
}

export interface Device {
  class: "DEVICE",
  path: string,
  flags: number,
  driver: string
}

export class PacketError extends Error {
  public data: string;

  public constructor(data: string) {
    super("Received malformed packet.");

    this.data = data;
  }
}

export interface Satellite {
  PRN: number,
  az?: number,
  el?: number,
  ss?: number,
  used: boolean,
  gnssid?: GnssId,
  svid?: number,
  sigid?: number,
  freqid?: number,
  health?: number
}
