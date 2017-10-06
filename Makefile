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
	node ${BUILDDIR}/${OUTSCRIPT} -vv -c ${TESTCARRIERS} -f ${TESTFP} --arearef 200 --json balance.json
	node lib/cteepbd.js -c src/examples/cte_test_carriers.csv -l PENINSULA --cogen 0 2.5 0 2.5 -vv

installpackages:
	$(info [INFO]: instalación de paquetes)
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo aptitude install nodejs

nodebin: ${WINBUILDDIR} ${BUILDDIR}/${OUTSCRIPT}
	$(info [INFO]: Obtención del intérprete para win32 de NodeJS)
	wget -cN http://nodejs.org/dist/${NODEBINDIR}/${NODEBIN}
	unzip -jo ${NODEBIN} '*/node.exe' -d ${WINBUILDDIR}

dist: ${BUILDDIR}/${OUTSCRIPT}

distwin32: dist nodebin ${BUILDDIR}/${OUTSCRIPT}
	cp ${BUILDDIR}/${OUTSCRIPT} ${WINBUILDDIR}

clean:
	rm -rf lib/

${WINBUILDDIR}:
	mkdir -p ${WINBUILDDIR}

${BUILDDIR}:
	mkdir -p ${BUILDDIR}

${BUILDDIR}/examples:
	cp -r ./${SRCDIR}/examples ./${BUILDDIR}

${BUILDDIR}/${OUTSCRIPT}: ${BUILDDIR} ${SRCDIR}/index.js
	npm run bundle
