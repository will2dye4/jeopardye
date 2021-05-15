app:
	@yarn start

server:
	@# Use 'LOG_TIME=abs' instead for ISO-8601 timestamps
	@LOG_LEVEL=info LOG_TIME=rel node src/server/server.mjs
