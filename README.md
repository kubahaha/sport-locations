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
qid,Lpl,Dpl,P17,P31,P641,P452,P118
,"Piast Żmigród","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"GKS Raciborowice","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"Chrobry II Głogów","polski klub sportowy, zespół rezerw Chrobrego Głogów",Q36,Q847017,Q2736,Q124022875,Q2403778
,"GKS Mirków/Długołęka","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"Błyskawica Gać","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"WKS Wierzbice","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"Polonia Bielany Wrocławskie","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"Polonia Środa Śląska","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"AKS Strzegom","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"Iskra Księginice","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"Odra Ścinawa","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
,"Prochowiczanka Prochowice","polski klub sportowy",Q36,Q847017,Q2736,Q124022875,Q2403778
```

### Dodaj kluby do ligi

```csv
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
qid,Lpl,Dpl,P17,P31,P625,P466,P1083
,"Boczne boisko Chrobrego Głogów","boisko piłkarskie w Głogowie, Polska",Q36,Q1154710,@51.655950/16.098769,Q141493062,924
,"Stadion Miejski OSiR Strzegom","stadion sportowy w Strzegomiu, Polska",Q36,Q483110,@50.971231/16.352377,Q141493069,400
,"Stadion Miejski w Gaci","stadion sportowy w Gaci, Polska",Q36,Q1154710,@50.887462/17.368816,Q141493064,600
,"Stadion Miejski w Złotoryi","stadion sportowy w Złotoryi, Polska",Q36,Q1154710,@51.126327/15.905575,Q86659642,1000
,"Stadion w Księginicach","stadion sportowy w Księginicach, Polska",Q36,Q483110,@51.405865/16.273938,Q141493070,200
,"Stadion Miejski w Ścinawie","stadion sportowy w Ścinawie, Polska",Q36,Q483110,@51.409151/16.436588,Q141493071,535
,"Stadion OSiR w Ząbkowicach Śląskich","stadion sportowy w Ząbkowicach Śląskich, Polska",Q36,Q483110,@50.594251/16.827160,Q11799414,2500
,"Stadion OSiR w Żmigrodzie","stadion sportowy w Żmigrodzie, Polska",Q36,Q483110,@51.471293/16.917368,Q141493058,900
,"Stadion Miejski OSiR Środa Śląska","stadion sportowy w Środzie Śląskiej, Polska",Q36,Q483110,@51.168594/16.604762,Q141493067,500
,"Stadion Prochowiczanka","stadion sportowy w Prochowicach, Polska",Q36,Q483110,@:51.273031/16.372343,Q141493072,1000
,"Boisko w Wierzbicahc","stadion sportowy w Wierzbicach, Polska",Q36,Q483110,@50.951472/16.896662,Q141493065,350
```

### Przypisz stadiony klubom

```csv
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
