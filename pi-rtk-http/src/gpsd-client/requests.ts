export interface WatchRequest {
  enable?: boolean,
  json?: boolean,
  nmea?: boolean,
  raw?: number,
  scaled?: boolean,
  split24?: boolean,
  pps?: boolean,
  device?: string,
  remote?: string
}
