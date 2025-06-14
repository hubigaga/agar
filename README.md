# Geotextr

This repository now contains only the Geotextr application.
The app provides a small Python server and a web interface for
uploading geo-tagged text snippets with optional audio.

## Running locally

```sh
cd geotext
python3 server.py
```

By default the server listens on port 8080. You can override this
by setting the `PORT` environment variable.

## Docker

You can also build a container:

```sh
docker build -t geotextr geotext
```

Run the container:

```sh
docker run -p 8080:8080 geotextr
```
