import React from "react"

import { funnelize } from "../../index"
import { orframe_data } from "../../../docs/sampledata/nyc_temp"

export const degreeDiffFormat = d => `${Math.ceil(d * 100) / 100}°`

export const summaryChart = {
  rAccessor: "stepValue",
  oAccessor: "stepName",
  summaryStyle: () => ({
    fill: "#d38779",
    fillOpacity: 0.5,
    stroke: "#b3331d",
    strokeOpacity: 0.75
  }),
  data: orframe_data,
  summaryType: { type: "violin", bins: 40 },
  axis: {
    orient: "left",
    tickFormat: degreeDiffFormat,
    label: "Monthly temperature"
  },
  oLabel: d => <text transform="translate(-10,10) rotate(45)">{d}</text>,
  margin: { left: 60, top: 85, bottom: 70, right: 30 },
  oPadding: 10
}

const funnel = [
  {
    color: "#00a2ce",
    visits: 1000,
    registration: 900,
    mop: 500,
    signups: 400,
    streamed: 300,
    paid: 100
  },
  {
    color: "#b3331d",
    visits: 200,
    registration: 160,
    mop: 180,
    signups: 170,
    streamed: 80,
    paid: 90
  },
  {
    color: "#b6a756",
    visits: 300,
    registration: 100,
    mop: 50,
    signups: 50,
    streamed: 50,
    paid: 50
  }
]

export const funnelData = funnelize({
  data: funnel,
  steps: ["visits", "registration", "mop", "signups", "streamed", "paid"],
  key: "color"
})
