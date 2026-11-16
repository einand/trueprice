#!/usr/bin/env python3
"""Independent verification of generated arithmetic, gaps, trends and source copying."""
import csv, json, math
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def csv_rows(name):
    with (ROOT/'data'/name).open() as f: return list(csv.DictReader(f))
def values(name,key): return {int(r['year']):float(r[key]) for r in csv_rows(name)}
def payload(name): return json.loads((ROOT/'static/data'/name).read_text())
def close(a,b):
    assert (a is None and b is None) or (a is not None and b is not None and math.isfinite(a) and math.isclose(a,b,rel_tol=1e-10,abs_tol=1e-12)), (a,b)
def trend(a,b): return 'dyrare relativt lön' if b>a else 'billigare relativt lön' if b<a else 'oförändrat'
wages=values('average_monthly_salaries.csv','sek_per_month')
fees={int(r['year']):r for r in csv_rows('tv_license_annual_fees.csv')}
real=values('gasoline_prices_2024_sek_per_liter.csv','sek_per_liter_2024_prices')
cpi=values('cpi_annual_average.csv','cpi_2020_100_annual_average')
hourly={(int(r['year']),r['sex'],r['industry_category']):float(r['wage_sek_per_hour']) for r in csv_rows('historical_manufacturing_hourly_wages.csv')}
count=0
for filename,kind in [('gasoline_series.json','gas'),('tv_license_series.json','tv'),('nintendo_hardware_launch_prices.json','hw'),('nintendo_software_prices.json','sw')]:
    p=payload(filename); assert p['sources']; previous=None
    for r in p['data']:
        year=r['year']; annual=wages.get(year,0)*12
        if kind=='gas':
            price=round(real[year]*cpi[year]/cpi[2024],2); close(r['price_sek_per_liter'],price)
        elif kind=='tv':
            price=float(fees[year]['annual_fee_sek']) if year in fees else None
            close(r['fee_sek'],price)
        else:
            price=r['price_sek']
            if not annual: annual=hourly.get((year,'men','vägt genomsnitt'),0)*2080
            close(r['annual_wage_sek'],annual or None)
        expected=price/annual*100 if price is not None and annual else None
        close(r['share_percent'],expected)
        if kind in ('gas','tv'):
            multiplier=2 if kind=='tv' and r['fee_unit']=='person_year_max' else 1
            close(r['share_percent_two_adults'],expected*multiplier/2 if expected is not None else None)
        else: assert r['share_percent_two_adults'] is None
        if kind=='hw': assert r['trend'] is None
        if kind=='sw' and r['reported_currency']=='SEK':
            close(price,round(r['reported_sales_value']/r['sample_size'],2))
        if kind=='sw' and r.get('observation_type')=='review_price_sample':
            sample=[x for x in csv_rows('nintendo_software_review_price_observations.csv') if int(x['observation_date'][:4])==year]
            close(price,round(sum(float(x['sek_per_game']) for x in sample)/len(sample),2))
            assert r['sample_size']==len(sample) and r['trend'] is None
            assert len(r['observation_source_urls'])==len(sample)
        if kind=='sw':
            comparable=previous is not None and r['reported_currency']=='SEK' and previous.get('reported_currency')=='SEK' and year==previous['year']+1 and expected is not None and previous['share_percent'] is not None
            assert r['trend']==(trend(previous['share_percent'],expected) if comparable else None)
        if kind=='sw' and r['reported_currency']=='EUR':
            assert price is None and expected is None and r['trend'] is None
            close(r['price_eur'],r['reported_sales_value']/r['sample_size'])
        if previous and kind in ('gas','tv'):
            comparable=year==previous['year']+1 and expected is not None and previous['share_percent'] is not None and (kind=='gas' or previous['fee_regime']==r['fee_regime'])
            assert r['trend']==(trend(previous['share_percent'],expected) if comparable else None)
        previous=r; count+=1
    for s in p['sources']:
        for key in ('source','url','unit','definition','coverage','retrieved_at','transformation'): assert s.get(key), (s['id'],key)
for file in (ROOT/'data').glob('*.csv'):
    assert file.read_bytes()==(ROOT/'static/data'/file.name).read_bytes(),file
# Regression against parliamentary source corrections, rate at 31 December.
assert {y:int(fees[y]['annual_fee_sek']) for y in (1978,1979,1980,1984)}=={1978:480,1979:480,1980:572,1984:736}
tv={r['year']:r for r in payload('tv_license_series.json')['data']}
assert tv[1967]['fee_sek'] is None and tv[1968]['fee_sek'] is None
assert tv[2019]['break_before'] and tv[2019]['trend'] is None
print(f'Independent arithmetic and metadata checks passed for {count} generated rows.')
