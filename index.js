//paquetes requeridos
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const chalkAnimation = require('chalk-animation');

//Es una estupidez, pero se ve lindo
var str = 'Iniciando';
var rainbow = chalkAnimation.rainbow(str);

//Funcion que recorre las paginas con todos los juegos
async function recorrido() {

    //Arreglo que contendra los links recorridos
    let array_juegos = [];

    //Son 25 paginas con listado de juegos
    for (let i = 1; i < 26; i++) {

        //Variable que tiene el sitio a recorrer
        let sitios_a_recorrer = 'https://romsmania.cc/roms/nintendo-famicom-disk-system/search?name=&genre=&region=&orderBy=name&orderAsc=1&page=' + i;

        //Abrimos pagina
        await axios.get(sitios_a_recorrer)
            .then(function (respuesta) {

                //Cargamos el sitio en cheerio para poder buscar links
                let $ = cheerio.load(respuesta.data);

                //Cada tag a que contiene el link del juego, que es lo que importa
                $('td > a').each(function (i, element) {
                    //Insertamos link en arreglo, esta modificado para obtener al tiro el sitio que corresponde y evito un paso extra 
                    array_juegos.push('https://romsmania.cc/download/roms/' + $(this).attr('href').split('/').slice(-2)[0] + '/' + $(this).attr('href').split('/').slice(-2)[1]);
                });

            });
        //Actualizamos texto a mostrar al usuario
        rainbow.replace(`Obteniendo listado de juegos ${Math.round((i * 100) / 26)}%`);

    }

    //Mando el arreglo final con todos los juegos que encontro
    obtener_link_descarga(array_juegos);
}

//Funcion para obtener el link de descarga
async function obtener_link_descarga(dato) {

    //Arreglo que contendra los links de descarga directa
    let arreglo_final = [];

    //Recorre todos los links del arreglo
    for (let i = 0; i < dato.length; i++) {

        //Variable para hacer mas simple entender el codigo
        let juego_link = dato[i];

        //Abrimos pagina
        await axios.get(juego_link)
            .then(function (respuesta) {

                //Cargamos el sitio en cheerio para poder obtener el link de descarga
                let $ = cheerio.load(respuesta.data);
                //Agrego contenido al arreglo con el link de descarga
                arreglo_final.push($('.wait__link').attr('href'));

            });
            //Actualiza el progreso de obtencion de los links
            rainbow.replace(`Obteniendo links de descarga ${Math.round((i * 100) / dato.length)}% ${juego_link}`);
    }
    //Llama a la funcion que descarga los juegos
    await descarga(arreglo_final);
}

//Funcion que descarga los archivos
async function descarga(arr_link_final) {
    //Variable para tener el directorio de manera mas bonita
    let directorio_descarga = __dirname+'/descargas/nintendo-famicom-disk-system';

    //Crea los directorios para descarga de archivos
    fs.mkdirSync(directorio_descarga, { recursive: true })

    //Recorre el arreglo que contiene todos los links de descarga
    for (let i = 0; i < arr_link_final.length; i++) {
        
        //Variable para que sea mas legible el codigo
        let link = arr_link_final[i];
        
        //Variable para generar el nombre de archivo de manera legible
        let nombre = decodeURI(link.split('/').pop());
        
        //Descarga del archivo
        await axios({
            method: 'get',
            url: link,
            responseType: 'stream',
            timeout: 48000
        })
            .then(function (response) {
                //El archivo es guardado en el directorio
                response.data.pipe(fs.createWriteStream(directorio_descarga + '/' + nombre));
            });
            //Actualiza el estado de la descarga en promedio de TODOS los juegos
            rainbow.replace(`Porcentaje completado ${Math.round((i * 100) / arr_link_final.length)} => Descargado ${nombre}`);
    }
    //Aviso al usuario que ya las cosas fueron descargadas
    rainbow.replace('T E R M I N A D O');
    //Detiene la animacion de consola
    rainbow.stop();
}

recorrido();

/**
 * TODO:
 * Revisar si el archivo fue descargado
 * Ver la posibilidad de crear un menu para descargar las cosas
 * 
 */