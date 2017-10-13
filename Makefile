SRCDIR:=src
BUILDDIR:=lib
WINBUILDDIR:=winbuild
NODEBINDIR=latest-v8.x
NODEBIN=node-v8.6.0-win-x86.zip
OUTSCRIPT=cteepbd.js
TESTFP:=src/examples/factores_paso_20140203.csv
TESTCARRIERS:=src/examples/cte_test_carriers.csv

test:
	npm run bundledev
	node ${BUILDDIR}/${OUTSCRIPT} --help
	node ${BUILDDIR}/${OUTSCRIPT} -vv -c ${TESTCARRIERS} -f ${TESTFP} -a 200 --json balance.json --xml balance.xml > balance.txt
	node lib/cteepbd.js -c src/examples/cte_test_carriers.csv -l PENINSULA --cogen 0 2.5 0 2.5 -vv

installpackages:
	$(info [INFO]: instalación de paquetes)
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo aptitude install nodejs

nodebin: ${WINBUILDDIR}
	$(info [INFO]: Obtención del intérprete para win32 de NodeJS)
	wget -cN http://nodejs.org/dist/${NODEBINDIR}/${NODEBIN}
	unzip -jo ${NODEBIN} '*/node.exe' -d ${WINBUILDDIR}

dist: ${BUILDDIR} ${SRCDIR}/cteepbd.js
	$(info [INFO]: Compilando versión de producción)
	npm run bundle

distwin32: nodebin dist
	$(info [INFO]: Preparando versión para distribución en windows 32bit)
	cp ${BUILDDIR}/${OUTSCRIPT} ${WINBUILDDIR}
	cp LICENSE ./${WINBUILDDIR}/cteepbd.LICENSE
	cp README.md ./${WINBUILDDIR}/cteepbd.README.md

clean:
	rm -rf lib/

${WINBUILDDIR}:
	mkdir -p ${WINBUILDDIR}

${BUILDDIR}:
	mkdir -p ${BUILDDIR}
