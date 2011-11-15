NODE_BIN = /usr/bin/env node

all: doc

clean:
	rm -rf out

docs_out = out/doc
docs_md = $(wildcard doc/*.md)
docs_html = $(addprefix out/,$(docs_md:.md=.html))

doc: $(docs_out) $(docs_html)

$(docs_out):
	mkdir -p $@
	mkdir -p $@/assets
	cp doc/template/doc.css out/doc/assets/doc.css

out/doc/%: doc/%
	cp $< $@

out/doc/%.html: doc/%.md
	$(NODE_BIN) tools/doctool/doctool.js doc/template/template.html $< > $@

.DEFAULT_GOAL := all

.PHONY: clean