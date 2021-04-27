import { Component } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { tap } from "rxjs/operators";
import { RinexLinks } from './shared/config';

interface Device {
  name: string
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public readonly devices$ = new BehaviorSubject<Device[]>([]);

  public readonly rinexLinks = RinexLinks;

  title = 'pi-rtk';

  constructor() {
    this.devices$.next([
      { name: "Raw GNSS" },
      { name: "Rover" }
    ]);
  }
}
