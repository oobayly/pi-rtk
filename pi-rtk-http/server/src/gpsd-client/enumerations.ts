export enum TpvMode {
  Unknown = 0,
  NoFix = 1,
  Fix2d = 2,
  Fix3d = 3
}

export enum FixStatus {
  Unknown = 0,
  Normal = 1,
  Dgps = 2,
  RtkFix = 3,
  RtkFloat = 4,
  Dr = 5,
  GnssDr = 6,
  Time = 7,
  Simulated = 8,
  Py = 9
}

export enum GnssId {
  GPS = 0,
  Galileo = 2,
  Beidou = 3,
  QZSS = 5,
  GLONASS = 6
}
