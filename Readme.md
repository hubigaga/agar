## Custom Ogar

### Build
```
docker build -t agar .
```

## Run
```
docker run -d -p 8088:88 -p 8080:8080 -p 8090:9000 agar
```


## Example caddy config

```
agar.games.tld {
    reverse_proxy 127.0.0.1:8080
}

admin.agar.games.tld {
    reverse_proxy 127.0.0.1:9000
}
```