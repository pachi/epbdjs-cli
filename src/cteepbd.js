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
  energy_performance,
  serialize_components,
  serialize_wfactors,
  cte
} from 'epbdjs';

const {
  KEXP_DEFAULT,
  CTE_COGEN_DEFAULTS,
  CTE_RED_DEFAULTS,
  parse_components,
  new_wfactors,
  parse_wfactors,
  strip_wfactors,
  components_by_service,
  wfactors_to_nearby,
  balance_to_plain,
  balance_to_JSON,
  balance_to_XML
} = cte;

const AREAREF_DEFAULT = 1.0;
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
    help: `Área de referencia [Predefinida: ${ AREAREF_DEFAULT }]`,
    type: Number,
    dest: 'arearef'
  }
);
parser.addArgument(
  '-k',
  {
    help: `Factor de exportación (k_exp) [Predefinido: ${ KEXP_DEFAULT }]`,
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
  '--acs_nearby',
  {
    help: 'Realiza el balance considerando solo los componentes del servicio de ACS y el perímetro nearby',
    type: Boolean,
    dest: 'acsnrb',
    action: 'storeConst',
    constant: true,
    defaultValue: false
  }
);
parser.addArgument(
  '--cogen',
  {
    help: 'Factores de exportación a la red (ren, nren) de la electricidad cogenerada. P.e.: --cogen 0 2.5',
    type: Number,
    nargs: 2
  }
);
// parser.addArgument(
//   '--cogennepb',
//   {
//     help: 'Factores de exportación a usos no EPB (ren, nren) de la electricidad cogenerada. P.e.: --cogennepb 0 2.5',
//     type: Number,
//     nargs: 2
//   }
// );
parser.addArgument(
  '--red1',
  {
    help: 'Factores de paso (ren, nren) del vector RED1. P.e.: --red1 0 1.3',
    type: Number,
    nargs: 2
  }
);
parser.addArgument(
  '--red2',
  {
    help: 'Factores de paso (ren, nren) del vector RED2. P.e.: --red2 0 1.3',
    type: Number,
    nargs: 2
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

// Funciones auxiliares -----------------------------------------------------------------------

// Actualiza objeto de metadatos con nuevo valor de la clave o inserta clave y valor si no existe
function updatemeta(metaobj, key, value) {
  const match = metaobj.find(c => c.key === key)
  if(match) {
    match.value = value;
  } else {
    metaobj.push({ key, value });
  }
}

// --------------------------------------------------------------------------------------------


// Prólogo ------------------------------------------------------------------------------------

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
    console.error(`ERROR: el factor de exportación debe estar entre 0.0 y 1.0 y vale ${ args.kexp }`);
    process.exit();
  }
  if (args.kexp !== KEXP_DEFAULT) {
    console.warn(`AVISO: factor de exportación (${ args.kexp }) distinto al reglamentario (${ KEXP_DEFAULT })`);
    process.exit();
  }
}

// Factores de paso
if (args.archivo_factores !== '' && args.fps_loc !== '') {
  console.error(`ERROR: deben definirse los factores de paso usando un archivo de datos o una localización, pero no ambos`);
  process.exit();
}

// Area de referencia
if (args.arearef !== null && args.arearef <= 0) {
  console.error(`ERROR: el área de referencia definida por el usuario debe ser mayor que 0 y vale ${ args.arearef }`);
  process.exit();
}

// Componentes energéticos ---------------------------------------------------------------------
let components;
if (args.archivo_componentes !== '') {
  try {
    const componentsstring = fs.readFileSync(args.archivo_componentes, 'utf-8');
    components = parse_components(componentsstring);
  } catch (e) {
    console.error(`ERROR: No se ha podido leer el archivo de componentes energéticos "${ args.archivo_componentes }"`);
    throw e;
  } finally {
    console.log(`Componentes energéticos: "${ args.archivo_componentes }"`);
  }
}

if (args.acsnrb === true) { // Estamos en cálculo de ACS en nearby
  components = components_by_service(components, 'ACS');
}

// Extraemos los valores bien conocidos, para preferirlos sobre los valores por defecto
// Las opciones de línea de comandos tienen prioridad en todo caso
// Valores bien conocidos:
// CTE_AREAREF -> num
// CTE_KEXP -> num
// CTE_LOCALIZACION -> str
// CTE_COGEN -> num, num
// CTE_RED1 -> num, num
// CTE_RED2 -> num, num
const COMPONENTS_META = {};
if (components) {
  // TODO: esto debería ser más robusto frente a archivos mal formados
  let meta = components.cmeta.find(c => c.key === 'CTE_AREAREF');
  COMPONENTS_META.arearef = meta ? meta.value : null;
  meta = components.cmeta.find(c => c.key === 'CTE_KEXP');
  COMPONENTS_META.kexp = meta ? meta.value : null;
  meta = components.cmeta.find(c => c.key === 'CTE_LOCALIZACION');
  COMPONENTS_META.loc = meta ? meta.value : null;
  meta = components.cmeta.find(c => c.key === 'CTE_COGEN');
  COMPONENTS_META.cogen = meta ? meta.value.split(',').map(Number) : null;
  meta = components.cmeta.find(c => c.key === 'CTE_COGENNEPB');
  COMPONENTS_META.cogennepb = meta ? meta.value.split(',').map(Number) : null;
  meta = components.cmeta.find(c => c.key === 'CTE_RED1');
  COMPONENTS_META.red1 = meta ? meta.value.split(',').map(Number) : null;
  meta = components.cmeta.find(c => c.key === 'CTE_RED2');
  COMPONENTS_META.red2 = meta ? meta.value.split(',').map(Number) : null;
  if(verbosity > 1) {
    console.log("Metadatos de componentes: ", COMPONENTS_META);
  }
}

// Factores de paso ---------------------------------------------------------------------------
// Para los factores de paso para RED1, RED2, COGEN, se usan los valores por defecto salvo que
// se indiquen valores por la interfaz
// Se generan en base a la localización (PENINSULA, CANARIAS, BALEARES, CEUTAMELILLA)
let fpdata;
if (args.archivo_factores !== '') { // Archivo de factores de paso
  try {
    const fpstring = fs.readFileSync(args.archivo_factores, 'utf-8');
    fpdata = parse_wfactors(fpstring, { stripnepb: false });
  } catch (e) {
    console.error(`ERROR: No se ha podido leer el archivo de factores de paso "${ args.archivo_factores }"`);
  } finally {
    console.log(`Factores de paso (archivo): "${ args.archivo_factores }"`);
  }
} else if (args.fps_loc || COMPONENTS_META.loc) { // Definición de localización por CLI o metadatos
  let localizacion;
  if(args.fps_loc) {
    localizacion = args.fps_loc;
    console.log(`Factores de paso (usuario): ${ localizacion }`);
  } else {
    localizacion = COMPONENTS_META.loc;
    console.log(`Factores de paso (metadatos): ${ localizacion }`);
  }
  if(components) {
    updatemeta(components.cmeta, 'CTE_LOCALIZACION', localizacion);
  }

  const red = CTE_RED_DEFAULTS;
  if (args.red1 || COMPONENTS_META.red1) {
    let r1_ren, r1_nren;
    if(args.red1) {
      [r1_ren, r1_nren] = args.red1;
      console.log(`Factores de paso para RED1 (usuario): ${ r1_ren }, ${ r1_nren }`);
    } else {
      [r1_ren, r1_nren] = COMPONENTS_META.red1;
      console.log(`Factores de paso para RED1 (metadatos): ${ r1_ren }, ${ r1_nren }`);
    }
    if (verbosity > 0) {
      console.log(`- RED1, RED, input, A, ${ r1_ren }, ${ r1_nren } `);
    }
    red.RED1.ren = r1_ren;
    red.RED1.nren = r1_nren;
  }

  if (args.red2 || COMPONENTS_META.red2) {
    let r2_ren, r2_nren;
    if(args.red2) {
      [r2_ren, r2_nren] = args.red2;
      console.log(`Factores de paso para RED2 (usuario): ${ r2_ren }, ${ r2_nren }`);
    } else {
      [r2_ren, r2_nren] = COMPONENTS_META.red2;
      console.log(`Factores de paso para RED2 (metadatos): ${ r2_ren }, ${ r2_nren }`);
    }
    if (verbosity > 0) {
      console.log(`- RED2, RED, input, A, ${ r2_ren }, ${ r2_nren } `);
    }
    red.RED2.ren = r2_ren;
    red.RED2.nren = r2_nren;
  }

  const cogen = CTE_COGEN_DEFAULTS;
  if (args.cogen || COMPONENTS_META.cogen || COMPONENTS_META.cogennepb) {
    let cgrid_ren, cgrid_nren;
    if(args.cogen) {
      [cgrid_ren, cgrid_nren] = args.cogen;
      console.log(`Factores de paso de COGENERACIÓN a la red (usuario): ${ cgrid_ren }, ${ cgrid_nren }`);
    } else {
      if (COMPONENTS_META.cogen) {
        [cgrid_ren, cgrid_nren] = COMPONENTS_META.cogen;
        console.log(`Factores de paso de COGENERACIÓN a la red (metadatos): ${ cgrid_ren }, ${ cgrid_nren }`);
      }
    }
    cogen.to_grid.ren = cgrid_ren;
    cogen.to_grid.nren = cgrid_nren;
    if (verbosity > 0) {
      console.log(`- ELECTRICIDAD, COGENERACION, to_grid, A, ${ cogen.to_grid.ren }, ${ cogen.to_grid.nren } `);
    }

    // No tenemos opción de pasar este factor por CLI, ya que no se usa en CTE2018
    if (COMPONENTS_META.cogennepb) {
      const [cnepb_ren, cnepb_nren] = COMPONENTS_META.cogennepb;
      console.log(`Factores de paso de COGENERACIÓN a usos no EPB (metadatos): ${ cnepb_ren }, ${ cnepb_nren }`);
      cogen.to_nEPB.ren = cnepb_ren;
      cogen.to_nEPB.nren = cnepb_nren;
    }
    if (verbosity > 0) {
      console.log(`- ELECTRICIDAD, COGENERACION, to_nEPB, A, ${ cogen.to_nEPB.ren }, ${ cogen.to_nEPB.nren } `);
    }
  }

  try {
    fpdata = new_wfactors(localizacion, { red, cogen });
  } catch (e) {
    console.error("ERROR: No se han podido generar los factores de paso");
    if(verbosity > 2) { throw(e); } else { process.exit() }
  }
} else {
  console.error("[ERROR]: No se han definido factores de paso");
  process.exit();
}

// Simplificar factores de paso -----------------------------------------------------------------
if(components && !args.nosimplificafps) {
  const oldfplen = fpdata.wdata.length;
  fpdata = strip_wfactors(fpdata, components);
  if (verbosity > 1) { console.log(`Reducción de factores de paso: ${ oldfplen } a ${ fpdata.wdata.length }`); }
}

// Factores de paso en nearby
if (args.acsnrb === true) { // Estamos en cálculo de ACS en nearby
  fpdata = wfactors_to_nearby(fpdata);
}

// Área de referencia -------------------------------------------------------------------------
// Orden de prioridad:
// - Valor explícito en argumentos de CLI
// - Valor definido en metadatos de componentes
// - Valor por defecto (AREA_REF = 1)

let arearef;
if(COMPONENTS_META.arearef === null) { // No se define CTE_AREAREF en metadatos de componentes energéticos
  if (args.arearef !== null) {
    arearef = args.arearef;
    console.log(`Área de referencia (usuario) [m2]: ${ arearef }`);
  } else {
    arearef = AREAREF_DEFAULT;
    console.log(`Área de referencia (predefinida) [m2]: ${ arearef }`);
  }
} else { // Se define CTE_AREAREF en metadatos de componentes energéticos
  if (args.arearef === null) {
    arearef = COMPONENTS_META.arearef;
    console.log(`Área de referencia (metadatos) [m2]: ${ arearef }`);
  } else {
    if (COMPONENTS_META.arearef !== args.arearef) {
      console.warn(`AVISO: El valor del área de referencia del archivo de componentes energéticos (${ COMPONENTS_META.arearef }) no coincide con el valor definido por el usuario (${ args.arearef })`);
    }
    arearef = args.arearef;
    console.log(`Área de referencia (usuario) [m2]: ${ arearef }`);
  }
}
// Actualiza metadato CTE_AREAREF al valor seleccionado
if (components) {
  updatemeta(components.cmeta, 'CTE_AREAREF', arearef);
}

// kexp ------------------------------------------------------------------------------------------
// Orden de prioridad:
// - Valor explícito en argumentos de CLI
// - Valor definido en metadatos de componentes
// - Valor por defecto (KEXP_REF = 1)
let kexp;
if(COMPONENTS_META.kexp === null) { // No se define CTE_KEXP en metadatos de componentes energéticos
  if(args.kexp !== null) {
    kexp = args.kexp;
    console.log(`Factor de exportación (usuario) [-]: ${ kexp }`);
  } else {
    kexp = KEXP_DEFAULT;
    console.log(`Factor de exportación (predefinido) [-]: ${ kexp }`);
  }
} else { // Se define CTE_KEXP en metadatos de componentes energéticos
  if (args.kexp === null) {
    kexp = COMPONENTS_META.kexp;
    console.log(`Factor de exportación (metadatos) [-]: ${ kexp }`);
  } else {
    if (COMPONENTS_META.kexp !== args.kexp) {
      console.warn(`AVISO: El valor del factor de exportación del archivo de componentes energéticos (${ COMPONENTS_META.kexp }) no coincide con el valor definido por el usuario (${ args.kexp })`);
    }
    kexp = args.kexp;
    console.log(`Factor de exportación (usuario) [-]: ${ kexp }`);
  }
}
// Actualiza metadato CTE_KEXP al valor seleccionado
if (components) {
  updatemeta(components.cmeta, 'CTE_KEXP', kexp);
}

// Guardado de componentes energéticos -----------------------------------------------------------
if (args.gen_archivo_componentes !== '') {
  const carrierstring = serialize_components(components);
  fs.writeFile(args.gen_archivo_componentes, carrierstring, 'utf-8',
    err => {
      if (err) {
        console.error(`ERROR: No se ha podido escribir en "${ args.gen_archivo_componentes}" debido al error: ${ err }`);
      } else {
        if (verbosity > 0) { console.log(`Guardado archivo de vectores energéticos: ${ args.gen_archivo_componentes }`); }
      }
    }
  );
}

// Guardado de factores de paso corregidos ------------------------------------------------------
if (args.gen_archivo_factores !== '') {
  const fpstring = serialize_wfactors(fpdata);
  if(verbosity > 0) { console.log("Factores de paso: ", fpstring); }
  fs.writeFile(args.gen_archivo_factores, fpstring, 'utf-8',
    err => {
      if (err) {
        console.error(`ERROR: No se ha podido escribir en "${ args.gen_archivo_factores}" debido al error: ${ err }`);
      } else {
        if (verbosity > 0) { console.log(`Guardado archivo de factores de paso: ${ args.gen_archivo_factores }`); }
      }
    }
  );
}

// Cálculo del balance -------------------------------------------------------------------------
let balance;
if (components && fpdata && (kexp !== null)) {
  try {
    balance = energy_performance(components, fpdata, kexp, arearef);
  } catch (e) {
    console.error(`ERROR: No se ha podido calcular el balance energético`);
    throw e;
  }
} else if(fpdata && args.gen_archivos_factores !== '') {
  console.log(`No se calcula el balance pero se ha generado el archivo de factores de paso ${ args.gen_archivo_factores }`);
} else {
  console.log(`No se han definido datos suficientes para calcular el balance energético. Necesita definir al menos los componentes energéticos y los factores de paso`);
}

// Salida de resultados ------------------------------------------------------------------------
if (balance) {
  // Guardar balance en formato json
  if (args.archivo_salida_json !== '') {
    if (verbosity > 0) { console.log(`Resultados en formato JSON: "${ args.archivo_salida_json }"`); }
    const jsonbalancestring = balance_to_JSON(balance);
    fs.writeFile(args.archivo_salida_json, jsonbalancestring, 'utf-8',
      err => {
        if (err) {
          console.error(`ERROR: No se ha podido escribir en "${args.archivo_salida_json}" debido al error: ${err}`);
        }
      }
    );
  }
  // Guardar balance en formato XML
  if (args.archivo_salida_xml !== '') {
    if (verbosity > 0) { console.log(`Resultados en formato XML: "${ args.archivo_salida_xml }"`); }
    const xmlstring = balance_to_XML(balance);
    fs.writeFile(args.archivo_salida_xml, xmlstring, 'utf-8',
      err => {
        if (err) {
          console.error(`ERROR: No se ha podido escribir en "${args.archivo_salida_xml}" debido al error: ${err}`);
        }
      }
    );
  }
  // Mostrar siempre en formato plain
  if (args.acsnrb) {
    console.log("** Balance energético (servicio de ACS, perímetro próximo)");
  } else {
  console.log("** Balance energético");
  }
  console.log(balance_to_plain(balance));
}
