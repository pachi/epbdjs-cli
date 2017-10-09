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
  get_metas,
  energy_performance,
  serialize_carrier_list,
  serialize_weighting_factors,
  cte
} from 'epbdjs';

const {
  parse_carrier_list,
  new_weighting_factors,
  parse_weighting_factors,
  strip_weighting_factors,
  balance_to_plain,
  balance_to_JSON,
  balance_to_XML
} = cte;

const KEXP = 0.0;
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
    Publicado bajo licencia MIT.
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
  ['-a', '--arearef'],
  {
    help: 'Define el área de referencia',
    type: Number
  }
);
parser.addArgument(
  ['-k', '--kexp'],
  {
    help: 'Define el factor de exportación (k_exp) [Predefinido: 0.0]',
    type: Number,
    defaultValue: KEXP
  }
);
parser.addArgument(
  ['-c', '--vectores'],
  {
    help: 'Usa el archivo de vectores energético',
    type: String,
    dest: 'vectores_archivo',
    defaultValue: ''
  }
);
parser.addArgument(
  ['-f', '--fps'],
  {
    help: 'Usa un archivo para definir los factores de paso',
    type: String,
    dest: 'fps_archivo',
    defaultValue: ''
  }
);
parser.addArgument(
  ['-l', '--fpsloc'],
  {
    help: 'Usa una localización para generar los factores de paso. [Predefinido: PENINSULA]',
    type: String,
    choices: ['PENINSULA', 'CANARIAS', 'BALEARES', 'CEUTAYMELILLA'],
    defaultValue: 'PENINSULA'
  }
);
parser.addArgument(
  '--cogen',
  {
    help: 'Indica los factores de exportación (ren, nren) a la red y a usos no EPB de electricidad cogenerada. P.e.: --cogen 0 2.5 0 2.5',
    type: Number,
    nargs: 4
  }
);
parser.addArgument(
  '--red',
  {
    help: 'Indica los factores de paso (ren, nren) de los vectores RED1 y RED2. P.e.: --red 0 1.3 0 1.3',
    type: Number,
    nargs: 4
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
    help: 'Guarda balance energético en formato JSON',
    type: String,
    dest: 'gen_json_archivo',
    defaultValue: '',
  }
);
parser.addArgument(
  '--xml',
  {
    help: 'Guarda balance energético en formato XML',
    type: String,
    dest: 'gen_xml_archivo',
    defaultValue: ''
  }
);
parser.addArgument(
  '--no_simplifica_fps',
  {
    help: 'No realiza simplificación de factores de paso a partir de los vectores definidos',
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
    help: 'Muestra licencia del programa',
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

// Lee kexp
const kexp = args.kexp;
if (verbosity > 0) {
  console.log(`Factor de exportación k_exp = ${ args.vectores_archivo }`);
}
if (kexp < 0 || kexp > 1) {
  console.log(`ERROR: el factor de exportación debe estar entre 0.0 y 1.0 y vale ${ kexp }`);
}
if (kexp !== 0) {
  console.log("AVISO: se está usando un factor de exportación distinto al reglamentario (CTE DB-HE) k_exp = 0");
}

// Leer vectores energéticos y corregirlos
let carriers;
if (args.vectores_archivo !== '') {
  try {
    const datastring = fs.readFileSync(args.vectores_archivo, 'utf-8');
    carriers = parse_carrier_list(datastring);
  } catch (e) {
    console.log(`ERROR: No se ha podido leer el archivo de vectores energéticos "${ args.vectores_archivo }"`);
  } finally {
    if (verbosity > 0) { console.log(`Vectores energéticos (${ args.vectores_archivo })`); }
  }
}

// Lee area_ref
let c_arearef = null;
if (carriers) {
  const metas = get_metas(carriers);
  const metaarea = metas.find(c => c.key === 'Area_ref');
  c_arearef = metaarea ? metaarea.value : null;
}

let arearef;
if(c_arearef === null) { // No se define Area_ref en metadatos de vectores energéticos
  if (args.arearef !== null) {
    arearef = args.arearef;
  } else {
    arearef = AREA_REF;
    if (verbosity > 0) { console.log(`Usando área de referencia predefinida)`); }
  }
} else { // Se define Area_ref en metadatos de vectores energéticos
  if (args.arearef === null) {
    if (verbosity > 0) { console.log(`Usando área de referencia de metadatos`); }
    arearef = c_arearef;
  } else {
    if (c_arearef !== args.arearef) {
      console.log(`AVISO: El valor del área de referencia del archivo de vectores energéticos (${ c_arearef }) no coincide con el valor definido por el usuario (${ args.arearef })`);
    }
    arearef = args.arearef;
  }
}
if (verbosity > 0) { console.log(`Área de referencia (${ arearef } m²)`); }

// Lee factores de paso
let fp;
if (args.fps_archivo !== '') {
  try {
    const fpstring = fs.readFileSync(args.fps_archivo, 'utf-8');
    fp = parse_weighting_factors(fpstring);
  } catch (e) {
    console.log(`ERROR: No se ha podido leer el archivo de factores de paso "${ args.fps_archivo }"`);
  } finally {
    if (verbosity > 0) { console.log(`Factores de paso (${ args.fps_archivo })`); }
  }
} else if (args.fpsloc) {
  if (verbosity > 0) { console.log(`Factores de paso (${ args.fpsloc })`); }
  let red = null;
  let cogen = null;
  if (args.red !== null) {
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
    fp = new_weighting_factors(args.fpsloc, { red, cogen });
  } catch (e) {
    console.log("ERROR: No se han podido generar los factores de paso");
    if(verbosity > 2) { throw(e); } else { process.exit() }
  }
} else {
  console.log("[ERROR]: No se han definido factores de paso");
  process.exit();
}

// Guardar vectores
if (args.gen_vectores_archivo !== '') {
  const carrierstring = serialize_carrier_list(carriers);
  fs.writeFile(args.gen_vectores_archivo, carrierstring, 'utf-8',
    err => {
      if (err) {
        console.log(`ERROR: No se ha podido escribir en "${ args.gen_vectores_archivo}" debido al error: ${ err }`);
      } else {
        if (verbosity > 0) { console.log(`Guardado archivo de vectores energéticos (${ args.gen_vectores_archivo })`); }
      }
    }
  );
}

// Simplificar factores de paso
if(carriers && !args.nosimplificafps) {
  const oldlen = fp.length;
  fp = strip_weighting_factors(fp, carriers);
  if (verbosity > 1) { console.log(`Reducción de factores de paso (${ oldlen } -> ${ fp.length })`); }
}

// Guardar factores de paso corregidos
if (args.gen_fps_archivo !== '') {
  const fpstring = serialize_weighting_factors(fp);
  fs.writeFile(args.gen_fps_archivo, fpstring, 'utf-8',
    err => {
      if (err) {
        console.log(`ERROR: No se ha podido escribir en "${ args.gen_fps_archivo}" debido al error: ${ err }`);
      } else {
        if (verbosity > 0) { console.log(`Guardado archivo de factores de paso (${ args.gen_fps_archivo })`); }
      }
    }
  );
}

// Compute primary energy (weighted energy)
let balance;
if (carriers && fp) {
  try {
    balance = energy_performance(carriers, fp, kexp);
  } catch (e) {
    console.log(`ERROR: No se ha podido calcular el balance energético`);
    throw e;
  }
}

// Show result
if (balance) {
  // Guardar balance en formato json
  if (args.gen_json_archivo !== '') {
    if (verbosity > 0) { console.log(`Resultados en formato JSON (${ args.gen_json_archivo })`); }
    const jsonbalancestring = cte.balance_to_JSON(balance);
    fs.writeFile(args.gen_json_archivo, jsonbalancestring, 'utf-8',
      err => {
        if (err) {
          console.log(`ERROR: No se ha podido escribir en "${args.gen_json_archivo}" debido al error: ${err}`);
        }
      }
    );
  }
  if (args.gen_xml_archivo !== '') {
    if (verbosity > 0) { console.log(`Resultados en formato XML (${ args.gen_xml_archivo })`); }
    const xmlstring = balance_to_XML(balance, arearef);
    fs.writeFile(args.gen_xml_archivo, xmlstring, 'utf-8',
      err => {
        if (err) {
          console.log(`ERROR: No se ha podido escribir en "${args.gen_xml_archivo}" debido al error: ${err}`);
        }
      }
    );
  }

  if (verbosity > 0) { console.log("Balance energético:"); }
  console.log(balance_to_plain(balance, arearef));
}
