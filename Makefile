usage:
	@echo "Usage:"
	@echo "  make init 		- prepare env for this project"
	@echo "  make mongod    - start DB server"
	@echo "  make dev 		- run development server"

init:
	yarn install

mongod:
	mongod -f conf/mongod.conf

dev: help_init
	npm start

help_init:
	@if [ ! -d node_modules ]; then yarn install; fi

