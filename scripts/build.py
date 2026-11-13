#!/usr/bin/env python3
import csv, json, shutil
from pathlib import Path
from datetime import datetime, timezone
ROOT=Path(__file__).resolve().parents[1]
def read(name, key):
    with (ROOT/name).open(newline='') as f:
        rows=list(csv.DictReader(f))
    out={int(r['year']):float(r[key]) for r in rows}
    if len(out)!=len(rows) or any(v<=0 for v in out.values()):
        raise ValueError(f'Invalid or duplicate data in {name}')
    return out
source_real=read('data/gasoline_prices_2024_sek_per_liter.csv','sek_per_liter_2024_prices')
cpi=read('data/cpi_annual_average.csv','cpi_2020_100_annual_average')
if set(source_real)!=set(cpi) or 2024 not in cpi:
    raise ValueError('gasoline source prices and CPI must cover the same years and include 2024')
prices={year:round(value*cpi[year]/cpi[2024],2) for year,value in source_real.items()}
with (ROOT/'data/gasoline_prices.csv').open('w',newline='') as f:
    writer=csv.writer(f); writer.writerow(['year','sek_per_liter'])
    writer.writerows((year,f'{value:.2f}') for year,value in sorted(prices.items()))
salaries=read('data/average_monthly_salaries.csv','sek_per_month')
tv_fees=read('data/tv_license_annual_fees.csv','annual_fee_sek')
with (ROOT/'data/tv_license_annual_fees.csv').open(newline='') as f:
    tv_fee_source=list(csv.DictReader(f))
tv_fee_meta={int(r['year']):{'unit':r['fee_unit'],'regime':r['regime']} for r in tv_fee_source}
if not set(range(1991,2026)).issubset(tv_fees) or any(tv_fee_meta[y]['regime'] != ('tv_receiver_fee' if y<=2018 else 'public_service_fee') for y in range(1991,2026)):
    raise ValueError('TV fee series must retain continuous 1991–2025 values and the 2019 regime change')
with (ROOT/'data/gasoline_historical_price_ranges.csv').open(newline='') as f:
    historical_gasoline=list(csv.DictReader(f))
for row in historical_gasoline:
    if int(row['year'])<1900 or float(row['price_min_ore_per_liter'])<=0 or float(row['price_max_ore_per_liter'])<float(row['price_min_ore_per_liter']):
        raise ValueError('invalid historical gasoline price range')
with (ROOT/'data/historical_manufacturing_hourly_wages.csv').open(newline='') as f:
    historical_wages=list(csv.DictReader(f))
seen=set()
for wage in historical_wages:
    key=(int(wage['year']),wage['sex'],wage['industry_category'])
    if key in seen or float(wage['wage_sek_per_hour'])<=0:
        raise ValueError('duplicate or invalid historical wage observation')
    seen.add(key)
rows=[]
for year in sorted(prices.keys() | salaries.keys() | tv_fees.keys()):
    p, m=prices.get(year), salaries.get(year)
    tv_fee=tv_fees.get(year)
    fee_unit=tv_fee_meta[year]['unit'] if tv_fee else None
    rows.append({'year':year,'gasoline_price_sek_per_liter':p,'average_monthly_salary_sek':m,'average_annual_salary_sek':m*12 if m else None,'share_percent':p/(m*12)*100 if p and m else None,'share_percent_two_adults':p/(m*12*2)*100 if p and m else None,'trend':None,'trend_two_adults':None,'tv_license_fee_sek':tv_fee,'tv_license_fee_unit':fee_unit,'tv_license_regime':tv_fee_meta[year]['regime'] if tv_fee else None,'tv_license_share_percent':tv_fee/(m*12)*100 if tv_fee and m else None,'tv_license_share_percent_two_adults':tv_fee*(2 if fee_unit=='person_year_max' else 1)/(m*12*2)*100 if tv_fee and m else None,'tv_license_trend':None,'tv_license_trend_two_adults':None,'tv_license_break_before':year==2019})
for i in range(1,len(rows)):
    prev, cur=rows[i-1],rows[i]
    if prev['year']+1==cur['year'] and prev['share_percent'] is not None and cur['share_percent'] is not None:
        delta=cur['share_percent']-prev['share_percent']
        cur['trend']='dyrare relativt lön' if delta>0 else 'billigare relativt lön' if delta<0 else 'oförändrat'
        delta=cur['share_percent_two_adults']-prev['share_percent_two_adults']
        cur['trend_two_adults']='dyrare relativt lön' if delta>0 else 'billigare relativt lön' if delta<0 else 'oförändrat'
    if prev['year']+1==cur['year'] and prev['tv_license_regime']==cur['tv_license_regime'] and prev['tv_license_share_percent'] is not None and cur['tv_license_share_percent'] is not None:
        delta=cur['tv_license_share_percent']-prev['tv_license_share_percent']
        cur['tv_license_trend']='dyrare relativt lön' if delta>0 else 'billigare relativt lön' if delta<0 else 'oförändrat'
        delta=cur['tv_license_share_percent_two_adults']-prev['tv_license_share_percent_two_adults']
        cur['tv_license_trend_two_adults']='dyrare relativt lön' if delta>0 else 'billigare relativt lön' if delta<0 else 'oförändrat'
all_sources=json.loads((ROOT/'data/sources.json').read_text())
generated_at=datetime.now(timezone.utc).isoformat()
gasoline_data=[{'year':r['year'],'price_sek_per_liter':r['gasoline_price_sek_per_liter'],'share_percent':r['share_percent'],'share_percent_two_adults':r['share_percent_two_adults'],'trend':r['trend'],'trend_two_adults':r['trend_two_adults']} for r in rows if r['gasoline_price_sek_per_liter'] is not None or r['share_percent'] is not None]
tv_data=[{'year':r['year'],'fee_sek':r['tv_license_fee_sek'],'fee_unit':r['tv_license_fee_unit'],'fee_regime':r['tv_license_regime'],'share_percent':r['tv_license_share_percent'],'share_percent_two_adults':r['tv_license_share_percent_two_adults'],'trend':r['tv_license_trend'],'trend_two_adults':r['tv_license_trend_two_adults'],'break_before':r['year']==2019 or (i>0 and rows[i-1]['tv_license_regime']!=r['tv_license_regime'])} for i,r in enumerate(rows) if r['tv_license_fee_sek'] is not None or r['tv_license_share_percent'] is not None]
def write_series(filename, series_id, series_data, source_ids):
    payload={'generated_at_utc':generated_at,'series_id':series_id,'wage_series_reference':'average_monthly_salaries.csv','sources':[s for s in all_sources['series'] if s['id'] in source_ids],'data':series_data}
    (ROOT/'static/data'/filename).write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n')
write_series('gasoline_series.json','gasoline',gasoline_data,{'average_salary','gasoline_price_nominal','gasoline_price_2024_level','cpi_annual_average','gasoline_historical_prewar_price_ranges'})
write_series('tv_license_series.json','tv_license',tv_data,{'average_salary','tv_license_and_public_service_fee'})
index={'generated_at_utc':generated_at,'sources':all_sources,'wage_series_reference':'average_monthly_salaries.csv','series':[{'id':'gasoline','file':'gasoline_series.json'},{'id':'tv_license','file':'tv_license_series.json'},{'id':'historical_manufacturing_hourly_wages_by_industry','file':'historical_manufacturing_hourly_wages.csv'}]}
(ROOT/'static/data/series.json').write_text(json.dumps(index,ensure_ascii=False,indent=2)+'\n')
for source_file in ['data/average_monthly_salaries.csv','data/historical_manufacturing_hourly_wages.csv','data/gasoline_prices.csv','data/gasoline_prices_2024_sek_per_liter.csv','data/gasoline_historical_price_ranges.csv','data/cpi_annual_average.csv','data/tv_license_annual_fees.csv']:
    shutil.copyfile(ROOT/source_file, ROOT/'static/data'/Path(source_file).name)
print(f"Validated {len(rows)} annual rows; gasoline pump-price series {min(prices)}–{max(prices)}, historical gasoline observations {len(historical_gasoline)} years, radio/TV fee observations {min(tv_fees)}–{max(tv_fees)} with gaps, salary {min(salaries)}–{max(salaries)}, historical wage-category observations {len(historical_wages)}.")
