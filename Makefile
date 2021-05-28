install:
	npm ci

lint:
	npx eslint .

lint-fix:
	npx eslint --fix .

test:
	npm test

start:
	npx webpack serve --mode development --open

develop:
	npx webpack --mode development

build:
	npx webpack --mode production