install:
	npm ci

lint:
	npx eslint .

test:
	npm test

develop:
	npx webpack serve

build:
	rm -rf dist
	NODE_ENV=production npx webpack
