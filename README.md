# Quick Statements

## wersja 1

### Dodaj nowe kluby

```sql
CREATE
LAST	Lpl	"Orlęta Kielce"
LAST	Dpl	"polski klub sportowy"
LAST	P17	Q36
LAST	P31	Q847017
LAST	P641	Q2736
LAST	P452	Q124022875
LAST	P118	Q2403778 -- liga
```

### Dodaj nowe stadiony

```sql
CREATE
LAST	Lpl	"Stadion Miejski w Ożarowie"
LAST	Dpl	"stadion sportowy w Polsce"
LAST	P17	Q36
LAST	P31	Q483110
LAST	P1083	1700 -- liczba miejsc
LAST	P466	Q11685421 -- użytkownik
LAST	P625	@50.892778/21.659374
```

## Wersja 2 (csv)

### Dodaj brakujące kluby

```csv
drużyna, label, desc, państwo, jest to, sport, liga
qid,Lpl,Dpl,P17,P31,P641,P118
,"Odra Nietków","polski klub piłkarski",Q36,Q847017,Q2736,Q11710567
,"Ilanka Rzepin","polski klub piłkarski",Q36,Q847017,Q2736,Q11710567
,"","polski klub piłkarski",Q36,Q847017,Q2736,Q11710567
,"","polski klub piłkarski",Q36,Q847017,Q2736,Q11710567

drużyna, desc, państwo, jest to, sport, liga
qid,Dpl,P17,P31,P641,P118
Q60854771,"polski klub piłkarski",Q36,Q847017,Q2736,Q11710567
Q11821067,"polski klub piłkarski",Q36,Q847017,Q2736,Q11710567
,"polski klub piłkarski",Q36,Q847017,Q2736,Q11710567
,"polski klub piłkarski",Q36,Q847017,Q2736,Q11710567

drużyna, państwo, jest to, sport, liga
qid,P17,P31,P641,P118
Q2086814,Q36,Q847017,Q2736,Q11710567
Q1091780,Q36,Q847017,Q2736,Q11710567
,Q36,Q847017,Q2736,Q11710567
,Q36,Q847017,Q2736,Q11710567
```

### Dodaj kluby do ligi

```csv
liga,zespół biorący udział
qid,P1923
Q141493028,Q141493072
Q141493028,Q141493071
Q141493028,Q141493070
Q141493028,Q141493069
Q141493028,Q141493067
Q141493028,Q141493066
Q141493028,Q141493065
Q141493028,Q141493064
Q141493028,Q141493063
Q141493028,Q141493062
Q141493028,Q141493060
Q141493028,Q141493058
```

### Dodaj brakujące stadiony

```csv
stadion,Label,desc,państwo,jest to,sport,współrzędne,użytkownik,liczba miejsc
qid,Lpl,Dpl,P17,P31,P641,P625,P466,P1083
,"Stadion Miejski w Strzelcach Krajeńskich","stadion sportowy w Strzelcach Krajeńskich, Polska",Q36,Q483110,Q2736,@52.881621/15.519948,Q9394516,776

stadion,desc,państwo,jest to,sport,użytkownik,liczba miejsc
qid,Dpl,P17,P31,P641,P466,P1083
Q9341190,"boisko piłkarskie w Szprotawie, Polska",Q36,Q483110,Q2736,Q60854771,1500

stadion,państwo,jest to,sport,użytkownik,liczba miejsc
qid,P17,P31,P641,P466,P1083
Q139806084,Q36,Q483110,Q2736,Q935163,2000
```

### Przypisz stadiony klubom

```csv
klub,stadion
qid,P115
Q141493066,Q141501492
Q141493060,Q141501491
Q141493063,Q141501490
Q141493072,Q141501489
Q141493065,Q141501483
Q141493067,Q141501481
Q141493058,Q141501480
Q11799414,Q141501478
Q141493071,Q141501477
Q141493070,Q141501476
Q86659642,Q141501475
Q141493064,Q141501472
Q141493069,Q141501471
Q141493062,Q141501470
```
