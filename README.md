## <small>Free Code Camp API project</small>
# Image Search Abstraction Layer

Made according to the instructions here:  
http://www.freecodecamp.com/challenges/image-search-abstraction-layer

### Client usage

Visit or issue a GET request to `/imagesearch/new/query` where `query` is your search term, e.g. [/imagesearch/new/freecodecamp](/imagesearch/new/freecodecamp). The response will be an array of result objects.

#### Response format example

```
[
  {
    url: "https://pbs.twimg.com/profile_images/562385977390272512/AK29YaTf.png",
    thumbnail: "http://ts4.mm.bing.net/th?id=OIP.Me6e1bdc33930f75297f87ef91e3beb85o0&pid=15.1",
    context: "https://twitter.com/FreeCodeCamp",
    snippet: "Free Code Camp"
  },
  ...
]
```

You can also visit [/imagesearch/latest](/imagesearch/latest) to retrieve a list of the 10 most recent queries and when they were made.