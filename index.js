//paquetes requeridos
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const chalkAnimation = require('chalk-animation');
const inquirer = require('inquirer');


/**
 * TODO
 * Crear menu con las consolas
 * Revisar si ya fue descargado
 * Poder crear archivo txt con todos los links
 * Revisar si el archivo fue creado, leerlo y evitar recorrer todo de nuevo
 * 
 */

/**
 * NOTAS
 * Por cada consola, son 20 items por pagina...
 * Para saber el item total de cada consola se puede ver en
 * https://romsmania.cc/roms/
 * Deberia dividir el total y redondear hacia arriba
 * Ejemplo: Amstrad tiene 26 items y son dos paginas
 */

//Creo que podria ver otra manera de poder ocupar esta variable pq no la quiero dejar tan global
var tipo_consola = '';

//Iniciamos tabla para elegir consola
inquirer
  .prompt([
    {
      type: 'list',
      name: 'consola',
      message: 'ROMs de que consola?',
      choices: [
       'Acorn 8 bit (629)','Acorn Archimedes (213)','Acorn Electron (993)','Amiga 500 (4,259)','Amstrad CPC (10,562)','Amstrad GX4000 (26)','Apple I (4)','Apple II (2,352)','Apple II GS (814)','Atari 2600 (2,549)','Atari 5200 (104)','Atari 7800 (68)','Atari 800 (5,485)','Atari Jaguar (47)','Atari Lynx (90)','Atari ST (304)','Bally Pro Arcade Astrocade (24)','BBC Micro (6,214)','Camputers Lynx (92)','Capcom Play System 1 (136)','Capcom Play System 2 (177)','Casio Loopy (7)','Casio PV1000 (5)','ColecoVision (479)','ColecoVision ADAM (104)','Commodore 64 (5,985)','Commodore Max Machine (3)','Commodore Pet (30)','Commodore Plus4 C16 (18)','Commodore VIC20 (292)','Dragon Data Dragon (565)','Elektronika BK (32)','Emerson Arcadia 2001 (48)','Entex Adventure Vision (5)','Epoch Super Cassette Vision (25)','Fairchild Channel F (37)','Funtech Super Acan (8)','Galaksija (54)','Game Gear (664)','Gameboy (1,412)','Gameboy Advance (2,518)','Gameboy Color (1,100)','GameCube (1,405)','GamePark GP32 (35)','GCE Vectrex (108)','Hartung Game Master (12)','Intellivision (243)','Interact Family Computer (28)','Kaypro II (1)','Luxor ABC 800 (5)','Magnavox Odyssey 2 (133)','MAME 037b11 (2,257)','Mattel Aquarius (55)','Memotech MTX512 (101)','Microsoft Xbox (20)','Miles Gordon Sam Coupe (172)','MSX 2 (197)','MSX Computer (524)','Neo Geo (562)','Neo Geo Pocket (11)','Neo Geo Pocket Color (119)','Nintendo (3,182)','Nintendo 3DS (1)','Nintendo 64 (500)','Nintendo DS (6,190)','Nintendo Famicom Disk System (173)','Nintendo Pokemon Mini (44)','Nintendo Virtual Boy (30)','Nintendo Wii (1,142)','Nokia N Gage (127)','Pel Varazdin Orao (42)','Philips Videopac (34)','Playstation (1,420)','Playstation 2 (122)','Playstation Portable (3,832)','RCA Studio II (6)','Robotron Z1013 (659)','Sega 32x (36)','Sega Dreamcast (554)','Sega Genesis (950)','Sega Master System (415)','Sega Pico (63)','Sega SG1000 (100)','Sega Super Control Station (11)','Sega Visual Memory System (56)','Sharp MZ 700 (84)','Sharp X68000 (3,245)','Sinclair ZX81 (1,229)','Sufami Turbo (15)','Super Grafx (4)','Super Nintendo (3,749)','Tandy Color Computer (109)','Tangerine Oric (513)','Thomson MO5 (222)','Tiger Game Com (24)','TurboGrafx 16 (1,513)','VTech CreatiVision (21)','VTech V Smile (88)','Wang VS (3)','Watara Supervision (44)','WonderSwan (256)','Z Machine Infocom (82)','ZX Spectrum (12,906)'
      ]
    }
  ])
  .then(answers => {
      recorrido(answers.consola);
  });



//Funcion que recorre las paginas con todos los juegos
async function recorrido(consola) {

    //Crea texto para que el usuario vea progresos
    var str = '';
    var rainbow = chalkAnimation.rainbow(str);

    //Expresion regular para filtrar contenido dentro de parentesis
    let regExp = /\(([^)]+)\)/;

    //Busco el contenido que este dentro del parentesis
    var coincidencias = regExp.exec(consola);
    
    //Variable para saber cuantas paginas tiene que recorrer
    let cantidad_paginas= Math.ceil((coincidencias[1])/20);

    //Variable actualizada para poder crear carpeta de descarga y poder completar links de descarga
    tipo_consola = consola.replace(coincidencias[0], '').trim().toLowerCase().split(' ').join('-');

    //Arreglo que contendra los links recorridos
    let array_juegos = [];

    //Recorre la cantidad de paginas determinada arriba
    for (let i = 1; i < cantidad_paginas+1; i++) {

        //Variable que tiene el sitio a recorrer
        let sitios_a_recorrer = `https://romsmania.cc/roms/${tipo_consola}/search?name=&genre=&region=&orderBy=name&orderAsc=1&page=${i}`;

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
    let directorio_descarga = `${__dirname}/descargas/${tipo_consola}/`;

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