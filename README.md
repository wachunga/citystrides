# citystrides

Some helpers for analyzing [CityStrides](https://citystrides.com) data.

Note: there is no public API, so we have to resort to scraping the UI of citystrides.com.
The requests are done sequentially to avoid overwhelming the site.

## Motivation

CityStrides marks your progress by [complete streets](https://community.citystrides.com/t/about-the-node-street-and-city-data/19802).
In a city like Vancouver, you could run a long time without actually completing any streets, so I like to target short streets now and then.

Pop the data into a spreadsheet to find short streets...

| name          | count | % complete | url                                     |
| ------------- | ----- | ---------- | --------------------------------------- |
| Bradley Court | 1     | 0.00%      | https://citystrides.com/streets/5624649 |
| Canada Way    | 1     | 0.00%      | https://citystrides.com/streets/5623887 |
| Douglas Road  | 1     | 0.00%      | https://citystrides.com/streets/5624027 |
| Myrtle Street | 1     | 0.00%      | https://citystrides.com/streets/5624019 |
| Pender Street | 1     | 0.00%      | https://citystrides.com/streets/5624026 |

... or really long ones ...

| name                   | count | % complete | url                                     |
| ---------------------- | ----- | ---------- | --------------------------------------- |
| Stanley Park Drive     | 485   | 6.60%      | https://citystrides.com/streets/5624279 |
| Main Street            | 380   | 53.95%     | https://citystrides.com/streets/5623524 |
| Southwest Marine Drive | 378   | 13.23%     | https://citystrides.com/streets/5623809 |
| Cambie Street          | 360   | 69.44%     | https://citystrides.com/streets/5623532 |
| Kingsway               | 348   | 47.70%     | https://citystrides.com/streets/5623813 |

... or streets that are _so close_ to complete:

| name             | count | % complete | url                                     |
| ---------------- | ----- | ---------- | --------------------------------------- |
| Ash Street       | 108   | 89.81%     | https://citystrides.com/streets/5623698 |
| Birch Street     | 34    | 88.24%     | https://citystrides.com/streets/5623719 |
| Water Street     | 17    | 88.24%     | https://citystrides.com/streets/5623678 |
| East 13th Avenue | 70    | 85.71%     | https://citystrides.com/streets/5623543 |
| Quebec Street    | 237   | 84.81%     | https://citystrides.com/streets/5623648 |

## Usage

### Incomplete streets

Fetches all streets for the provided city which CityStrides still considers incomplete.

To include percentage complete, include the value of your `_citystrides_session` cookie as your second argument:

`DEBUG=* node incomplete.js 37612 FonQHJUL8azT%2BdeWFibYRL2qI...`

You can get this from the dev tools of your browser when you're logged into citystrides.com. For example, in Chrome, look under Application > Cookies > citystrides.com.

Sample output:

```
name,remaining,count,% complete,missingLat,missingLong,url
Coleridge Avenue,1,6,0.8333333333333334,49.2262237,-123.038758,https://citystrides.com/streets/5624092
Hastings Street,1,1,0,49.281125,-123.0236419,https://citystrides.com/streets/15656732
Pender Street,1,1,0,49.280208,-123.0236854,https://citystrides.com/streets/5624026
Senlac Street,1,8,0.875,49.2328205,-123.0331707,https://citystrides.com/streets/5623957
Douglas Road,2,2,0,49.2763976,-123.0234595,https://citystrides.com/streets/5624027
```

When you're done, you can use a service like [Batchgeo](https://batchgeo.com) to map your data.
