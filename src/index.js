/* -*- coding: utf-8 -*-

Copyright (c) 2017 Ministerio de Fomento
                   Instituto de Ciencias de la Construcción Eduardo Torroja (IETcc-CSIC)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

Author(s): Rafael Villar Burke <pachi@ietcc.csic.es>
*/

/* eslint-disable no-console */
import * as fs from 'fs';
import * as path from 'path';
import { ArgumentParser } from 'argparse';

import {
  energy_performance,
  serialize_carrier_list,
  serialize_weighting_factors,
  cte
} from 'epbdjs';

function show_final_EP(ep, area=1.0) {
  const { ren, nren } = ep['B'];
  return `C_ep [kWh/año]`
    + `: ren = ${ ren.toFixed(1) }`
    + `, nren = ${ nren.toFixed(1) }`
    + `, tot = ${ (ren + nren).toFixed(1) }`
    + `, RER = ${ (ren / (ren + nren)).toFixed(2) }\n`
    +
    `C_ep [kWh/m²·año]`
    + `: ren = ${ (ren / area).toFixed(1) }`
    + `, nren = ${ (nren / area).toFixed(1) }`
    + `, tot = ${ ((ren + nren) / area).toFixed(1) }`
    + `, RER = ${ (ren / (ren + nren)).toFixed(2) }`;
}

const KEXP = 0.0;
const AREA_REF = 1.0;

var parser = new ArgumentParser({
  addHelp:true,
  //prog: 'epbjscli',
  description: 'Interfaz de línea de comandos de epbdjs [v.1.0.0]',
  epilog: "Copyright (c) 2017 Ministerio de Fomento, Instituto de Ciencias de la Construcción Eduardo Torroja (IETcc-CSIC). Publicado bajo licencia MIT."
});
parser.addArgument(
  '-v',
  {
    help: 'Nivel de información adicional',
    action: 'count',
    defaultValue: 0,
    dest: 'verbosity'
  }
);
parser.addArgument(
  '--arearef',
  {
    help: 'Define el área de referencia [Predefinido : 1.0]',
    type: Number,
    defaultValue: AREA_REF
  }
);
parser.addArgument(
  '--kexp',
  {
    help: 'Define el factor de exportación (k_exp) [Predefinido: 0.0]',
    type: Number,
    defaultValue: KEXP
  }
);
parser.addArgument(
  '--vectores',
  {
    help: 'Usa el archivo de vectores energético',
    type: String,
    dest: 'vectores_archivo',
    defaultValue: ''
  }
);
parser.addArgument(
  '--genvectores',
  {
    help: 'Guarda el archivo de vectores energéticos corregidos',
    type: String,
    dest: 'gen_vectores_archivo',
    defaultValue: ''
  }
);
parser.addArgument(
  '--fps',
  {
    help: 'Usa un archivo para definir los factores de paso',
    type: String,
    dest: 'fps_archivo',
    defaultValue: ''
  }
);
parser.addArgument(
  '--fpsloc',
  {
    help: 'Usa una localización para generar los factores de paso. [Predefinido: PENINSULA]',
    type: String,
    choices: ['PENINSULA', 'CANARIAS', 'BALEARES', 'CEUTAYMELILLA'],
    defaultValue: 'PENINSULA'
  }
);
parser.addArgument(
  '--genfps',
  {
    help: 'Guarda el archivo de factores de paso corregidos',
    type: String,
    dest: 'gen_fps_archivo',
    defaultValue: ''
  }
);
parser.addArgument(
  '--json',
  {
    help: 'Obtiene balance energético en formato JSON [Predefinido: no]',
    type: Boolean,
    dest: 'isjson',
    action: 'storeConst',
    constant: true,
    defaultValue: false,
  }
);
parser.addArgument(
  '--xml',
  {
    help: 'Obtiene resultados en formato XML [Predefinido: no]',
    type: Boolean,
    dest: 'isxml',
    action: 'storeConst',
    constant: true,
    defaultValue: false
  }
);
const args = parser.parseArgs();
const verbosity = args.verbosity;

if (verbosity > 2) {
  console.log("Opciones indicadas: ----------");
  console.log(args);
  console.log("------------------------------");
}

// Read area_ref
const arearef = args.arearef;
if (verbosity > 0) { console.log(`Área de referencia: ${ arearef } m²`); }

// Read kexp
const kexp = args.kexp;

// Leer vectores energéticos y corregirlos
let carriers;
if (args.vectores_archivo !== '') {
  if (verbosity > 0) { console.log("Archivo de vectores: ", args.vectores_archivo); }
  try {
    const datastring = fs.readFileSync(args.vectores_archivo, 'utf-8');
    carriers = cte.parse_carrier_list(datastring);
    //console.log("carriers sin valores: ", carriers.filter(c => !c.values));
    // TODO: ver si se define en metadatos el area_ref
  } catch (e) {
    console.log(`ERROR: No se ha podido leer el archivo de vectores energéticos "${ args.vectores_archivo }"`);
  }
}

// Guardar vectores corregidos
if (args.gen_vectores_archivo !== '') {
  const carrierstring = serialize_carrier_list(carriers);
  fs.writeFile(args.gen_vectores_archivo, carrierstring, 'utf-8',
    err => {
      if (err) {
        console.log(`ERROR: No se ha podido escribir en "${ args.gen_vectores_archivo}" debido al error: ${ err }`);
      }
    }
  );
}

// Read weighting factors
let fp;
if (args.fps_archivo !== '') {
  if (verbosity > 0) { console.log("Archivo de factores de paso: ", args.fps_archivo); }
  try {
    const fpstring = fs.readFileSync(args.fps_archivo, 'utf-8');
    fp = cte.parse_weighting_factors(fpstring);
  } catch (e) {
    console.log(`ERROR: No se ha podido leer el archivo de factores de paso "${ args.fps_archivo }"`);
  }
} else if (args.fps_loc) {
  // TODO: Mirar antes si están definidos cogen y red1|red2
  fp = cte.new_weighting_factors(args.fps_loc);
}

// Guardar factores de paso corregidos
if (args.gen_fps_archivo !== '') {
  // TODO: ¿limpiar factores antes de exportarlos?
  const fpstring = serialize_weighting_factors(fp);
  const outpath = path.resolve(__dirname, args.gen_fps_archivo);
  fs.writeFile(outpath, fpstring, 'utf-8',
    err => {
      if (err) {
        console.log(`ERROR: No se ha podido escribir en "${ args.gen_fps_archivo}" debido al error: ${ err }`);
      }
    }
  );
}

// Compute primary energy (weighted energy)
let balance;
if (carriers && fp) {
  if (verbosity > 0) { console.log("Calculando el balance energético"); }
  try {
    balance = energy_performance(carriers, fp, kexp);
  } catch (e) {
    console.log(`ERROR: No se ha podido calcular el balance energético`);
    throw e;
  }
}

// Show result
if (balance) {
  if (args.isjson) {
    // JSON
    console.log(JSON.stringify(balance, null, '  '));  
  } else if (args.isxml) {
    // TODO: XML
    console.log("Salida XML");
  } else {
    console.log(show_final_EP(balance.EP, arearef));
  }
}
