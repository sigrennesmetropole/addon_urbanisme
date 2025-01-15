FROM georchestra/mapfishapp

ADD urbanisme-addon.zip /etc/georchestra/mapfishapp/addons/

RUN apt-get update && apt-get upgrade -y && apt-get install -y zip

RUN cd /etc/georchestra/mapfishapp/addons &&      \
    unzip urbanisme-addon.zip &&   \
    rm urbanisme-addon.zip

