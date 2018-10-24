Javascript visicom-autocomplete widget
===================

An extremely lightweight and powerful geocode completion suggester.

Released under the MIT License: http://www.opensource.org/licenses/mit-license.php

## Features

* Search address, settlement, POI etc. in one autocomplete form
* Add your callbacks to suggest selection event
* Leaflet map support (zoom on selection)
* Proxy servers support to hide your API key from client side

## Installing
Add imports on your page:

```html
<link rel="stylesheet" href="<link rel="stylesheet" href="https://raw.githubusercontent.com/andrusha19/visicom-autocomplete/master/visicom-autocomplete.css">">
```

```html
<script src="https://raw.githubusercontent.com/andrusha19/visicom-autocomplete/master/visicom-autocomplete.js"></script>
```

Create element in your html file ('a' tag will dispappear, you shouldn't remove it):

```html
<div id="visicom-autocomplete">
    <a href="https://api.visicom.ua/" target="_blank">© Visicom</a>
</div>
```

Create new autocomplete object (you can specify options):
```html
<script>
let ac = new visicomAutoComplete({        
    apiKey : 'YOUR_API_KEY',
});
</script>
```

Now we have such options:
* apiKey - your API key (required, if you don't specify proxy urls)
* selector - autocomplete element div selector (required, default = '#visicom-autocomplete')
* width - width of the autocomplete element (optional, string, default = '400px')
* height - height of the autocomplete element (optional, string, default = '35px')
* placeholder - placeholder for input (optional, default = 'Search...')
* minCahrs - minimum length of input query for search to start (optional, number, default = 3)
* delay - delay between key pressed for search to start, ms (optional, number, default = 150)
* suggestsLimit - maximum count of suggests to display (optional, number, default = 5)
* lang - language for search (optional, default = 'local', you can use one of: 'uk', 'en', 'ru')
* onSuggestSelected - function to call when suggest was selected (optional, default = () => console.log)
* map - Leaflet map object. When suggest selected, it will zoom on selected suggest (optional)
* marker - custom Leaflet marker (optional)
* proxyApiGeocodeUrl - your proxy url. Geocode requests will be send to that url. You don't need to specify API key. You'll recieve such parameters in GET request: text (search text), lang, key (API key), limit (suggestsLimit) (optional)
* proxyApiFeatureUrl - your proxy url. Feature requests will be send to that url. You don't need to specify API key. You'll recieve such parameters in GET request: feature_id (feature id you are searching), lang, key (API key) (optional)

Be carefull when using your proxy server. You should return same JSON object to client side, which you recieve on your server side.

Returned object from visicomAutoComplete function contains such methods:
* clear - clear input value and all suggests

## Changelog

### Version 0.0.2 beta - 2018/10/24

* Add proxy server support

### Version 0.0.1 beta - 2018/10/19

* First release
