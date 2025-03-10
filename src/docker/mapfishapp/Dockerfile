FROM georchestra/mapfishapp

ADD urbanisme-addon.zip /etc/georchestra/mapfishapp/addons/

USER root
RUN apt-get update && apt-get upgrade -y && apt-get install -y unzip
USER jetty

RUN cd /etc/georchestra/mapfishapp/addons &&      \
    unzip urbanisme-addon.zip &&   \
    rm urbanisme-addon.zip

