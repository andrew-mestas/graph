# D3 Graph 

## Summary
D3 graph created from data pulled from an obesity study. Data is held within a csv file and parsed out using d3 method. The remaining processing is taken care of via custom JavaScript functions designed by myself.

## Technologies used
HTML5, CSS - Page and style (not very styled yet)

JavaScript - Everything else - parsing and filtering data, transforming object structures

D3 - Creating graph and tooltips

PrettyJSON (jquery, underscore, backbone) - for displaying parsed data on page (not nessasary, but a nice feature)

## Challenges
Originally I tried to keep to JavaScript's functional nature which resulted in many Object.keys(x).forEach which given the amount of data handled caused loading time and graph rendering to be very slow. I was able to reduce the amount of processing time nearly in half for each of the sections I monitored for performance. By implementing for loops with stored variable for length I could process more items in less time. 

[forEach vs each vs for](https://jsperf.com/foreach-vs-jquery-each/9)

In addition, by reducing the amount of for loops and reevaluating what was necessary to have greating increased the main function where the sorting and filtering begin. 

Once the initial d3 parse is complete then an object is created which contains keys that correspond to the named fields within the csv file the values is data for each of those rows. This global object is used later for additional queries, sorting, filtering, etc...

```javascript
Loaded 599184 rows.
helpers.js:53 d: 8410.437ms
helpers.js:58 Initial: 4705.725ms
helpers.js:61 All data parsed!
helpers.js:62 Object {location_id: Object, location: Object, location_name: Object, year: Object, age_group_id: Object…}
helpers.js:361 SETUP
```

On average the d3 csv function takes 9963.9446 ms to complete and the global object creation an additional 4633.1585 ms after this startup though processing is relatively quick.

```javascript
Grouped By location_id filter for obese Array[219]
helpers.js:97 Parse: 889.254ms
helpers.js:98 Statistics by sex Object
helpers.js:99 Object
helpers.js:197 calculate: 2.788ms
helpers.js:216 GLINEDATA Object
helpers.js:283 graphing: 7.589ms
helpers.js:497 PREV locations
helpers.js:81 Grouped By age_group_id filter for obese Array[19]
helpers.js:97 Parse: 1138.936ms
helpers.js:98 Statistics by sex Object
helpers.js:99 Object
helpers.js:197 calculate: 0.357ms
helpers.js:216 GLINEDATA Object
helpers.js:283 graphing: 3.757ms
helpers.js:497 PREV ages
helpers.js:81 Grouped By year filter for obese Array[24]
helpers.js:97 Parse: 881.959ms
helpers.js:98 Statistics by sex Object
helpers.js:99 Object
helpers.js:197 calculate: 0.925ms
helpers.js:216 GLINEDATA Object
helpers.js:283 graphing: 4.767ms
helpers.js:497 PREV year
helpers.js:81 Grouped By year filter for 5 to 9 yrs Array[24]
helpers.js:97 Parse: 214.001ms
helpers.js:98 Statistics by sex Object
helpers.js:99 Object
helpers.js:197 calculate: 0.575ms
helpers.js:216 GLINEDATA Object
helpers.js:283 graphing: 4.442ms
helpers.js:497 PREV year
helpers.js:81 Grouped By year filter for 25 to 29 yrs Array[24]
helpers.js:97 Parse: 199.576ms
helpers.js:98 Statistics by sex Object
helpers.js:99 Object
helpers.js:197 calculate: 1.081ms
helpers.js:216 GLINEDATA Object
helpers.js:283 graphing: 4.966ms
helpers.js:497 PREV year
helpers.js:81 Grouped By year filter for 25 to 29 yrs Array[24]
helpers.js:97 Parse: 310.872ms
helpers.js:98 Statistics by location Object
helpers.js:99 Object
helpers.js:197 calculate: 22.375ms
helpers.js:216 GLINEDATA Object
helpers.js:283 graphing: 141.685ms
helpers.js:497 PREV year
helpers.js:81 Grouped By year filter for 25 to 29 yrs Array[24]
helpers.js:97 Parse: 313.236ms
helpers.js:98 Statistics by location Object
helpers.js:99 Object
helpers.js:197 calculate: 20.413ms
helpers.js:505 1990 Array[24]0: "1990"1: "1991"2: "1992"3: "1993"4: "1994"5: "1995"6: "1996"7: "1997"8: "1998"9: "1999"10: "2000"11: "2001"12: "2002"13: "2003"14: "2004"15: "2005"16: "2006"17: "2007"18: "2008"19: "2009"20: "2010"21: "2011"22: "2012"23: "2013"length: 24__proto__: Array[0]
helpers.js:361 SETUP
helpers.js:216 GLINEDATA Object
helpers.js:283 graphing: 7845.710ms
helpers.js:497 PREV year
helpers.js:81 Grouped By year filter for 25 to 29 yrs Array[24]
helpers.js:97 Parse: 233.579ms
helpers.js:98 Statistics by location Object1990: Array[24965]1991: Array[24965]1992: Array[24965]1993: Array[24965]1994: Array[24965]1995: Array[24965]1996: Array[24965]1997: Array[24965]1998: Array[24965]1999: Array[24965]2000: Array[24965]2001: Array[24965]2002: Array[24965]2003: Array[24965]2004: Array[24965]2005: Array[24965]2006: Array[24965]2007: Array[24965]2008: Array[24965]2009: Array[24965]2010: Array[24965]2011: Array[24965]2012: Array[24965]2013: Array[24965]__proto__: Object
helpers.js:99 Object0: ObjectAFG: ObjectAGO: ObjectALB: ObjectAND: ObjectARE: ObjectARG: ObjectARM: ObjectATG: ObjectAUS: ObjectAUT: ObjectAZE: ObjectBDI: ObjectBEL: ObjectBEN: ObjectBFA: ObjectBGD: ObjectBGR: ObjectBHR: ObjectBHS: ObjectBIH: ObjectBLR: ObjectBLZ: ObjectBOL: ObjectBRA: ObjectBRB: ObjectBRN: ObjectBTN: ObjectBWA: ObjectCAF: ObjectCAN: ObjectCHE: ObjectCHL: ObjectCHN: ObjectCIV: ObjectCMR: ObjectCOD: ObjectCOG: ObjectCOL: ObjectCOM: ObjectCPV: ObjectCRI: ObjectCUB: ObjectCYP: ObjectCZE: ObjectD0: ObjectD1: ObjectDEU: ObjectDJI: ObjectDMA: ObjectDNK: ObjectDOM: ObjectDZA: ObjectECU: ObjectEGY: ObjectERI: ObjectESP: ObjectEST: ObjectETH: ObjectFIN: ObjectFJI: ObjectFRA: ObjectFSM: ObjectG: ObjectGAB: ObjectGBR: ObjectGEO: ObjectGHA: ObjectGIN: ObjectGMB: ObjectGNB: ObjectGNQ: ObjectGRC: ObjectGRD: ObjectGTM: ObjectGUY: ObjectHND: ObjectHRV: ObjectHTI: ObjectHUN: ObjectIDN: ObjectIND: ObjectIRL: ObjectIRN: ObjectIRQ: ObjectISL: ObjectISR: ObjectITA: ObjectJAM: ObjectJOR: ObjectJPN: ObjectKAZ: ObjectKEN: ObjectKGZ: ObjectKHM: ObjectKIR: ObjectKOR: ObjectKWT: ObjectLAO: ObjectLBN: ObjectLBR: ObjectLBY: ObjectLCA: ObjectLKA: ObjectLSO: ObjectLTU: ObjectLUX: ObjectLVA: ObjectMAR: ObjectMDA: ObjectMDG: ObjectMDV: ObjectMEX: ObjectMHL: ObjectMKD: ObjectMLI: ObjectMLT: ObjectMMR: ObjectMNE: ObjectMNG: ObjectMOZ: ObjectMRT: ObjectMUS: ObjectMWI: ObjectMYS: ObjectNAM: ObjectNER: ObjectNGA: ObjectNIC: ObjectNLD: ObjectNOR: ObjectNPL: ObjectNZL: ObjectOMN: ObjectPAK: ObjectPAN: ObjectPER: ObjectPHL: ObjectPNG: ObjectPOL: ObjectPRK: ObjectPRT: ObjectPRY: ObjectPSE: ObjectQAT: ObjectR1: ObjectR2: ObjectR3: ObjectR4: ObjectR5: ObjectR6: ObjectR7: ObjectR8: ObjectR9: ObjectR10: ObjectR11: ObjectR12: ObjectR13: ObjectR14: ObjectR15: ObjectR16: ObjectR17: ObjectR18: ObjectR19: ObjectR20: ObjectR21: ObjectROU: ObjectRUS: ObjectRWA: ObjectS1: ObjectS2: ObjectS3: ObjectS4: ObjectS5: ObjectS6: ObjectS7: ObjectSAU: ObjectSDN: ObjectSEN: ObjectSGP: ObjectSLB: ObjectSLE: ObjectSLV: ObjectSOM: ObjectSRB: ObjectSSD: ObjectSTP: ObjectSUR: ObjectSVK: ObjectSVN: ObjectSWE: ObjectSWZ: ObjectSYC: ObjectSYR: ObjectTCD: ObjectTGO: ObjectTHA: ObjectTJK: ObjectTKM: ObjectTLS: ObjectTON: ObjectTTO: ObjectTUN: ObjectTUR: ObjectTWN: ObjectTZA: ObjectUGA: ObjectUKR: ObjectURY: ObjectUSA: ObjectUZB: ObjectVCT: ObjectVEN: ObjectVNM: ObjectVUT: ObjectWSM: ObjectYEM: ObjectZAF: ObjectZMB: ObjectZWE: Object__proto__: Object1: Object2: Object3: Object4: Object5: Object6: Object7: Object8: Object9: Object10: Object11: Object12: Object13: Object14: Object15: Object16: Object17: Object18: Object19: Object20: Object21: Object22: Object23: Object__proto__: Object
helpers.js:197 calculate: 24.679ms
helpers.js:505 1990 Array[24]
helpers.js:361 SETUP
helpers.js:216 GLINEDATA Object
helpers.js:283 graphing: 7793.074ms
```
Created with 
[Global Burden of Disease 2013 Obesity Prevalence 1990-2013 study](http://ghdx.healthdata.org/record/global-burden-disease-study-2013-gbd-2013-obesity-prevalence-1990-2013) dataset

The Global Burden of Disease Study 2013 (GBD 2013), coordinated by the Institute for Health Metrics and Evaluation (IHME), estimated the burden of diseases, injuries, and risk factors globally and for 21 regions. This dataset provides prevalence of overweight and obesity, and obesity alone, for 188 countries, 21 regions, and globally by age group and sex, for 1990-2013. The results were published in The Lancet in May 2014 in "Global, regional, and national prevalence of overweight and obesity in children and adults during 1980–2013: a systematic analysis for the Global Burden of Disease Study 2013." 
