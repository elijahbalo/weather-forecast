import { Component, Input, OnInit } from '@angular/core';
import * as Highcharts from 'highcharts';

@Component({
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.scss']
})
export class LineChartComponent implements OnInit {
  @Input() set chartData(value: number[]) {
    this.setChartData(value);
  }
  @Input() set currentChartDate(date: string) {
    this.setCurrentChartDate(date);
  }
  @Input() set title(title: string){
    this.chartOptions.series.forEach((item:any) => {item.name = title});
  };
  constructor() {}

  ngOnInit(): void {}
  setChartData(value) {
    this.chartOptions.series.forEach((item:any) => {item.data = value})
  }
  setCurrentChartDate(date){
    let currentTime = new Date(date);
    this.chartOptions.series.forEach((item:any) => {item.pointStart = Date.UTC(currentTime.getFullYear(),currentTime.getMonth(), currentTime.getDate())})
  }

  currentTime = new Date();
  year = this.currentTime.getFullYear();
  month = this.currentTime.getMonth();
  day = this.currentTime.getDate();

  highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    chart: {
      backgroundColor: 'transparent'

    },
    title: {
      text: undefined,
      align: 'left',
      x: 25,
      margin: 10,
      style: {
        fontSize: '24px',
        fontWeight: 'semi bold'
      },
    },
    credits: {
      enabled: false,
    },
    xAxis: {
      type: 'datetime',
    },
    yAxis: {
      gridLineWidth: 0,
      title: {
        enabled: false,
      },
    },
    legend: {
      align: 'left',
      verticalAlign: 'top',
      x: 80,
      symbolWidth: 10,
      symbolHeight: 50,
    },
    series: [
      {
        color: '#E9892D',
        marker: {
          enabled: false,
        },
        pointStart: Date.UTC(this.year, this.month, this.day),
        pointInterval: 3600 * 3000, // one hour
      }

    ],
  } as any;
}