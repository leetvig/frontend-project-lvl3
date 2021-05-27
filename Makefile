install:
	npm ci

lint:
	npx eslint .

lint-fix:
	npx eslint --fix .

test:
	npm test

develop:
	NODE_ENV=development npx webpack

build:
	NODE_ENV=production npx webpack