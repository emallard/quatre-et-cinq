docker run --rm --volume="$PWD:/srv/jekyll" --volume="$PWD/vendor/bundle:/usr/local/bundle" -p4000:4000 -it jekyll/jekyll:3.8 bundle install
