# citystrides

Some helpers for analyzing [CityStrides](https://citystrides.com) data.

Note: there is no public API, so we have to resort to scraping the UI of citystrides.com.
The requests are done sequentially to avoid overwhelming the site.

## Motivation

CityStrides marks your progress by [complete streets](https://community.citystrides.com/t/about-the-node-street-and-city-data/19802).
In a city like Vancouver, you could run a long time without actually completing any streets, so I like to target short streets
now and then.

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

### Street nodes

Get all city streets with node counts:

`DEBUG=* node cityStreets <city id>`

Sample output for Vancouver (city id 37612):

```
name,count,% complete,url
Aisne Street,5,0,https://citystrides.com/streets/5624202
Ackery&#39;s Alley,7,0,https://citystrides.com/streets/5624665
Adanac-Vernon Plaza,7,0,https://citystrides.com/streets/15036046
Aegean Crescent,8,0,https://citystrides.com/streets/5624496
54th Ave and Victoria Loop,10,0,https://citystrides.com/streets/5624446
```

To get percentage complete, include the value of your `_citystrides_session` cookie as your second argument:

`DEBUG=* node cityStreets 37612 FonQHJUL8azT%2BdeWFibYRL2qI...`

You can get this from the dev tools of your browser when you're logged into citystrides.com. For example, in Chrome, look under Application > Cookies > citystrides.com.

Sample output:

```
name,count,% complete,url
Bradley Court,1,0,https://citystrides.com/streets/5624649
Canada Way,1,0,https://citystrides.com/streets/5623887
North Dunlevy Avenue,1,1,https://citystrides.com/streets/15036044
Alice Street,2,0,https://citystrides.com/streets/5624130
Aquarius Mews,2,1,https://citystrides.com/streets/5624381
Blaydon Court,2,0,https://citystrides.com/streets/5624525
Bella Vista Street,3,0.6666666666666666,https://citystrides.com/streets/5624129
```
