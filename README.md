# citystrides

Some helpers for analyzing [CityStrides](https://citystrides.com) data.

Note: there is no public API, so we have to resort to scraping the UI of citystrides.com.
The requests are done sequentially to avoid overwhelming the site.

### street nodes

Get all streets with node counts for Vancouver (id 37612):

`DEBUG=* node cityStreets 37612`

Sample output:

```
name,count,% complete,url
Aisne Street,5,0,https://citystrides.com/streets/5624202
Ackery&#39;s Alley,7,0,https://citystrides.com/streets/5624665
Adanac-Vernon Plaza,7,0,https://citystrides.com/streets/15036046
Aegean Crescent,8,0,https://citystrides.com/streets/5624496
54th Ave and Victoria Loop,10,0,https://citystrides.com/streets/5624446
Alamein Avenue,11,0,https://citystrides.com/streets/5624039
Aberdeen Street,12,0,https://citystrides.com/streets/5623966
Abbott Street,21,0,https://citystrides.com/streets/5624391
Alberni Street,21,0,https://citystrides.com/streets/5623542
Adera Street,49,0,https://citystrides.com/streets/5624081
Adanac Street,78,0,https://citystrides.com/streets/5623789
Alberta Street,90,0,https://citystrides.com/streets/5623585
```
