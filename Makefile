SRCDIR:=src
BUILDDIR:=lib
TESTFP:=src/examples/factores_paso_20140203.csv
TESTCARRIERS:=src/examples/cte_test_carriers.csv

default: ${BUILDDIR}/index.js ${BUILDDIR}/examples
	node ${BUILDDIR}/index.js --help
	node ${BUILDDIR}/index.js -vvv --fps ${TESTFP} --vectores ${TESTCARRIERS} --arearef 200

test: ${BUILDDIR}/test.js ${BUILDDIR}/examples
	node ${BUILDDIR}/test.js

installpackages:
	$(info [INFO]: instalación de paquetes)
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo aptitude install nodejs

clean:
	rm -rf lib/

${BUILDDIR}:
	mkdir -p ${BUILDDIR}

${BUILDDIR}/examples:
	cp -r ./${SRCDIR}/examples ./${BUILDDIR}

${BUILDDIR}/index.js: ${BUILDDIR} ${SRCDIR}/index.js
	./node_modules/.bin/babel -o ${BUILDDIR}/index.js ${SRCDIR}/index.js

# ${BUILDDIR}/test.js: ${BUILDDIR} ${BUILDDIR}/index.js ${SRCDIR}/test.js
# 	./node_modules/.bin/babel -o ${BUILDDIR}/test.js ${SRCDIR}/test.js

# ${BUILDDIR}/examples:
# 	cp -r ./${SRCDIR}/examples ./${BUILDDIR}

