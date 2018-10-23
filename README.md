Javascript visicomAutoComplete widget
===================

An extremely lightweight and powerful completion suggester.

Released under the MIT License: http://www.opensource.org/licenses/mit-license.php

## Features

* Search address, settlement, POI etc. in one autocomplete
* Add your callback to selection event
* Leaflet map support (zoom on selection)

## Installing
Add imports:

```html
<link rel="stylesheet" href="https://raw.githubusercontent.com/andrusha19/visicomAutoComplete/master/visicom-auto-complete.css">
```

```html
<script src="https://raw.githubusercontent.com/andrusha19/visicomAutoComplete/master/visicom-auto-complete.js"></script>
```

Create element in your html file:

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
* apiKey - API key (required)
* selector - autocomplete element div selector (default = '#visicom-autocomplete')
* width - width of the autocomplete element (string, default = '400px')
* height - height of the autocomplete element (string, default = '35px')
* placeholder - placeholder for input (default = 'Search...')
* minCahrs - minimum length of input query for search to start (default = 3)
* delay - delay between key pressed for search to start, ms (default = 150)
* suggestsLimit - maximum count of suggests to display (default = 5)
* lang - language for search (default = 'local', you can use one of 'uk', 'en', 'ru')
* onSuggestSelected - function to call when suggest was selected (default = console.log)
* map - Leaflet map object. When suggest selected, it will zoom on selected suggest
* marker - custom Leaflet marker

Returned object contains such methods:
* clear - clear all text in input element and all suggests

## Changelog

### Version 0.0.1 beta - 2018/10/19

* First release
