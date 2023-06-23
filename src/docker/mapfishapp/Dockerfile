FROM georchestra/mapfishapp

ADD urbanisme-addon.zip /etc/georchestra/mapfishapp/addons/
RUN cd /etc/georchestra/mapfishapp/addons &&      \
    unzip urbanisme-addon.zip &&   \
    rm urbanisme-addon.zip

