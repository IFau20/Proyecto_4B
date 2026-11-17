import { translate } from "./i18n.js";
import { expect,it } from "vitest";
import { inDateRange } from "./PriceHistoryChart.jsx";
it("filters historical observations using calendar date endpoints",()=>{
 const point={checkedAt:"2026-11-15T12:30:00.000Z",priceClp:550000};
 expect(inDateRange(point,"2026-11-14","2026-11-16")).toBe(true);
 expect(inDateRange(point,"2026-11-16","2026-11-25")).toBe(false);
 expect(inDateRange(point,"","")).toBe(true);
});

import { formatPriceAxis, collapseUnchangedPrices, priceAtTime } from "./PriceHistoryChart.jsx";
it("renders millions instead of thousands of k",()=>{
 expect(formatPriceAxis(1222000)).toBe("1.222M");
 expect(formatPriceAxis(1000000)).toBe("1M");
 expect(formatPriceAxis(880000)).toBe("880k");
});
it("shows a point only when the price changes, preserving chronological order",()=>{
 const points=[
 {checkedAt:"2026-01-03T00:00:00Z",priceClp:700000},
 {checkedAt:"2026-01-01T00:00:00Z",priceClp:700000},
 {checkedAt:"2026-01-02T00:00:00Z",priceClp:700000},
 {checkedAt:"2026-01-04T00:00:00Z",priceClp:650000},
 {checkedAt:"2026-01-05T00:00:00Z",priceClp:650000}
 ];
 const compact=collapseUnchangedPrices(points);
 expect(compact.map(p=>p.priceClp)).toEqual([700000,650000]);
 expect(priceAtTime(points,Date.parse("2026-01-03T12:00:00Z")).priceClp).toBe(700000);
 expect(priceAtTime(points,Date.parse("2026-01-05T12:00:00Z")).priceClp).toBe(650000);
});

import {render,screen,fireEvent} from "@testing-library/react";
import PriceHistoryChart from "./PriceHistoryChart.jsx";
it("hides stores without observations in selected period from both cards and legend",()=>{
 const history={sources:[
  {sourceId:"recent",sourceName:"Tienda Reciente",points:[{checkedAt:"2026-11-15T00:00:00Z",priceClp:800000}]},
  {sourceId:"old",sourceName:"Tienda Antigua",points:[{checkedAt:"2025-03-01T00:00:00Z",priceClp:900000}]},
 ]};
 const {container}=render(<PriceHistoryChart history={history} locale="es" t={translate}/>);
 expect(screen.getByRole("heading",{name:"Tienda Antigua"})).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText("Desde"),{target:{value:"2026-11-01"}});
 expect(screen.queryByRole("heading",{name:"Tienda Antigua"})).not.toBeInTheDocument();
 expect(screen.queryByLabelText("Tienda Antigua")).not.toBeInTheDocument();
 expect(screen.getByRole("heading",{name:"Tienda Reciente"})).toBeInTheDocument();
 expect(container.querySelectorAll(".trend-card")).toHaveLength(1);
 fireEvent.change(screen.getByLabelText("Desde"),{target:{value:"2027-01-01"}});
 expect(container.querySelectorAll(".trend-card")).toHaveLength(0);
 expect(screen.getByText("No hay observaciones reales para este período.")).toBeInTheDocument();
});

it("translates year periods and formats chart values when language changes",()=>{
 const history={sources:[{sourceId:"shop",sourceName:"Shop",points:[{checkedAt:"2026-11-15T12:00:00Z",priceClp:500000}]}]};
 const {rerender}=render(<PriceHistoryChart history={history} locale="es" t={(key,values)=>translate(key,"es",values)}/>);
 expect(screen.getByRole("button",{name:"1a"})).toBeInTheDocument();
 expect(screen.getAllByText("$500.000").length).toBeGreaterThan(0);
 rerender(<PriceHistoryChart history={history} locale="en" t={(key,values)=>translate(key,"en",values)}/>);
 expect(screen.getByRole("button",{name:"1y"})).toBeInTheDocument();
 expect(screen.getByRole("group",{name:"Period"})).toBeInTheDocument();
 expect(screen.getAllByText("$500,000").length).toBeGreaterThan(0);
});
