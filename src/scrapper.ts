import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from 'fs';

const _URLS = [
    { host: 'puntoticket', url: 'https://www.puntoticket.com/todos' },
    { host: 'ticketplus', url: 'https://ticketplus.cl/t/conciertos-y-espectaculos' },
    { host: 'ticketmaster', url: 'https://www.ticketmaster.cl' }
];

async function scrapeEverything() {
    //* Instancio el navegador y lo guardo en una constante llamada _BROWSER
    const _BROWSER: Browser = await puppeteer.launch({ headless: true });
    
    let eventUrls: any = { puntoticket: [], ticketplus: [], ticketmaster: [] };
    for await (let eventWrapper of _URLS) {
        const urls: string[] = await scrapeUrlsFrom(eventWrapper.host, eventWrapper.url, _BROWSER);
        eventUrls[eventWrapper.host] = urls;
    }
    console.info('Done scraping everything!');
    console.log('\nSaving data to file...\n');

    //* Guardo la info inicial que pude rescatar en el archivo "data.json". Si es que no existe, se crea
    //* automaticamente 😺
    fs.writeFileSync('data/data.json', JSON.stringify(eventUrls, null, 2));
    
    console.info('Done saving data to file!');
    console.log('\nScraping extra data from events...');
    
    //* Creo una constante llamada newData para almacenar los datos actualizados, ya que en algunas
    //* eventos no se pudo conseguir toda la info necesaria.
    const newData: any = { puntoticket: [], ticketplus: [], ticketmaster: [] };
    
    for await (let eventWrapper of _URLS) {
        const data: any = await scrapeFrom(eventWrapper.host, eventUrls[eventWrapper.host], _BROWSER);
        newData[eventWrapper.host] = data;
    }
    console.info('Done scraping extra data from events!');
    console.log('\nSaving data to file...\n');

    //* Guardo la info final ya actualizada en un archivo llamado "final data.json"
    fs.writeFileSync('data/final data.json', JSON.stringify(newData, null, 2));

    console.info('Done saving data to file!');
    console.info('\nClosing browser...');
    await _BROWSER.close();
}

async function scrapeUrlsFrom(pageHost: string, url: string, browser: Browser): Promise<string[]> {
    //* Elimino todo el contenido del archivo llamado "data.json" para que no se acumule la info
    fs.writeFileSync('data/data.json', "");
    fs.writeFileSync('data/final data.json', "");

    console.info('\nScraping urls from: ' + pageHost);
    //* Creo una nueva página en la instancia del Navegador, esta página nos servirá para poder obtener
    //* la info
    const page: Page = await browser.newPage();
    //* Aca me dirijo a la página mediante la url. La URL es el parámetro que recibe la función
    await page.goto(url);
    //* Espero a que se cargue el contenido de la página
    await page.waitForSelector('body');
    let eventsUrlFunction: any;
    if (pageHost === 'puntoticket') {
        eventsUrlFunction = async () => {
            // En este caso se obtendrán todos los datos desde la landing page. Menos la descripción,
            // que, vamos a obtener desde la página del evento específico
            const eventsData: object[] = [];
            const eventArticles = document.querySelectorAll('#listado-eventos-shuffle .listado--eventos article');
            eventArticles.forEach((article: any) => {
                let eventUrl: string = article.querySelector('a').getAttribute('href');
                if (eventUrl.startsWith('/')) eventUrl = 'https://www.puntoticket.com' + eventUrl;
                
                //* Obtendremos la info básica excluyendo la descripción
                //? Nombre del evento
                const nombreEl = article.querySelector('.evento--box h3');
                const nombre = nombreEl ? nombreEl.innerText : 'No disponible';
                //? Fecha del evento
                const fechaEl = article.querySelector('.evento--box .fecha');
                const fecha = fechaEl ? fechaEl.innerText : 'No disponible';
                //? Lugar del evento
                const lugarEl = article.querySelector('.evento--box .descripcion strong');
                const lugar = lugarEl ? lugarEl.innerText : 'No disponible';
                //? Imagen del evento
                const imgEl = article.querySelector('.img--evento');
                const img = imgEl ? imgEl.getAttribute('src') : 'No disponible';
                //? Precio del evento
                /*
                * Generaremos un precio aleatorio entre $5.000 y $200.000. Con un aumento de $5.000
                
                ? Explicación de la fórmula Math.random() * 39
                ! Math.random() devuelve un número aleatorio entre 0 y 1
                ! Multiplicamos por 39 para que el número aleatorio sea entre 0 y 39
                ! ¿Por qué 39 como máximo? Porque 39 * 5000 da 195.000, que es el precio máximo
                ! debido a que el precio mínimo indispensable es de $5.000.
                */
                const numeroRandom = Math.floor(Math.random() * 39);
                const precio = 5000 + (numeroRandom * 5000);
                //? Generamos una cantidad aleatoria de entradas entre 50 y 5000
                const nuevoNumRandom = Math.floor(Math.random() * 100);
                const asientos = 50 + (nuevoNumRandom * 50);

                const eventObject = {
                    nombre: nombre,
                    fecha: fecha,
                    lugar: lugar,
                    img: img,
                    precio: precio,
                    asientos: asientos,
                    url: eventUrl,
                    descripcion: 'No disponible'
                };

                eventsData.push(eventObject);
            });
            return eventsData;
        };
    } else if (pageHost === 'ticketplus') {
        eventsUrlFunction = async () => {
            //const eventsUrls: string[] = [];
            const eventsData: object[] = [];
            document.querySelectorAll('.event-home').forEach(async (e) => {
                //console.log(e.parentElement.getAttribute('href'));
                let eventUrl: string = e.parentElement.getAttribute('href');
                if (eventUrl.startsWith('/')) eventUrl = 'https://ticketplus.cl' + eventUrl;
                //eventsUrls.push(eventUrl);

                //* Obtendremos la info básica excluyendo la descripción
                //? Nombre del evento
                const nombreEl: any = e.querySelector('.title-mi');
                const nombre = nombreEl ? nombreEl.innerText : 'No disponible';
                //? Fecha del evento
                const fechaEl: any = e.querySelector('.date-home');
                const fecha = fechaEl ? fechaEl.innerText.replace('\n', '') : 'No disponible';
                //? Lugar del evento
                // Se obtiene desde la página
                //? Imagen del evento
                const imgEl: any = e.querySelector('.img-home-count');
                let img = imgEl ? imgEl.getAttribute('src') : 'No disponible';
                if (!img.startsWith('https://')) img = 'No disponible';
                // if (!img.startsWith('https://')) img = 'No disponible';
                //? Precio del evento
                const numeroRandom = Math.floor(Math.random() * 39);
                const precio = 5000 + (numeroRandom * 5000);
                //? Generamos una cantidad aleatoria de entradas entre 50 y 5000
                const nuevoNumRandom = Math.floor(Math.random() * 100);
                const asientos = 50 + (nuevoNumRandom * 50);

                const eventObject = {
                    nombre: nombre,
                    fecha: fecha,
                    lugar: 'No disponible',
                    img: img,
                    precio: precio,
                    asientos: asientos,
                    url: eventUrl,
                    descripcion: 'No disponible'
                };

                eventsData.push(eventObject);
            });
            return eventsData;
        }
    } else if (pageHost === 'ticketmaster') {
        eventsUrlFunction = async () => {
            // En este caso se obtendrán todos los datos desde la landing page. Menos la descripción,
            // que, vamos a obtener desde la página del evento específico
            const eventsData: object[] = [];
            document.querySelectorAll('.home-events .row div .event-thumb').forEach((evento: any) => {
                if (evento.parentElement.checkVisibility()) {
                    let eventUrl: string = evento.querySelector('a').getAttribute('href');
                    if (eventUrl.startsWith('..')) eventUrl = eventUrl.replace('..', 'https://www.ticketmaster.cl');
                    //* Obtendremos la info básica excluyendo la descripción
                    //? Nombre del evento
                    const nombreEl = evento.querySelector('.thumb-title');
                    const nombre = nombreEl ? nombreEl.innerText : 'No disponible';
                    //? Fecha del evento
                    const fechaEl = evento.querySelector('.event_description');
                    const fecha = fechaEl ? fechaEl.innerText : 'No disponible';
                    //? Lugar del evento
                    const lugarEl = evento.querySelector('.event_venue');         
                    const lugar = lugarEl ? lugarEl.innerText : 'No disponible';
                    //? Imagen del evento
                    const imgEl = evento.querySelector('img');
                    const img = imgEl ? imgEl.getAttribute('src') : 'No disponible';
                    //? Precio del evento
                    //* Utilizaremos la misma fórmula que en Puntoticket
                    const numeroRandom = Math.floor(Math.random() * 39);
                    const precio = 5000 + (numeroRandom * 5000);
                    //? Generamos una cantidad aleatoria de entradas entre 50 y 5000
                    const nuevoNumRandom = Math.floor(Math.random() * 100);
                    const asientos = 50 + (nuevoNumRandom * 50);

                    const eventoData = {
                        nombre: nombre,
                        fecha: fecha,
                        lugar: lugar,
                        img: img,
                        precio: precio,
                        asientos: asientos,
                        descripcion: '',
                        url: eventUrl
                    };

                    eventsData.push(eventoData);
                }
            });
            return eventsData;
        }
    }
    //* Ejecuto la función que obtiene los datos de los eventos en la página que creamos.
    const eventsUrls = await page.evaluate(eventsUrlFunction);
    console.log('Done scraping urls from: ' + pageHost + '\n');
    //* Cierro la página y posteriormente returno los datos
    await page.close();
    return eventsUrls;
}

async function scrapeFrom(pageHost: string, urls: any, browser: Browser) {
    const page: Page = await browser.newPage();

    const actualRawData: string = await fs.promises.readFile('data.json', 'utf-8');
    const actualData: any = JSON.parse(actualRawData);

    let eventFunctionScrape: any;
    console.log('Scraping events from: ' + pageHost);
    if (pageHost === 'puntoticket') {
        eventFunctionScrape = async () => {
            // Descripcion
            const descripcionEl: any = document.querySelector('.slider-content span');
            const descripcion = descripcionEl ? descripcionEl.innerText : 'No disponible';

            return { descripcion: descripcion };
        }
    } else if (pageHost === 'ticketplus') {
        eventFunctionScrape = async () => {
            // Imagen
            const imgEl: any = document.querySelector('.img-header-event-container img');
            const img = imgEl ? imgEl.getAttribute('src') : 'No disponible';
            // Descripcion
            const descripcionEl: any = document.querySelector('.description-content');
            let descripcion = descripcionEl ? descripcionEl.innerText : 'No disponible';
            if (descripcion === '' || /^(\\n)+$/g.test(descripcion)) {
                descripcion = 'No se ha proporcionado una descripción para este evento';
            }
            // Lugar
            let lugar: any = 'No disponible';
            const lugarElements: any = document.querySelectorAll('.info-event .material-icons');
            const lugarIconEl: any = Array.from(lugarElements).find((e: any) => e.innerText === 'place');
            if (lugarIconEl) {
                let lugarContainerEl: any = lugarIconEl.parentElement;
                if (!lugarContainerEl) {
                    return { img: img, descripcion: descripcion, lugar: lugar };
                }
                lugarContainerEl = lugarContainerEl.parentElement;
                if (!lugarContainerEl) {
                    return { img: img, descripcion: descripcion, lugar: lugar };
                }
                const lugarEl: any = lugarContainerEl.querySelector('p');
                if (lugarEl) lugar = lugarEl.innerText;
            }

            const eventData: any = {
                img: img,
                descripcion: descripcion,
                lugar: lugar
            };

            return eventData;
        }
    } else if (pageHost === 'ticketmaster') {
        eventFunctionScrape = async () => {
            // Descripcion
            const descripcionElements: any = document.querySelectorAll('.row.event_info p');
            const filteredElements: any = Array.from(descripcionElements).filter((e: any) => e.innerText !== '');
            let descripcion = filteredElements.map((e: any) => e.innerText).join('\n');
            if (descripcion === '' || /^(\\n)+$/g.test(descripcion)) {
                descripcion = 'No se ha proporcionado una descripción para este evento';
            }

            return { descripcion: descripcion };
        }
    }
    for await (let url of urls) {
        await page.goto(url.url);
        const eventData: any = await page.evaluate(eventFunctionScrape);
        if (pageHost === 'puntoticket') {
            actualData[pageHost].forEach((e: any) => {
                if (e['url'] === url.url) {
                    e['descripcion'] = eventData.descripcion;
                }
            });
        } else if (pageHost === 'ticketplus') {
            actualData[pageHost].forEach((e: any) => {
                if (e['url'] === url.url) {
                    e['img'] = eventData.img;
                    e['descripcion'] = eventData.descripcion;
                    e['lugar'] = eventData.lugar;
                }
            });
        } else if (pageHost === 'ticketmaster') {
            actualData[pageHost].forEach((e: any) => {
                if (e['url'] === url.url) {
                    e['descripcion'] = eventData.descripcion;
                }
            });
        }
    }
    console.log('Scraping data from : ' + pageHost + ' done!\n');
    await page.close();
    return actualData[pageHost];
}

scrapeEverything();