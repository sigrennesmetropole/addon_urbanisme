What ?
========

This docker composition aims to make the development of the urbanisme tool easier.


How to use this docker composition
=====================================

In the root directory

```
$ mvn clean package
```

This will generate the addon, the urbanisme webapp, and create a subdirectory
in `target/docker`, with all the needed materials to runtime test the project.
But it is your responsability to make sure that the docker images and
containers are purged. So do not forget to `docker-compose build` after each
rebuild.

Once built,

```
$ cd target/docker/
$ docker-compose build
$ docker-compose up
```

