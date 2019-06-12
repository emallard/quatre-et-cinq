docker run --user $(id -u):$(id -g) --rm --volume="$PWD:/srv/jekyll" --volume="$PWD/vendor/bundle:/usr/local/bundle" -p4000:4000 -it jekyll/jekyll:3.8 jekyll serve -H 0.0.0.0
