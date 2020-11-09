# citystrides

Some helpers for analyzing [CityStrides](https://citystrides.com) data.

Note: there is no public API, so we have to resort to scraping the UI of citystrides.com.
The requests are done sequentially to avoid overwhelming the site.

### street nodes

Get all streets with node counts for Vancouver (id 37612):

`DEBUG=* node cityStreets 37612`

Sample output:

```
2	Alder Bay Court - https://citystrides.com/streets/5624376
2	Alice Street - https://citystrides.com/streets/5624130
2	Ann Street - https://citystrides.com/streets/5623965
2	Aquarius Mews - https://citystrides.com/streets/5624381
2	Aubrey Place - https://citystrides.com/streets/5623737
2	Balsam Place - https://citystrides.com/streets/5624111
2	Beagle Court - https://citystrides.com/streets/5624485
2	Blaydon Court - https://citystrides.com/streets/5624525
2	Bonsai Street - https://citystrides.com/streets/5624642
3	Aqua Drive - https://citystrides.com/streets/5624224
3	Archimedes Street - https://citystrides.com/streets/5623972
```
