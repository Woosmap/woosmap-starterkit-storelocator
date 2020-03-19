(function () {
    const woosmapLoadOptions = {
        version: '1.4',
        publicKey: 'starbucks-demo-woos', //replace with your public key
        callback: woosmap_main,
        loadJQuery: true
    };
    const localitiesOptions = {
        components: {
            "country": ["gb"]
        },
        language: "GB"
    };
    const googleLoadOptions = {
        key: "AIzaSyCOtRab6Lh2pNn7gYxvAqN5leETC24OXYQ",
        language: "en",
        region: "GB",
        version: "3.39"
    };
    const googleMapsOptions = {
        center: {
            lat: 48,
            lng: 2
        },
        zoom: 4,
        scrollwheel: false,
        mapTypeControl: false
    };
    const woosmapOptions = {
        gentleCenter: true,
        style: {
            'default': {
                'icon': {
                    url: './images/markers/starbucks-marker.svg',
                    scaledSize: {
                        height: 47,
                        width: 40
                    },
                },
                'numberedIcon': {
                    url: './images/markers/numbered/{number}.svg',
                    scaledSize: {
                        height: 47,
                        width: 40
                    },
                },
                'selectedIcon': {
                    url: './images/markers/starbucks-marker-selected.svg',
                    scaledSize: {
                        height: 71,
                        width: 61
                    }
                }
            }
        },
        tileStyle: {
            color: '#008248',
            size: 10,
            minSize: 6
        },
        breakPoint: 10
    };
    const selectedStoreTemplate = "<div class='woosmap-tableview-cell'>" +
        "<div class='store-photo-header'><img /><div id='back-to-results'></div></div>" +
        "<div class='selected-store-card'><div class='hero'>" +
        "<div class='store-title'>{{name}}</div>" +
        "<div class='store-opened'>{{openlabel}}</div></div>" +
        "<div class='content'><div class='store-address'>{{address.lines}} {{address.city}} {{address.zip}}</div>" +
        "{{#contact.phone}}<div class='store-contact'>Tel : <a href='tel:{{contact.phone}}'>{{contact.phone}}</a></div>{{/contact.phone}}" +
        "<div class='store-link-page'><a href='https://google.fr/?storeId={{store_id}}' target='_blank'>Go to Store Page</a></div>" +
        "</div></div>" +
        "<div class='store-opening-hours'><div id='store-opening-hours-header'>Opening times</div>" +
        "<ul id='store-opening-hours-list'>" +
        "{{#week}}<li><span class='day'>{{dayName}}</span><span class='hours'>{{hoursDay}}</span></li>{{/week}}" +
        "</ul></div>" +
        "</div>";

    const summaryStoreTemplate = "<div class='controls store-card'>" +
        "<div><div><strong>{{name}} - {{address.city}}</strong></div>" +
        "<div><div id='store-address'>{{address.lines}} {{address.city}} {{address.zip}}</div>" +
        "{{#contact.phone}}<div>Tel : <a href='tel:{{contact.phone}}'>{{contact.phone}}</a></div>{{/contact.phone}}</div></div>" +
        "<div class='store-photo'><img src='./images/default.svg'/></div></div>";


    let map, mapView, dataSource, selectedStoreObj = null;
    const photosSrcFull = ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg", "7.jpg", "8.jpg", "9.jpg", "10.jpg", "11.jpg", "12.jpg", "13.jpg", "14.jpg", "15.jpg", "16.jpg", "17.jpg", "18.jpg", "19.jpg", "20.jpg", "21.jpg", "22.jpg", "23.jpg"];

    function renderPhoto(cell, selector, photosSrc, rootPath) {
        woosmap.$(cell).find(selector + " img").each(function (index) {
            woosmap.$(this).attr("src", rootPath + photosSrc[Math.floor(Math.random() * photosSrc.length)]);
        });
    }

    function clearMapSelectedStore() {
        mapView.set('selectedStore', null);
    }

    function toggleAndSlideTableview(selectedStoreCell) {
        const $selectedStoreHTML = woosmap.$('#selected-store-container');
        const $listingStores = woosmap.$('#listing-stores-container');
        if (selectedStoreCell) {
            $selectedStoreCell = woosmap.$(selectedStoreCell).html();
            const $previousCell = $selectedStoreHTML.find(".woosmap-tableview-cell");
            if ($previousCell.length === 0) {
                $listingStores.removeClass('animated fadeOutLeft fadeInLeft').addClass('animated fadeOutLeft');
                $selectedStoreHTML.removeClass().addClass('animated fadeInRight');
            }
            woosmap.$('#search-input').addClass('selected-store');
            $selectedStoreHTML.show().html($selectedStoreCell);
            if ($listingStores.hasClass('home')) {
                woosmap.$('#back-to-results').html('Back to home');
            } else {
                woosmap.$('#back-to-results').html('Back to results');
            }
            woosmap.$('#back-to-results').click(function () {
                toggleAndSlideTableview();
                clearMapSelectedStore();
            });
            renderPhoto($selectedStoreHTML, '.store-photo-header', photosSrcFull, "./images/full/");
            $selectedStoreHTML.scrollTop(0);
        } else {
            $selectedStoreHTML.removeClass().addClass('animated fadeOutRight');
            $listingStores.removeClass().addClass('animated fadeInLeft');
            $listingStores.scrollTop(0);
            woosmap.$('#search-input').removeClass('selected-store');
        }
    }

    function concatenateStoreHours(openHours) {
        let hoursText = "";
        let end = "";
        for (let slice in openHours) {
            if ('all-day' in openHours[slice]) {
                return "24h/24";
            }
            end = openHours[slice].end;
            hoursText += openHours[slice].start + "–" + end;
            if (slice < openHours.length - 1) {
                hoursText += ", ";
            }
        }
        return hoursText;
    }

    function generateOpeningHoursHTML(weekly_opening) {
        let hoursData = {
            weekly_opening: [{dayName: "Monday", hoursDay: ""},
                {dayName: "Tuesday", hoursDay: ""},
                {dayName: "Wednesday", hoursDay: ""},
                {dayName: "Thursday", hoursDay: ""},
                {dayName: "Friday", hoursDay: ""},
                {dayName: "Saturday", hoursDay: ""},
                {dayName: "Sunday", hoursDay: ""}
            ]
        };
        for (let day in weekly_opening) {
            if (weekly_opening[day].length === 0) {
                hoursData.weekly_opening[day].hoursDay = "Closed"
            } else if (weekly_opening[day].hours) {
                hoursData.weekly_opening[day - 1].hoursDay = concatenateStoreHours(weekly_opening[day].hours);
            }
        }
        return hoursData.weekly_opening;
    }

    function getSummaryRenderedTemplate(store) {
        const templateRenderer = new woosmap.TemplateRenderer(summaryStoreTemplate);
        return templateRenderer.render(store.properties);
    }

    function getSelectedRenderedTemplate(store) {
        const templateRenderer = new woosmap.TemplateRenderer(selectedStoreTemplate);
        store.properties.openlabel = (store.properties.open && store.properties.open.open_now) ? "Open Now" : "Close";
        store.properties.week = store.properties.weekly_opening ? generateOpeningHoursHTML(store.properties.weekly_opening) : {};
        return templateRenderer.render(store.properties);
    }

    function buildTableView(stores) {
        const $listingStores = woosmap.$('#listing-stores-container');
        $listingStores.empty();
        for (store in stores) {
            const $cell = woosmap.$(document.createElement('div'));
            $cell.append(getSummaryRenderedTemplate(stores[store]));
            $cell.data('store', stores[store]);
            $cell.click(function () {
                const storeData = woosmap.$(this).data('store');
                selectedStoreObj.set('selectedStore', storeData);
                const selectedStoreHTML = getSelectedRenderedTemplate(storeData);
                toggleAndSlideTableview(selectedStoreHTML);
            });
            $listingStores.append($cell)
        }
        toggleAndSlideTableview();
    }

    function registerMapClickEvent(mapView) {
        let storeObj = new woosmap.utils.MVCObject();
        storeObj.selectedStore_changed = function () {
            var selectedStore = this.get('selectedStore');
            if (selectedStore) {
                const selectedStoreHTML = getSelectedRenderedTemplate(selectedStore, selectedStoreTemplate);
                toggleAndSlideTableview(selectedStoreHTML)
            }
        };
        storeObj.bindTo('selectedStore', mapView, false);
    }

    function search(location) {
        if (location) {
            var searchParams = new woosmap.search.SearchParameters({
                lat: location.lat,
                lng: location.lng,
                page: 1,
                storesByPage: 9
            });
            dataSource.searchStoresByParameters(searchParams, function (stores) {
                mapView.set('stores', stores.features);
                mapView.set('location', location);
                buildTableView(stores.features);
            });
        }
    }

    function woosmap_main() {
        const loader = new woosmap.MapsLoader(googleLoadOptions);
        loader.load(function () {
            map = new google.maps.Map(woosmap.$('#my-map')[0], googleMapsOptions);
            mapView = new woosmap.TiledView(map, woosmapOptions);
            mapView.marker.setOptions({
                icon: {url: 'https://www.woosmap.com/assets/locationanimation.svg'}
            });
            dataSource = new woosmap.DataSource();
            registerMapClickEvent(mapView);
            selectedStoreObj = new woosmap.utils.MVCObject();
            selectedStoreObj.selectedStore = null;
            selectedStoreObj.bindTo('selectedStore', mapView, 'selectedStore', false);
        });
        let localitiesWidget = new woosmapsave.localities.Autocomplete('search-input', localitiesOptions);
        localitiesWidget.addListener('selected_locality', () => {
            let locality = localitiesWidget.getSelectedLocality();
            search(locality.location);
        });
    }

    if (window.attachEvent) {
        window.attachEvent('onload', function () {
            WoosmapLoader.load(woosmapLoadOptions);
        });
    } else {
        window.addEventListener('load', WoosmapLoader.load(woosmapLoadOptions), false);
    }
}());
