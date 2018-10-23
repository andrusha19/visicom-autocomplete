/*
    JavaScript visicomAutoComplete v0.0.1
    Copyright (c) 2018 Andrey Kotelnikov / Visicom
    GitHub: https://github.com/andrusha19/JavaScript-autoComplete
    License: http://www.opensource.org/licenses/mit-license.php
*/

let visicomAutoComplete = (function(){
    
    function autoComplete(options){

        let opt = {
            selector : '#visicom-autocomplete',
            apiUrl : `https://api.visicom.ua/data-api/4.0/{lang}/`,
            apiKey : '',
            placeholder : 'Search...',
            minChars : 3,
            delay : 150,
            width : '400px',
            height : '35px',
            map : null,
            marker: null,
            suggestsLimit : 5,
            lang : 'local',
            onSuggestSelected : suggest => console.log('Suggest selected: ' + (suggest.html)),            
        };

        opt = Object.assign({}, opt, options);

        let autocomplete = getElement(opt.selector);
        if(!autocomplete){
            console.log(`Couldn't find element with '${opt.selector}' selector.`);
            return;
        }

        if(!opt.apiKey){
            console.log(`You didn't specify your API key.`);
            return;
        }

        let copyright = autocomplete.innerHTML.trim();

        autocomplete.classList.add('visicom-autocomplete');    
        autocomplete.style.width = opt.width;
        autocomplete.style.height = opt.height;

        let input = document.createElement('input');    
        input.placeholder = opt.placeholder;
        input.setAttribute('autocomplete', 'off');
        input.setAttribute('autocorrect', 'off');
        input.setAttribute('autocapitalize', 'off');
        input.setAttribute('spellcheck', 'false');
        
        let suggestsDiv = document.createElement('div');   
        suggestsDiv.classList.add('suggests'); 
        
        let closeDiv = document.createElement('button');
        closeDiv.classList.add('close');
        closeDiv.style.width = opt.height;
        closeDiv.style.height = opt.height;
        
        autocomplete.appendChild(input);   
        autocomplete.appendChild(suggestsDiv);    
        autocomplete.appendChild(closeDiv);    

        if(!copyright || !copyright.includes('href="https://api.visicom.ua/"')){
            console.log('Visicom link not available.');
            return;
        }  
        autocomplete.removeChild(autocomplete.firstElementChild);
        
        let suggests = [];
        let selectedIndex = -1;
        let timer = null;

        if(opt.map && !opt.marker){
            if(typeof L === 'undefined' || L === null){
                console.log('Leaflet object is not available.');
            }else{
                let iconSVG =  `<svg xmlns="http://www.w3.org/2000/svg" 
                                        width="24" height="24" viewBox="0 0 24 24">

                                    <defs>         
                                        <filter id="blur1" x="-100%" y="-100%" width="400%" height="400%">             
                                            <feGaussianBlur stdDeviation="2"></feGaussianBlur>
                                        </filter>
                                    </defs>
                                    
                                    <style>
                                        .selected-bg {
                                            fill: #808080;
                                            filter: url(#blur1);
                                        }
                                        .selected-fill {
                                            fill: #ffffff;
                                            stroke: #ff0000;
                                            stroke-width: 1.7px;
                                        }
                                    </style>    

                                    <g>
                                        <circle class="selected-bg" cx="12" cy="12" r="9"/>           
                                        <circle class="selected-fill" cx="11" cy="11" r="9" />
                                        <path fill="#ff0000" d="m11 5.7c-2.1285 0-3.85 1.7215-3.85 3.85 0 2.8875 3.85 7.15 3.85 7.15s3.85-4.2625 3.85-7.15c0-2.1285-1.7215-3.85-3.85-3.85zm0 5.225c-0.759 0-1.375-0.616-1.375-1.375s0.616-1.375 1.375-1.375 1.375 0.616 1.375 1.375-0.616 1.375-1.375 1.375z"/>
                                    </g>  
                                </svg>`;
                opt.marker = L.marker([], {
                    icon: L.divIcon({
                        html: iconSVG,
                        iconSize: [24, 24]
                    }),
                    draggable: true
                });
            }
        }

        addEvent(input, 'input', function(){
            selectedIndex = -1;
            clearTimeout(timer);
            timer = null;

            timer = setTimeout(function(){
                let query = input.value;
                
                if(query.length > 0){
                    closeDiv.classList.add('visible');
                    if(query.length  < opt.minChars){
                        return;
                    }  
                    suggests = [];
                    let results = [];
                    suggestsDiv.classList.remove('open');

                    results = Coordparsing.search(query);		
                    if(results.length){
                        results.forEach(function(coords){
                            var d = {
                                html: Coordparsing.format(coords),
                                feature: {coords: coords}
                            };
                            suggests.push(d);
                        });
                        renderSuggests();
                        return;
                    }
                    results = [];
                    makeGeocodeRequest(query)
                        .then(json =>{
                            if(json.type === 'FeatureCollection'){
                                results = json.features;
                            }else if(json.type === 'Feature'){
                                results.push(json);
                            }                    
                            
                            results.forEach(res => {
                                if(res.properties.name || res.properties.vitrine)
                                    suggests.push({
                                            html: feature2content(res, query, true),
                                            feature: res
                                        });
                            });
                            renderSuggests();
                        })
                        .catch(err => {
                            console.log('Error in API request: ' + err);
                            clear();
                        });

                }else{    
                    clear();
                }
            }, opt.delay);
        });

        addEvent(document, 'keydown', function(e){
            // Esc pressed
            if (e.keyCode === 27){
                clear();
            }                
        });

        addEvent(suggestsDiv, 'click', function(e){
            let selected = Array.prototype.indexOf.call(e.target.parentNode.children, e.target);
            suggestSelected(selected);
        });

        addEvent(input, 'keydown', function(e){
            // Enter pressed
            if (e.keyCode === 13){
                if(suggests.length > 0){
                    let selected = selectedIndex > 0 ? selectedIndex : 0;
                    suggestSelected(selected);
                }
            // Arrow up or down pressed                    
            }else if(e.keyCode === 38 || e.keyCode === 40){
                if(suggests.length === 0)
                    return;

                if(!suggestsDiv.classList.contains('open'))    
                    suggestsDiv.classList.add('open');

                suggestsDiv.childNodes.forEach(el => el.classList.remove('selected'));

                if(e.keyCode === 38)
                    selectedIndex = selectedIndex < 0 ? suggests.length - 1 : selectedIndex - 1;
                else    
                    selectedIndex = selectedIndex === suggests.length - 1 ? - 1 : selectedIndex + 1;
                
                if(selectedIndex >= 0)
                    suggestsDiv.childNodes[selectedIndex].classList.add('selected');
            }                 
        });

        addEvent(input, 'focus', function(e){
            suggestsDiv.childNodes.forEach(el => el.classList.remove('selected'));
            if(suggests.length > 0){
                suggestsDiv.classList.add('open');
            }
        });

        addEvent(closeDiv, 'click', function(){
            clear();
        });

        addEvent(getElement('body'), 'click', function(e){
            if(e.target == this){
                selectedIndex = -1;
                suggestsDiv.classList.remove('open');
                input.blur();
            }
        });

        if(opt.map){
            opt.map.on('click', function(){
                selectedIndex = -1;
                suggestsDiv.classList.remove('open');
                input.blur();
            });
        }
        
        function getElement(selector){
            return document.querySelector(selector);
        }

        function addEvent(el, type, handler){
            if (el.attachEvent) 
                el.attachEvent('on' + type, handler); 
            else 
                el.addEventListener(type, handler);
        }

        function clear(){
            suggests = [];
            selectedIndex = -1;
            closeDiv.classList.remove('visible');
            suggestsDiv.classList.remove('open');
            input.value = '';
            input.focus();           
            if(opt.map && opt.marker)
                opt.map.removeLayer(opt.marker); 
        }

        function makeGeocodeRequest(query){            
            return fetch(`${opt.apiUrl.replace('{lang}', opt.lang)}/geocode.json?text=${query}&key=${opt.apiKey}&limit=${opt.suggestsLimit}`)
                .then(data => data.json());                
        }

        function makeFeatureRequest(feature_id){            
            return fetch(`${opt.apiUrl.replace('{lang}', opt.lang)}/feature/${feature_id}.json?key=${opt.apiKey}`)
                .then(data => data.json());  
        }
        
        function renderSuggests(){
            suggestsDiv.innerHTML = '';
            let output = '';
            suggests.forEach(suggest => {
                output += '<div>';
                output += suggest.html;
                output += '</div>';
            });

            if(output)
                suggestsDiv.classList.add('open');            

            suggestsDiv.innerHTML = output;
        }

        function suggestSelected(selected){
            suggestsDiv.classList.remove('open');
            opt.onSuggestSelected(suggests[selected]);
            if(opt.map){
                renderOnMap(suggests[selected]);
            }
            selectedIndex = -1;
        }

        function renderOnMap(suggest){
            if(opt.marker)
                opt.map.removeLayer(opt.marker);  

            if(suggest.feature.coords !== undefined){
                opt.map.panTo(suggest.feature.coords);	       
                if(opt.marker){
                    opt.marker.setLatLng(suggest.feature.coords);
                    opt.map.addLayer(opt.marker);    
                }                  				
                setTimeout(() => opt.map.setZoom(19));
            }else{
                makeFeatureRequest(suggest.feature.id)
                    .then(data => {                    
                        if(data.geometry.type === 'Point'){                            
                            opt.map.panTo([data.geometry.coordinates[1], data.geometry.coordinates[0]]);	                                  
                            if(opt.marker){
                                opt.marker.setLatLng([data.geometry.coordinates[1], data.geometry.coordinates[0]]);
                                opt.map.addLayer(opt.marker); 
                            }					
                            setTimeout(() => opt.map.setZoom(19));
                        }else{
                            opt.map.fitBounds(getBounds(data), {animate: true, maxZoom: 17});
                        }								
                    })
                    .catch(err => {
                        console.log('Error in API request: ' + err);
                        clear();
                    });
            }            
        }

        function feature2content(feat, q, isCompact)
        {
            
            let prop = feat.properties,
                cat = prop.categories;

            let descr = null;    
            if(startswith(cat, 'adm_country'))
                descr = compact([prop.name]).join('');            
            else if(startswith(cat, 'adm_district')) 
                descr = compact([prop.name, " ", prop.type, " ", formatSettlementName(prop.settlement_type, prop.settlement)]).join('');            
            else if(startswith(cat, 'adm_level1'))
                descr = compact([prop.name, ", ", prop.country]).join('');            
            else if(startswith(cat, 'adm_level2'))
                descr = compact([prop.name, ", ", prop.country, ", ", prop.level1]).join('');            
            else if(startswith(cat, 'adm_level3'))
                descr = compact([prop.name, ", ", prop.level1, ", ", prop.level2]).join('');            
            else if(startswith(cat, 'adm_settlement'))
                descr = compact([formatSettlementName(prop.type, prop.name), " ", prop.level1, " ", prop.level2, " ", prop.level3]).join('');            
            else if(startswith(cat, 'adr_street'))
                descr = compact([prop.type, " ", prop.name, ", ", formatSettlementName(prop.settlement_type, prop.settlement), " ", prop.zone]).join('');            
            else if(startswith(cat, 'adr_address'))
                descr = compact([prop.settlement, ", ", prop.street_type, " ", prop.street, ", ", prop.name]).join('');            
            else if(startswith(cat, 'poi'))
                descr = compact([prop.vitrine, " ", prop.address]).join('');
            
            return descr ? trimToLength(descr, q, isCompact) : trimToLength(prop.name, q, isCompact);
            
            
            function trimToLength(d, qu, isCompact){
                return isCompact ? 
                    (d.length >= 50 ? 
                        replaceWithBold(d.substring(0, 55).concat('...'), qu) : 
                        replaceWithBold(d, qu) ) : 
                    d;
            }

            function replaceWithBold(dat,que){
                let description = dat.toLowerCase();
                let quer = que.toLowerCase();
                return description.indexOf(quer) < 0 ? 
                        dat :
                        str(dat.substring(0, description.indexOf(quer)), "<strong>",
                            dat.substring(description.indexOf(quer), description.indexOf(quer) + que.length), "</strong>",
                            dat.substring(description.indexOf(quer) + que.length));
            }
        
            function formatSettlementName(type, name){
                return type ? (name + " " + type) : name;
            }
        }

        function startswith(cat, str) { 
            return cat.indexOf(str) === 0;
        }

        function str() {
            return "".concat.apply("",arguments);
        }

        function compact(array){
            return array.filter(el => el);
        }

        function getBounds(feature){
            let bbox = feature.bbox || (feature.geometry || {}).bbox;
            if (bbox) {
                return [[bbox[1], bbox[0]], [bbox[3], bbox[2]]];
            }
            return {};
        }   

        let Coordparsing = {};

        Coordparsing.search = function(text) 
        {
            if(text.length === 0 || text.trim().length < 4) return [];  
            let coord = Coordparsing.parse(text);
            if(coord === null) return [];
            let result = [[coord.lat, coord.lng]];
            if( text.search(/[NSEW]/) !== -1  )
                return result;
            result.push([coord.lng, coord.lat]);
            return result;    
        }

        Coordparsing.format = function(latlng){
            function _split( position ){
                let result = {};
                result.hemisphere = position >= 0 ? +1 : -1;
                position = Math.abs(position);
                result.degrees = Math.floor(position);
                result.degreesDecimal = Math.min(9999, Math.round((position - result.degrees)*10000) );

                position = position*60 % 60; //Minutes
                result.minutes = Math.floor(position);
                result.minutesDecimal = Math.min( 999, Math.round((position - result.minutes)*1000) );

                position = position*60 % 60; //seconds
                result.seconds = Math.floor(position);
                result.secondsDecimal = Math.min( 9, Math.floor/*round*/((position - result.seconds)*10) );

                return result;
            }  
            let format = "DDD°MM′SS″H";
            let lat = _split(latlng[0]);
            let lng = _split(latlng[1]);
            
            lat = format.replace('H', lat.hemisphere === 1 ? 'N' : 'S')
                .replace('DDD', lat.degrees)  
                .replace('MM', lat.minutes)  
                .replace('SS', lat.seconds);  
            
            lng = format.replace('H', lng.hemisphere === 1 ? 'E' : 'W')
                .replace('DDD', lng.degrees)  
                .replace('MM', lng.minutes)  
                .replace('SS', lng.seconds);  

            return str(lat, " ", lng);
        }

        Coordparsing.parse = function(text)
        {
            function degrees2Decimal(txt, m){
                let signRegExp = /^[+-]/;
                let sign1 = "",sign2 = "", d1=0, d2=0;
                if (m.length === 6) {
                    if (m[0].match(signRegExp) !== null) {
                        sign1 = m[0].match(signRegExp);
                        m[0] = m[0].replace(signRegExp, '');
                    } else {sign1 = '+';}
                    if (m[3].match(signRegExp) !== null) {
                        sign2 = m[3].match(signRegExp);
                        m[3] = m[3].replace(signRegExp, '');
                    } else {sign2 = '+';}
                    d1 = parseFloat(m[0]) + ((1/60)*parseFloat(m[1])) + (1/(60*60)*parseFloat(m[2]));
                    d2 = parseFloat(m[3]) + ((1/60)*parseFloat(m[4])) + (1/(60*60)*parseFloat(m[5]));
                    return [parseFloat(sign1 + d1), parseFloat(sign2 + d2)];
                } else if (m.length === 4) {
                    if (m[0].match(signRegExp) !== null) {
                        sign1 = m[0].match(signRegExp);
                        m[0] = m[0].replace(signRegExp, '');
                    } else {sign1 = '+';}
                    if (m[2].match(signRegExp) !== null) {
                        sign2 = m[2].match(signRegExp);
                        m[2] = m[2].replace(signRegExp, '');
                    } else {sign2 = '+';}
                    d1 = parseFloat(m[0]) + ((1/60)*parseFloat(m[1]));
                    d2 = parseFloat(m[2]) + ((1/60)*parseFloat(m[3]));
                    return [parseFloat(sign1 + d1), parseFloat(sign2 + d2)];
                }
                return null;
            };
            
            function detectLatLng(txt, digits)
            {
                txt = txt.toUpperCase();
                let l = txt.match(/[NEWS]/g);
                if (l.length === 1) {
                    if (l[0] === 'N') return {'lat':digits[0], 'lng':digits[1]};
                    else if (l[0] === 'E') return {'lng':digits[0], 'lat':digits[1]};
                    else if (l[0] === 'S') return {'lat':-digits[0], 'lng':digits[1]};
                    else if (l[0] === 'W') return {'lng':-digits[0], 'lat':digits[1]};
                } else if (l.length === 2) {
                    let res = {};
                    if (l[0] === 'E')  res.lng = digits[0];
                    else if (l[0] === 'W') res.lng = -digits[0];
                    else if (l[0] === 'N') res.lat = digits[0];
                    else if (l[0] === 'S') res.lat = -digits[0];
                    if (l[1] === 'E') res.lng = digits[1];
                    else if (l[1] === 'W') res.lng = -digits[1];
                    else if (l[1] === 'N') res.lat = digits[1];
                    else if (l[1] === 'S') res.lat = -digits[1];
                    return res;
                }
            };            
            
            // if numbers count is less then not-numbers count
            let m = text.match(/\d/g);
            if(m == null) 
                return null;
            let digits = (m == null) ? 0 : m.length;
            m = text.match(/\D/g);
            let nodigits = (m == null) ? 0 : m.length;
            if(digits*1.5 <= nodigits) 
                return null;
            text = text.replace(/,/igm,'.');
            text = text.replace(/([+-])\s(\d+)/igm, '$1$2');
            m = text.match(/[+-]?\d+[.,]?(?:\d+)?/igm);
            if(m === null) return null;
            if (m.length === 6 || m.length === 4) {
                let result = degrees2Decimal(text, m);
                if (/[news]/ig.exec(text) !== null) 
                return detectLatLng(text, result);
                else 
                return {'lat':parseFloat(result[0]), 'lng':parseFloat(result[1])};
            }
            else if (m.length === 2) {
                if (/[news]/ig.exec(text) !== null) 
                    return detectLatLng(text, [parseFloat(m[0]), parseFloat(m[1])]);         
                else
                    return {'lat':parseFloat(m[0]), 'lng':parseFloat(m[1])}
            } 
            return null;
        }

        return {
            clear: clear,
        }
    }

    return autoComplete;
})();

(function(){
    if (typeof define === 'function' && define.amd)
        define('visicomAutoComplete', function () { return visicomAutoComplete; });
    else if (typeof module !== 'undefined' && module.exports)
        module.exports = visicomAutoComplete;
    else
        window.visicomAutoComplete = visicomAutoComplete;
})();
