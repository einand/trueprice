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
if set(tv_fees)!=set(range(min(tv_fees),max(tv_fees)+1)) or min(tv_fees)!=1991 or max(tv_fees)!=2025:
    raise ValueError('TV fee series must be continuous for 1991–2025')
if any(tv_fee_meta[y]['regime'] != ('tv_receiver_fee' if y<=2018 else 'public_service_fee') for y in tv_fees):
    raise ValueError('TV fee regime must switch from household receiver fee to individual public service fee in 2019')
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
comparison_rows=[{k:v for k,v in row.items() if k not in ('average_monthly_salary_sek','average_annual_salary_sek')} for row in rows]
result={'generated_at_utc':datetime.now(timezone.utc).isoformat(),'sources':json.loads((ROOT/'data/sources.json').read_text()),'wage_series_reference':'average_monthly_salaries.csv','data':comparison_rows,'supplementary_series':{'historical_manufacturing_hourly_wages_by_industry':historical_wages}}
(ROOT/'static/data/series.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
for source_file in ['data/average_monthly_salaries.csv','data/historical_manufacturing_hourly_wages.csv','data/gasoline_prices.csv','data/gasoline_prices_2024_sek_per_liter.csv','data/cpi_annual_average.csv','data/tv_license_annual_fees.csv']:
    shutil.copyfile(ROOT/source_file, ROOT/'static/data'/Path(source_file).name)
print(f"Validated {len(rows)} annual rows; gasoline {min(prices)}–{max(prices)}, TV fee {min(tv_fees)}–{max(tv_fees)}, salary {min(salaries)}–{max(salaries)}, historical wage-category observations {len(historical_wages)}.")
