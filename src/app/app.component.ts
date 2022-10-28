import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { GoogleMap, MapInfoWindow, MapMarker } from '@angular/google-maps';
import { DailyWeatherInfo, Forecast, TimeOfDayGrouping, WeatherStat } from './app.model';
import { GeocoderResponse } from './geocoder-response.model';
import { GeocodingService } from './geocoding.service';
import { WeatherService } from './weather.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  constructor(
    private geocodingService: GeocodingService,
    private weatherService: WeatherService,
    private cd: ChangeDetectorRef
  ) { }

  @ViewChild(GoogleMap, { static: false }) map: GoogleMap;
  @ViewChild(MapInfoWindow, { static: false }) infoWindow: MapInfoWindow;
  currentDayId = 0;
  statsTitle: string;
  weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  tempTitle = "Temperature";
  humidTitle = "Humidity";
  weatherDays: string[] = [];
  weatherForecast: any;
  weatherStats: WeatherStat;
  weatherGroup: TimeOfDayGrouping;
  currentTempChartData: number[] = [];
  currentTempChartDate: string;
  currentHumidChartData: number[] = [];
  currentHumidChartDate: string;
  currentDayInfo: DailyWeatherInfo;
  weatherDataLoaded = false;
  chartLoaded = false;
  tempChartLoaded = false;
  humidChartLoaded = false;
  weatherDataMap = new Map<string, DailyWeatherInfo>();
  mapZoom = 12;
  mapCenter: google.maps.LatLng;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    zoomControl: true,
    scrollwheel: false,
    disableDoubleClickZoom: true,
    maxZoom: 20,
    minZoom: 4,
  };
  markerInfoContent = '';
  markerOptions: google.maps.MarkerOptions = {
    draggable: false,
    animation: google.maps.Animation.DROP,
  };
  geocoderWorking = false;
  geolocationWorking = false;
  address: string;
  formattedAddress?: string | null = null;
  locationCoords?: google.maps.LatLng | null = null;

  ngOnInit() {
  }

  get isWorking(): boolean {
    return this.geolocationWorking || this.geocoderWorking;
  }

  generateWeatherMapData(date: string,main:Forecast) {
    let currentDate = new Date();  //get current date
    let incomingDate = new Date(date);
    let currentWeekday = currentDate.getDay(); //get current day of the week
    let offsetDay = incomingDate.getDate() - currentDate.getDate();
    let numOfDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth()+1, 0).getDate();
    if(offsetDay < 0) {
      offsetDay = (numOfDaysInMonth - currentDate.getDate()) + incomingDate.getDate();
    }
    let dayOfWeek = this.weekday[(currentWeekday+offsetDay)%7];
    if(this.weatherDataMap.has(dayOfWeek)) {
      this.weatherDataMap.get(dayOfWeek).data.push(main);
    }else{
      this.weatherDataMap.set(dayOfWeek,{date:date,data:[main]})
    }
  }

  findAddress() {
    this.resetCharts();
    if (!this.address || this.address.length === 0) {
      return;
    }
    this.geocoderWorking = true;
    this.geocodingService
      .getLocation(this.address)
      .subscribe(
        (response: GeocoderResponse) => {
          if (response.status === 'OK' && response.results?.length) {
            const location = response.results[0];
            const loc: any = location.geometry.location;
            this.locationCoords = new google.maps.LatLng(loc.lat, loc.lng);
            this.mapCenter = location.geometry.location;
            setTimeout(() => {
              if (this.map !== undefined) {
                this.map.panTo(location.geometry.location);
              }
            }, 200);
            this.address = location.formatted_address;
            this.formattedAddress = location.formatted_address;
            this.markerInfoContent = location.formatted_address;
            this.markerOptions = {
              draggable: true,
              animation: google.maps.Animation.DROP,
            };
            this.weatherService.getWeatherForecast(this.locationCoords.lat(), this.locationCoords.lng()).subscribe((res: any) => {
              this.weatherForecast = res.list;
              this.weatherForecast.forEach((item: any) => {
                this.generateWeatherMapData(item.dt_txt, item.main);
              })
              this.weatherDays = Array.from(this.weatherDataMap.keys());
              this.weatherDataLoaded = true;
              this.getDailyInformation(0); //display information of first day
            })
          }
        },
        (err: HttpErrorResponse) => {
          console.error('geocoder error', err);
        }
      )
      .add(() => {
        this.geocoderWorking = false;
      });
  }

  getCurrentLocation() {
    this.resetCharts();
    this.geolocationWorking = true;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.geolocationWorking = false;
        const point: google.maps.LatLngLiteral = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        this.geocoderWorking = true;
        this.geocodingService
          .geocodeLatLng(point)
          .then((response: GeocoderResponse) => {
            if (response.status === 'OK' && response.results?.length) {
              const value = response.results[0];
              this.locationCoords = new google.maps.LatLng(point);
              this.mapCenter = new google.maps.LatLng(point);
              this.map.panTo(point);
              this.address = value.formatted_address;
              this.formattedAddress = value.formatted_address;
              this.markerInfoContent = value.formatted_address;
              this.markerOptions = {
                draggable: true,
                animation: google.maps.Animation.DROP,
              };
              this.weatherService.getWeatherForecast(this.locationCoords.lat(), this.locationCoords.lng()).subscribe((res: any) => {
                this.weatherForecast = res.list;
                this.weatherForecast.forEach(item => {
                  this.generateWeatherMapData(item.dt_txt, item.main);
                })
                this.weatherDays = Array.from(this.weatherDataMap.keys());
                this.weatherDataLoaded = true;
                this.getDailyInformation(0); //display information of first day
              })
            }
          })
          .finally(() => {
            this.geocoderWorking = false;
          });
      },
      (error) => {
        this.geolocationWorking = false;
      },
      { enableHighAccuracy: true }
    );
  }

  openInfoWindow(marker: MapMarker) {
    this.infoWindow.open(marker);
  }

  resetCharts() {
    this.weatherDataLoaded = false;
    this.weatherDataMap = new Map();
  }

  onMapDragEnd(event: google.maps.MapMouseEvent) {
    const point: google.maps.LatLngLiteral = {
      lat: event.latLng.lat(),
      lng: event.latLng.lng(),
    };
    this.geocoderWorking = true;
    this.geocodingService
      .geocodeLatLng(point)
      .then((response: GeocoderResponse) => {
        if (response.status === 'OK') {
          if (response.results.length) {
            const value = response.results[0];
            this.locationCoords = new google.maps.LatLng(point);
            this.mapCenter = new google.maps.LatLng(point);
            this.map.panTo(point);
            this.address = value.formatted_address;
            this.formattedAddress = value.formatted_address;
            this.markerOptions = {
              draggable: true,
              animation: google.maps.Animation.DROP,
            };
            this.markerInfoContent = value.formatted_address;
          }
        }
      })
      .finally(() => {
        this.geocoderWorking = false;
      });
  }

  getDailyInformation($event) {
    this.currentDayId = $event;
    this.currentDayInfo = this.weatherDataMap.get(this.weatherDays[$event]);
    this.getChartInformation(0);
  }

  getChartInformation($event) {
    ($event == 0) ? this.loadTemperatureChart(this.currentDayInfo) : this.loadHumidityChart(this.currentDayInfo);
    this.cd.detectChanges();
  }

  loadTemperatureChart(info: DailyWeatherInfo) {
    this.tempChartLoaded = false;  // load temperature by default
    setTimeout(() => { this.tempChartLoaded = true; }, 500);
    let data = [];
    info.data.forEach(item => {
      data.push(item.temp);
    })
    this.currentTempChartData = data;
    this.currentTempChartDate = this.currentDayInfo.date;
    this.statsTitle = "Temperature Stats";
    this.calculateDataAndStats(data);
  }

  loadHumidityChart(info: DailyWeatherInfo) {
    this.humidChartLoaded = false;
    setTimeout(() => { this.humidChartLoaded = true; }, 500); //allowChartLoad
    let data = [];
    info.data.forEach(item => {
      data.push(item.humidity)
    })
    this.currentHumidChartData = data;
    this.currentHumidChartDate = this.currentDayInfo.date;
    this.statsTitle = "Humidity Stats";
    this.calculateDataAndStats(data);
  }

  calculateDataAndStats(data: number[]) {
    this.weatherStats = {
      mean: this.getMeanValue(data),
      mode: this.getModeValue(data),
      min: this.getMinValue(data),
      max: this.getMaxValue(data),
    }
    this.weatherGroup = {
      morning: this.getMorningValues(data),
      day: this.getAfternoonValues(data),
      night: this.getNightValues(data)
    }
  }


  // Helper Methods
  getMeanValue(data: number[]) {
    return Number((data.reduce((a, b) => a + b, 0) / data.length).toFixed(2));
  }

  getModeValue(data: number[]) {
    const rounded_data = data.map(x => Math.round(x));
    let numMapping = {};
    let greatestFreq = 0;
    let mode;
    rounded_data.forEach(number => {
      numMapping[number] = (numMapping[number] || 0) + 1;

      if (greatestFreq < numMapping[number]) {
        greatestFreq = numMapping[number];
        mode = number;
      }
    });
    return mode;
  }

  getMinValue(data: number[]) {
    return Math.min(...data)
  }

  getMaxValue(data: number[]) {
    return Math.max(...data)
  }

  getMorningValues(data: number[]) {
    let statData = this.sanitizeOffsetData(data);
    let res = this.getMeanValue([...statData.slice(0, 5)]);
    return (res == 0)?"No Data":res;
  }

  getAfternoonValues(data: number[]) {
    let statData = this.sanitizeOffsetData(data);
    let res = this.getMeanValue([...statData.slice(5, 7)]);
    return (res == 0)?"No Data":res;
  }

  getNightValues(data: number[]) {
    let statData = this.sanitizeOffsetData(data);
    let res = this.getMeanValue([...statData.slice(7, 9)]);
    return (res == 0)?"No Data":res;
  }

  sanitizeOffsetData(data: number[]) {
    let statData = [...data];
    if (data.length < 8 && this.currentDayId == 0) {
      let prependLen = 8 - data.length;
      for (let i = 0; i < prependLen; i++) {
        statData.unshift(0)
      }
    }
    if (data.length < 8 && this.currentDayId == this.weatherDays.length - 1) {
      let prependLen = 8 - data.length;
      for (let i = 0; i < prependLen; i++) {
        statData.push(0)
      }
    }
    return statData;
  }

}
