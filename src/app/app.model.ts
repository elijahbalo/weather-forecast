export interface WeatherStat {
    mean: number,
    mode: number,
    min: number,
    max: number
}
export interface TimeOfDayGrouping {
    morning: number | string,
    day: number | string,
    night: number | string,
}
export interface Forecast {
    temp: number,
    feels_like: number,
    temp_min: number,
    temp_max: number,
    pressure: number,
    sea_level: number,
    grnd_level: number,
    humidity: number,
    temp_kf: number

}
export interface DailyWeatherInfo {
    date: string,
    data: Forecast[]

}
