import { EventEmitter } from "events";
import { Socket } from "net";
import * as rl from "readline";
import { ClientOptions, PacketError } from "./models";

import { WatchRequest } from "./requests";
import { DevicesResponse, GpsdResponse, PollResponse, SkyResponse, TpvResponse, VersionResponse } from "./responses";

export declare interface GpsdClient {
  /** Raised upon connection to the GPSD server. */
  on(event: "socket.connect", listener: () => void): this;
  /** Raised when disconnected from the GPSD server. */
  on(event: "socket.disconnect", listener: () => void): this;
  /** Raised when a socket error occurs. */
  on(event: "socket.error", listener: (e: Error) => void): this;
  /** Raised when the socket times out. */
  on(event: "socket.error", listener: (e: Error) => void): this;
  /** Raised when a packet error occurs.  */
  on(event: "packet.error", listener: (e: Error) => void): this;

  // Responses
  on(event: "packet.ALL", listener: (packet: GpsdResponse) => void): this;
  on(event: "packet.ATT", listener: (packet: GpsdResponse) => void): this;
  on(event: "packet.GST", listener: (packet: GpsdResponse) => void): this;
  on(event: "packet.OSC", listener: (packet: GpsdResponse) => void): this;
  on(event: "packet.PPS", listener: (packet: GpsdResponse) => void): this;
  on(event: "packet.SKY", listener: (packet: SkyResponse) => void): this;
  on(event: "packet.TOFF", listener: (packet: GpsdResponse) => void): this;
  on(event: "packet.TPV", listener: (packet: TpvResponse) => void): this;

  // Command responses
  on(event: "packet.DEVICES", listener: (packet: DevicesResponse) => void): this;
  on(event: "packet.POLL", listener: (packet: PollResponse) => void): this;
  on(event: "packet.VERSION", listener: (packet: VersionResponse) => void): this;
}

type GpsCommand = "VERSION" | "DEVICES" | "WATCH" | "POLL" | "DEVICE" | "ERROR";

export class GpsdClient extends EventEmitter {
  private _isConnected = false;

  private readonly host: string;

  private readonly port: number;

  private reader: rl.Interface | null = null;

  private readonly socket: Socket;

  public get isConnected(): boolean { return this._isConnected; }

  public constructor(options?: ClientOptions) {
    super();

    this.host = options?.host || "localhost";
    this.port = options?.port || 2947;
    this.socket = new Socket();

    this.socket
      .on("close", this.onClose)
      .on("connect", this.onConnect)
      .on("error", this.onError)
      .on("timeout", this.onTimeout)
      ;
  }

  private onClose = (): void => {
    this.reader?.close();
    this.reader = null;
    this._isConnected = false;

    this.emit("socket.disconnect");
  }

  private onConnect = (): void => {
    this._isConnected = true;

    this.emit("socket.connect");
  }

  private onData = (line: string): void => {
    let packet: GpsdResponse;

    try {
      packet = JSON.parse(line) as GpsdResponse;
    } catch {
      this.emit("packet.error", new PacketError(line));

      return;
    }

    this.emit(`packet.${packet.class}`, packet);
    this.emit("packet.ALL", packet);
  }

  private onError = (e: Error): void => {
    this.emit("socket.error", e);
  }

  private onTimeout = (): void => {
    this.emit("socket.timeout");

    this._isConnected = false;

    this.socket.end();
  }

  private sendCommand(command: GpsCommand, payload: unknown = undefined) {
    if (!payload) {
      this.socket.write(`?${command};`);

      return;
    }

    payload = Object.assign(
      { "class": command },
      payload
    );

    this.socket.write(`?${command}=${JSON.stringify(payload)};`);
  }

  public connect(callback?: () => void): void {
    this.reader = rl.createInterface(this.socket);

    this.reader
      .on("line", this.onData)
      ;

    if (callback) {
      this.socket.once("connect", callback);
    }

    this.socket.connect({
      host: this.host,
      port: this.port
    });
  }

  public devices(): void {
    this.sendCommand("DEVICES");
  }

  public disconnect(): void {
    this.unwatch();
    this.socket.end();
  }

  public poll(): void {
    this.sendCommand("POLL");
  }

  public watch(options: WatchRequest): void {
    this.sendCommand("WATCH", options);
  }

  public unwatch(): void {
    this.watch({ enable: false });
  }
}
