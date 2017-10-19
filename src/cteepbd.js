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
           Daniel Jiménez González <danielj@ietcc.csic.es>
           Marta Sorribes Gil <msorribes@ietcc.csic.es>
*/

/* eslint-disable no-console */
import * as fs from 'fs';
import argparse, { ArgumentParser } from 'argparse';

import {
  filter_metas,
  energy_performance,
  serialize_carrierdata,
  serialize_wfactordata,
  cte
} from 'epbdjs';

const {
  parse_carrierdata,
  new_wfactordata,
  parse_wfactordata,
  strip_wfactordata,
  balance_to_plain,
  balance_to_JSON,
  balance_to_XML
} = cte;

const KEXP_REF = 0.0;
const AREA_REF = 1.0;
const VERSION = '1.0';

var parser = new ArgumentParser({
  addHelp:true,
  prog: 'cteepbd',
  formatterClass: argparse.RawDescriptionHelpFormatter,
  description:
`cteepbd ${ VERSION } - Eficiencia energética de los edificios (CTE DB-HE)

    Copyright (c) 2017 Ministerio de Fomento,
                       Instituto de CC. de la Construcción Eduardo Torroja (IETcc-CSIC)

    Autores: Rafael Villar Burke <pachi@ietcc.csic.es>,
             Daniel Jiménez González <danielj@ietcc.csic.es>
             Marta Sorribes Gil <msorribes@ietcc.csic.es>

    Licencia: Publicado bajo licencia MIT.
`
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
  '-a',
  {
    help: 'Área de referencia [Predefinida: 1]',
    type: Number,
    dest: 'arearef'
  }
);
parser.addArgument(
  '-k',
  {
    help: 'Factor de exportación (k_exp) [Predefinido: 0.0]',
    type: Number,
    dest: 'kexp'
  }
);
parser.addArgument(
  '-c',
  {
    help: 'Archivo de definición de los componentes energéticos',
    type: String,
    dest: 'archivo_componentes',
    defaultValue: ''
  }
);
parser.addArgument(
  '-f',
  {
    help: 'Archivo de definición de los factores de paso',
    type: String,
    dest: 'archivo_factores',
    defaultValue: ''
  }
);
parser.addArgument(
  '-l',
  {
    help: 'Localización que define los factores de paso',
    type: String,
    dest: 'fps_loc',
    choices: ['PENINSULA', 'CANARIAS', 'BALEARES', 'CEUTAYMELILLA'],
    defaultValue: ''
  }
);
parser.addArgument(
  '--oc',
  {
    help: 'Archivo de salida de los vectores energéticos corregidos',
    type: String,
    dest: 'gen_archivo_componentes',
    defaultValue: ''
  }
);
parser.addArgument(
  '--of',
  {
    help: 'Archivo de salida de los factores de paso corregidos',
    type: String,
    dest: 'gen_archivo_factores',
    defaultValue: ''
  }
);
parser.addArgument(
  '--json',
  {
    help: 'Archivo de salida de resultados detallados en formato JSON',
    type: String,
    dest: 'archivo_salida_json',
    defaultValue: '',
  }
);
parser.addArgument(
  '--xml',
  {
    help: 'Archivo de salida de resultados en formato XML',
    type: String,
    dest: 'archivo_salida_xml',
    defaultValue: ''
  }
);
parser.addArgument(
  '--cogen',
  {
    help: 'Factores de exportación (ren, nren) a la red y a usos no EPB de electricidad cogenerada. P.e.: --cogen 0 2.5 0 2.5',
    type: Number,
    nargs: 4
  }
);
parser.addArgument(
  '--red',
  {
    help: 'Factores de paso (ren, nren) de los vectores RED1 y RED2. P.e.: --red 0 1.3 0 1.3',
    type: Number,
    nargs: 4
  }
);
parser.addArgument(
  '--no_simplifica_fps',
  {
    help: 'Evita la simplificación de los factores de paso a partir de los vectores definidos',
    type: Boolean,
    dest: 'nosimplificafps',
    action: 'storeConst',
    constant: true,
    defaultValue: false
  }
);
parser.addArgument(
  '--licencia',
  {
    help: 'Muestra la licencia del programa (MIT)',
    type: Boolean,
    dest: 'showlicense',
    action: 'storeConst',
    constant: true,
    defaultValue: false
  }
);
const args = parser.parseArgs();
if (process.argv.length < 3) {
  parser.printHelp();
  process.exit();
}

if (args.showlicense) {
  console.log(`Copyright (c) 2017 Ministerio de Fomento
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
           Daniel Jiménez González <danielj@ietcc.csic.es>
           Marta Sorribes Gil <msorribes@ietcc.csic.es>`
  );
  process.exit();
}

const verbosity = args.verbosity;

if (verbosity > 2) {
  console.log("Opciones indicadas: ----------");
  console.log(args);
  console.log("------------------------------");
}

console.log("** Datos de entrada");

// Comprobaciones básicas de consistencia -----------------------------------------------------

// Lee kexp
if (args.kexp !== null) {
  if (args.kexp < 0 || args.kexp > 1) {
    console.log(`ERROR: el factor de exportación debe estar entre 0.0 y 1.0 y vale ${ args.kexp }`);
    process.exit();
  }
  if (args.kexp !== 0) {
    console.log(`AVISO: factor de exportación distinto al reglamentario (${ args.kexp }) (CTE DB-HE: k_exp = 0)`);
    process.exit();
  }
}

// Factores de paso
if (args.archivo_factores !== '' && args.fps_loc !== '') {
  console.log(`ERROR: deben definirse los factores de paso usando un archivo de datos o una localización, pero no ambos`);
  process.exit();
}

// Area de referencia
if (args.arearef !== null && args.arearef <= 0) {
  console.log(`ERROR: el área de referencia definida por el usuario debe ser mayor que 0 y vale ${ args.arearef }`);
  process.exit();
}

// Componentes energéticos ---------------------------------------------------------------------
let carrierdata;
if (args.archivo_componentes !== '') {
  try {
    const datastring = fs.readFileSync(args.archivo_componentes, 'utf-8');
    carrierdata = parse_carrierdata(datastring);
  } catch (e) {
    console.log(`ERROR: No se ha podido leer el archivo de componentes energéticos "${ args.archivo_componentes }"`);
    throw e;
  } finally {
    console.log(`Componentes energéticos: "${ args.archivo_componentes }"`);
  }
}

// Factores de paso ---------------------------------------------------------------------------
let fpdata;
if (args.archivo_factores !== '') {
  try {
    const fpstring = fs.readFileSync(args.archivo_factores, 'utf-8');
    fpdata = parse_wfactordata(fpstring);
  } catch (e) {
    console.log(`ERROR: No se ha podido leer el archivo de factores de paso "${ args.archivo_factores }"`);
  } finally {
    console.log(`Factores de paso: "${ args.archivo_factores }"`);
  }
} else if (args.fps_loc) {
  console.log(`Factores de paso: ${ args.fps_loc }`);
  let red = null;
  let cogen = null;
  if (args.red !== null) {
    console.log(`Factores de paso de usuario para RED1, RED2: ${ args.red }`);
    const [r1_ren, r1_nren, r2_ren, r2_nren] = args.red;
    if (verbosity > 0) {
      console.log(`- RED1, RED, input, A, ${ r1_ren }, ${ r1_nren } `);
      console.log(`- RED2, RED, input, A, ${ r2_ren }, ${ r2_nren } `);
    }
    red = {
      RED1: { ren: r1_ren, nren: r1_nren }, // RED1, RED, input, A, ren, nren
      RED2: { ren: r2_ren, nren: r2_nren }  // RED2, RED, input, A, ren, nren
    };
  }
  if (args.cogen !== null) {
    console.log(`Factores de paso de usuario para COGENERACIÓN: ${ args.cogen }`);
    const [cgrid_ren, cgrid_nren, cnepb_ren, cnepb_nren] = args.cogen;
    if (verbosity > 0) {
      console.log(`- ELECTRICIDAD, COGENERACION, to_grid, A, ${ cgrid_ren }, ${ cgrid_nren } `);
      console.log(`- ELECTRICIDAD, COGENERACION, to_nEPB, A, ${ cnepb_ren }, ${ cnepb_nren } `);
    }
    cogen = {
      to_grid: { ren: cgrid_ren, nren: cgrid_nren }, // ELECTRICIDAD, COGENERACION, to_grid, A, ren, nren
      to_nEPB: { ren: cnepb_ren, nren: cnepb_nren }  // ELECTRICIDAD, COGENERACION, to_nEPB, A, ren, nren
    };
  }
  try {
    fpdata = new_wfactordata(args.fps_loc, { red, cogen });
  } catch (e) {
    console.log("ERROR: No se han podido generar los factores de paso");
    if(verbosity > 2) { throw(e); } else { process.exit() }
  }
} else {
  console.log("[ERROR]: No se han definido factores de paso");
  process.exit();
}

// Área de referencia -------------------------------------------------------------------------
let c_arearef = null;
if (carrierdata) {
  const metas = filter_metas(carrierdata);
  const metaarea = metas.find(c => c.key === 'Area_ref');
  c_arearef = metaarea ? metaarea.value : null;
}

let arearef;
if(c_arearef === null) { // No se define Area_ref en metadatos de vectores energéticos
  if (args.arearef !== null) {
    arearef = args.arearef;
  } else {
    arearef = AREA_REF;
    console.log(`Área de referencia (predefinida) [m2]: ${ arearef }`);
  }
} else { // Se define Area_ref en metadatos de vectores energéticos
  if (args.arearef === null) {
    arearef = c_arearef;
    console.log(`Área de referencia (metadatos) [m2]: ${ arearef }`);
  } else {
    if (c_arearef !== args.arearef) {
      console.log(`AVISO: El valor del área de referencia del archivo de vectores energéticos (${ c_arearef }) no coincide con el valor definido por el usuario (${ args.arearef })`);
    }
    arearef = args.arearef;
    console.log(`Área de referencia (usuario) [m2]: ${ arearef }`);
  }
}

// kexp ------------------------------------------------------------------------------------------

let kexp;
if (args.kexp === null) {
  kexp = KEXP_REF;
  console.log(`Factor de exportación (predefinido): ${ kexp }`);
} else {
  kexp = args.kexp;
  console.log(`Factor de exportación (usuario): ${ kexp }`);
}

// Guardado de componentes energéticos -----------------------------------------------------------
if (args.gen_archivo_componentes !== '') {
  const carrierstring = serialize_carrierdata(carrierdata);
  fs.writeFile(args.gen_archivo_componentes, carrierstring, 'utf-8',
    err => {
      if (err) {
        console.log(`ERROR: No se ha podido escribir en "${ args.gen_archivo_componentes}" debido al error: ${ err }`);
      } else {
        if (verbosity > 0) { console.log(`Guardado archivo de vectores energéticos: ${ args.gen_archivo_componentes }`); }
      }
    }
  );
}

// Simplificar factores de paso -----------------------------------------------------------------
if(carrierdata && !args.nosimplificafps) {
  const oldfplen = fpdata.length;
  fpdata = strip_wfactordata(fpdata, carrierdata);
  if (verbosity > 1) { console.log(`Reducción de factores de paso: ${ oldfplen } a ${ fpdata.length }`); }
}

// Guardado de factores de paso corregidos ------------------------------------------------------
if (args.gen_archivo_factores !== '') {
  const fpstring = serialize_wfactordata(fpdata);
  fs.writeFile(args.gen_archivo_factores, fpstring, 'utf-8',
    err => {
      if (err) {
        console.log(`ERROR: No se ha podido escribir en "${ args.gen_archivo_factores}" debido al error: ${ err }`);
      } else {
        if (verbosity > 0) { console.log(`Guardado archivo de factores de paso: ${ args.gen_archivo_factores }`); }
      }
    }
  );
}

// Cálculo del balance -------------------------------------------------------------------------
let balance;
if (carrierdata && fpdata && (kexp !== null)) {
  try {
    balance = energy_performance(carrierdata, fpdata, kexp);
  } catch (e) {
    console.log(`ERROR: No se ha podido calcular el balance energético`);
    throw e;
  }
} else {
  console.log(`ERROR: no hay datos suficientes para calcular el balance energético`);
  process.exit();
}

// Salida de resultados ------------------------------------------------------------------------
if (balance) {
  // Guardar balance en formato json
  if (args.archivo_salida_json !== '') {
    if (verbosity > 0) { console.log(`Resultados en formato JSON: "${ args.archivo_salida_json }"`); }
    const jsonbalancestring = balance_to_JSON(balance, arearef);
    fs.writeFile(args.archivo_salida_json, jsonbalancestring, 'utf-8',
      err => {
        if (err) {
          console.log(`ERROR: No se ha podido escribir en "${args.archivo_salida_json}" debido al error: ${err}`);
        }
      }
    );
  }
  // Guardar balance en formato XML
  if (args.archivo_salida_xml !== '') {
    if (verbosity > 0) { console.log(`Resultados en formato XML: "${ args.archivo_salida_xml }"`); }
    const xmlstring = balance_to_XML(balance, arearef);
    fs.writeFile(args.archivo_salida_xml, xmlstring, 'utf-8',
      err => {
        if (err) {
          console.log(`ERROR: No se ha podido escribir en "${args.archivo_salida_xml}" debido al error: ${err}`);
        }
      }
    );
  }
  // Mostrar siempre en formato plain
  console.log("** Balance energético");
  console.log(balance_to_plain(balance, arearef));
}
