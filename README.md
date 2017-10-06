# CTEEPBD

CLI for the `epbdjs` implementation of the ISO EN 52000-1 "Energy performance of buildings" standard.

Interfaz de línea de comandos para la evaluación energética de edificios para el CTE DB-HE. Implementa la norma ISO EN 52000-1.

## Introduction

This software provides a command line interface to compute some energy performance indicators of the *ISO EN 52000-1: Energy performance of buildings - Overarching EPB assessment - General framework and procedures* standard, as implemented by the `epbdjs` package.

The underlying implementation uses the following assumptions:

- all weighting factors are constant through timesteps
- threre's no priority is set for energy production (average step A weighting factor f_we_el_stepA)
- all on-site produced energy from non cogeneration sources is considered as delivered
- the load matching factor is set to 1.0

## Usage

### CLI

See help using:

    $ node cteepbd.js --help

### Tests
**To run the tests** type ```make``` on the command line.

## Formats used

This applications needs two input data files, one specifying the energy carrier data and one specifying the weighting factors data.

The energy carrier data can include additional metadata such as the source of the data, the exportation factor (k_exp) and the reference area (A_ref).

The weighting factors data can include additional metadata such as the source of the data and the location used to get the factors (LOCATION).

### Energy carrier format

TODO

### Weighting factors format

TODO

