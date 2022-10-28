import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {Observable, throwError} from 'rxjs';
import {catchError, tap, map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WeatherService {

  constructor(private http: HttpClient) {}

   getWeatherForecast(lat: number,long: number): Observable<any[]> {
    return this.http.get<any[]>(`http://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${long}&appid=b6a9988772363b38e7d2f3564d886891&units=metric`);
}
}
