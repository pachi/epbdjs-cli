SRCDIR:=src
BUILDDIR:=lib
WINBUILDDIR:=winbuild
NODEBINDIR=latest-v8.x
NODEBIN=node-v8.9.1-win-x86.zip
OUTSCRIPT=cteepbd.js
TESTFP:=src/examples/factores_paso_20140203.csv
TESTCARRIERS:=src/examples/cte_test_carriers.csv
EXAMPLESDIR:=docs/ejemplos
EXAMPLESFP:=$(EXAMPLESDIR)/factores_paso_20140203.csv
EXAMPLESK:=$(foreach dir,$(EXAMPLESDIR),$(wildcard $(dir)/ejemplo[123456]*.csv))
EXAMPLESJ:=$(foreach dir,$(EXAMPLESDIR),$(wildcard $(dir)/ejemploJ[123456789]*.csv))
OUTDIR:=docs/ejemplos/output

UPX := $(shell which upx 2> /dev/null)
PDFLATEX := $(shell which pdflatex 2> /dev/null)

test:
	npm run bundledev
	node ${BUILDDIR}/${OUTSCRIPT} --help
	node ${BUILDDIR}/${OUTSCRIPT} -vv -c ${TESTCARRIERS} -f ${TESTFP} -a 200 --json balance.json --xml balance.xml > balance.txt
	node ${BUILDDIR}/${OUTSCRIPT} -vv -c ${TESTCARRIERS} -l PENINSULA --cogen 0 2.5 --red1 0 1.3 --red2 0 1.3
	node ${BUILDDIR}/${OUTSCRIPT} -vv -c ${TESTCARRIERS}
	node ${BUILDDIR}/${OUTSCRIPT} -c ${TESTCARRIERS} --acs_nearby

installpackages:
	$(info [INFO]: instalación de paquetes)
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo aptitude install nodejs

nodebin: ${WINBUILDDIR}
	$(info [INFO]: Obtención del intérprete para win32 de NodeJS)
	wget -cN http://nodejs.org/dist/${NODEBINDIR}/${NODEBIN}
	unzip -jo ${NODEBIN} '*/node.exe' -d ${WINBUILDDIR}
ifdef UPX
	upx -i $(WINBUILDDIR)/node.exe -v
endif

.PHONY: buildexamples $(EXAMPLESJ)
buildexamples: $(OUTDIR) $(EXAMPLESJ) helpoutput balances factorespaso
$(EXAMPLESJ):
	node ${BUILDDIR}/${OUTSCRIPT} -c "$@" -f $(EXAMPLESFP) > "$(subst .csv,.out,$(subst $(EXAMPLESDIR),$(OUTDIR),$@))"
helpoutput:
	node ${BUILDDIR}/${OUTSCRIPT} --help > $(OUTDIR)/ayuda.out
balances:
	node ${BUILDDIR}/${OUTSCRIPT} -c "$(EXAMPLESDIR)/cte_test_carriers.csv" -l PENINSULA --json "$(OUTDIR)/balance.json" --xml "$(OUTDIR)/balance.xml" > "$(OUTDIR)/balance.plain"
factorespaso:
	node ${BUILDDIR}/${OUTSCRIPT} -l PENINSULA --of docs/ejemplos/output/factorespen.csv

docs: buildexamples docs/Manual_cteepbd.tex
ifndef PDFLATEX
	$(error "Es necesario tener instalado pdflatex para generar la documentación")
endif
	cd docs && pdflatex --output-directory=build Manual_cteepbd.tex && pdflatex --output-directory=build Manual_cteepbd.tex

dist: ${BUILDDIR} ${SRCDIR}/cteepbd.js
	$(info [INFO]: Compilando versión de producción)
	npm run bundle

distwin32: nodebin dist docs
	$(info [INFO]: Preparando versión para distribución en windows 32bit)
	cp ${BUILDDIR}/${OUTSCRIPT} ${WINBUILDDIR}
	cp LICENSE ./${WINBUILDDIR}/cteepbd.LICENSE
	cp README.md ./${WINBUILDDIR}/cteepbd.README.md
	mkdir -p ${WINBUILDDIR}/ejemplos
	cp $(EXAMPLESDIR)/*.csv ./${WINBUILDDIR}/ejemplos
	cp docs/build/Manual_cteepbd.pdf ./${WINBUILDDIR}
	zip -r "cteepbd-$(shell date +"%Y-%m-%d").zip" ./${WINBUILDDIR}/*

clean:
	rm -rf lib/

${WINBUILDDIR}:
	mkdir -p ${WINBUILDDIR}

${BUILDDIR}:
	mkdir -p ${BUILDDIR}

${OUTDIR}:
	mkdir -p ${OUTDIR}
